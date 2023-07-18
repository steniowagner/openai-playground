import { ChatCompletionResponseMessage } from "openai";

import { GeneratorParams } from "./types";
import { interpolatePrompt } from "./utils/interpolate-prompt";
import * as pinecone from "./pinecone-handler";
import * as prompts from "./prompts";
import { askGpt } from "./ask-gpt";
import { rephrase } from "./rephrase";

type GenerateLearningObjectivesParms = GeneratorParams & {
  aim: string;
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
  const questionPrompt = interpolatePrompt(prompts.QA_PROMPT, {
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
  return result.content as string;
};
