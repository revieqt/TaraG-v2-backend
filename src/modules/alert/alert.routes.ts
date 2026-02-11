import express from 'express';
import {
  createAlert,
  getAlerts,
  updateAlert,
  deleteAlert,
  getAllAlerts,
  getNumberOfAlertsToday,
} from './alert.controller';
import { authMiddleware } from '../../middleware/authMiddleware';

const router = express.Router();

// Create a new alert
router.post('/create', authMiddleware, createAlert);

// Get alerts for user based on userType and locations
router.post('/get-user-alerts', authMiddleware, getAlerts);

// Get the number of alerts that are active today
router.get('/count/today', authMiddleware, getNumberOfAlertsToday);

// Update an alert
router.patch('/update/:alertId', authMiddleware, updateAlert);

// Delete an alert
router.delete('/delete/:alertId', authMiddleware, deleteAlert);

// Get all alerts for admin dashboard with pagination and filters
router.get('/', authMiddleware, getAllAlerts);

export default router;
