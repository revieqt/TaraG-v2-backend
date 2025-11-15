// backend/src/middleware/uploadMiddleware.ts
import multer from "multer";
import fs from "fs";
import path from "path";
import sharp from "sharp";
import { Request, Response, NextFunction } from "express";

// Temporary upload folder
const tempPath = "uploads/temp";
const profileImagesPath = "uploads/profileImages";

if (!fs.existsSync(tempPath)) {
  fs.mkdirSync(tempPath, { recursive: true });
}

if (!fs.existsSync(profileImagesPath)) {
  fs.mkdirSync(profileImagesPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, tempPath);
  },
  filename: (_req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images are allowed.'));
  }
};

export const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// ✅ Add explicit types for req, res, next
export const optimizeImage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.file) return next();

    const file = req.file;
    const ext = path.extname(file.originalname).toLowerCase();

    // Determine upload type (profileImages, files, etc.)
    const type = req.params.type || "files";
    const uploadPath = path.join("uploads", type);

    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });

    const optimizedPath = path.join(uploadPath, file.filename);

    if ([".jpg", ".jpeg", ".png"].includes(ext)) {
      await sharp(file.path)
        .resize({ width: 1080 }) // Optional: resize width
        .jpeg({ quality: 80 }) // Compress
        .toFile(optimizedPath);

      fs.unlinkSync(file.path); // Delete temp file
    } else {
      fs.renameSync(file.path, optimizedPath);
    }

    req.file.path = optimizedPath;
    next();
  } catch (error) {
    console.error("Image optimization failed:", error);
    next(error);
  }
};

// Middleware to process and save profile images
export const processProfileImage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const file = req.file;
    const userId = req.body.userId || '';
    const ext = path.extname(file.originalname).toLowerCase();

    // Generate filename: timestamp_userId
    const timestamp = Date.now();
    const filename = `${timestamp}_${userId.replace(/\//g, '_')}.jpg`;
    const optimizedPath = path.join(profileImagesPath, filename);

    // Compress and optimize image for profile (portrait 3:4 ratio)
    await sharp(file.path)
      .resize(600, 800, {
        fit: 'cover', // Crop to aspect ratio
        position: 'center'
      })
      .jpeg({ quality: 85, progressive: true })
      .toFile(optimizedPath);

    // Delete temporary file
    fs.unlinkSync(file.path);

    // Store the relative path in req for controller to use
    (req as any).processedImagePath = `/uploads/profileImages/${filename}`;
    
    next();
  } catch (error) {
    console.error('Profile image processing failed:', error);
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
    res.status(500).json({ message: 'Failed to process image' });
  }
};
