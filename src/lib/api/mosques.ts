import { pb } from "../pocketbase";
import type {
  Mosque,
  MosqueFilters,
  MosqueWithDetails,
  PaginatedResponse,
} from "@/types";
import type { Amenity, MosqueAmenity, Activity } from "@/types";
import {
  createFormDataWithImage,
  validateImageFile,
} from "../pocketbase-images";
import { validateState, sanitizeSearchTerm } from "../validation";
import { sanitizeError } from "../error-handler";
import { logAuditEvent, createEntitySnapshot } from "../audit-logger";

// Helper function to fetch and attach activities to mosques
async function attachActivitiesToMosques(mosques: Mosque[]): Promise<Mosque[]> {
  if (mosques.length === 0) {
    return mosques;
  }

  try {
    const mosqueIds = new Set(mosques.map((m) => m.id));

    // Fetch all activities and filter client-side
    // This is more reliable than building complex filters that may fail
    let activitiesResult;
    try {
      // Try with sort first
      activitiesResult = await pb.collection("activities").getList(1, 500, {
        sort: "-created",
      });
    } catch (fetchError: unknown) {
      // If sort fails, try without sort
      try {
        activitiesResult = await pb.collection("activities").getList(1, 500);
      } catch (noSortError: unknown) {
        // If that also fails, just log and continue without activities
        console.warn("Failed to fetch activities:", noSortError);
        return mosques;
      }
    }

    // Filter activities client-side:
    // 1. Only include activities for mosques we're displaying
    // 2. Only include active activities (if status field exists)
    const activitiesByMosque: Record<string, Activity[]> = {};

    activitiesResult.items.forEach((item: unknown) => {
      const activityItem = item as Record<string, unknown>;
      const mosqueId = activityItem.mosque_id as string | undefined;
      const status = activityItem.status as string | undefined;

      // Only include activities for mosques we're displaying
      // and only active activities (if status field exists and is not 'active', skip it)
      if (mosqueId && mosqueIds.has(mosqueId)) {
        // If status field exists, only include active activities
        // If status field doesn't exist or is undefined, include all
        if (!status || status === "active") {
          if (!activitiesByMosque[mosqueId]) {
            activitiesByMosque[mosqueId] = [];
          }
          activitiesByMosque[mosqueId].push(activityItem as Activity);
        }
      }
    });

    // Attach activities to mosques
    return mosques.map((mosque) => ({
      ...mosque,
      activities: activitiesByMosque[mosque.id] || [],
    })) as Mosque[];
  } catch (activitiesError: unknown) {
    // If activities fetch fails, return mosques without activities
    console.warn("Failed to fetch activities:", activitiesError);
    return mosques;
  }
}

// Helper function to fetch and attach amenities to mosques
async function attachAmenitiesToMosques(mosques: Mosque[]): Promise<Mosque[]> {
  if (mosques.length === 0) {
    return mosques;
  }

  try {
    const mosqueIds = mosques.map((m) => m.id);
    const mosqueIdsFilter = mosqueIds
      .map((id) => `mosque_id = "${id}"`)
      .join(" || ");

    const amenitiesResult = await pb
      .collection("mosque_amenities")
      .getList(1, 500, {
        filter: `(${mosqueIdsFilter})`,
        expand: "amenity_id",
      });

    // Group amenities by mosque_id
    const amenitiesByMosque: Record<
      string,
      (Amenity & { details: MosqueAmenityDetails; verified: boolean })[]
    > = {};
    const customAmenitiesByMosque: Record<string, MosqueAmenity[]> = {};

    amenitiesResult.items.forEach((item: unknown) => {
      const amenityItem = item as Record<string, unknown>;
      const mosqueId = amenityItem.mosque_id as string | undefined;

      if (amenityItem.amenity_id && amenityItem.expand && typeof amenityItem.expand === "object" && "amenity_id" in amenityItem.expand) {
        // Regular amenity
        if (mosqueId && !amenitiesByMosque[mosqueId]) {
          amenitiesByMosque[mosqueId] = [];
        }
        if (mosqueId) {
          amenitiesByMosque[mosqueId].push({
            ...(amenityItem.expand.amenity_id as Amenity),
            details: (amenityItem.details as MosqueAmenityDetails) || {},
            verified: (amenityItem.verified as boolean) || false,
          });
        }
      } else {
        // Custom amenity
        if (mosqueId && !customAmenitiesByMosque[mosqueId]) {
          customAmenitiesByMosque[mosqueId] = [];
        }
        if (mosqueId) {
          customAmenitiesByMosque[mosqueId].push({
            id: amenityItem.id as string,
            mosque_id: amenityItem.mosque_id as string,
            amenity_id: null,
            details: (amenityItem.details as MosqueAmenityDetails) || {},
            verified: (amenityItem.verified as boolean) || false,
            created: amenityItem.created as string,
            updated: amenityItem.updated as string,
          });
        }
      }
    });

    // Attach amenities to mosques
    return mosques.map((mosque) => ({
      ...mosque,
      amenities: amenitiesByMosque[mosque.id] || [],
      customAmenities: customAmenitiesByMosque[mosque.id] || [],
    })) as Mosque[];
  } catch (amenitiesError: unknown) {
    // If amenities fetch fails, return mosques without amenities
    console.warn("Failed to fetch amenities:", amenitiesError);
    return mosques;
  }
}

