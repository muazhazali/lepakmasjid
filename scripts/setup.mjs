import { existsSync, copyFileSync } from "node:fs";
import { resolve } from "node:path";

const minimumNode = 24;
const currentNode = Number(process.versions.node.split(".")[0]);

if (currentNode < minimumNode) {
  console.error(
    `Node.js ${minimumNode}+ is required. Current version: ${process.version}`
  );
  process.exit(1);
}

const envExample = resolve(".env.example");
const envLocal = resolve(".env.local");

if (!existsSync(envLocal)) {
  copyFileSync(envExample, envLocal);
  console.log("Created .env.local from .env.example");
} else {
  console.log("Kept existing .env.local");
}

console.log("Setup complete.");
console.log("Next steps:");
console.log("  1. Confirm VITE_POCKETBASE_URL in .env.local");
console.log("  2. Set PocketBase admin credentials in .env.local");
console.log(
  "  3. Run `pnpm setup:pocketbase` to create schema and sample data"
);
console.log("  4. Run `pnpm dev`");
