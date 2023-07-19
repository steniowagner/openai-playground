import path from "path";
import { ChatCompletionRequestMessage, Configuration, OpenAIApi } from "openai";

import { interpolatePrompt } from "./utils/interpolate-prompt";
import * as learningObjectives from "./learning-objectives";
import * as pinecone from "./pinecone-handler";
import { readYaml } from "./utils/read-yaml";
import * as prompts from "./prompts";
import * as aim from "./aim";
import { rephrase } from "./rephrase";
import * as statements from "./statements";
import * as feedback from "./feedback";

const config = readYaml(
  path.join(path.resolve(__dirname, "..", "test-files"), "config.yaml")
);

export const run = async () => {
  const openAiApi = new OpenAIApi(
    new Configuration({
      apiKey: process.env.OPENAI_API_KEY ?? "",
    })
  );
  const vectorStore = await pinecone.getVectorStore();
  const guidelines = {
    role: "system",
    content: interpolatePrompt(config.overall.prompt, {
      iq_level: config.overall.iq_level,
    }),
  } as ChatCompletionRequestMessage;

  console.log("\n---------------- summary ----------------");
  const summary = await rephrase({
    prompt: prompts.SUMMARIZE_DOCUMENT,
    vectorStore,
    openAiApi,
    guidelines,
  });
  // console.log(summary);
  console.log("\n---------------- summary ----------------\n");

  console.log("\n---------------- aim ----------------");
  const aimContent = await aim.generate({
    summary,
    openAiApi,
    guidelines,
    config,
  });
  // console.log(aimContent);
  console.log("\n---------------- aim ----------------");

  console.log("\n---------------- learning objectives ----------------");
  const learningObjectivesContent = await learningObjectives.generate({
    aim: aimContent,
    vectorStore,
    openAiApi,
    guidelines,
    config,
  });
  console.log("\n---------------- learning objectives ----------------");

  console.log("\n---------------- statements ----------------");
  const statementsContent = await statements.generate({
    learningObjectives: learningObjectivesContent,
    aim: aimContent,
    vectorStore,
    openAiApi,
    guidelines,
    config,
  });
  console.log(statementsContent.length);
  console.log("\n---------------- statements ----------------");

  // console.log("\n---------------- feedback ----------------");
  const feedbackContent = await feedback.generate({
    statements: statementsContent,
    aim: aimContent,
    vectorStore,
    openAiApi,
    guidelines,
    config,
  });
  // console.log("\n---------------- feedback ----------------");

  return;
};

(async () => {
  await run();
})();
