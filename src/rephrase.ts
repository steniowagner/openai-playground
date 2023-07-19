import { ChatCompletionResponseMessage } from "openai";

import { interpolatePrompt } from "./utils/interpolate-prompt";
import * as pinecone from "./pinecone-handler";
import { GeneratorParams } from "./types";
import { askGpt } from "./ask-gpt";

type RephraseParams = Omit<GeneratorParams, "config"> & {
  prompt: string;
};

export const REPHRASE_TEXT = `
Create a clear, concise, and effective standalone rephrased version of the text provided below.

Text:
[text]

Rephrased standalone text:
`;

export const rephrase = async (params: RephraseParams) => {
  const similarVectors = await pinecone.findSimilarVectors(
    params.vectorStore,
    params.prompt
  );
  // console.log(`Original-size: ${similarVectors.length} charcters`);
  const questionPrompt = interpolatePrompt(REPHRASE_TEXT, {
    text: similarVectors,
  });
  const history = [
    params.guidelines,
    {
      role: "user",
      content: questionPrompt,
    },
  ];
  const result = (await askGpt(
    params.openAiApi,
    history
  )) as ChatCompletionResponseMessage;
  // console.log(`Rephrased-size: ${result.content?.length} charcters\n`);
  return result.content!;
};
