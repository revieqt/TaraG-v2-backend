import { AnnouncementModel, IAnnouncement } from './announcement.model';

/**
 * Get today's announcements
 * Returns announcements where current date is >= startsOn AND <= endsOn
 * Only returns: title, image, altDesc, isExternal, linkPath
 */
export const getTodaysAnnouncementsService = async () => {
  try {
    const now = new Date();
    console.log('🟡 getTodaysAnnouncementsService - Fetching announcements for date:', now);

    const announcements = await AnnouncementModel.find({
      startsOn: { $lte: now },
      endsOn: { $gte: now },
    }).select('title image altDesc isExternal linkPath');

    console.log('✅ Today\'s announcements fetched:', announcements.length);
    return announcements;
  } catch (error) {
    console.error('❌ Error fetching today\'s announcements:', error);
    throw error;
  }
};

/**
 * Create a new announcement
 * Expects the image path to be already processed by uploadMiddleware
 */
export const createAnnouncementService = async (
  title: string,
  image: string,
  altDesc: string,
  isExternal: boolean,
  linkPath: string,
  startsOn: Date,
  endsOn: Date
): Promise<IAnnouncement> => {
  try {
    console.log('🟡 createAnnouncementService - Creating new announcement', {
      title,
      image,
      altDesc,
      isExternal,
      linkPath,
      startsOn,
      endsOn,
    });

    const newAnnouncement = new AnnouncementModel({
      title,
      image,
      altDesc,
      isExternal,
      linkPath,
      startsOn,
      endsOn,
      createdOn: new Date(),
      updatedOn: new Date(),
    });

    const savedAnnouncement = await newAnnouncement.save();
    console.log('✅ Announcement created successfully:', savedAnnouncement);
    return savedAnnouncement;
  } catch (error) {
    console.error('❌ Error creating announcement:', error);
    throw error;
  }
};

/**
 * Update an announcement
 * If image path is different, old image should be deleted by controller
 */
export const updateAnnouncementService = async (
  announcementId: string,
  title: string,
  image: string,
  altDesc: string,
  isExternal: boolean,
  linkPath: string,
  startsOn: Date,
  endsOn: Date
): Promise<IAnnouncement | null> => {
  try {
    console.log('🟡 updateAnnouncementService - Updating announcement:', announcementId);

    const updatedAnnouncement = await AnnouncementModel.findByIdAndUpdate(
      announcementId,
      {
        title,
        image,
        altDesc,
        isExternal,
        linkPath,
        startsOn,
        endsOn,
        updatedOn: new Date(),
      },
      { new: true }
    );

    console.log('✅ Announcement updated successfully:', updatedAnnouncement);
    return updatedAnnouncement;
  } catch (error) {
    console.error('❌ Error updating announcement:', error);
    throw error;
  }
};

/**
 * Delete an announcement
 */
export const deleteAnnouncementService = async (announcementId: string): Promise<boolean> => {
  try {
    console.log('🟡 deleteAnnouncementService - Deleting announcement:', announcementId);

    const result = await AnnouncementModel.findByIdAndDelete(announcementId);

    if (!result) {
      console.log('⚠️ Announcement not found:', announcementId);
      return false;
    }

    console.log('✅ Announcement deleted successfully:', announcementId);
    return true;
  } catch (error) {
    console.error('❌ Error deleting announcement:', error);
    throw error;
  }
};

/**
 * Get all announcements with filters and pagination
 * Filters:
 * - searchKey: searches in title, altDesc, linkPath
 * - dateFilter: { startsOn: Date, endsOn: Date } - returns announcements between these dates
 * Returns 10 announcements at a time, sorted by latest dates first
 */
export const getAllAnnouncementsService = async (
  searchKey?: string,
  dateFilter?: { startsOn?: Date; endsOn?: Date },
  page: number = 1
): Promise<{ announcements: IAnnouncement[]; total: number }> => {
  try {
    const pageSize = 10;
    const skip = (page - 1) * pageSize;

    console.log('🟡 getAllAnnouncementsService - Fetching announcements', {
      searchKey,
      dateFilter,
      page,
    });

    // Build filter query
    const filter: any = {};

    // Add search filter
    if (searchKey && searchKey.trim()) {
      const searchRegex = { $regex: searchKey, $options: 'i' };
      filter.$or = [
        { title: searchRegex },
        { altDesc: searchRegex },
        { linkPath: searchRegex },
      ];
    }

    // Add date filter
    if (dateFilter) {
      if (dateFilter.startsOn && dateFilter.endsOn) {
        // Announcements that overlap with the date range
        filter.startsOn = { $lte: dateFilter.endsOn };
        filter.endsOn = { $gte: dateFilter.startsOn };
      } else if (dateFilter.startsOn) {
        filter.startsOn = { $lte: dateFilter.startsOn };
      } else if (dateFilter.endsOn) {
        filter.endsOn = { $gte: dateFilter.endsOn };
      }
    }

    // Fetch announcements sorted by latest dates first (endsOn descending, then createdOn descending)
    const announcements = await AnnouncementModel.find(filter)
      .sort({ endsOn: -1, createdOn: -1 })
      .skip(skip)
      .limit(pageSize);

    // Get total count for pagination
    const total = await AnnouncementModel.countDocuments(filter);

    console.log('✅ Announcements fetched:', {
      count: announcements.length,
      total,
      page,
    });

    return { announcements, total };
  } catch (error) {
    console.error('❌ Error fetching announcements:', error);
    throw error;
  }
};

/**
 * Get announcement by ID
 */
export const getAnnouncementByIdService = async (announcementId: string): Promise<IAnnouncement | null> => {
  try {
    console.log('🟡 getAnnouncementByIdService - Fetching announcement:', announcementId);

    const announcement = await AnnouncementModel.findById(announcementId);

    return announcement;
  } catch (error) {
    console.error('❌ Error fetching announcement:', error);
    throw error;
  }
};
