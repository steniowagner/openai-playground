import { ChatCompletionResponseMessage } from "openai";

import { GeneratorParams } from "./types";
import { interpolatePrompt } from "./utils/interpolate-prompt";
import { askGpt } from "./ask-gpt";
import { rephrase } from "./rephrase";

type GenerateLearningObjectivesParms = GeneratorParams & {
  aim: string;
};

const LEARNING_OBEJCTIVES_PROMPT = `
Question: [question]
=========
Context: [context]
=========
Your answer must be inside of an javascript array, where each learning objective will be an item of the array.
Answer:`;

const parseResultToArray = (result?: string) => {
  if (!result) {
    return [];
  }
  return JSON.parse(result) as string[];
};

export const generate = async (params: GenerateLearningObjectivesParms) => {
  const learningObjectivePrompt = interpolatePrompt(
    params.config.learning_objectives.prompt,
    {
      ...params.config.overall,
      aim: params.aim,
      count: params.config.learning_objectives.count,
    }
  );
  const rephrasedPrompt = await rephrase({
    ...params,
    prompt: learningObjectivePrompt,
  });
  const questionPrompt = interpolatePrompt(LEARNING_OBEJCTIVES_PROMPT, {
    question: learningObjectivePrompt,
    context: rephrasedPrompt,
  });
  const history = [
    params.guidelines,
    { role: "user", content: questionPrompt },
  ];
  const result = (await askGpt(
    params.openAiApi,
    history
  )) as ChatCompletionResponseMessage;
  return parseResultToArray(result.content);
};
