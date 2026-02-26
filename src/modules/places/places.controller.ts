import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import {
  createLocationPointService,
  updateLocationPointService,
  getLocationPointService,
  deleteLocationPointService,
  getAllLocationPointsService,
} from './places.service';
import { ILocationPoint } from './places.types';

interface AuthRequest extends Request {
  user?: any;
  processedImagePath?: string;
}

/**
 * Create a new location point
 * POST /api/locations/create
 */
export const createLocationPoint = async (req: AuthRequest, res: Response) => {
  try {
    console.log('🟡 createLocationPoint - req.user:', req.user);
    console.log('🟡 createLocationPoint - processedImagePath:', req.processedImagePath);

    const {
      locationName,
      address,
      schedule,
      latitude,
      longitude,
      category,
      type,
      description,
      links,
    } = req.body;

    // Validate required fields
    if (
      !locationName ||
      !address ||
      !schedule ||
      latitude === undefined ||
      longitude === undefined ||
      !category ||
      !type ||
      !description
    ) {
      return res.status(400).json({
        message:
          'Missing required fields: locationName, address, schedule, latitude, longitude, category, type, description',
      });
    }

    // Validate user
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: 'Unauthorized. User ID not found in token.' });
    }

    // Parse address if it's a string
    let parsedAddress = address;
    if (typeof address === 'string') {
      try {
        parsedAddress = JSON.parse(address);
      } catch (e) {
        return res.status(400).json({ message: 'Invalid address format. Must be valid JSON.' });
      }
    }

    // Parse schedule if it's a string
    let parsedSchedule = schedule;
    if (typeof schedule === 'string') {
      try {
        parsedSchedule = JSON.parse(schedule);
      } catch (e) {
        return res.status(400).json({ message: 'Invalid schedule format. Must be valid JSON.' });
      }
    }

    // Parse links if it's a string
    let parsedLinks = links || [];
    if (typeof links === 'string') {
      try {
        parsedLinks = JSON.parse(links);
      } catch (e) {
        parsedLinks = [];
      }
    }

    // Create location point
    const locationPointData: ILocationPoint = {
      locationName,
      address: parsedAddress,
      schedule: parsedSchedule,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      category,
      type,
      imageUrl: req.processedImagePath || '',
      description,
      links: parsedLinks,
      reviews: [],
      status: 'active',
      updatedOn: new Date(),
      createdBy: req.user.userId,
    };

    const newLocationPoint = await createLocationPointService(locationPointData);

    res.status(201).json({
      message: 'Location point created successfully',
      data: newLocationPoint,
    });
  } catch (error) {
    console.error('❌ Error creating location point:', error);
    res.status(500).json({ message: 'Failed to create location point' });
  }
};

/**
 * Update a location point
 * PATCH /api/locations/update/:locationId
 */
export const updateLocationPoint = async (req: AuthRequest, res: Response) => {
  try {
    const { locationId } = req.params;
    const {
      locationName,
      address,
      schedule,
      latitude,
      longitude,
      category,
      type,
      description,
      links,
      status,
    } = req.body;

    console.log('🟡 updateLocationPoint - locationId:', locationId);
    console.log('🟡 updateLocationPoint - processedImagePath:', req.processedImagePath);

    // Get existing location point
    const existingLocationPoint = await getLocationPointService(locationId);
    if (!existingLocationPoint) {
      return res.status(404).json({ message: 'Location point not found' });
    }

    // Build update data
    const updateData: Partial<ILocationPoint> = {};

    if (locationName) updateData.locationName = locationName;
    if (address) {
      if (typeof address === 'string') {
        try {
          updateData.address = JSON.parse(address);
        } catch (e) {
          return res.status(400).json({ message: 'Invalid address format. Must be valid JSON.' });
        }
      } else {
        updateData.address = address;
      }
    }
    if (schedule) {
      if (typeof schedule === 'string') {
        try {
          updateData.schedule = JSON.parse(schedule);
        } catch (e) {
          return res.status(400).json({ message: 'Invalid schedule format. Must be valid JSON.' });
        }
      } else {
        updateData.schedule = schedule;
      }
    }
    if (latitude !== undefined) updateData.latitude = parseFloat(latitude);
    if (longitude !== undefined) updateData.longitude = parseFloat(longitude);
    if (category) updateData.category = category;
    if (type) updateData.type = type;
    if (description) updateData.description = description;
    if (links !== undefined) {
      if (typeof links === 'string') {
        try {
          updateData.links = JSON.parse(links);
        } catch (e) {
          updateData.links = [];
        }
      } else {
        updateData.links = links || [];
      }
    }
    if (status) updateData.status = status;

    // Handle image update
    let imageUrl = existingLocationPoint.imageUrl;
    if (req.processedImagePath) {
      imageUrl = req.processedImagePath;

      // Delete old image file if it exists and is different
      if (existingLocationPoint.imageUrl && existingLocationPoint.imageUrl !== '') {
        const oldImagePath = path.join(process.cwd(), existingLocationPoint.imageUrl);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
          console.log('✅ Old image deleted:', existingLocationPoint.imageUrl);
        }
      }
    }

    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;

    // Update location point
    const updatedLocationPoint = await updateLocationPointService(locationId, updateData);

    res.status(200).json({
      message: 'Location point updated successfully',
      data: updatedLocationPoint,
    });
  } catch (error) {
    console.error('❌ Error updating location point:', error);
    res.status(500).json({ message: 'Failed to update location point' });
  }
};

