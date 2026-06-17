import compression from "compression";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { apiRouter } from "./routes/index.js";
import { env } from "./config/env.js";
import { errorHandler, notFound } from "./middleware/error.middleware.js";
import { startReminderJobs } from "./services/reminder.service.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app: express.Express = express();

app.use(helmet());
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(compression());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(rateLimit({ windowMs: 60_000, limit: 180 }));
const uploadsDir = path.isAbsolute(env.UPLOAD_DIR)
  ? env.UPLOAD_DIR
  : path.join(__dirname, '..', env.UPLOAD_DIR)
app.use("/uploads", express.static(uploadsDir));

app.use("/api", apiRouter);
app.use(notFound);
app.use(errorHandler);

if (env.NODE_ENV !== "test") {
  app.listen(env.PORT, () => {
    console.log(`Lendora API running on http://localhost:${env.PORT}`);
    startReminderJobs();
  });
}

export default app;
