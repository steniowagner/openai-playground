import { ChatCompletionResponseMessage } from "openai";

import { interpolatePrompt } from "./utils/interpolate-prompt";
import { GeneratorParams } from "./types";
import { askGpt } from "./ask-gpt";
import * as prompts from "./prompts";

type GenerateAimParams = Omit<
  GeneratorParams & {
    summary: string;
  },
  "vectorStore"
>;

export const generate = async (params: GenerateAimParams) => {
  const aimPrompt = interpolatePrompt(
    params.config.aim.prompt,
    params.config.overall
  );
  const questionPrompt = interpolatePrompt(prompts.QA_PROMPT, {
    question: aimPrompt,
    context: params.summary,
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
