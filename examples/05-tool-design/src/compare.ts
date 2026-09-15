import { executeAnything, executeAnythingSchema } from "./badTool.ts";
import type { Tool } from "./registry.ts";
import {
  listFiles,
  listFilesSchema,
  readFileSchema,
  readFileTool,
  runTests,
  runTestsSchema,
  searchCode,
  searchCodeSchema,
} from "./tools.ts";

export const badTool: Tool = {
  schema: executeAnythingSchema,
  kind: "execute",
  run: executeAnything,
};

export const goodTools: Tool[] = [
  { schema: searchCodeSchema, kind: "read", run: searchCode },
  { schema: readFileSchema, kind: "read", run: readFileTool },
  { schema: listFilesSchema, kind: "read", run: listFiles },
  { schema: runTestsSchema, kind: "execute", run: runTests },
];
