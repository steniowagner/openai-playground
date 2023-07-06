import fs from "fs";
import yaml from "js-yaml";

export const readYaml = (path: string) => {
  const content = fs.readFileSync(path, "utf-8");
  return yaml.load(content);
};
