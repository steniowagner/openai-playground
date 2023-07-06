import pdfParser from "pdf-parse";
import fs from "fs";

export const readPdf = async (path: string) => {
  try {
    const buffer = fs.readFileSync(path);
    return pdfParser(buffer);
  } catch (error) {
    console.error("Error reading PDF:", error);
  }
};
