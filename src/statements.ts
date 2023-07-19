import { ChatCompletionResponseMessage } from "openai";

import { interpolatePrompt } from "./utils/interpolate-prompt";
import * as pinecone from "./pinecone-handler";
import { Config, GeneratorParams } from "./types";
import { askGpt } from "./ask-gpt";
import { rephrase } from "./rephrase";

type GenerateStatementsParams = GeneratorParams & {
  learningObjectives: string[];
  aim: string;
};

type MakePromptQuestionParams = {
  learningObjective: string;
  context: string;
  config: Config;
  aim: string;
};

type Statement = {
  description: string;
  value: boolean;
};

export type StatementResult = {
  learningObjective: string;
  statements: Statement[];
};

const STATEMENTS_QUESTION_TEMPLATE_PROMPT = `
Question: [question]
=========
Learning objective: [learning_objective]
=========
Context: [context]
=========
Your answer must follow the following json structure:

{
  learningObjective: <the learning objective title>,
  statements: [{
    description: <description of the statement>,
    value: <a boolean that indicates if the statement is either true or false>
  }]
}

Answer:`;

const makePromptQuestion = (params: MakePromptQuestionParams) => {
  const statementPrompt = interpolatePrompt(params.config.statements.prompt, {
    ...params.config.overall,
    ...params.config.statements,
  });
  return interpolatePrompt(STATEMENTS_QUESTION_TEMPLATE_PROMPT, {
    question: statementPrompt,
    context: `${params.aim} ${params.context}`,
    learning_objective: params.learningObjective,
  });
};

const makeContext = async (
  params: GenerateStatementsParams,
  learningObjective: string
) => {
  const similarVectors = await pinecone.findSimilarVectors(
    params.vectorStore,
    learningObjective
  );
  return rephrase({
    ...params,
    prompt: similarVectors,
  });
};

const parseContentResult = (content?: string) => {
  if (!content) {
    return [];
  }
  return JSON.parse(content);
};

export const generate = async (params: GenerateStatementsParams) =>
  Promise.all(
    params.learningObjectives.map(async (learningObjective) => {
      const context = await makeContext(params, learningObjective);
      const promptQuestion = makePromptQuestion({
        learningObjective,
        config: params.config,
        aim: params.aim,
        context,
      });
      const history = [
        params.guidelines,
        { role: "user", content: promptQuestion },
      ];
      const result = (await askGpt(
        params.openAiApi,
        history
      )) as ChatCompletionResponseMessage;
      return parseContentResult(result.content) as StatementResult;
    })
  );
