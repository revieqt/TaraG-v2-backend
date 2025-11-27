import { Request, Response } from 'express';
import {
  createAlertService,
  getAlertsService,
  updateAlertService,
  deleteAlertService,
  getAllAlertsService,
  getNumberOfAlertsTodayService,
} from '../services/alertService';

interface AuthRequest extends Request {
  user?: any;
}

/**
 * Create a new alert
 * POST /api/alerts/create
 */
export const createAlert = async (req: AuthRequest, res: Response) => {
  try {
    console.log('🟡 createAlert - req.user:', req.user);
    const { title, description, severity, target, startsOn, endsOn, locations } = req.body;

    // Validate required fields
    if (!title || !severity || !target || !startsOn || !endsOn || !locations) {
      return res.status(400).json({
        message: 'Missing required fields: title, severity, target, startsOn, endsOn, locations',
      });
    }

    if (!Array.isArray(locations)) {
      return res.status(400).json({ message: 'Locations must be an array' });
    }

    // Validate enum values
    const validSeverities = ['low', 'medium', 'high'];
    const validTargets = ['everyone', 'traveler', 'admin'];

    if (!validSeverities.includes(severity)) {
      return res.status(400).json({ message: 'Invalid severity. Must be: low, medium, or high' });
    }

    if (!validTargets.includes(target)) {
      return res.status(400).json({ message: 'Invalid target. Must be: everyone, traveler, or admin' });
    }

    const newAlert = await createAlertService(
      title,
      severity,
      target,
      new Date(startsOn),
      new Date(endsOn),
      locations,
      description
    );

    res.status(201).json({
      message: 'Alert created successfully',
      data: newAlert,
    });
  } catch (error) {
    console.error('❌ Error creating alert:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get alerts for user
 * POST /api/alerts/get-user-alerts
 */
export const getAlerts = async (req: AuthRequest, res: Response) => {
  try {
    console.log('🟡 getAlerts - req.user:', req.user);
    const { userType, locations } = req.body;

    // Validate required fields
    if (!userType || !locations) {
      return res.status(400).json({
        message: 'Missing required fields: userType, locations',
      });
    }

    if (!Array.isArray(locations)) {
      return res.status(400).json({ message: 'Locations must be an array' });
    }

    const validUserTypes = ['traveler', 'admin'];
    if (!validUserTypes.includes(userType)) {
      return res.status(400).json({ message: 'Invalid userType. Must be: traveler or admin' });
    }

    const alerts = await getAlertsService(userType, locations);

    res.status(200).json({
      message: 'Alerts retrieved successfully',
      data: alerts,
    });
  } catch (error) {
    console.error('❌ Error getting alerts:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Update an alert
 * PATCH /api/alerts/update/:alertId
 */
export const updateAlert = async (req: AuthRequest, res: Response) => {
  try {
    console.log('🟡 updateAlert - req.user:', req.user);
    const { alertId } = req.params;
    const updateData = req.body;

    if (!alertId) {
      return res.status(400).json({ message: 'Alert ID is required' });
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'No update data provided' });
    }

    const updatedAlert = await updateAlertService(alertId, updateData);

    res.status(200).json({
      message: 'Alert updated successfully',
      data: updatedAlert,
    });
  } catch (error) {
    console.error('❌ Error updating alert:', error);
    if (error instanceof Error && error.message === 'Alert not found') {
      return res.status(404).json({ message: 'Alert not found' });
    }
    res.status(500).json({
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Delete an alert
 * DELETE /api/alerts/delete/:alertId
 */
export const deleteAlert = async (req: AuthRequest, res: Response) => {
  try {
    console.log('🟡 deleteAlert - req.user:', req.user);
    const { alertId } = req.params;

    if (!alertId) {
      return res.status(400).json({ message: 'Alert ID is required' });
    }

    const deletedAlert = await deleteAlertService(alertId);

    res.status(200).json({
      message: 'Alert deleted successfully',
      data: deletedAlert,
    });
  } catch (error) {
    console.error('❌ Error deleting alert:', error);
    if (error instanceof Error && error.message === 'Alert not found') {
      return res.status(404).json({ message: 'Alert not found' });
    }
    res.status(500).json({
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get all alerts for admin dashboard with pagination and filters
 * GET /api/alerts?page=1&searchKey=&target=&severity=&date=
 */
export const getAllAlerts = async (req: AuthRequest, res: Response) => {
  try {
    console.log('🟡 getAllAlerts - req.user:', req.user);
    const { page, searchKey, target, severity, date } = req.query;

    const pageNum = page ? parseInt(page as string, 10) : 1;

    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({ message: 'Page must be a positive number' });
    }

    const alertsData = await getAllAlertsService(
      pageNum,
      searchKey as string,
      target as string,
      severity as string,
      date ? new Date(date as string) : undefined
    );

    res.status(200).json({
      message: 'Alerts retrieved successfully',
      data: alertsData,
    });
  } catch (error) {
    console.error('❌ Error getting all alerts:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get the number of alerts that are active today
 * GET /api/alerts/count/today
 */
export const getNumberOfAlertsToday = async (req: AuthRequest, res: Response) => {
  try {
    console.log('🟡 getNumberOfAlertsToday - req.user:', req.user);

    const count = await getNumberOfAlertsTodayService();

    res.status(200).json(count);
  } catch (error) {
    console.error('❌ Error getting alert count for today:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
