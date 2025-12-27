import { pb } from '../pocketbase';
import type { Mosque, MosqueFilters, MosqueWithDetails } from '@/types';
import type { Amenity, MosqueAmenity, Activity } from '@/types';
import { createFormDataWithImage, validateImageFile } from '../pocketbase-images';
import { validateState, sanitizeSearchTerm } from '../validation';
import { sanitizeError } from '../error-handler';

// Helper function to fetch and attach activities to mosques
async function attachActivitiesToMosques(mosques: Mosque[]): Promise<Mosque[]> {
  if (mosques.length === 0) {
    return mosques;
  }

  try {
    const mosqueIds = new Set(mosques.map(m => m.id));
    
    // Fetch all activities and filter client-side
    // This is more reliable than building complex filters that may fail
    let activitiesResult;
    try {
      // Try with sort first
      activitiesResult = await pb.collection('activities').getList(1, 500, {
        sort: '-created',
      });
    } catch (fetchError: any) {
      // If sort fails, try without sort
      try {
        activitiesResult = await pb.collection('activities').getList(1, 500);
      } catch (noSortError: any) {
        // If that also fails, just log and continue without activities
        console.warn('Failed to fetch activities:', noSortError);
        return mosques;
      }
    }
    
    // Filter activities client-side:
    // 1. Only include activities for mosques we're displaying
    // 2. Only include active activities (if status field exists)
    const activitiesByMosque: Record<string, Activity[]> = {};
    
    activitiesResult.items.forEach((item: any) => {
      const mosqueId = item.mosque_id;
      const status = item.status;
      
      // Only include activities for mosques we're displaying
      // and only active activities (if status field exists and is not 'active', skip it)
      if (mosqueId && mosqueIds.has(mosqueId)) {
        // If status field exists, only include active activities
        // If status field doesn't exist or is undefined, include all
        if (!status || status === 'active') {
          if (!activitiesByMosque[mosqueId]) {
            activitiesByMosque[mosqueId] = [];
          }
          activitiesByMosque[mosqueId].push(item as Activity);
        }
      }
    });
    
    // Attach activities to mosques
    return mosques.map(mosque => ({
      ...mosque,
      activities: activitiesByMosque[mosque.id] || [],
    })) as Mosque[];
  } catch (activitiesError: any) {
    // If activities fetch fails, return mosques without activities
    console.warn('Failed to fetch activities:', activitiesError);
    return mosques;
  }
}

// Helper function to fetch and attach amenities to mosques
async function attachAmenitiesToMosques(mosques: Mosque[]): Promise<Mosque[]> {
  if (mosques.length === 0) {
    return mosques;
  }

  try {
    const mosqueIds = mosques.map(m => m.id);
    const mosqueIdsFilter = mosqueIds.map(id => `mosque_id = "${id}"`).join(' || ');
    
    const amenitiesResult = await pb.collection('mosque_amenities').getList(1, 500, {
      filter: `(${mosqueIdsFilter})`,
      expand: 'amenity_id',
    });
    
    // Group amenities by mosque_id
    const amenitiesByMosque: Record<string, (Amenity & { details: any; verified: boolean })[]> = {};
    const customAmenitiesByMosque: Record<string, MosqueAmenity[]> = {};
    
    amenitiesResult.items.forEach((item: any) => {
      const mosqueId = item.mosque_id;
      
      if (item.amenity_id && item.expand?.amenity_id) {
        // Regular amenity
        if (!amenitiesByMosque[mosqueId]) {
          amenitiesByMosque[mosqueId] = [];
        }
        amenitiesByMosque[mosqueId].push({
          ...item.expand.amenity_id,
          details: item.details || {},
          verified: item.verified || false,
        });
      } else {
        // Custom amenity
        if (!customAmenitiesByMosque[mosqueId]) {
          customAmenitiesByMosque[mosqueId] = [];
        }
        customAmenitiesByMosque[mosqueId].push({
          id: item.id,
          mosque_id: item.mosque_id,
          amenity_id: null,
          details: item.details || {},
          verified: item.verified || false,
          created: item.created,
          updated: item.updated,
        });
      }
    });
    
    // Attach amenities to mosques
    return mosques.map(mosque => ({
      ...mosque,
      amenities: amenitiesByMosque[mosque.id] || [],
      customAmenities: customAmenitiesByMosque[mosque.id] || [],
    })) as Mosque[];
  } catch (amenitiesError: any) {
    // If amenities fetch fails, return mosques without amenities
    console.warn('Failed to fetch amenities:', amenitiesError);
    return mosques;
  }
}

