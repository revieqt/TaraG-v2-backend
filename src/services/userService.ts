import User from '../models/userModel';
import fs from 'fs';
import path from 'path';

/**
 * Update a boolean field in the user document
 * Supports nested fields using dot notation (e.g., "visibilitySettings.isProfilePublic")
 * Returns only the affected field (not full user document) to reduce latency
 */
export const updateBooleanFieldService = async (
  userId: string,
  fieldName: string,
  value: boolean
) => {
  try {
    console.log(`🔵 updateBooleanFieldService - userId: ${userId}, fieldName: ${fieldName}, value: ${value}`);
    
    // Validate that fieldName follows expected patterns
    const allowedFields = [
      'isFirstLogin',
      'isProUser',
      'safetyState.isInAnEmergency',
      'visibilitySettings.isProfilePublic',
      'visibilitySettings.isPersonalInfoPublic',
      'visibilitySettings.isTravelInfoPublic',
      'securitySettings.is2FAEnabled',
      'taraBuddySettings.isTaraBuddyEnabled'
    ];

    if (!allowedFields.includes(fieldName)) {
      throw new Error(`Invalid field name: ${fieldName}`);
    }

    const updateData: any = {};
    updateData[fieldName] = value;

    console.log(`🔵 Update data:`, updateData);

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    );

    console.log(`🔵 Updated user:`, updatedUser);
    
    // Return only the affected field (not full user document)
    // For nested fields (e.g., "visibilitySettings.isProfilePublic"), create the nested structure
    const affectedFields: any = {};
    
    console.log(`🔵 fieldName: "${fieldName}", includes dot: ${fieldName.includes('.')}`);
    
    if (fieldName.includes('.')) {
      // Handle nested fields
      console.log(`🔵 Processing nested field`);
      const parts = fieldName.split('.');
      console.log(`🔵 Parts:`, parts);
      let current = affectedFields;
      for (let i = 0; i < parts.length - 1; i++) {
        console.log(`🔵 Creating nested key: ${parts[i]}`);
        current[parts[i]] = {};
        current = current[parts[i]];
      }
      const lastPart = parts[parts.length - 1];
      console.log(`🔵 Setting final key: ${lastPart} = ${value}`);
      current[lastPart] = value;
    } else {
      // Handle flat fields
      console.log(`🔵 Processing flat field`);
      affectedFields[fieldName] = value;
    }
    
    console.log(`🔵 Returning only affected fields:`, affectedFields);
    return affectedFields;
  } catch (error) {
    console.error(`❌ Error updating boolean field ${fieldName}:`, error);
    throw error;
  }
};

/**
 * Update a string field in the user document
 * Supports nested fields using dot notation if needed
 * Returns only the affected field (not full user document) to reduce latency
 */
export const updateStringFieldService = async (
  userId: string,
  fieldName: string,
  value: string
) => {
  try {
    console.log(`🟡 updateStringFieldService - userId: ${userId}, fieldName: ${fieldName}, value: ${value}`);
    
    // Validate that fieldName follows expected patterns
    const allowedFields = [
      'fname',
      'lname',
      'bio',
      'contactNumber',
      'status',
      'profileImage',
      'safetyState.emergencyType',
      'safetyState.emergencyContact',
      'taraBuddySettings.preferredGender'
    ];

    if (!allowedFields.includes(fieldName)) {
      throw new Error(`Invalid field name: ${fieldName}`);
    }

    const updateData: any = {};
    updateData[fieldName] = value;

    console.log(`🟡 Update data:`, updateData);

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    );

    console.log(`🟡 Updated user:`, updatedUser);
    
    // Return only the affected field (not full user document)
    // For nested fields (e.g., "safetyState.emergencyType"), create the nested structure
    const affectedFields: any = {};
    
    console.log(`🟡 fieldName: "${fieldName}", includes dot: ${fieldName.includes('.')}`);
    
    if (fieldName.includes('.')) {
      // Handle nested fields
      console.log(`🟡 Processing nested field`);
      const parts = fieldName.split('.');
      console.log(`🟡 Parts:`, parts);
      let current = affectedFields;
      for (let i = 0; i < parts.length - 1; i++) {
        console.log(`🟡 Creating nested key: ${parts[i]}`);
        current[parts[i]] = {};
        current = current[parts[i]];
      }
      const lastPart = parts[parts.length - 1];
      console.log(`🟡 Setting final key: ${lastPart} = ${value}`);
      current[lastPart] = value;
    } else {
      // Handle flat fields
      console.log(`🟡 Processing flat field`);
      affectedFields[fieldName] = value;
    }
    
    console.log(`🟡 Returning only affected fields:`, affectedFields);
    return affectedFields;
  } catch (error) {
    console.error(`❌ Error updating string field ${fieldName}:`, error);
    throw error;
  }
};

