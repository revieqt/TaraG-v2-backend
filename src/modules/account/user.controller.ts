import { Request, Response } from 'express';
import { updateBooleanFieldService, updateStringFieldService, updateProfileImageWithCleanup, updateUserLikesService } from './user.service';

interface AuthRequest extends Request {
  user?: any;
}

export const updateBooleanUserData = async (req: AuthRequest, res: Response) => {
  try {
    console.log('🔵 updateBooleanUserData - req.user:', req.user);
    const { userId, fieldName, value } = req.body;

    console.log('🔵 Received:', { userId, fieldName, value });

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    if (!fieldName || typeof fieldName !== 'string') {
      return res.status(400).json({ message: 'Invalid fieldName provided' });
    }

    if (typeof value !== 'boolean') {
      return res.status(400).json({ message: 'Value must be a boolean' });
    }

    const result = await updateBooleanFieldService(userId, fieldName, value);

    if (!result) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('🔵 Result from service:', result);
    
    // Remove flat dot-notation keys from result (they shouldn't be in the response)
    // Keep only properly nested structure
    const cleanedResult: any = {};
    for (const key in result) {
      if (!key.includes('.')) {
        cleanedResult[key] = result[key];
      }
    }
    
    console.log('🔵 Cleaned result:', cleanedResult);
    res.status(200).json({
      message: 'Boolean field updated successfully',
      data: cleanedResult
    });
  } catch (error) {
    console.error('❌ Error updating boolean user data:', error);
    res.status(500).json({ message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const updateStringUserData = async (req: AuthRequest, res: Response) => {
  try {
    console.log('🟡 updateStringUserData - req.user:', req.user);
    const { userId, fieldName, value } = req.body;

    console.log('🟡 Received:', { userId, fieldName, value });

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    if (!fieldName || typeof fieldName !== 'string') {
      return res.status(400).json({ message: 'Invalid fieldName provided' });
    }

    if (typeof value !== 'string') {
      return res.status(400).json({ message: 'Value must be a string' });
    }

    const result = await updateStringFieldService(userId, fieldName, value);

    if (!result) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: 'String field updated successfully',
      data: result
    });
  } catch (error) {
    console.error('❌ Error updating string user data:', error);
    res.status(500).json({ message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const uploadProfileImage = async (req: AuthRequest, res: Response) => {
  try {
    console.log('🖼️ uploadProfileImage - req.user:', req.user);
    const { userId } = req.body;
    const imagePath = (req as any).processedImagePath;

    console.log('🖼️ Received:', { userId, imagePath });

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    if (!imagePath) {
      return res.status(400).json({ message: 'Image file is required' });
    }

    // Update user's profileImage field and delete old image
    const result = await updateProfileImageWithCleanup(userId, imagePath);

    if (!result) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: 'Profile image uploaded successfully',
      data: result
    });
  } catch (error) {
    console.error('❌ Error uploading profile image:', error);
    res.status(500).json({ message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const updateUserLikes = async (req: AuthRequest, res: Response) => {
  try {
    console.log('❤️ updateUserLikes - req.user:', req.user);
    const { likes, isFirstLoginValue } = req.body;
    const userId = req.user?.id || req.user?.userId;

    console.log('❤️ Received:', { userId, likes, isFirstLoginValue });

    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!Array.isArray(likes)) {
      return res.status(400).json({ message: 'Likes must be an array of strings' });
    }

    // Validate that all items in likes array are strings
    if (!likes.every(item => typeof item === 'string')) {
      return res.status(400).json({ message: 'All items in likes array must be strings' });
    }

    // Optional: validate isFirstLoginValue if provided
    if (typeof isFirstLoginValue !== 'undefined' && typeof isFirstLoginValue !== 'boolean') {
      return res.status(400).json({ message: 'isFirstLoginValue must be a boolean if provided' });
    }

    const result = await updateUserLikesService(userId, likes, isFirstLoginValue);

    if (!result) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: 'User likes updated successfully',
      data: result
    });
  } catch (error) {
    console.error('❌ Error updating user likes:', error);
    res.status(500).json({ message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

