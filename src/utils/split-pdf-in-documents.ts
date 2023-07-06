import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Document } from "langchain/document";

const CHUNK_OVERLAP = 200;
const CHUNK_SIZE = 1000;

export const splitPDFInDocuments = async (
  pdfContent: string,
  pdfFileName: string
) => {
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkOverlap: CHUNK_OVERLAP,
    chunkSize: CHUNK_SIZE,
  });
  const documents = await textSplitter.splitDocuments([
    new Document({
      metadata: { source: pdfFileName, type: "file" },
      pageContent: pdfContent,
    }),
  ]);
  return documents;
};
