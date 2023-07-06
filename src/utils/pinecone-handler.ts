import { PineconeClient } from "@pinecone-database/pinecone";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { PineconeStore } from "langchain/vectorstores/pinecone";
import { Document } from "langchain/document";

export class PineconeHandler {
  constructor() {
    if (
      !process.env.PINECONE_ENVIRONMENT ||
      !process.env.PINECONE_API_KEY ||
      !process.env.PINECONE_INDEX_NAME
    ) {
      throw new Error("Pinecone environment, api-key or index-name missing");
    }
  }

  private async init() {
    const pinecone = new PineconeClient();
    await pinecone.init({
      environment: process.env.PINECONE_ENVIRONMENT!,
      apiKey: process.env.PINECONE_API_KEY!,
    });
    return pinecone;
  }

  async storeDocuments(documents: Document<Record<string, any>>[]) {
    const pinecone = await this.init();
    if (!pinecone) {
      throw new Error("Error when tried to initialize Pinecone");
    }
    const embeddings = new OpenAIEmbeddings();
    const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME!);
    await PineconeStore.fromDocuments(documents, embeddings, {
      namespace: process.env.PINECONE_NAMESPACE,
      pineconeIndex,
      textKey: "text",
    });
  }
}
