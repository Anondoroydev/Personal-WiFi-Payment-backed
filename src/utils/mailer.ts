import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import { AppError } from "./error.js";

function createTransport() {
  if (
    !env.smtpHost ||
    !Number.isInteger(env.smtpPort) ||
    !env.smtpUser ||
    !env.smtpPassword ||
    !env.smtpFrom
  ) {
    throw new AppError("Email delivery is not configured", 503);
  }

  return nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpPort === 465,
    auth: {
      user: env.smtpUser,
      pass: env.smtpPassword,
    },
  });
}

export async function sendPasswordResetEmail(
  email: string,
  name: string,
  code: string,
) {
  const transport = createTransport();
  await transport.sendMail({
    from: env.smtpFrom,
    to: email,
    subject: "Your WiFi account password reset code",
    text: `Hello ${name},\n\nYour password reset code is ${code}. It expires in 10 minutes. If you did not request this, you can ignore this email.`,
  });
}
