import { PineconeStore } from "langchain/vectorstores/pinecone";
import { ChatCompletionResponseMessage, OpenAIApi } from "openai";

export type Config = {
  overall: {
    iq_level: number;
    role: string;
    industry: string;
    prompt: string;
  };
  aim: {
    prompt: string;
  };
  learning_objectives: {
    count: number;
    prompt: string;
  };
  statements: {
    min_count: number;
    max_count: number;
    word_count: number;
    prompt: string;
  };
  feedback: {
    prompt: string;
  };
};

export type GeneratorParams = {
  guidelines: ChatCompletionResponseMessage;
  config: Config;
  vectorStore: PineconeStore;
  openAiApi: OpenAIApi;
};
