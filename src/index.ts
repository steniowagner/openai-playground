import path from "path";

import { splitPDFInDocuments } from "./utils/split-pdf-in-documents";
import { readPdf } from "./utils/read-pdf";
import * as pinecone from "./utils/pinecone-handler";
import { readYaml } from "./utils/read-yaml";

const PDF_FILE_PATH = path.join(
  path.resolve(__dirname, "..", "test-files"),
  "test.pdf"
);
const YAML_FILE_PATH = path.join(
  path.resolve(__dirname, "..", "test-files"),
  "config.yaml"
);

const run = async () => {
  try {
    console.log(readYaml(YAML_FILE_PATH));
    // read the pdf-content
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
  } catch (err) {
    console.log(err);
  }
};

(async () => {
  await run();
})();
