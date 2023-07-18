import path from "path";

import { splitPDFInDocuments } from "./utils/split-pdf-in-documents";
import { readPdf } from "./utils/read-pdf";
import * as pinecone from "./pinecone-handler";

const PDF_FILE_PATH = path.join(
  path.resolve(__dirname, "..", "test-files"),
  "aws.pdf"
);

export const loadPdfPinecone = async () => {
  const pdfContent = await readPdf(PDF_FILE_PATH);
  if (!pdfContent) {
    throw new Error("Error when tried to read the pdf");
  }
  // transform the pdf-content in documents
  const pdfContentSplittedInDocuments = await splitPDFInDocuments(
    pdfContent.text,
    path.basename(PDF_FILE_PATH)
  );
  // store the documents into the Pinecone
  await pinecone.storeDocuments(pdfContentSplittedInDocuments);
};

(async () => {
  await loadPdfPinecone();
})();
