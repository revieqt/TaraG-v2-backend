import express from 'express';
import {
  getTodaysAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getAllAnnouncements,
} from './announcement.controller';
import { authMiddleware } from '../../middleware/authMiddleware';
import { upload, processAnnouncementImage } from '../../middleware/uploadMiddleware';

const router = express.Router();

router.get('/today', getTodaysAnnouncements);

// Create a new announcement
router.post(
  '/create',
  authMiddleware,
  upload.single('image'),
  processAnnouncementImage,
  createAnnouncement
);

// Update an announcement
router.patch(
  '/update/:announcementId',
  authMiddleware,
  upload.single('image'),
  processAnnouncementImage,
  updateAnnouncement
);

// Delete an announcement
router.delete('/delete/:announcementId', authMiddleware, deleteAnnouncement);

// Get all announcements with filters and pagination
router.get('/', authMiddleware, getAllAnnouncements);

export default router;
