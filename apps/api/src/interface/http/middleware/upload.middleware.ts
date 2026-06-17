import multer    from 'multer'
import sharp     from 'sharp'
import crypto    from 'node:crypto'
import { v2 as cloudinary } from 'cloudinary'
import type { Request, Response, NextFunction } from 'express'

// ── Cloudinary configuration ─────────────────────────────────────────────────
// Credentials are set via CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET env vars.
// Falls back to local-disk behaviour if credentials are missing (dev mode).
const CLOUDINARY_CONFIGURED =
  !!(process.env['CLOUDINARY_CLOUD_NAME'] &&
     process.env['CLOUDINARY_API_KEY']    &&
     process.env['CLOUDINARY_API_SECRET'])

if (CLOUDINARY_CONFIGURED) {
  cloudinary.config({
    cloud_name: process.env['CLOUDINARY_CLOUD_NAME'],
    api_key:    process.env['CLOUDINARY_API_KEY'],
    api_secret: process.env['CLOUDINARY_API_SECRET'],
    secure:     true,
  })
}

// ── Multer — always memory storage (no temp files) ───────────────────────────
const MAX_FILE_MB = 10

const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp']
  cb(null, allowed.includes(file.mimetype))
}

const multerInstance = multer({
  storage:    multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: MAX_FILE_MB * 1024 * 1024 },
})

export const uploadSingle   = multerInstance.single('file')
export const uploadMultiple = multerInstance.array('files', 10)
export const uploadVendorRegistrationFiles = multerInstance.fields([
  { name: 'profilePicture', maxCount: 1 },
  { name: 'nidFrontImage',  maxCount: 1 },
  { name: 'nidBackImage',   maxCount: 1 },
])

// ── Image processing + storage ───────────────────────────────────────────────

async function processImage(buffer: Buffer, subdir: string): Promise<string> {
  const webpBuffer = await sharp(buffer)
    .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer()

  if (CLOUDINARY_CONFIGURED) {
    return uploadToCloudinary(webpBuffer, subdir)
  }

  // ── Local fallback (development without Cloudinary) ──────────────────────
  const path = await import('node:path')
  const fs   = await import('node:fs/promises')
  const { fileURLToPath } = await import('node:url')

  const __dirname  = path.default.dirname(fileURLToPath(import.meta.url))
  const _rawDir    = process.env['UPLOAD_DIR'] ?? 'uploads'
  const UPLOAD_DIR = path.default.isAbsolute(_rawDir)
    ? _rawDir
    : path.default.join(__dirname, '..', '..', '..', '..', _rawDir)

  const filename = `${crypto.randomUUID()}.webp`
  const dir      = path.default.join(UPLOAD_DIR, subdir)
  await fs.default.mkdir(dir, { recursive: true })
  await fs.default.writeFile(path.default.join(dir, filename), webpBuffer)

  const baseUrl = process.env['SERVER_URL'] ?? 'http://localhost:4000'
  return `${baseUrl}/uploads/${subdir}/${filename}`
}

function uploadToCloudinary(buffer: Buffer, folder: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder:           `lendora/${folder}`,
        format:           'webp',
        public_id:        crypto.randomUUID(),
        overwrite:        false,
        resource_type:    'image',
        transformation:   [{ quality: 'auto', fetch_format: 'webp' }],
      },
      (error, result) => {
        if (error || !result) reject(error ?? new Error('Cloudinary upload failed'))
        else resolve(result.secure_url)
      },
    )
    stream.end(buffer)
  })
}

// ── Express middleware helpers ───────────────────────────────────────────────

export function processUploadedFile(subdir: string) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    if (!req.file) return next()
    try {
      req.body.uploadedUrl = await processImage(req.file.buffer, subdir)
      next()
    } catch (err) {
      next(err)
    }
  }
}

export function processUploadedFiles(subdir: string) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const files = req.files as Express.Multer.File[] | undefined
    if (!files?.length) return next()
    try {
      req.body.uploadedUrls = await Promise.all(files.map((f) => processImage(f.buffer, subdir)))
      next()
    } catch (err) {
      next(err)
    }
  }
}

export function processVendorRegistrationFiles() {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const fields = req.files as Record<string, Express.Multer.File[]> | undefined
    if (!fields) return next()
    try {
      const [profilePicture] = fields['profilePicture'] ?? []
      const [nidFrontImage]  = fields['nidFrontImage']  ?? []
      const [nidBackImage]   = fields['nidBackImage']   ?? []

      if (profilePicture) req.body.profilePictureUrl = await processImage(profilePicture.buffer, 'avatars')
      if (nidFrontImage)  req.body.nidFrontImageUrl  = await processImage(nidFrontImage.buffer,  'nid')
      if (nidBackImage)   req.body.nidBackImageUrl   = await processImage(nidBackImage.buffer,   'nid')
      next()
    } catch (err) {
      next(err)
    }
  }
}
