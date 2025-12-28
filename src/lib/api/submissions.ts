import { pb } from "../pocketbase";
import type { Submission } from "@/types";
import { validateSubmissionStatus, validateRecordId } from "../validation";
import { sanitizeError } from "../error-handler";
import {
  validateImageFile,
  createFormDataWithImage,
  getImageFileFromRecord,
} from "../pocketbase-images";
import { mosquesApi } from "./mosques";
import { amenitiesApi, mosqueAmenitiesApi } from "./amenities";
import { activitiesApi } from "./activities";
import { logAuditEvent, createEntitySnapshot } from "../audit-logger";

export const submissionsApi = {
  // List submissions (admin only)
  async list(
    status?: "pending" | "approved" | "rejected"
  ): Promise<Submission[]> {
    let filter = "";
    if (status) {
      // Validate status against allowlist to prevent filter injection
      if (!validateSubmissionStatus(status)) {
        throw new Error("Invalid status parameter");
      }
      filter = `status = "${status}"`;
    }

    const result = await pb.collection("submissions").getList(1, 100, {
      filter,
      sort: "-submitted_at",
    });
    return result.items as unknown as Submission[];
  },

  // List current user's submissions
  async listMySubmissions(
    status?: "pending" | "approved" | "rejected"
  ): Promise<Submission[]> {
    if (!pb.authStore.model) {
      throw new Error("User not authenticated");
    }

    let filter = `submitted_by = "${pb.authStore.model.id}"`;
    if (status) {
      // Validate status against allowlist to prevent filter injection
      if (!validateSubmissionStatus(status)) {
        throw new Error("Invalid status parameter");
      }
      filter += ` && status = "${status}"`;
    }

    const result = await pb.collection("submissions").getList(1, 100, {
      filter,
      sort: "-submitted_at",
    });
    return result.items as unknown as Submission[];
  },

  // Get single submission
  async get(id: string): Promise<Submission> {
    // Validate ID format to prevent injection
    if (!validateRecordId(id)) {
      throw new Error("Invalid submission ID format");
    }
    return (await pb
      .collection("submissions")
      .getOne(id)) as unknown as Submission;
  },

  // Create submission
  async create(
    data: Partial<Submission> & { imageFile?: File }
  ): Promise<Submission> {
    // Extract imageFile from data if present
    const { imageFile, ...submissionData } = data;

    // If image file is provided, validate it first
    if (imageFile) {
      const validationError = validateImageFile(imageFile);
      if (validationError) {
        throw new Error(validationError);
      }
    }

    // If we have an image file, use FormData to upload
    if (imageFile) {
      // Ensure data is an object and remove any image reference from it
      const submissionDataObj =
        (submissionData.data as Record<string, unknown>) || {};
      const { image, ...dataWithoutImage } = submissionDataObj;

      // Create FormData - build it similar to createFormDataWithImage but adapted for submissions
      const formData = new FormData();

      // Add all submission top-level fields (excluding data)
      // These are: type, mosque_id, status, submitted_by, submitted_at, etc.
      Object.entries(submissionData).forEach(([key, value]) => {
        if (key !== "data" && value !== null && value !== undefined) {
          if (value instanceof Date) {
            formData.append(key, value.toISOString());
          } else if (typeof value === "string") {
            // Strings (including relation IDs) should be sent as-is
            formData.append(key, value);
          } else if (typeof value === "number" || typeof value === "boolean") {
            formData.append(key, String(value));
          } else if (typeof value === "object" && !(value instanceof File)) {
            // For objects/arrays, stringify them
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, String(value));
          }
        }
      });

      // Add the data field as JSON string (PocketBase JSON field type requires stringified JSON)
      // This contains the mosque data (name, address, lat, lng, amenities, etc.) without the image
      formData.append("data", JSON.stringify(dataWithoutImage));

      // Add the image file LAST - must be appended as a File object
      // PocketBase will handle the file upload automatically
      // Note: Some servers require the file to be appended last
      formData.append("image", imageFile, imageFile.name);

      try {
        return (await pb
          .collection("submissions")
          .create(formData)) as unknown as Submission;
      } catch (error: unknown) {
        // Log the error for debugging
        console.error("Error creating submission with image:", error);
        // Re-throw with a more helpful message
        if (
          error &&
          typeof error === "object" &&
          "response" in error &&
          error.response &&
          typeof error.response === "object" &&
          "data" in error.response
        ) {
          console.error("PocketBase error details:", error.response.data);
        }
        throw error;
      }
    }

    // Otherwise, create normally without image
    const createdSubmission = (await pb
      .collection("submissions")
      .create(submissionData)) as unknown as Submission;

    // Log audit event
    await logAuditEvent(
      "create",
      "submission",
      createdSubmission.id,
      null,
      createEntitySnapshot(createdSubmission)
    );

    return createdSubmission;
  },

  // Update submission (approve/reject)
  async update(id: string, data: Partial<Submission>): Promise<Submission> {
    return (await pb
      .collection("submissions")
      .update(id, data)) as unknown as Submission;
  },

  // Approve submission
  async approve(id: string, reviewedBy: string): Promise<Submission> {
    const submission = await this.get(id);

    // Get before state for audit log
    const beforeState = createEntitySnapshot(submission);

    // Whitelist of allowed fields for mosque creation/update
    // This prevents mass assignment attacks where malicious fields could be injected
    const ALLOWED_MOSQUE_FIELDS = [
      "name",
      "name_bm",
      "address",
      "state",
      "lat",
      "lng",
      "description",
      "description_bm",
      "status",
    ] as const;

    // Sanitize submission data - only allow whitelisted fields (excluding image)
    const sanitizedData: Record<string, unknown> = {};
    for (const field of ALLOWED_MOSQUE_FIELDS) {
      if (field in submission.data && submission.data[field] !== undefined) {
        sanitizedData[field] = submission.data[field];
      }
    }

    // When approving a submission, create the mosque with approved status
    // For edits, preserve existing status unless explicitly changed
    if (submission.type === "new_mosque") {
      sanitizedData.status = "approved"; // Mosque is approved when admin approves the submission
      sanitizedData.created_by = submission.submitted_by;
    }

    // Handle image from submission
    // Check if submission has an image field (file field in PocketBase)
    let imageFile: File | undefined;
    const submissionRecord = submission as Record<string, unknown>;

    // If submission has an image file field, fetch it
    if (submissionRecord.image) {
      try {
        const fetchedImageFile = await getImageFileFromRecord(
          submissionRecord,
          submissionRecord.image,
          "submissions"
        );
        if (fetchedImageFile) {
          // Validate the fetched image file for security
          const validationError = validateImageFile(fetchedImageFile);
          if (!validationError) {
            imageFile = fetchedImageFile;
          } else {
            console.warn(
              "Image from submission failed validation:",
              validationError
            );
          }
        }
      } catch (error) {
        console.error("Error fetching image from submission:", error);
        // Continue without image if fetch fails
      }
    }

    let createdMosqueId: string | undefined;

    if (submission.type === "new_mosque") {
      // Create the mosque with sanitized data and image
      // Use mosquesApi.create which handles image upload securely
      const createdMosque = await mosquesApi.create(sanitizedData, imageFile);
      createdMosqueId = createdMosque.id;
    } else if (submission.type === "edit_mosque" && submission.mosque_id) {
      // Validate mosque ID format
      if (!validateRecordId(submission.mosque_id)) {
        throw new Error("Invalid mosque ID format");
      }
      // Update the mosque with sanitized data and image (only allowed fields)
      await mosquesApi.update(submission.mosque_id, sanitizedData, imageFile);
      createdMosqueId = submission.mosque_id;
    }

    // Handle amenities from submission
    if (createdMosqueId && submission.data) {
      const submissionData = submission.data as Record<string, unknown>;
      const amenities = (submissionData.amenities as Array<Record<string, unknown>>) || [];
      const customAmenities = (submissionData.customAmenities as Array<Record<string, unknown>>) || [];

      // Process regular amenities
      const amenityData = amenities.map((amenity) => ({
        amenity_id: amenity.amenity_id,
        details: amenity.details || {},
        verified: amenity.verified ?? false,
      }));

      // Process custom amenities - create them in amenities collection first
      for (const custom of customAmenities) {
        try {
          // Check if custom amenity already exists
          let customAmenityId: string | null = null;
          try {
            const existing = await pb
              .collection("amenities")
              .getFirstListItem(`key="${custom.key}"`);
            customAmenityId = existing.id;
          } catch (err: unknown) {
            // If not found, create it
            if (
              err &&
              typeof err === "object" &&
              "status" in err &&
              err.status === 404
            ) {
              const createdCustom = await amenitiesApi.createCustom({
                key: custom.key,
                label_en: custom.custom_name_en || custom.custom_name || "",
                label_bm: custom.custom_name || "",
                icon: custom.custom_icon,
                order: 0,
              });
              customAmenityId = createdCustom.id;
            } else {
              console.warn("Error checking for existing custom amenity:", err);
            }
          }

          if (customAmenityId) {
            amenityData.push({
              amenity_id: customAmenityId,
              details: {
                ...custom.details,
                custom_name: custom.custom_name,
                custom_name_en: custom.custom_name_en,
                custom_icon: custom.custom_icon,
              },
              verified: false,
            });
          }
        } catch (err) {
          console.warn("Failed to create custom amenity:", err);
        }
      }

      // Replace all amenities for the mosque
      if (
        amenityData.length > 0 ||
        amenities.length > 0 ||
        customAmenities.length > 0
      ) {
        try {
          await mosqueAmenitiesApi.replaceAll(createdMosqueId, amenityData);
        } catch (err) {
          console.warn("Failed to update mosque amenities:", err);
          // Don't fail the submission approval if amenities fail
        }
      }

      // Handle activities from submission
      const activities = submissionData.activities || [];
      if (activities.length > 0) {
        try {
          // Delete existing activities for this mosque (for edit submissions)
          if (submission.type === "edit_mosque") {
            try {
              const existingActivities = await pb
                .collection("activities")
                .getList(1, 100, {
                  filter: `mosque_id = "${createdMosqueId}"`,
                });
              for (const activity of existingActivities.items) {
                await pb.collection("activities").delete(activity.id);
              }
            } catch (deleteErr) {
              console.warn("Failed to delete existing activities:", deleteErr);
              // Continue with creating new activities
            }
          }

          // Create new activities
          for (const activityData of activities) {
            try {
              await activitiesApi.create({
                mosque_id: createdMosqueId,
                title: activityData.title,
                title_bm: activityData.title_bm || undefined,
                description: activityData.description || undefined,
                description_bm: activityData.description_bm || undefined,
                type: activityData.type,
                schedule_json: activityData.schedule_json || {},
                start_date: activityData.start_date || undefined,
                end_date: activityData.end_date || undefined,
                status: activityData.status || "active",
                created_by: submission.submitted_by,
              });
            } catch (activityErr) {
              console.warn("Failed to create activity:", activityErr);
              // Continue with other activities
            }
          }
        } catch (activitiesErr) {
          console.warn("Failed to process activities:", activitiesErr);
          // Don't fail the submission approval if activities fail
        }
      }
    }

    // Update submission status
    const updatedSubmission = await this.update(id, {
      status: "approved",
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString(),
    });

    // Log audit event
    await logAuditEvent(
      "approve",
      "submission",
      id,
      beforeState,
      createEntitySnapshot(updatedSubmission)
    );

    return updatedSubmission;
  },

  // Reject submission
  async reject(
    id: string,
    reviewedBy: string,
    reason: string
  ): Promise<Submission> {
    // Get before state for audit log
    const submission = await this.get(id);
    const beforeState = createEntitySnapshot(submission);

    const updatedSubmission = await this.update(id, {
      status: "rejected",
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString(),
      rejection_reason: reason,
    });

    // Log audit event
    await logAuditEvent(
      "reject",
      "submission",
      id,
      beforeState,
      createEntitySnapshot(updatedSubmission)
    );

    return updatedSubmission;
  },
};
