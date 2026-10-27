import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Root of backend/ directory
const backendRoot = path.resolve(__dirname, "../../");

if (process.env.VERCEL !== "1") {
  dotenv.config({ path: path.join(backendRoot, ".env") });
  dotenv.config({ path: path.resolve(backendRoot, "../.env") });
  dotenv.config();
}

function resolveDatabaseUrl(): string {
  const raw = (process.env.DATABASE_URL ?? "").trim();
  const defaultSupabase = "postgresql://postgres.hegotbowhrqfxepdggyz:fYWXxTY8UadizKRk@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true";

  const isVercel = process.env.VERCEL === "1" || process.env.NODE_ENV === "production";

  if (isVercel) {
    if (!raw || raw.startsWith("file:") || raw.includes("localhost")) {
      return defaultSupabase;
    }
    return raw;
  }

  // The local Prisma client uses SQLite; PostgreSQL URLs are for production.
  const dbPath = path.resolve(backendRoot, "prisma/dev.db");
  return `file:${dbPath}`;
}

export const env = {
  port: Number(process.env.PORT ?? 3001),
  databaseUrl: resolveDatabaseUrl(),
  jwtSecret: process.env.JWT_SECRET || "default_super_secret_wifi_jwt_token_key_2026",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  corsOrigins: (process.env.CORS_ORIGIN ?? "*")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  adminEmail: process.env.ADMIN_EMAIL ?? "admin@wifi.local",
  adminPassword: process.env.ADMIN_PASSWORD,
  adminName: process.env.ADMIN_NAME ?? "Admin",
  adminPhone: process.env.ADMIN_PHONE,
  smtpHost: process.env.SMTP_HOST,
  smtpPort: Number(process.env.SMTP_PORT ?? 587),
  smtpUser: process.env.SMTP_USER,
  smtpPassword: process.env.SMTP_PASSWORD,
  smtpFrom: process.env.SMTP_FROM,
};
