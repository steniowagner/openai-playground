import { ChatCompletionResponseMessage } from "openai";

import { interpolatePrompt } from "./utils/interpolate-prompt";
import { GeneratorParams } from "./types";
import { askGpt } from "./ask-gpt";
import { rephrase } from "./rephrase";

type Target = {
  learningObjective: string;
  statements: string[];
};

type GenerateFeedbackParams = GeneratorParams & {
  targets: Target[];
  aim: string;
};

type MakeStatementRephrasedContextParams = GeneratorParams & {
  learningObjective: string;
  statement: string;
  aim: string;
};

const STATEMENT_CONTEXT_TEMPLATE_PROMPT = `
Given that our aim is "[aim]" and the learning objective is "[learning_objective]", what are the most relevant parts of this document related with the following stament?
=========
Statement: [statement]
=========`;

const FEEDBACK_QUESTION_PROMPT = `
Given that our aim is "[aim]" and the learning objective is "[learning_objective]", your task is:
=========
Task: [task]
=========
Statement: [statement]
=========
Context: [context]
=========
Answer:
`;

const makeStatementRephrasedContext = async (
  params: MakeStatementRephrasedContextParams
) => {
  const relatedContentPrompt = interpolatePrompt(
    STATEMENT_CONTEXT_TEMPLATE_PROMPT,
    {
      learning_objective: params.learningObjective,
      aim: params.aim,
      statement: params.statement,
    }
  );
  return rephrase({
    ...params,
    prompt: relatedContentPrompt,
  });
};

export const generate = async (params: GenerateFeedbackParams) => {
  const results = await Promise.all(
    params.targets.map(async (target) => {
      target.statements.map(async (statement) => {
        const context = await makeStatementRephrasedContext({
          ...params,
          learningObjective: target.learningObjective,
          statement,
        });
        const feedbackPrompt = interpolatePrompt(
          params.config.feedback.prompt,
          params.config.overall
        );
        const questionPrompt = interpolatePrompt(FEEDBACK_QUESTION_PROMPT, {
          aim: params.aim,
          learning_objective: target.learningObjective,
          task: feedbackPrompt,
          statement,
          context,
        });
        const history = [
          params.guidelines,
          { role: "user", content: questionPrompt },
        ];
        const results = (await askGpt(
          params.openAiApi,
          history
        )) as ChatCompletionResponseMessage;
        console.log("\n----------------------------");
        console.log("Learning-objective: ", target.learningObjective);
        console.log("Statement: ", statement);
        console.log(results);
        console.log("----------------------------\n");
      });
    })
  );
};
