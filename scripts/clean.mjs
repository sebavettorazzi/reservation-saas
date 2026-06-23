import { rm } from "node:fs/promises";

const generatedPaths = [".next", "coverage", "tsconfig.tsbuildinfo"];

await Promise.all(
  generatedPaths.map((path) => rm(path, { recursive: true, force: true }))
);

console.log("Generated files removed.");
