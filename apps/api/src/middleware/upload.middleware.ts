import fs from "node:fs";
import path from "node:path";
import multer from "multer";
import { env } from "../config/env.js";

const uploadRoot = path.resolve(env.UPLOAD_DIR);
fs.mkdirSync(uploadRoot, { recursive: true });

const storage = multer.diskStorage({
  destination(_request, _file, callback) {
    callback(null, uploadRoot);
  },
  filename(_request, file, callback) {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "-");
    callback(null, `${Date.now()}-${safeName}`);
  }
});

export const upload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024,
    files: 12
  }
});