/**
 * Get a single location point
 * GET /api/locations/:locationId
 */
export const getLocationPoint = async (req: AuthRequest, res: Response) => {
  try {
    const { locationId } = req.params;

    console.log('🟡 getLocationPoint - locationId:', locationId);

    const locationPoint = await getLocationPointService(locationId);

    if (!locationPoint) {
      return res.status(404).json({ message: 'Location point not found' });
    }

    res.status(200).json({
      message: 'Location point fetched successfully',
      data: locationPoint,
    });
  } catch (error) {
    console.error('❌ Error fetching location point:', error);
    res.status(500).json({ message: 'Failed to fetch location point' });
  }
};

/**
 * Delete a location point
 * DELETE /api/locations/delete/:locationId
 */
export const deleteLocationPoint = async (req: AuthRequest, res: Response) => {
  try {
    const { locationId } = req.params;

    console.log('🟡 deleteLocationPoint - locationId:', locationId);

    // Get existing location point to delete image if exists
    const existingLocationPoint = await getLocationPointService(locationId);
    if (!existingLocationPoint) {
      return res.status(404).json({ message: 'Location point not found' });
    }

    // Delete image file if exists
    if (existingLocationPoint.imageUrl && existingLocationPoint.imageUrl !== '') {
      const imagePath = path.join(process.cwd(), existingLocationPoint.imageUrl);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
        console.log('✅ Image deleted:', existingLocationPoint.imageUrl);
      }
    }

    // Delete location point
    const deleted = await deleteLocationPointService(locationId);

    if (!deleted) {
      return res.status(404).json({ message: 'Location point not found' });
    }

    res.status(200).json({
      message: 'Location point deleted successfully',
    });
  } catch (error) {
    console.error('❌ Error deleting location point:', error);
    res.status(500).json({ message: 'Failed to delete location point' });
  }
};

/**
 * Get all location points with filters and pagination
 * GET /api/locations
 */
export const getAllLocationPoints = async (req: AuthRequest, res: Response) => {
  try {
    const {
      category,
      type,
      country,
      region,
      province,
      city,
      district,
      neighborhood,
      searchKey,
      page = 1,
      pageSize = 10,
    } = req.query;

    console.log('🟡 getAllLocationPoints - Fetching location points', {
      filters: {
        category,
        type,
        country,
        region,
        province,
        city,
        district,
        neighborhood,
        searchKey,
      },
      page,
      pageSize,
    });

    const filters = {
      category: category as string | undefined,
      type: type as string | undefined,
      country: country as string | undefined,
      region: region as string | undefined,
      province: province as string | undefined,
      city: city as string | undefined,
      district: district as string | undefined,
      neighborhood: neighborhood as string | undefined,
      searchKey: searchKey as string | undefined,
    };

    const pageNum = parseInt(page as string) || 1;
    const size = parseInt(pageSize as string) || 10;

    const { locationPoints, total } = await getAllLocationPointsService(
      filters,
      pageNum,
      size
    );

    res.status(200).json({
      message: 'Location points fetched successfully',
      data: locationPoints,
      pagination: {
        total,
        page: pageNum,
        pageSize: size,
        totalPages: Math.ceil(total / size),
      },
    });
  } catch (error) {
    console.error('❌ Error fetching location points:', error);
    res.status(500).json({ message: 'Failed to fetch location points' });
  }
};
