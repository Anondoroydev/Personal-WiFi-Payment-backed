import { env } from "./config/env.js";
import { createApp } from "./app.js";

const app = createApp();

export default async function handler(req: any, res: any) {
  try {
    return app(req, res);
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err?.message || "Internal Server Error",
    });
  }
}

