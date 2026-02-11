import express from 'express';
import { updateBooleanUserData, updateStringUserData, uploadProfileImage, updateUserLikes } from './user.controller';
import { authMiddleware } from '../../middleware/authMiddleware';
import { upload, processProfileImage } from '../../middleware/uploadMiddleware';

const router = express.Router();

// Update boolean user data (visibilitySettings, securitySettings, etc.)
router.patch('/update-boolean', authMiddleware, updateBooleanUserData);

// Update string user data (fname, lname, bio, etc.)
router.patch('/update-string', authMiddleware, updateStringUserData);

// Upload profile image
router.post('/upload-profile-image', authMiddleware, upload.single('image'), processProfileImage, uploadProfileImage);

// Update user likes and optionally isFirstLogin
router.patch('/update-likes', authMiddleware, updateUserLikes);

export default router;
