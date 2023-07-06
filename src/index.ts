import { readPdf } from "./utils/read-pdf";

const run = async () => {
  const pdfContent = await readPdf(
    "/Users/steniowagner/dev/openai-playground/test-files/test.pdf"
  );
};
