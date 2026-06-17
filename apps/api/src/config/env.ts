import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(5000),
  CLIENT_URL: z.string().url().default("http://localhost:3000"),
  JWT_SECRET: z.string().min(24).default("development-jwt-secret-change-me"),
  JWT_REFRESH_SECRET: z.string().min(24).default("development-refresh-secret-change-me"),
  DB_HOST: z.string().default("localhost"),
  DB_PORT: z.coerce.number().default(3306),
  DB_USER: z.string().default("root"),
  DB_PASSWORD: z.string().default(""),
  DB_NAME: z.string().default("lendora"),
  UPLOAD_DIR: z.string().default("uploads"),
  PUBLIC_UPLOAD_URL: z.string().url().default("http://localhost:5000/uploads"),
  BKASH_BASE_URL: z.string().url().default("https://tokenized.sandbox.bka.sh/v1.2.0-beta"),
  BKASH_APP_KEY: z.string().optional(),
  BKASH_APP_SECRET: z.string().optional(),
  BKASH_USERNAME: z.string().optional(),
  BKASH_PASSWORD: z.string().optional(),
  BKASH_CALLBACK_URL: z.string().url().default("http://localhost:3000/payment/callback")
});

export const env = envSchema.parse(process.env);
