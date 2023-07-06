import path from "path";

import { splitPDFInDocuments } from "./utils/split-pdf-in-documents";
import { readPdf } from "./utils/read-pdf";
import * as pinecone from "./utils/pinecone-handler";

const PDF_FILE_PATH =
  "/Users/steniowagner/dev/openai-playground/test-files/test.pdf";

const run = async () => {
  try {
    const pdfContent = await readPdf(PDF_FILE_PATH);
    if (!pdfContent) {
      throw new Error("Error when tried to read the pdf");
    }
    const pdfContentSplittedInDocuments = await splitPDFInDocuments(
      pdfContent.text,
      path.basename(PDF_FILE_PATH)
    );
    await pinecone.storeDocuments(pdfContentSplittedInDocuments);
  } catch (err) {
    console.log(err);
  }
};

(async () => {
  await run();
})();
