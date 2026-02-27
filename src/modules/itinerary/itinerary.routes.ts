import express from 'express';
import {
  viewItinerary,
  createItinerary,
  updateItinerary,
  deleteItinerary,
  cancelItinerary,
  markItineraryAsDone,
  repeatItinerary,
  viewUserItineraries,
} from './itinerary.controller';
import { authMiddleware } from '../../middleware/authMiddleware';

const router = express.Router();

// View all itineraries for the authenticated user
router.get('/user/all', authMiddleware, viewUserItineraries);

// View a single itinerary
router.post('/view', authMiddleware, viewItinerary);

// Create a new itinerary
router.post('/create', authMiddleware, createItinerary);

// Update an itinerary
router.patch('/update/:itineraryID', authMiddleware, updateItinerary);

// Repeat an itinerary (update with new dates and set status to 'active')
router.patch('/repeat/:itineraryID', authMiddleware, repeatItinerary);

// Delete an itinerary
router.delete('/delete/:itineraryID', authMiddleware, deleteItinerary);

// Cancel an itinerary
router.patch('/cancel/:itineraryID', authMiddleware, cancelItinerary);

// Mark an itinerary as done
router.patch('/mark-done/:itineraryID', authMiddleware, markItineraryAsDone);

export default router;
