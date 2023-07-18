import path from "path";

import { splitPDFInDocuments } from "./utils/split-pdf-in-documents";
import { readPdf } from "./utils/read-pdf";
import * as pinecone from "./pinecone-handler";
import { readYaml } from "./utils/read-yaml";
import { interpolatePrompt } from "./utils/interpolate-prompt";
import {
  ChatCompletionRequestMessage,
  Configuration,
  CreateEmbeddingRequest,
  OpenAIApi,
} from "openai";
import { Config } from "./types";
import { PineconeStore } from "langchain/vectorstores/pinecone";

const PDF_FILE_PATH = path.join(
  path.resolve(__dirname, "..", "test-files"),
  "aws.pdf"
);
const YAML_FILE_PATH = path.join(
  path.resolve(__dirname, "..", "test-files"),
  "config.yaml"
);

const makeOpenAI = () => {
  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY ?? "",
  });
  return new OpenAIApi(configuration);
};

const generateAimPrompt = async (
  vectorStore: PineconeStore,
  config: Config
) => {
  const aimPrompt = interpolatePrompt(config.aim.prompt, {
    ...config.overall,
    ...config.aim,
  })
    .trim()
    .replace("\n", "");
  const similarities = await vectorStore.similaritySearch(aimPrompt);
  return [
    {
      role: "user",
      content: `Context: ${similarities[0].pageContent}\n-------------------\nQuestion: ${aimPrompt}\n
    `,
    },
  ] as ChatCompletionRequestMessage[];
};

const generateLearningObjectivesPrompt = async (
  vectorStore: PineconeStore,
  config: Config,
  aimResults: string
) => {
  const larningObjectivesPrompt = interpolatePrompt(
    config.learning_objectives.prompt,
    {
      ...config.overall,
      ...config.learning_objectives,
      aim: aimResults,
    }
  )
    .trim()
    .replace("\n", "");
  const similarities = await vectorStore.similaritySearch(
    larningObjectivesPrompt
  );
  return [
    {
      role: "user",
      content: `Context: ${similarities[0].pageContent}\n-------------------\nQuestion: ${larningObjectivesPrompt}\n
    `,
    },
  ] as ChatCompletionRequestMessage[];
};

const generateStatementsPrompt = async (
  vectorStore: PineconeStore,
  config: Config,
  aimResults: string,
  learningObjectivesResults: string
) => {
  const promptInterpolated = interpolatePrompt(config.statements.prompt, {
    ...config.overall,
    ...config.statements,
    aim: aimResults,
    learningObjectives: learningObjectivesResults,
  })
    .trim()
    .replace("\n", "");
  const similarities = await vectorStore.similaritySearch(promptInterpolated);
  return [
    {
      role: "user",
      content: `Context: ${similarities[0].pageContent}\n-------------------\nQuestion: ${promptInterpolated}\n
    `,
    },
  ] as ChatCompletionRequestMessage[];
};

const generateFeedbackPrompt = async (
  vectorStore: PineconeStore,
  config: Config,
  aimResults: string,
  learningObjectivesResults: string,
  statementsResults: string
) => {
  const promptInterpolated = interpolatePrompt(config.feedback.prompt, {
    ...config.overall,
    ...config.feedback,
    aim: aimResults,
    learningObjectives: learningObjectivesResults,
    statements: statementsResults,
  });
  const similarities = await vectorStore.similaritySearch(promptInterpolated);
  return [
    {
      role: "user",
      content: `Context: ${similarities[0].pageContent}\n-------------------\nQuestion: ${promptInterpolated}\n
    `,
    },
  ] as ChatCompletionRequestMessage[];
};

const run = async () => {
  try {
    // const pdfContent = await readPdf(PDF_FILE_PATH);
    // if (!pdfContent) {
    //   throw new Error("Error when tried to read the pdf");
    // }
    // // transform the pdf-content in documents
    // const pdfContentSplittedInDocuments = await splitPDFInDocuments(
    //   pdfContent.text,
    //   path.basename(PDF_FILE_PATH)
    // );
    // // store the documents into the Pinecone
    // await pinecone.storeDocuments(pdfContentSplittedInDocuments);

    // ------------ setup --------------
    const vectorStore = await pinecone.getVectorStore();
    const config = readYaml(YAML_FILE_PATH);
    const openai = makeOpenAI();
    const overallPrompt = interpolatePrompt(config.overall.prompt, {
      ...config.overall,
    })
      .trim()
      .replace("\n", "");
    const history = [
      { role: "user", content: overallPrompt },
    ] as ChatCompletionRequestMessage[];
    // ------------ setup --------------

    const similarities = await vectorStore.similaritySearch(
      "Summarize this document"
    );
    const context = similarities
      .map((similarty) => similarty.pageContent)
      .join("\n");

    //

    console.log(context);

    // // ------------ aim --------------
    const aimPrompt = await generateAimPrompt(vectorStore, config);
    history.push(...aimPrompt);
    const aimResult = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      // stream: true,
      temperature: 0.7,
      messages: history,
    });
    history.push(aimResult.data.choices[0].message!);
    // // ------------ aim --------------

    // // ------------ learning-objectives --------------
    // const learningObjectivesPrompt = await generateLearningObjectivesPrompt(
    //   vectorStore,
    //   config,
    //   aimResult.data.choices[0].message?.content!
    // );
    // history.push(...learningObjectivesPrompt);
    // const learningObjectivesResult = await openai.createChatCompletion({
    //   model: "gpt-3.5-turbo",
    //   // stream: true,
    //   temperature: 0.7,
    //   messages: history,
    // });
    // history.push(learningObjectivesResult.data.choices[0].message!);
    // // ------------ learning-objectives --------------

    // // ------------ statements --------------
    // const statementsPrompt = await generateStatementsPrompt(
    //   vectorStore,
    //   config,
    //   aimResult.data.choices[0].message?.content!,
    //   learningObjectivesResult.data.choices[0].message?.content!
    // );
    // history.push(...statementsPrompt);
    // const statementsResult = await openai.createChatCompletion({
    //   model: "gpt-3.5-turbo",
    //   // stream: true,
    //   temperature: 0.7,
    //   messages: history,
    // });
    // history.push(statementsResult.data.choices[0].message!);
    // // ------------ statements --------------

    // // ------------ feedback --------------
    // const feedbackPrompt = await generateFeedbackPrompt(
    //   vectorStore,
    //   config,
    //   aimResult.data.choices[0].message?.content!,
    //   learningObjectivesResult.data.choices[0].message?.content!,
    //   statementsResult.data.choices[0].message?.content!
    // );
    // history.push(...feedbackPrompt);
    // const feedbackResult = await openai.createChatCompletion({
    //   model: "gpt-3.5-turbo",
    //   // stream: true,
    //   temperature: 0.7,
    //   messages: history,
    // });
    // history.push(feedbackResult.data.choices[0].message!);
    // console.log(history);
    // ------------ feedback --------------
  } catch (err) {
    console.log(err);
  }
};

(async () => {
  await run();
})();
