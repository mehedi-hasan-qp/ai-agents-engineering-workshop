import { badTool, goodTools } from "./compare.ts";

console.log("Bad tool schema (one opaque string, no classification):");
console.log(JSON.stringify(badTool.schema, null, 2));

console.log("\nGood tool schemas (narrow, typed, classified):");
for (const tool of goodTools) {
  console.log(`- ${tool.schema.name} [${tool.kind}]: ${tool.schema.description}`);
}