export const mosquesApi = {
  // List mosques with filters
  async list(filters?: MosqueFilters): Promise<Mosque[]> {
    try {
      // Build filter parts (without status filter to avoid 400 errors)
      const filterParts: string[] = [];
      
      if (filters) {
        if (filters.state && filters.state !== 'all') {
          // Validate state against allowlist to prevent filter injection
          if (!validateState(filters.state)) {
            throw new Error('Invalid state parameter');
          }
          filterParts.push(`state = "${filters.state}"`);
        }
        
        if (filters.amenities && filters.amenities.length > 0) {
          // This requires a join query - simplified for now
          // In production, you'd need to query mosque_amenities and join
        }
        
        if (filters.search && filters.search.trim()) {
          // Sanitize search term to prevent filter injection
          const sanitizedSearch = sanitizeSearchTerm(filters.search);
          if (sanitizedSearch) {
            filterParts.push(`(name ~ "${sanitizedSearch}" || address ~ "${sanitizedSearch}" || state ~ "${sanitizedSearch}")`);
          }
        }
      }
      
      // Build query options
      const queryOptions: any = {};
      
      // Add filter if we have any filter parts
      if (filterParts.length > 0) {
        queryOptions.filter = filterParts.join(' && ');
      }
      
      // Add sort if specified, otherwise skip sort to avoid potential issues
      if (filters?.sortBy) {
        const sortString = this.getSortString(filters.sortBy);
        if (sortString) {
          queryOptions.sort = sortString;
        }
      }
      
      // Fetch mosques from PocketBase (without status filter to avoid 400 errors)
      const result = await pb.collection('mosques').getList(1, 50, queryOptions);
      
      const items = result.items as unknown as Mosque[];
      
      // Filter client-side by status (only show approved mosques)
      let filtered = items.filter((mosque: any) => !mosque.status || mosque.status === 'approved');
      
      // Apply any additional client-side filtering if needed
      if (filters) {
        // State filter is already applied in the query, but double-check
        if (filters.state && filters.state !== 'all') {
          filtered = filtered.filter((m: any) => m.state === filters.state);
        }
      }
      
      // Sort client-side if needed (for cases where server-side sort might fail)
      if (filters?.sortBy) {
        switch (filters.sortBy) {
          case 'alphabetical':
            filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            break;
          case 'most_amenities':
            // Sort by number of amenities (descending)
            filtered.sort((a, b) => {
              const aCount = (a.amenities?.length || 0) + (a.customAmenities?.length || 0);
              const bCount = (b.amenities?.length || 0) + (b.customAmenities?.length || 0);
              return bCount - aCount;
            });
            break;
          default:
            // Default: sort by created date (newest first)
            filtered.sort((a, b) => {
              const aDate = new Date(a.created || 0).getTime();
              const bDate = new Date(b.created || 0).getTime();
              return bDate - aDate;
            });
        }
      } else {
        // Default sort by created date (newest first)
        filtered.sort((a, b) => {
          const aDate = new Date(a.created || 0).getTime();
          const bDate = new Date(b.created || 0).getTime();
          return bDate - aDate;
        });
      }
      
      // Fetch and attach amenities and activities to mosques
      const mosquesWithAmenities = await attachAmenitiesToMosques(filtered);
      return await attachActivitiesToMosques(mosquesWithAmenities);
    } catch (error: any) {
      // Log the error for debugging
      console.error('Failed to fetch mosques:', {
        status: error.status,
        message: error.message,
        data: error.data,
      });
      
      // Sanitize error to prevent information disclosure
      throw sanitizeError(error);
    }
  },

  // Get single mosque with details
  async get(id: string): Promise<MosqueWithDetails> {
    try {
      const mosque = await pb.collection('mosques').getOne(id) as unknown as Mosque;
      
      // Validate ID format to prevent injection
      if (!/^[a-zA-Z0-9]{15}$/.test(id)) {
        throw new Error('Invalid mosque ID format');
      }
      
      // Fetch related amenities
      const amenitiesResult = await pb.collection('mosque_amenities').getList(1, 100, {
        filter: `mosque_id = "${id}"`,
        expand: 'amenity_id',
      });
      
      const amenities = amenitiesResult.items.map((item: any) => ({
        ...(item.expand?.amenity_id || {}),
        details: item.details || {},
        verified: item.verified || false,
      })) as (Amenity & { details: any; verified: boolean })[];
      
      // Fetch custom amenities (where amenity_id is null)
      const customAmenities = amenitiesResult.items
        .filter((item: any) => !item.amenity_id)
        .map((item: any) => ({
          id: item.id,
          mosque_id: item.mosque_id,
          amenity_id: null,
          details: item.details || {},
          verified: item.verified || false,
          created: item.created,
          updated: item.updated,
        })) as MosqueAmenity[];
      
      // Fetch activities
      // Fetch all activities and filter client-side for reliability
      let activities: Activity[] = [];
      try {
        // Try with mosque_id filter and sort first
        let activitiesResult;
        let alreadyFilteredByMosque = false;
        try {
          activitiesResult = await pb.collection('activities').getList(1, 100, {
            filter: `mosque_id = "${id}"`,
            sort: '-created',
          });
          alreadyFilteredByMosque = true;
        } catch (filterError: any) {
          // If filter fails, try without sort
          try {
            activitiesResult = await pb.collection('activities').getList(1, 100, {
              filter: `mosque_id = "${id}"`,
            });
            alreadyFilteredByMosque = true;
          } catch (noSortError: any) {
            // If that also fails, fetch all and filter client-side
            try {
              activitiesResult = await pb.collection('activities').getList(1, 100, {
                sort: '-created',
              });
            } catch (noFilterError: any) {
              // Last resort: fetch all without any options
              activitiesResult = await pb.collection('activities').getList(1, 100);
            }
          }
        }
        
        // Filter client-side
        // If already filtered by mosque_id, use items as-is (only filter out cancelled if status exists)
        // Otherwise, filter by both mosque_id and status
        if (alreadyFilteredByMosque) {
          // Only filter by status (mosque_id already filtered)
          // Include all activities, only exclude if status is explicitly 'cancelled'
          activities = (activitiesResult.items as unknown as Activity[]).filter(
            (activity) => !activity.status || activity.status !== 'cancelled'
          );
        } else {
          // Filter by both mosque_id and status
          activities = (activitiesResult.items as unknown as Activity[]).filter(
            (activity) => activity.mosque_id === id && (!activity.status || activity.status !== 'cancelled')
          );
        }
      } catch (activitiesError: any) {
        // If all attempts fail, just log and continue without activities
        console.warn('Failed to fetch activities:', activitiesError);
        activities = [];
      }
      
      return {
        ...mosque,
        amenities,
        customAmenities,
        activities,
      };
    } catch (error: any) {
      // Sanitize error to prevent information disclosure
      if (error.status === 404) {
        throw new Error('Mosque not found');
      }
      throw sanitizeError(error);
    }
  },

  // Create mosque (for submissions)
  async create(data: Partial<Mosque>, imageFile?: File): Promise<Mosque> {
    // If image file is provided, validate it first
    if (imageFile) {
      const validationError = validateImageFile(imageFile);
      if (validationError) {
        throw new Error(validationError);
      }
    }

    // If we have an image file, use FormData
    if (imageFile) {
      const formData = createFormDataWithImage(data, imageFile, 'image');
      return await pb.collection('mosques').create(formData) as unknown as Mosque;
    }

    // Otherwise, create normally
    return await pb.collection('mosques').create(data) as unknown as Mosque;
  },

  // Update mosque
  async update(id: string, data: Partial<Mosque>, imageFile?: File): Promise<Mosque> {
    // If image file is provided, validate it first
    if (imageFile) {
      const validationError = validateImageFile(imageFile);
      if (validationError) {
        throw new Error(validationError);
      }
    }

    // If we have an image file, use FormData
    if (imageFile) {
      const formData = createFormDataWithImage(data, imageFile, 'image');
      return await pb.collection('mosques').update(id, formData) as unknown as Mosque;
    }

    // Otherwise, update normally
    return await pb.collection('mosques').update(id, data) as unknown as Mosque;
  },

  // Delete mosque
  async delete(id: string): Promise<boolean> {
    await pb.collection('mosques').delete(id);
    return true;
  },

  // List all mosques for admin (including pending and rejected)
  async listAll(): Promise<Mosque[]> {
    try {
      // Fetch all mosques using pagination to avoid 400 errors
      const allItems: any[] = [];
      let page = 1;
      const perPage = 100; // Reasonable page size
      let hasMore = true;
      
      while (hasMore) {
        // Try with sort first, fallback without sort if it fails
        let result;
        try {
          result = await pb.collection('mosques').getList(page, perPage, {
            sort: '-created',
          });
        } catch (sortError: any) {
          // If sort fails, try without sort
          console.warn('Sort failed, trying without sort:', sortError);
          result = await pb.collection('mosques').getList(page, perPage);
        }
        
        allItems.push(...result.items);
        
        // Check if there are more pages
        hasMore = result.page < result.totalPages;
        page++;
      }
      
      // Sort client-side if server-side sort failed
      if (allItems.length > 0 && !allItems[0].created) {
        // If no created field, skip sorting
      } else {
        allItems.sort((a, b) => {
          const aDate = new Date(a.created || 0).getTime();
          const bDate = new Date(b.created || 0).getTime();
          return bDate - aDate; // Newest first
        });
      }
      
      const items = allItems as unknown as Mosque[];
      
      // Fetch and attach amenities to mosques
      return await attachAmenitiesToMosques(items);
    } catch (error: any) {
      console.error('Failed to fetch all mosques:', {
        status: error.status,
        message: error.message,
        data: error.data,
      });
      
      throw sanitizeError(error);
    }
  },

  // Helper to get sort string
  getSortString(sortBy?: string): string {
    switch (sortBy) {
      case 'alphabetical':
        return 'name';
      case 'most_amenities':
        return '-created'; // Placeholder - would need aggregation
      case 'nearest':
        return '-created'; // Placeholder - would need geospatial query
      default:
        return '-created';
    }
  },
};

