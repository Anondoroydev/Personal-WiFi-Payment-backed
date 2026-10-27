import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./config/prisma.js";

const app = createApp();

function isAddressInUseError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error && error.code === "EADDRINUSE";
}

function listen(): Promise<void> {
  return new Promise((resolve, reject) => {
    const server = app.listen(env.port);
    server.once("listening", resolve);
    server.once("error", reject);
  });
}

async function start() {
  try {
    await prisma.$connect();
    await listen();
    console.info(`API server listening on port ${env.port}`);
  } catch (error) {
    if (isAddressInUseError(error)) {
      console.error(
        `Port ${env.port} is already in use. Stop the other server before starting this backend.`,
      );
    } else {
      console.error("Failed to start the API server:", error);
    }

    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      console.error("Failed to disconnect from the database:", disconnectError);
    }

    process.exitCode = 1;
  }
}

start();

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
