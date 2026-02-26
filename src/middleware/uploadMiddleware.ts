// backend/src/middleware/uploadMiddleware.ts
import multer from "multer";
import fs from "fs";
import path from "path";
import sharp from "sharp";
import { Request, Response, NextFunction } from "express";

// Temporary upload folder
const tempPath = "uploads/temp";
const profileImagesPath = "uploads/profileImages";
const announcementsPath = "uploads/announcements";

if (!fs.existsSync(tempPath)) {
  fs.mkdirSync(tempPath, { recursive: true });
}

if (!fs.existsSync(profileImagesPath)) {
  fs.mkdirSync(profileImagesPath, { recursive: true });
}

if (!fs.existsSync(announcementsPath)) {
  fs.mkdirSync(announcementsPath, { recursive: true });
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

// Middleware to process and save announcement images
export const processAnnouncementImage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Image is optional for updates (if not changing image)
    if (!req.file) {
      return next();
    }

    const file = req.file;

    // Generate filename: timestamp_announcement
    const timestamp = Date.now();
    
    // Check if image has transparency by analyzing metadata
    const metadata = await sharp(file.path).metadata();
    const hasAlpha = metadata.hasAlpha || file.mimetype === 'image/png' || file.mimetype === 'image/webp' || file.mimetype === 'image/gif';
    
    // Use PNG for images with transparency, WEBP otherwise (better compression)
    const format = hasAlpha ? 'png' : 'webp';
    const filename = `${timestamp}_announcement.${format}`;
    const optimizedPath = path.join(announcementsPath, filename);

    // Get image dimensions for 2:3 ratio calculation
    const width = metadata.width || 600;
    const height = metadata.height || 900;
    const targetWidth = 600;
    const targetHeight = 900;

    // Process image: fit to 2:3 ratio while preserving transparency
    let pipeline = sharp(file.path);

    if (hasAlpha) {
      // For transparent images, use 'contain' to preserve transparency
      // and add transparent padding instead of filling
      pipeline = pipeline
        .resize(targetWidth, targetHeight, {
          fit: 'contain',
          position: 'center',
          background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent background
        })
        .png({ compressionLevel: 9 });
    } else {
      // For opaque images, use 'cover' for better composition
      pipeline = pipeline
        .resize(targetWidth, targetHeight, {
          fit: 'cover',
          position: 'center'
        })
        .webp({ quality: 80 });
    }

    await pipeline.toFile(optimizedPath);

    // Delete temporary file
    fs.unlinkSync(file.path);

    // Store the relative path in req for controller to use
    (req as any).processedImagePath = `/uploads/announcements/${filename}`;
    
    console.log(`✅ Announcement image processed: ${filename} (format: ${format}, hasAlpha: ${hasAlpha})`);
    next();
  } catch (error) {
    console.error('❌ Announcement image processing failed:', error);
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

// Middleware to process and save location point images
export const processLocationImage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Image is optional for location points
    if (!req.file) {
      return next();
    }

    const file = req.file;

    // Generate filename: timestamp_location
    const timestamp = Date.now();
    
    // Check if image has transparency
    const metadata = await sharp(file.path).metadata();
    const hasAlpha = metadata.hasAlpha || file.mimetype === 'image/png' || file.mimetype === 'image/webp' || file.mimetype === 'image/gif';
    
    // Use PNG for images with transparency, WEBP otherwise
    const format = hasAlpha ? 'png' : 'webp';
    const filename = `${timestamp}_location.${format}`;
    const locationsPath = 'uploads/locations';

    if (!fs.existsSync(locationsPath)) {
      fs.mkdirSync(locationsPath, { recursive: true });
    }

    const optimizedPath = path.join(locationsPath, filename);

    // Process image: resize to 1080px width for standardization
    let pipeline = sharp(file.path);

    if (hasAlpha) {
      // For transparent images, preserve transparency
      pipeline = pipeline
        .resize(1080, 800, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .png({ compressionLevel: 9 });
    } else {
      // For opaque images, use WEBP for better compression
      pipeline = pipeline
        .resize(1080, 800, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: 80 });
    }

    await pipeline.toFile(optimizedPath);

    // Delete temporary file
    fs.unlinkSync(file.path);

    // Store the relative path in req for controller to use
    (req as any).processedImagePath = `/uploads/locations/${filename}`;
    
    console.log(`✅ Location image processed: ${filename} (format: ${format}, hasAlpha: ${hasAlpha})`);
    next();
  } catch (error) {
    console.error('❌ Location image processing failed:', error);
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
