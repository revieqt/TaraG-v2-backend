import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import {
  getTodaysAnnouncementsService,
  createAnnouncementService,
  updateAnnouncementService,
  deleteAnnouncementService,
  getAllAnnouncementsService,
  getAnnouncementByIdService,
} from './announcements.service';

interface AuthRequest extends Request {
  user?: any;
  processedImagePath?: string;
}

/**
 * Get today's announcements
 * GET /api/announcements/today
 * No auth required
 */
export const getTodaysAnnouncements = async (req: Request, res: Response) => {
  try {
    console.log('🟡 getTodaysAnnouncements - Fetching announcements');

    const announcements = await getTodaysAnnouncementsService();

    res.status(200).json({
      message: 'Today\'s announcements fetched successfully',
      data: announcements,
    });
  } catch (error) {
    console.error('❌ Error fetching today\'s announcements:', error);
    res.status(500).json({ message: 'Failed to fetch today\'s announcements' });
  }
};

/**
 * Create a new announcement
 * POST /api/announcements/create
 */
export const createAnnouncement = async (req: AuthRequest, res: Response) => {
  try {
    console.log('🟡 createAnnouncement - req.user:', req.user);
    console.log('🟡 createAnnouncement - req.file:', req.file);
    console.log('🟡 createAnnouncement - processedImagePath:', req.processedImagePath);

    const { title, altDesc, isExternal, linkPath, startsOn, endsOn } = req.body;

    // Validate required fields
    if (!title || !altDesc || isExternal === undefined || !linkPath || !startsOn || !endsOn) {
      return res.status(400).json({
        message: 'Missing required fields: title, altDesc, isExternal, linkPath, startsOn, endsOn',
      });
    }

    // Check if image was processed
    if (!req.processedImagePath) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    // Create announcement
    const newAnnouncement = await createAnnouncementService(
      title,
      req.processedImagePath,
      altDesc,
      isExternal === 'true' || isExternal === true,
      linkPath,
      new Date(startsOn),
      new Date(endsOn)
    );

    res.status(201).json({
      message: 'Announcement created successfully',
      data: newAnnouncement,
    });
  } catch (error) {
    console.error('❌ Error creating announcement:', error);
    res.status(500).json({ message: 'Failed to create announcement' });
  }
};

/**
 * Update an announcement
 * PATCH /api/announcements/update/:announcementId
 */
export const updateAnnouncement = async (req: AuthRequest, res: Response) => {
  try {
    const { announcementId } = req.params;
    const { title, altDesc, isExternal, linkPath, startsOn, endsOn } = req.body;

    console.log('🟡 updateAnnouncement - announcementId:', announcementId);
    console.log('🟡 updateAnnouncement - processedImagePath:', req.processedImagePath);

    // Validate required fields
    if (!title || !altDesc || isExternal === undefined || !linkPath || !startsOn || !endsOn) {
      return res.status(400).json({
        message: 'Missing required fields: title, altDesc, isExternal, linkPath, startsOn, endsOn',
      });
    }

    // Get existing announcement
    const existingAnnouncement = await getAnnouncementByIdService(announcementId);
    if (!existingAnnouncement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    let imagePath = existingAnnouncement.image;

    // If new image is provided, use it and delete the old one
    if (req.processedImagePath && req.processedImagePath !== existingAnnouncement.image) {
      imagePath = req.processedImagePath;

      // Delete old image file
      const oldImagePath = path.join(process.cwd(), existingAnnouncement.image);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
        console.log('✅ Old image deleted:', existingAnnouncement.image);
      }
    }

    // Update announcement
    const updatedAnnouncement = await updateAnnouncementService(
      announcementId,
      title,
      imagePath,
      altDesc,
      isExternal === 'true' || isExternal === true,
      linkPath,
      new Date(startsOn),
      new Date(endsOn)
    );

    res.status(200).json({
      message: 'Announcement updated successfully',
      data: updatedAnnouncement,
    });
  } catch (error) {
    console.error('❌ Error updating announcement:', error);
    res.status(500).json({ message: 'Failed to update announcement' });
  }
};

/**
 * Delete an announcement
 * DELETE /api/announcements/delete/:announcementId
 */
export const deleteAnnouncement = async (req: AuthRequest, res: Response) => {
  try {
    const { announcementId } = req.params;

    console.log('🟡 deleteAnnouncement - announcementId:', announcementId);

    // Get announcement to fetch image path
    const announcement = await getAnnouncementByIdService(announcementId);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    // Delete announcement from database
    const deleted = await deleteAnnouncementService(announcementId);

    if (!deleted) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    // Delete image file
    const imagePath = path.join(process.cwd(), announcement.image);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
      console.log('✅ Image deleted:', announcement.image);
    }

    res.status(200).json({
      message: 'Announcement deleted successfully',
    });
  } catch (error) {
    console.error('❌ Error deleting announcement:', error);
    res.status(500).json({ message: 'Failed to delete announcement' });
  }
};

/**
 * Get all announcements with filters and pagination
 * GET /api/announcements
 * Query params:
 * - searchKey (optional): search string
 * - startDate (optional): date filter start
 * - endDate (optional): date filter end
 * - page (optional): page number (default 1)
 */
export const getAllAnnouncements = async (req: AuthRequest, res: Response) => {
  try {
    const { searchKey, startDate, endDate, page = '1' } = req.query;

    console.log('🟡 getAllAnnouncements - query:', {
      searchKey,
      startDate,
      endDate,
      page,
    });

    // Build dateFilter if provided
    const dateFilter: { startsOn?: Date; endsOn?: Date } | undefined =
      startDate || endDate
        ? {
            startsOn: startDate ? new Date(startDate as string) : undefined,
            endsOn: endDate ? new Date(endDate as string) : undefined,
          }
        : undefined;

    // Fetch announcements
    const { announcements, total } = await getAllAnnouncementsService(
      searchKey as string | undefined,
      dateFilter,
      parseInt(page as string, 10)
    );

    const totalPages = Math.ceil(total / 10);
    const currentPage = parseInt(page as string, 10);

    res.status(200).json({
      message: 'Announcements fetched successfully',
      data: announcements,
      pagination: {
        currentPage,
        totalPages,
        totalCount: total,
        pageSize: 10,
      },
    });
  } catch (error) {
    console.error('❌ Error fetching announcements:', error);
    res.status(500).json({ message: 'Failed to fetch announcements' });
  }
};
