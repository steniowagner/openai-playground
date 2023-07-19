import { ChatCompletionResponseMessage } from "openai";

import { interpolatePrompt } from "./utils/interpolate-prompt";
import { StatementResult } from "./statements";
import { GeneratorParams } from "./types";
import { askGpt } from "./ask-gpt";
import { rephrase } from "./rephrase";

type GenerateFeedbackParams = GeneratorParams & {
  statements: StatementResult[];
  aim: string;
};

type MakeStatementRephrasedContextParams = GeneratorParams & {
  learningObjective: string;
  statement: string;
  aim: string;
};

type FeedbackResult = {
  statement: string;
  description: string;
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
[is_correct]
Statement: [statement]
=========
Context: [context]
=========
Your answer must follow the following json structure:

{
  statement: <description of the statement>,
  description: <your answer goes here>
}

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

const parseFeedbackResult = (feedbackResult?: string) => {
  if (!feedbackResult) {
    return { statement: "", description: "" };
  }
  return JSON.parse(feedbackResult) as FeedbackResult;
};

export const generate = async (params: GenerateFeedbackParams) => {
  const results = await Promise.all(
    params.statements.map(async ({ learningObjective, statements }) => {
      const feedbacks = await Promise.all(
        statements.map(async (statement) => {
          const context = await makeStatementRephrasedContext({
            ...params,
            learningObjective,
            statement: statement.description,
          });
          const feedbackPrompt = interpolatePrompt(
            params.config.feedback.prompt,
            params.config.overall
          );
          const questionPrompt = interpolatePrompt(FEEDBACK_QUESTION_PROMPT, {
            is_correct: `The following statement is ${
              statement.value ? "correct" : "incorrect"
            }`,
            aim: params.aim,
            learning_objective: learningObjective,
            task: feedbackPrompt,
            statement: statement.description,
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
          return parseFeedbackResult(results.content);
        })
      );
      return {
        learningObjective,
        feedbacks,
      };
    })
  );
  results.forEach((result) => {
    console.log("\nLearning objective: ", result.learningObjective, "\n");
    result.feedbacks.forEach((feedback) => {
      console.log("Statement: ", feedback.statement, "\n");
      console.log("Feedback: ", feedback.description, "\n");
      console.log("--------\n");
    });
  });
};
