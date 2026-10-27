import { cp } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

await cp(
  path.join(backendRoot, "src/generated/client"),
  path.join(backendRoot, "dist/generated/client"),
  { recursive: true, force: true },
);
