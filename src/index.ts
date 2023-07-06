import path from "path";

import { readPdf } from "./utils/read-pdf";
import { splitPdfIntoDocuments } from "./utils/split-pdf-into-documents";

const PDF_FILE_PATH =
  "/Users/steniowagner/dev/openai-playground/test-files/test.pdf";

const run = async () => {
  try {
    const pdfName = path.basename(PDF_FILE_PATH);
    const pdfContent = await readPdf(PDF_FILE_PATH);
    if (!pdfContent) {
      throw new Error("Error when tried to read the pdf");
    }
    const pdfContentSplittedIntoDocuments = await splitPdfIntoDocuments(
      pdfContent.text,
      pdfName
    );
    console.log(pdfContentSplittedIntoDocuments);
  } catch (err) {}
};

(async () => {
  await run();
})();
