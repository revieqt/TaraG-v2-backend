import { LocationPointModel, ILocationPointDocument } from './places.model';
import { ILocationPoint, ILocationPointListItem } from './places.types';
import mongoose from 'mongoose';

/**
 * Create a new location point
 */
export const createLocationPointService = async (
  locationData: ILocationPoint
): Promise<ILocationPointDocument> => {
  try {
    console.log('🟡 createLocationPointService - Creating new location point', {
      locationName: locationData.locationName,
      category: locationData.category,
      type: locationData.type,
    });

    const newLocationPoint = new LocationPointModel({
      ...locationData,
      reviews: [],
      status: 'active',
      updatedOn: new Date(),
      createdOn: new Date(),
    });

    const savedLocationPoint = await newLocationPoint.save();
    console.log('✅ Location point created successfully:', savedLocationPoint._id);
    return savedLocationPoint;
  } catch (error) {
    console.error('❌ Error creating location point:', error);
    throw error;
  }
};

/**
 * Update a location point (patch)
 */
export const updateLocationPointService = async (
  locationId: string,
  updateData: Partial<ILocationPoint>
): Promise<ILocationPointDocument | null> => {
  try {
    if (!mongoose.Types.ObjectId.isValid(locationId)) {
      throw new Error('Invalid location ID');
    }

    console.log('🟡 updateLocationPointService - Updating location point:', locationId);

    const updatedLocationPoint = await LocationPointModel.findByIdAndUpdate(
      locationId,
      {
        ...updateData,
        updatedOn: new Date(),
      },
      { new: true }
    );

    console.log('✅ Location point updated successfully:', locationId);
    return updatedLocationPoint;
  } catch (error) {
    console.error('❌ Error updating location point:', error);
    throw error;
  }
};

/**
 * Get a single location point by ID
 */
export const getLocationPointService = async (
  locationId: string
): Promise<ILocationPointDocument | null> => {
  try {
    if (!mongoose.Types.ObjectId.isValid(locationId)) {
      throw new Error('Invalid location ID');
    }

    console.log('🟡 getLocationPointService - Fetching location point:', locationId);

    const locationPoint = await LocationPointModel.findById(locationId);

    console.log('✅ Location point fetched:', locationId);
    return locationPoint;
  } catch (error) {
    console.error('❌ Error fetching location point:', error);
    throw error;
  }
};

/**
 * Delete a location point
 */
export const deleteLocationPointService = async (
  locationId: string
): Promise<boolean> => {
  try {
    if (!mongoose.Types.ObjectId.isValid(locationId)) {
      throw new Error('Invalid location ID');
    }

    console.log('🟡 deleteLocationPointService - Deleting location point:', locationId);

    const result = await LocationPointModel.findByIdAndDelete(locationId);

    if (!result) {
      console.log('⚠️ Location point not found:', locationId);
      return false;
    }

    console.log('✅ Location point deleted successfully:', locationId);
    return true;
  } catch (error) {
    console.error('❌ Error deleting location point:', error);
    throw error;
  }
};

/**
 * Get all location points with filters and pagination
 * Returns only: id, locationName, address, latitude, longitude, schedule
 */
export const getAllLocationPointsService = async (
  filters?: {
    category?: string;
    type?: string;
    country?: string;
    region?: string;
    province?: string;
    city?: string;
    district?: string;
    neighborhood?: string;
    searchKey?: string;
  },
  page: number = 1,
  pageSize: number = 10
): Promise<{ locationPoints: ILocationPointListItem[]; total: number }> => {
  try {
    const skip = (page - 1) * pageSize;

    console.log('🟡 getAllLocationPointsService - Fetching location points', {
      filters,
      page,
      pageSize,
    });

    // Build filter query
    const filterQuery: any = {
      status: 'active', // Only return active locations
    };

    // Add category filter
    if (filters?.category && filters.category.trim()) {
      filterQuery.category = filters.category.trim();
    }

    // Add type filter
    if (filters?.type && filters.type.trim()) {
      filterQuery.type = filters.type.trim();
    }

    // Add address filters
    if (filters?.country && filters.country.trim()) {
      filterQuery['address.country'] = filters.country.trim();
    }
    if (filters?.region && filters.region.trim()) {
      filterQuery['address.region'] = filters.region.trim();
    }
    if (filters?.province && filters.province.trim()) {
      filterQuery['address.province'] = filters.province.trim();
    }
    if (filters?.city && filters.city.trim()) {
      filterQuery['address.city'] = filters.city.trim();
    }
    if (filters?.district && filters.district.trim()) {
      filterQuery['address.district'] = filters.district.trim();
    }
    if (filters?.neighborhood && filters.neighborhood.trim()) {
      filterQuery['address.neighborhood'] = filters.neighborhood.trim();
    }

    if (filters?.searchKey && filters.searchKey.trim()) {
      const searchRegex = { $regex: filters.searchKey, $options: 'i' };
      filterQuery.$or = [
        { locationName: searchRegex },
        { description: searchRegex },
      ];
    }

    // Fetch location points
    const locationPoints = await LocationPointModel.find(filterQuery)
      .select('_id locationName address latitude longitude schedule')
      .sort({ createdOn: -1 })
      .skip(skip)
      .limit(pageSize);

    // Get total count for pagination
    const total = await LocationPointModel.countDocuments(filterQuery);

    // Transform to list format
    const formattedLocationPoints: ILocationPointListItem[] = locationPoints.map((point) => ({
      id: (point._id as any).toString(),
      locationName: point.locationName,
      address: point.address,
      latitude: point.latitude,
      longitude: point.longitude,
      schedule: point.schedule,
    }));

    console.log('✅ Location points fetched:', {
      count: formattedLocationPoints.length,
      total,
      page,
    });

    return { locationPoints: formattedLocationPoints, total };
  } catch (error) {
    console.error('❌ Error fetching location points:', error);
    throw error;
  }
};
