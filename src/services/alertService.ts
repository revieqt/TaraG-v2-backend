import { AlertModel, IAlert } from '../models/alertModel';

/**
 * Create a new alert
 * Locations must be case sensitive
 */
export const createAlertService = async (
  title: string,
  severity: 'low' | 'medium' | 'high',
  target: 'everyone' | 'traveler' | 'admin',
  startsOn: Date,
  endsOn: Date,
  locations: string[],
  description?: string
) => {
  try {
    console.log('🟡 createAlertService - Creating new alert', {
      title,
      severity,
      target,
      startsOn,
      endsOn,
      locations,
      description,
    });

    const newAlert = new AlertModel({
      title,
      description: description || '',
      severity,
      target,
      startsOn,
      endsOn,
      locations, // Case sensitive
      createdOn: new Date(),
    });

    const savedAlert = await newAlert.save();
    console.log('✅ Alert created successfully:', savedAlert);
    return savedAlert;
  } catch (error) {
    console.error('❌ Error creating alert:', error);
    throw error;
  }
};

/**
 * Get alerts based on user type and locations
 * Filters by:
 * - userType and target match
 * - current date is between startsOn and endsOn
 * - at least one location matches (case sensitive)
 */
export const getAlertsService = async (
  userType: 'traveler' | 'admin',
  locations: string[]
) => {
  try {
    console.log('🟡 getAlertsService - Fetching alerts for userType:', userType, 'locations:', locations);

    const currentDate = new Date();
    console.log('🟡 Current date:', currentDate);

    // Determine which targets are applicable based on userType
    const applicableTargets = userType === 'admin' ? ['everyone', 'admin'] : ['everyone', 'traveler'];

    // Build query for location matching (case sensitive using $in with exact strings)
    const query: any = {
      target: { $in: applicableTargets },
      startsOn: { $lte: currentDate },
      endsOn: { $gte: currentDate },
      locations: { $in: locations }, // Case sensitive exact match
    };

    console.log('🟡 Query:', JSON.stringify(query));

    const alerts = await AlertModel.find(query);
    console.log('✅ Alerts fetched successfully:', alerts.length, 'alerts found');
    return alerts;
  } catch (error) {
    console.error('❌ Error fetching alerts:', error);
    throw error;
  }
};

/**
 * Update an alert by ID
 */
export const updateAlertService = async (
  alertId: string,
  updateData: Partial<IAlert>
) => {
  try {
    console.log('🟡 updateAlertService - Updating alert:', alertId, 'with data:', updateData);

    const updatedAlert = await AlertModel.findByIdAndUpdate(
      alertId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedAlert) {
      console.log('❌ Alert not found:', alertId);
      throw new Error('Alert not found');
    }

    console.log('✅ Alert updated successfully:', updatedAlert);
    return updatedAlert;
  } catch (error) {
    console.error('❌ Error updating alert:', error);
    throw error;
  }
};

/**
 * Delete an alert by ID
 */
export const deleteAlertService = async (alertId: string) => {
  try {
    console.log('🟡 deleteAlertService - Deleting alert:', alertId);

    const deletedAlert = await AlertModel.findByIdAndDelete(alertId);

    if (!deletedAlert) {
      console.log('❌ Alert not found:', alertId);
      throw new Error('Alert not found');
    }

    console.log('✅ Alert deleted successfully:', deletedAlert);
    return deletedAlert;
  } catch (error) {
    console.error('❌ Error deleting alert:', error);
    throw error;
  }
};

/**
 * Get all alerts with pagination and filters for admin dashboard
 * Filters:
 * - searchKey: searches in title and description
 * - target: filter by target
 * - severity: filter by severity
 * - date: filter alerts that are active on this date
 * Returns 10 items per page
 */
export const getAllAlertsService = async (
  page: number = 1,
  searchKey?: string,
  target?: string,
  severity?: string,
  date?: Date
) => {
  try {
    console.log('🟡 getAllAlertsService - page:', page, 'searchKey:', searchKey, 'target:', target, 'severity:', severity, 'date:', date);

    const pageSize = 10;
    const skip = (page - 1) * pageSize;

    const query: any = {};

    // Add search filter
    if (searchKey && searchKey.trim()) {
      query.$or = [
        { title: { $regex: searchKey, $options: 'i' } },
        { description: { $regex: searchKey, $options: 'i' } },
      ];
    }

    // Add target filter
    if (target && target.trim()) {
      query.target = target;
    }

    // Add severity filter
    if (severity && severity.trim()) {
      query.severity = severity;
    }

    // Add date filter (check if alert is active on the given date)
    if (date) {
      query.startsOn = { $lte: date };
      query.endsOn = { $gte: date };
    }

    console.log('🟡 Query:', JSON.stringify(query));

    // Get total count for pagination
    const totalCount = await AlertModel.countDocuments(query);
    const totalPages = Math.ceil(totalCount / pageSize);

    // Get paginated results
    const alerts = await AlertModel.find(query)
      .sort({ createdOn: -1 }) // Sort by newest first
      .skip(skip)
      .limit(pageSize);

    console.log('✅ Alerts fetched successfully:', {
      currentPage: page,
      totalPages,
      itemsPerPage: pageSize,
      totalItems: totalCount,
      itemsReturned: alerts.length,
    });

    return {
      alerts,
      pagination: {
        currentPage: page,
        totalPages,
        pageSize,
        totalItems: totalCount,
      },
    };
  } catch (error) {
    console.error('❌ Error fetching all alerts:', error);
    throw error;
  }
};

/**
 * Get the number of alerts that are active today
 * Compares current date with startsOn and endsOn
 */
export const getNumberOfAlertsTodayService = async () => {
  try {
    console.log('🟡 getNumberOfAlertsTodayService - Fetching alert count for today');

    const today = new Date();
    console.log('🟡 Today:', today);

    const query: any = {
      startsOn: { $lte: today },
      endsOn: { $gte: today },
    };

    console.log('🟡 Query:', JSON.stringify(query));

    const count = await AlertModel.countDocuments(query);
    console.log('✅ Alert count retrieved successfully:', count);
    return count;
  } catch (error) {
    console.error('❌ Error fetching alert count for today:', error);
    throw error;
  }
};