/**
 * Delete a profile image file from the uploads folder
 * @param imagePath - The relative path to the image (e.g., /uploads/profileImages/timestamp_userId.jpg)
 */
export const deleteProfileImageFile = (imagePath: string): boolean => {
  try {
    if (!imagePath || imagePath === '') {
      console.log('🖼️ No image to delete');
      return true;
    }

    // Extract the filename from the path
    const filename = path.basename(imagePath);
    const fullPath = path.join(__dirname, '../../uploads/profileImages', filename);

    // Check if file exists and delete it
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log(`🖼️ Deleted old profile image: ${fullPath}`);
      return true;
    } else {
      console.log(`🖼️ Old profile image not found: ${fullPath}`);
      return true;
    }
  } catch (error) {
    console.error(`❌ Error deleting profile image:`, error);
    // Don't throw, just log - we don't want to fail the entire operation
    return false;
  }
};

/**
 * Update user's profile image and delete the old one
 * Returns only the profileImage field (not full user document) to reduce latency
 * @param userId - User ID
 * @param newImagePath - The new image path
 */
export const updateProfileImageWithCleanup = async (
  userId: string,
  newImagePath: string
) => {
  try {
    console.log(`🖼️ updateProfileImageWithCleanup - userId: ${userId}, newImagePath: ${newImagePath}`);

    // Get current user to retrieve old image path
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const oldImagePath = user.profileImage;

    // Delete old image file if it exists
    if (oldImagePath && oldImagePath !== '') {
      deleteProfileImageFile(oldImagePath);
    }

    // Update user with new image path
    user.profileImage = newImagePath;
    await user.save();

    console.log(`🖼️ Profile image updated successfully`);
    
    // Return only the affected field (not full user document)
    console.log(`🖼️ Returning only affected fields: { profileImage: ${newImagePath} }`);
    return { profileImage: newImagePath };
  } catch (error) {
    console.error(`❌ Error updating profile image with cleanup:`, error);
    throw error;
  }
};

/**
 * Update user's likes array and optionally isFirstLogin field
 * Returns only the affected fields (not full user document) to reduce latency
 * @param userId - User ID
 * @param likes - Array of category strings that user likes
 * @param isFirstLoginValue - Optional boolean to update isFirstLogin field
 */
export const updateUserLikesService = async (
  userId: string,
  likes: string[],
  isFirstLoginValue?: boolean
) => {
  try {
    console.log(`❤️ updateUserLikesService - userId: ${userId}, likes: ${likes}, isFirstLoginValue: ${isFirstLoginValue}`);

    if (!Array.isArray(likes)) {
      throw new Error('Likes must be an array of strings');
    }

    const updateData: any = {
      likes: likes
    };

    // If isFirstLoginValue is provided, update it
    if (typeof isFirstLoginValue === 'boolean') {
      updateData.isFirstLogin = isFirstLoginValue;
      console.log(`❤️ Updating isFirstLogin to: ${isFirstLoginValue}`);
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      throw new Error('User not found');
    }

    console.log(`❤️ User likes updated successfully`);
    
    // Return only the affected fields (not full user document)
    const affectedFields: any = { likes: updatedUser.likes };
    if (typeof isFirstLoginValue === 'boolean') {
      affectedFields.isFirstLogin = updatedUser.isFirstLogin;
    }
    console.log(`❤️ Returning only affected fields:`, affectedFields);
    return affectedFields;
  } catch (error) {
    console.error(`❌ Error updating user likes:`, error);
    throw error;
  }
};
