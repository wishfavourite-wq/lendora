import { env } from "../config/env.js";

export interface StoredAsset {
  url: string;
  provider: "local" | "cloudinary";
  key: string;
}

export function fromUploadedFile(file: Express.Multer.File): StoredAsset {
  return {
    url: `${env.PUBLIC_UPLOAD_URL}/${file.filename}`,
    provider: "local",
    key: file.filename
  };
}

export async function uploadToCloudinaryReadyAdapter(_file: Express.Multer.File): Promise<StoredAsset> {
  throw new Error("Cloudinary adapter is ready for credentials and implementation.");
}
