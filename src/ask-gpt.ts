import { OpenAIApi } from "openai";

export const askGpt = async (openAIApi: OpenAIApi, messages: any) => {
  const answer = await openAIApi.createChatCompletion({
    model: "gpt-3.5-turbo",
    // stream: true,
    temperature: 0,
    messages,
  });
  console.log("\nUsage: ", answer.data.usage, "\n");
  return answer.data.choices[0].message ?? "-";
};
