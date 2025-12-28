import { getPocketBaseUrl } from "./pocketbase";
import type { RecordModel } from "pocketbase";

/**
 * Get the full URL for an image stored in PocketBase
 *
 * @param record - The PocketBase record containing the image (must have id property)
 * @param filename - The filename of the image (from the record's file field)
 * @param thumb - Optional thumbnail size (e.g., '100x250', '300x300')
 * @param collectionName - Optional collection name (defaults to 'mosques' if not found in record)
 * @returns The full URL to access the image
 *
 * @example
 * const mosque = await pb.collection('mosques').getOne('RECORD_ID');
 * const imageUrl = getImageUrl(mosque, mosque.image, '300x300');
 */
export function getImageUrl(
  record:
    | RecordModel
    | {
        id: string;
        collectionId?: string;
        collectionName?: string;
        [key: string]: unknown;
      },
  filename: string | string[] | File | null | undefined,
  thumb?: string,
  collectionName?: string
): string | null {
  if (!filename) {
    return null;
  }

  // If it's a File object (not yet uploaded), return a local object URL
  if (filename instanceof File) {
    return URL.createObjectURL(filename);
  }

  // If it's an array, get the first filename
  const imageFilename = Array.isArray(filename) ? filename[0] : filename;

  if (!imageFilename || typeof imageFilename !== "string") {
    return null;
  }

  if (!record || !record.id) {
    return null;
  }

  // Construct the URL manually: {baseUrl}/api/files/{collectionId}/{recordId}/{filename}
  const baseUrl = getPocketBaseUrl();
  // Try to get collection name from record, parameter, or default to 'mosques'
  const recordObj = record as Record<string, unknown>;
  const collectionId =
    collectionName ||
    (recordObj.collectionId as string | undefined) ||
    (recordObj.collectionName as string | undefined) ||
    "mosques";
  const recordId = record.id;

  let url = `${baseUrl}/api/files/${collectionId}/${recordId}/${imageFilename}`;

  // Add thumbnail parameter if specified
  if (thumb) {
    url += `?thumb=${thumb}`;
  }

  return url;
}

/**
 * Get multiple image URLs from a record
 *
 * @param record - The PocketBase record containing the images
 * @param filenames - Array of filenames or single filename
 * @param thumb - Optional thumbnail size
 * @returns Array of image URLs
 */
export function getImageUrls(
  record: RecordModel,
  filenames: string | string[] | File | null | undefined,
  thumb?: string
): string[] {
  if (!filenames) {
    return [];
  }

  if (filenames instanceof File) {
    return [URL.createObjectURL(filenames)];
  }

  const files = Array.isArray(filenames) ? filenames : [filenames];

  return files
    .filter((f): f is string => typeof f === "string" && f.length > 0)
    .map((filename) => {
      if (!record || !record.id) {
        return "";
      }
      const baseUrl = getPocketBaseUrl();
      const recordObj = record as Record<string, unknown>;
      const collectionId =
        (recordObj.collectionId as string | undefined) ||
        (recordObj.collectionName as string | undefined) ||
        "mosques";
      const recordId = record.id;
      let url = `${baseUrl}/api/files/${collectionId}/${recordId}/${filename}`;
      if (thumb) {
        url += `?thumb=${thumb}`;
      }
      return url;
    })
    .filter((url) => url.length > 0);
}

/**
 * Validate image file before upload
 *
 * @param file - The file to validate
 * @param maxSize - Maximum file size in bytes (default: 5MB)
 * @param allowedTypes - Allowed MIME types (default: common image types)
 * @returns Error message if invalid, null if valid
 */
export function validateImageFile(
  file: File,
  maxSize: number = 5242880, // 5MB
  allowedTypes: string[] = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
  ]
): string | null {
  if (!file) {
    return "No file provided";
  }

  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / 1024 / 1024).toFixed(2);
    return `File size exceeds ${maxSizeMB}MB limit`;
  }

  if (!allowedTypes.includes(file.type)) {
    return `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(", ")}`;
  }

  return null;
}

/**
 * Convert a File to a format suitable for PocketBase upload
 * This is mainly for type safety - PocketBase accepts File objects directly
 *
 * @param file - The file to prepare
 * @returns The file ready for upload
 */
export function prepareImageForUpload(file: File): File {
  return file;
}

/**
 * Create a FormData object with image file for PocketBase upload
 *
 * @param data - The record data (excluding the file)
 * @param imageFile - The image file to upload
 * @param fieldName - The field name for the image (default: 'image')
 * @returns FormData ready for PocketBase create/update
 *
 * @example
 * const formData = createFormDataWithImage(
 *   { name: 'Masjid Jamek', address: '...', ... },
 *   imageFile,
 *   'image'
 * );
 * const mosque = await pb.collection('mosques').create(formData);
 */
export function createFormDataWithImage(
  data: Record<string, unknown>,
  imageFile: File | null,
  fieldName: string = "image"
): FormData {
  const formData = new FormData();

  // Add all regular fields
  Object.entries(data).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      if (value instanceof Date) {
        formData.append(key, value.toISOString());
      } else if (typeof value === "object" && !(value instanceof File)) {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, String(value));
      }
    }
  });

  // Add the image file if provided
  if (imageFile) {
    formData.append(fieldName, imageFile);
  }

  return formData;
}

/**
 * Fetch an image file from a PocketBase record and convert it to a File object
 * This is useful when copying images from submissions to mosques
 *
 * @param record - The PocketBase record containing the image
 * @param filename - The filename of the image (from the record's file field)
 * @param collectionName - The collection name (e.g., 'submissions', 'mosques')
 * @returns A File object ready for upload, or null if image not found
 *
 * @example
 * const submission = await pb.collection('submissions').getOne('RECORD_ID');
 * const imageFile = await getImageFileFromRecord(submission, submission.image, 'submissions');
 * if (imageFile) {
 *   await mosquesApi.create(mosqueData, imageFile);
 * }
 */
export async function getImageFileFromRecord(
  record:
    | RecordModel
    | {
        id: string;
        collectionId?: string;
        collectionName?: string;
        [key: string]: unknown;
      },
  filename: string | string[] | null | undefined,
  collectionName?: string
): Promise<File | null> {
  if (!filename || !record?.id) {
    return null;
  }

  // Get the image filename
  const imageFilename = Array.isArray(filename) ? filename[0] : filename;
  if (!imageFilename || typeof imageFilename !== "string") {
    return null;
  }

  try {
    // Get the image URL
    const baseUrl = getPocketBaseUrl();
    const recordObj = record as Record<string, unknown>;
    const collectionId =
      collectionName ||
      (recordObj.collectionId as string | undefined) ||
      (recordObj.collectionName as string | undefined) ||
      "submissions";
    const recordId = record.id;
    const imageUrl = `${baseUrl}/api/files/${collectionId}/${recordId}/${imageFilename}`;

    // Fetch the image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      return null;
    }

    // Convert to blob and then to File
    const blob = await response.blob();
    const file = new File([blob], imageFilename, {
      type: blob.type || "image/jpeg",
    });

    return file;
  } catch (error) {
    console.error("Error fetching image from record:", error);
    return null;
  }
}