export const mosquesApi = {
  // List mosques with filters and pagination
  async list(filters?: MosqueFilters): Promise<PaginatedResponse<Mosque>> {
    try {
      // Build filter parts (without status filter to avoid 400 errors)
      const filterParts: string[] = [];

      if (filters) {
        if (filters.state && filters.state !== "all") {
          // Validate state against allowlist to prevent filter injection
          if (!validateState(filters.state)) {
            throw new Error("Invalid state parameter");
          }
          filterParts.push(`state = "${filters.state}"`);
        }

        // Amenities filtering is done client-side after amenities are attached
        // This allows us to properly filter by amenity IDs from the mosque_amenities join table

        if (filters.search && filters.search.trim()) {
          // Sanitize search term to prevent filter injection
          const sanitizedSearch = sanitizeSearchTerm(filters.search);
          if (sanitizedSearch) {
            filterParts.push(
              `(name ~ "${sanitizedSearch}" || address ~ "${sanitizedSearch}" || state ~ "${sanitizedSearch}")`
            );
          }
        }
      }

      // Build query options
      const queryOptions: {
        filter?: string;
        sort?: string;
      } = {};

      // Add filter if we have any filter parts
      if (filterParts.length > 0) {
        queryOptions.filter = filterParts.join(" && ");
      }

      // Add sort if specified, otherwise skip sort to avoid potential issues
      // Skip server-side sort for most_amenities since we sort client-side after attaching amenities
      if (filters?.sortBy && filters.sortBy !== "most_amenities") {
        const sortString = this.getSortString(filters.sortBy);
        if (sortString) {
          queryOptions.sort = sortString;
        }
      }

      // Pagination parameters
      const page = filters?.page || 1;
      const perPage = filters?.perPage || 12;

      // Fetch mosques from PocketBase (without status filter to avoid 400 errors)
      // We fetch more items than needed to account for client-side filtering
      const fetchPerPage = Math.max(perPage * 2, 50); // Fetch more to account for filtering
      const result = await pb
        .collection("mosques")
        .getList(page, fetchPerPage, queryOptions);

      const items = result.items as unknown as Mosque[];

      // Filter client-side by status (only show approved mosques)
      let filtered = items.filter(
        (mosque) => !mosque.status || mosque.status === "approved"
      );

      // Apply any additional client-side filtering if needed
      if (filters) {
        // State filter is already applied in the query, but double-check
        if (filters.state && filters.state !== "all") {
          filtered = filtered.filter((m) => m.state === filters.state);
        }
      }

      // We need to attach amenities BEFORE filtering by amenities and sorting
      // This ensures we can filter correctly and sort by amenity count
      const needsAmenitiesForFilter =
        filters?.amenities && filters.amenities.length > 0;
      const needsAmenitiesForSort = filters?.sortBy === "most_amenities";
      const needsAmenities = needsAmenitiesForFilter || needsAmenitiesForSort;

      let mosquesWithAmenities = filtered;

      // Attach amenities if needed for filtering or sorting
      if (needsAmenities) {
        mosquesWithAmenities = await attachAmenitiesToMosques(filtered);
      }

      // Filter by amenities if specified
      if (needsAmenitiesForFilter && filters.amenities) {
        mosquesWithAmenities = mosquesWithAmenities.filter((mosque: Mosque) => {
          // Get all amenity IDs from the mosque (both regular and custom amenities)
          const mosqueAmenityIds = new Set<string>();

          // Add regular amenity IDs
          if (mosque.amenities) {
            mosque.amenities.forEach((amenity) => {
              mosqueAmenityIds.add(amenity.id);
            });
          }

          // Check if mosque has ALL selected amenities
          // All selected amenities must be present in the mosque
          return filters.amenities.every((selectedAmenityId) =>
            mosqueAmenityIds.has(selectedAmenityId)
          );
        });
      }

      // Sort client-side if needed (for cases where server-side sort might fail)
      if (filters?.sortBy) {
        switch (filters.sortBy) {
          case "alphabetical":
            mosquesWithAmenities.sort((a, b) =>
              (a.name || "").localeCompare(b.name || "")
            );
            break;
          case "most_amenities":
            // Sort by number of amenities (descending)
            mosquesWithAmenities.sort((a, b) => {
              const aCount =
                (a.amenities?.length || 0) + (a.customAmenities?.length || 0);
              const bCount =
                (b.amenities?.length || 0) + (b.customAmenities?.length || 0);
              return bCount - aCount;
            });
            break;
          default:
            // Default: sort by created date (newest first)
            mosquesWithAmenities.sort((a, b) => {
              const aDate = new Date(a.created || 0).getTime();
              const bDate = new Date(b.created || 0).getTime();
              return bDate - aDate;
            });
        }
      } else {
        // Default sort by created date (newest first)
        mosquesWithAmenities.sort((a, b) => {
          const aDate = new Date(a.created || 0).getTime();
          const bDate = new Date(b.created || 0).getTime();
          return bDate - aDate;
        });
      }

      // Apply pagination after filtering and sorting
      const startIndex = (page - 1) * perPage;
      const endIndex = startIndex + perPage;
      const paginatedItems = mosquesWithAmenities.slice(startIndex, endIndex);

      // Calculate total pages based on filtered results
      // Note: This is an approximation since we don't know the total filtered count
      // For accurate pagination, we'd need to fetch all items or use server-side filtering
      const totalItems = mosquesWithAmenities.length;
      const totalPages = Math.ceil(totalItems / perPage);

      // Attach amenities to paginated items if not already attached
      let mosquesWithDetails = paginatedItems;
      if (!needsAmenities) {
        mosquesWithDetails = await attachAmenitiesToMosques(paginatedItems);
      }
      // Always attach activities
      mosquesWithDetails = await attachActivitiesToMosques(mosquesWithDetails);

      return {
        items: mosquesWithDetails,
        page,
        perPage,
        totalItems,
        totalPages,
      };
    } catch (error: unknown) {
      // Log the error for debugging
      console.error("Failed to fetch mosques:", {
        status: error.status,
        message: error.message,
        data: error.data,
      });

      // Sanitize error to prevent information disclosure
      throw sanitizeError(error);
    }
  },

  // List all mosques (for map view - no pagination)
  async listAll(
    filters?: Omit<MosqueFilters, "page" | "perPage">
  ): Promise<Mosque[]> {
    try {
      // Build filter parts (without status filter to avoid 400 errors)
      const filterParts: string[] = [];

      if (filters) {
        if (filters.state && filters.state !== "all") {
          // Validate state against allowlist to prevent filter injection
          if (!validateState(filters.state)) {
            throw new Error("Invalid state parameter");
          }
          filterParts.push(`state = "${filters.state}"`);
        }

        if (filters.search && filters.search.trim()) {
          // Sanitize search term to prevent filter injection
          const sanitizedSearch = sanitizeSearchTerm(filters.search);
          if (sanitizedSearch) {
            filterParts.push(
              `(name ~ "${sanitizedSearch}" || address ~ "${sanitizedSearch}" || state ~ "${sanitizedSearch}")`
            );
          }
        }
      }

      // Build query options
      const queryOptions: {
        filter?: string;
        sort?: string;
      } = {};

      // Add filter if we have any filter parts
      if (filterParts.length > 0) {
        queryOptions.filter = filterParts.join(" && ");
      }

      // Add sort if specified
      // Skip server-side sort for most_amenities since we sort client-side after attaching amenities
      if (filters?.sortBy && filters.sortBy !== "most_amenities") {
        const sortString = this.getSortString(filters.sortBy);
        if (sortString) {
          queryOptions.sort = sortString;
        }
      }

      // Fetch all mosques using pagination to avoid 400 errors
      const allItems: unknown[] = [];
      let page = 1;
      const fetchPerPage = 100;
      let hasMore = true;

      while (hasMore) {
        let result;
        try {
          result = await pb
            .collection("mosques")
            .getList(page, fetchPerPage, queryOptions);
        } catch (sortError: unknown) {
          // If sort fails, try without sort
          console.warn("Sort failed, trying without sort:", sortError);
          const { sort, ...optionsWithoutSort } = queryOptions;
          result = await pb
            .collection("mosques")
            .getList(page, fetchPerPage, optionsWithoutSort);
        }

        allItems.push(...result.items);
        hasMore = result.page < result.totalPages;
        page++;
      }

      const items = allItems as unknown as Mosque[];

      // Filter client-side by status (only show approved mosques)
      let filtered = items.filter(
        (mosque) => !mosque.status || mosque.status === "approved"
      );

      // Apply any additional client-side filtering if needed
      if (filters) {
        if (filters.state && filters.state !== "all") {
          filtered = filtered.filter((m) => m.state === filters.state);
        }
      }

      // We need to attach amenities BEFORE filtering by amenities and sorting
      const needsAmenitiesForFilter =
        filters?.amenities && filters.amenities.length > 0;
      const needsAmenitiesForSort = filters?.sortBy === "most_amenities";
      const needsAmenities = needsAmenitiesForFilter || needsAmenitiesForSort;

      let mosquesWithAmenities = filtered;

      // Attach amenities if needed for filtering or sorting
      if (needsAmenities) {
        mosquesWithAmenities = await attachAmenitiesToMosques(filtered);
      }

      // Filter by amenities if specified
      if (needsAmenitiesForFilter && filters.amenities) {
        mosquesWithAmenities = mosquesWithAmenities.filter((mosque: Mosque) => {
          // Get all amenity IDs from the mosque (both regular and custom amenities)
          const mosqueAmenityIds = new Set<string>();

          // Add regular amenity IDs
          if (mosque.amenities) {
            mosque.amenities.forEach((amenity) => {
              mosqueAmenityIds.add(amenity.id);
            });
          }

          // Check if mosque has ALL selected amenities
          // All selected amenities must be present in the mosque
          return filters.amenities!.every((selectedAmenityId) =>
            mosqueAmenityIds.has(selectedAmenityId)
          );
        });
      }

      // Sort client-side if needed
      if (filters?.sortBy) {
        switch (filters.sortBy) {
          case "alphabetical":
            mosquesWithAmenities.sort((a, b) =>
              (a.name || "").localeCompare(b.name || "")
            );
            break;
          case "most_amenities":
            // Sort by number of amenities (descending)
            mosquesWithAmenities.sort((a, b) => {
              const aCount =
                (a.amenities?.length || 0) + (a.customAmenities?.length || 0);
              const bCount =
                (b.amenities?.length || 0) + (b.customAmenities?.length || 0);
              return bCount - aCount;
            });
            break;
          default:
            mosquesWithAmenities.sort((a, b) => {
              const aDate = new Date(a.created || 0).getTime();
              const bDate = new Date(b.created || 0).getTime();
              return bDate - aDate;
            });
        }
      } else {
        // Default sort by created date (newest first)
        mosquesWithAmenities.sort((a, b) => {
          const aDate = new Date(a.created || 0).getTime();
          const bDate = new Date(b.created || 0).getTime();
          return bDate - aDate;
        });
      }

      // Attach amenities if not already attached
      if (!needsAmenities) {
        mosquesWithAmenities =
          await attachAmenitiesToMosques(mosquesWithAmenities);
      }

      return await attachActivitiesToMosques(mosquesWithAmenities);
    } catch (error: unknown) {
      const errorObj =
        error && typeof error === "object" && "status" in error
          ? {
              status: error.status,
              message: "message" in error ? error.message : undefined,
              data: "data" in error ? error.data : undefined,
            }
          : { status: undefined, message: String(error), data: undefined };
      console.error("Failed to fetch all mosques:", errorObj);
      throw sanitizeError(error);
    }
  },

  // Get single mosque with details
  async get(id: string): Promise<MosqueWithDetails> {
    try {
      const mosque = (await pb
        .collection("mosques")
        .getOne(id)) as unknown as Mosque;

      // Validate ID format to prevent injection
      if (!/^[a-zA-Z0-9]{15}$/.test(id)) {
        throw new Error("Invalid mosque ID format");
      }

      // Fetch related amenities
      const amenitiesResult = await pb
        .collection("mosque_amenities")
        .getList(1, 100, {
          filter: `mosque_id = "${id}"`,
          expand: "amenity_id",
        });

      const amenities = amenitiesResult.items.map((item: unknown) => {
        const amenityItem = item as Record<string, unknown>;
        return {
          ...((amenityItem.expand &&
            typeof amenityItem.expand === "object" &&
            "amenity_id" in amenityItem.expand
            ? amenityItem.expand.amenity_id
            : {}) as Amenity),
          details: (amenityItem.details as MosqueAmenityDetails) || {},
          verified: (amenityItem.verified as boolean) || false,
        };
      }) as (Amenity & { details: MosqueAmenityDetails; verified: boolean })[];

      // Fetch custom amenities (where amenity_id is null)
      const customAmenities = amenitiesResult.items
        .filter((item: unknown) => {
          const amenityItem = item as Record<string, unknown>;
          return !amenityItem.amenity_id;
        })
        .map((item: unknown) => {
          const amenityItem = item as Record<string, unknown>;
          return {
            id: amenityItem.id as string,
            mosque_id: amenityItem.mosque_id as string,
            amenity_id: null,
            details: (amenityItem.details as MosqueAmenityDetails) || {},
            verified: (amenityItem.verified as boolean) || false,
            created: amenityItem.created as string,
            updated: amenityItem.updated as string,
          };
        }) as MosqueAmenity[];

      // Fetch activities
      // Fetch all activities and filter client-side for reliability
      let activities: Activity[] = [];
      try {
        // Try with mosque_id filter and sort first
        let activitiesResult;
        let alreadyFilteredByMosque = false;
        try {
          activitiesResult = await pb.collection("activities").getList(1, 100, {
            filter: `mosque_id = "${id}"`,
            sort: "-created",
          });
          alreadyFilteredByMosque = true;
        } catch (filterError: unknown) {
          // If filter fails, try without sort
          try {
            activitiesResult = await pb
              .collection("activities")
              .getList(1, 100, {
                filter: `mosque_id = "${id}"`,
              });
            alreadyFilteredByMosque = true;
          } catch (noSortError: unknown) {
            // If that also fails, fetch all and filter client-side
            try {
              activitiesResult = await pb
                .collection("activities")
                .getList(1, 100, {
                  sort: "-created",
                });
            } catch (noFilterError: unknown) {
              // Last resort: fetch all without any options
              activitiesResult = await pb
                .collection("activities")
                .getList(1, 100);
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
            (activity) => !activity.status || activity.status !== "cancelled"
          );
        } else {
          // Filter by both mosque_id and status
          activities = (activitiesResult.items as unknown as Activity[]).filter(
            (activity) =>
              activity.mosque_id === id &&
              (!activity.status || activity.status !== "cancelled")
          );
        }
      } catch (activitiesError: unknown) {
        // If all attempts fail, just log and continue without activities
        console.warn("Failed to fetch activities:", activitiesError);
        activities = [];
      }

      return {
        ...mosque,
        amenities,
        customAmenities,
        activities,
      };
    } catch (error: unknown) {
      // Sanitize error to prevent information disclosure
      if (
        error &&
        typeof error === "object" &&
        "status" in error &&
        error.status === 404
      ) {
        throw new Error("Mosque not found");
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

    let createdMosque: Mosque;

    // If we have an image file, use FormData
    if (imageFile) {
      const formData = createFormDataWithImage(data, imageFile, "image");
      createdMosque = (await pb
        .collection("mosques")
        .create(formData)) as unknown as Mosque;
    } else {
      // Otherwise, create normally
      createdMosque = (await pb
        .collection("mosques")
        .create(data)) as unknown as Mosque;
    }

    // Log audit event
    await logAuditEvent(
      "create",
      "mosque",
      createdMosque.id,
      null,
      createEntitySnapshot(createdMosque)
    );

    return createdMosque;
  },

  // Update mosque
  async update(
    id: string,
    data: Partial<Mosque>,
    imageFile?: File,
    deleteImage?: boolean
  ): Promise<Mosque> {
    // Get before state for audit log
    let beforeState: Record<string, unknown> | null = null;
    try {
      const existing = await pb.collection("mosques").getOne(id);
      beforeState = createEntitySnapshot(existing);
    } catch (error) {
      // If we can't get the before state, continue anyway
      console.warn("Could not fetch before state for audit log:", error);
    }

    // If image file is provided, validate it first
    if (imageFile) {
      const validationError = validateImageFile(imageFile);
      if (validationError) {
        throw new Error(validationError);
      }
    }

    let updatedMosque: Mosque;

    // If we need to delete the image, set image field to empty string
    if (deleteImage) {
      const updateData = { ...data, image: "" };
      updatedMosque = (await pb
        .collection("mosques")
        .update(id, updateData)) as unknown as Mosque;
    } else if (imageFile) {
      // If we have an image file, use FormData
      const formData = createFormDataWithImage(data, imageFile, "image");
      updatedMosque = (await pb
        .collection("mosques")
        .update(id, formData)) as unknown as Mosque;
    } else {
      // Otherwise, update normally
      updatedMosque = (await pb
        .collection("mosques")
        .update(id, data)) as unknown as Mosque;
    }

    // Log audit event
    await logAuditEvent(
      "update",
      "mosque",
      id,
      beforeState,
      createEntitySnapshot(updatedMosque)
    );

    return updatedMosque;
  },

  // Delete mosque
  async delete(id: string): Promise<boolean> {
    // Get before state for audit log
    let beforeState: Record<string, unknown> | null = null;
    try {
      const existing = await pb.collection("mosques").getOne(id);
      beforeState = createEntitySnapshot(existing);
    } catch (error) {
      // If we can't get the before state, continue anyway
      console.warn("Could not fetch before state for audit log:", error);
    }

    await pb.collection("mosques").delete(id);

    // Log audit event
    await logAuditEvent("delete", "mosque", id, beforeState, null);

    return true;
  },

  // List all mosques for admin (including pending and rejected)
  async listAllAdmin(): Promise<Mosque[]> {
    try {
      // Fetch all mosques using pagination to avoid 400 errors
      const allItems: unknown[] = [];
      let page = 1;
      const perPage = 100; // Reasonable page size
      let hasMore = true;

      while (hasMore) {
        // Try with sort first, fallback without sort if it fails
        let result;
        try {
          result = await pb.collection("mosques").getList(page, perPage, {
            sort: "-created",
          });
        } catch (sortError: unknown) {
          // If sort fails, try without sort
          console.warn("Sort failed, trying without sort:", sortError);
          result = await pb.collection("mosques").getList(page, perPage);
        }

        allItems.push(...result.items);

        // Check if there are more pages
        hasMore = result.page < result.totalPages;
        page++;
      }

      // Sort client-side if server-side sort failed
      const typedItems = allItems as Array<{ created?: string }>;
      if (typedItems.length > 0 && !typedItems[0].created) {
        // If no created field, skip sorting
      } else {
        typedItems.sort((a, b) => {
          const aDate = new Date(a.created || 0).getTime();
          const bDate = new Date(b.created || 0).getTime();
          return bDate - aDate; // Newest first
        });
      }

      const items = typedItems as unknown as Mosque[];

      // Fetch and attach amenities to mosques
      return await attachAmenitiesToMosques(items);
    } catch (error: unknown) {
      const errorObj =
        error && typeof error === "object" && "status" in error
          ? {
              status: error.status,
              message: "message" in error ? error.message : undefined,
              data: "data" in error ? error.data : undefined,
            }
          : { status: undefined, message: String(error), data: undefined };
      console.error("Failed to fetch all mosques:", errorObj);
      throw sanitizeError(error);
    }
  },

  // Helper to get sort string
  getSortString(sortBy?: string): string {
    switch (sortBy) {
      case "alphabetical":
        return "name";
      case "most_amenities":
        return "-created"; // Placeholder - would need aggregation
      case "nearest":
        return "-created"; // Placeholder - would need geospatial query
      default:
        return "-created";
    }
  },
};
