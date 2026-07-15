import { pb } from "../pocketbase";
import type { Amenity, MosqueAmenity, MosqueAmenityDetails } from "@/types";
import { sanitizeError } from "../error-handler";
import { validateRecordId } from "../validation";

export const amenitiesApi = {
  // List all amenities
  async list(): Promise<Amenity[]> {
    try {
      const result = await pb.collection("amenities").getList(1, 100, {
        sort: "order",
      });
      return result.items as unknown as Amenity[];
    } catch (error: unknown) {
      // Sanitize error to prevent information disclosure
      if (
        error &&
        typeof error === "object" &&
        "status" in error &&
        error.status === 403
      ) {
        throw new Error("Access denied. Please check your permissions.");
      }
      throw sanitizeError(error);
    }
  },

  // Get single amenity
  async get(id: string): Promise<Amenity> {
    return (await pb.collection("amenities").getOne(id)) as unknown as Amenity;
  },

  // Create custom amenity
  async createCustom(data: {
    key: string;
    label_en: string;
    label_bm: string;
    icon?: string;
    order?: number;
  }): Promise<Amenity> {
    try {
      // Validate key format (alphanumeric and underscores only)
      if (!/^[a-z0-9_]+$/.test(data.key)) {
        throw new Error(
          "Invalid amenity key format. Use lowercase letters, numbers, and underscores only."
        );
      }

      // Check if key already exists
      try {
        const existing = await pb
          .collection("amenities")
          .getFirstListItem(`key="${data.key}"`);
        if (existing) {
          throw new Error("Amenity with this key already exists");
        }
      } catch (err: unknown) {
        // If not found, that's fine - we can create it
        if (
          err &&
          typeof err === "object" &&
          "status" in err &&
          err.status !== 404
        ) {
          throw err;
        }
      }

      const result = await pb.collection("amenities").create({
        key: data.key,
        label_en: data.label_en,
        label_bm: data.label_bm,
        icon: data.icon || "circle",
        order: data.order || 0,
      });

      return result as unknown as Amenity;
    } catch (error: unknown) {
      throw sanitizeError(error);
    }
  },
};

export const mosqueAmenitiesApi = {
  // Get all amenities for a mosque
  async getByMosque(mosqueId: string): Promise<MosqueAmenity[]> {
    if (!validateRecordId(mosqueId)) {
      throw new Error("Invalid mosque ID format");
    }

    try {
      const result = await pb.collection("mosque_amenities").getList(1, 500, {
        filter: `mosque_id = "${mosqueId}"`,
        expand: "amenity_id",
      });
      return result.items as unknown as MosqueAmenity[];
    } catch (error: unknown) {
      throw sanitizeError(error);
    }
  },

  // Create mosque amenity
  async create(data: {
    mosque_id: string;
    amenity_id?: string | null;
    details?: MosqueAmenityDetails;
    verified?: boolean;
  }): Promise<MosqueAmenity> {
    if (!validateRecordId(data.mosque_id)) {
      throw new Error("Invalid mosque ID format");
    }

    if (data.amenity_id && !validateRecordId(data.amenity_id)) {
      throw new Error("Invalid amenity ID format");
    }

    try {
      const result = await pb.collection("mosque_amenities").create({
        mosque_id: data.mosque_id,
        amenity_id: data.amenity_id || null,
        details: data.details || {},
        verified: data.verified ?? false,
      });
      return result as unknown as MosqueAmenity;
    } catch (error: unknown) {
      throw sanitizeError(error);
    }
  },

  // Update mosque amenity
  async update(
    id: string,
    data: {
      details?: MosqueAmenityDetails;
      verified?: boolean;
    }
  ): Promise<MosqueAmenity> {
    if (!validateRecordId(id)) {
      throw new Error("Invalid mosque amenity ID format");
    }

    try {
      const result = await pb.collection("mosque_amenities").update(id, {
        details: data.details,
        verified: data.verified,
      });
      return result as unknown as MosqueAmenity;
    } catch (error: unknown) {
      throw sanitizeError(error);
    }
  },

  // Delete mosque amenity
  async delete(id: string): Promise<boolean> {
    if (!validateRecordId(id)) {
      throw new Error("Invalid mosque amenity ID format");
    }

    try {
      await pb.collection("mosque_amenities").delete(id);
      return true;
    } catch (error: unknown) {
      throw sanitizeError(error);
    }
  },

  // Replace all amenities for a mosque (delete existing and create new ones)
  async replaceAll(
    mosqueId: string,
    amenities: Array<{
      amenity_id?: string | null;
      details?: MosqueAmenityDetails;
      verified?: boolean;
    }>
  ): Promise<MosqueAmenity[]> {
    if (!validateRecordId(mosqueId)) {
      throw new Error("Invalid mosque ID format");
    }

    try {
      // Get all existing amenities for this mosque
      const existing = await this.getByMosque(mosqueId);

      // Delete all existing amenities
      for (const existingAmenity of existing) {
        try {
          await this.delete(existingAmenity.id);
        } catch (err) {
          console.warn("Failed to delete existing amenity:", err);
        }
      }

      // Create new amenities
      const created: MosqueAmenity[] = [];
      for (const amenity of amenities) {
        if (amenity.amenity_id && !validateRecordId(amenity.amenity_id)) {
          console.warn("Skipping invalid amenity_id:", amenity.amenity_id);
          continue;
        }

        try {
          const createdAmenity = await this.create({
            mosque_id: mosqueId,
            amenity_id: amenity.amenity_id || null,
            details: amenity.details || {},
            verified: amenity.verified ?? false,
          });
          created.push(createdAmenity);
        } catch (err) {
          console.warn("Failed to create amenity:", err);
        }
      }

      return created;
    } catch (error: unknown) {
      throw sanitizeError(error);
    }
  },
};
