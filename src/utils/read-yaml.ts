import fs from "fs";
import yaml from "js-yaml";

import { Config } from "../types";

export const readYaml = (path: string) => {
  const content = fs.readFileSync(path, "utf-8");
  return yaml.load(content) as Config;
};
