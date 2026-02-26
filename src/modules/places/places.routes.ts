import express from 'express';
import {
  createLocationPoint,
  updateLocationPoint,
  getLocationPoint,
  deleteLocationPoint,
  getAllLocationPoints,
} from './places.controller';
import { authMiddleware } from '../../middleware/authMiddleware';
import { upload, processLocationImage } from '../../middleware/uploadMiddleware';

const router = express.Router();

// Create a new location point
router.post(
  '/create',
  authMiddleware,
  upload.single('image'),
  processLocationImage,
  createLocationPoint
);

// Update a location point
router.patch(
  '/update/:locationId',
  authMiddleware,
  upload.single('image'),
  processLocationImage,
  updateLocationPoint
);

// Get a single location point
router.get('/:locationId', authMiddleware, getLocationPoint);

// Delete a location point
router.delete('/delete/:locationId', authMiddleware, deleteLocationPoint);

// Get all location points with filters and pagination
router.get('/', authMiddleware, getAllLocationPoints);

export default router;
