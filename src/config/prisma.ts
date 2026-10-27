import { env } from "./env.js";
import { PrismaClient } from "../generated/client/index.js";

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: env.databaseUrl,
    },
  },
});
