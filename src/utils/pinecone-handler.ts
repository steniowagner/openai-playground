import { PineconeClient } from "@pinecone-database/pinecone";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { PineconeStore } from "langchain/vectorstores/pinecone";
import { Document } from "langchain/document";

const init = async () => {
  const pinecone = new PineconeClient();
  await pinecone.init({
    environment: process.env.PINECONE_ENVIRONMENT ?? "",
    apiKey: process.env.PINECONE_API_KEY ?? "",
  });
  return pinecone;
};

const getPineconeIndex = async () => {
  const pinecone = await init();
  if (!pinecone) {
    throw new Error("Error when tried to initialize Pinecone");
  }
  return pinecone.Index(process.env.PINECONE_INDEX_NAME ?? "");
};

export const storeDocuments = async (
  documents: Document<Record<string, any>>[]
) => {
  const pineconeIndex = await getPineconeIndex();
  const embeddings = new OpenAIEmbeddings();
  await PineconeStore.fromDocuments(documents, embeddings, {
    namespace: process.env.PINECONE_NAMESPACE,
    pineconeIndex,
    textKey: "text",
  });
};
