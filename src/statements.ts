import { ChatCompletionResponseMessage } from "openai";

import { interpolatePrompt } from "./utils/interpolate-prompt";
import * as pinecone from "./pinecone-handler";
import { Config, GeneratorParams } from "./types";
import { askGpt } from "./ask-gpt";
import { rephrase } from "./rephrase";

type GenerateStatementsParams = GeneratorParams & {
  learningObjectives: string;
  aim: string;
};

type MakePromptQuestionParams = {
  learningObjective: string;
  context: string;
  config: Config;
  aim: string;
};

const STATEMENTS_QUESTION_TEMPLATE_PROMPT = `
Question: [question]
=========
Learning objective: [learning_objective]
=========
Context: [context]
=========
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

export const generate = async (params: GenerateStatementsParams) => {
  const learningObjectives = params.learningObjectives.split("\n") as string[];
  return Promise.all(
    learningObjectives.map(async (learningObjective) => {
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
      return {
        statements: (result.content as string).split("\n"),
        learningObjective,
      };
    })
  );
};
