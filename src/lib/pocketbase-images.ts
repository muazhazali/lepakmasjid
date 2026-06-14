import { getApiBase } from "./api-client";

type ImageRecord = {
  id?: string;
  collectionId?: string;
  collectionName?: string;
  image?: string | string[] | File | null;
};

/** Resolve mosque/user image for <img src> (API returns full URL or path). */
export function getImageUrl(
  record: ImageRecord,
  filename: string | string[] | File | null | undefined,
  _thumb?: string,
  _collectionName?: string
): string | null {
  if (filename instanceof File) return URL.createObjectURL(filename);

  const fromRecord = record.image;
  const candidate =
    typeof fromRecord === "string"
      ? fromRecord
      : typeof filename === "string"
        ? filename
        : null;

  if (!candidate) return null;

  if (candidate.startsWith("http://") || candidate.startsWith("https://")) {
    return candidate;
  }

  // API may return full URL already; if path-only, serve via /api/uploads (Vite proxy)
  if (candidate.startsWith("/")) return candidate;

  const apiBase = getApiBase().replace(/\/$/, "");
  return `${apiBase}/uploads/${candidate.replace(/^\//, "")}`;
}

export function getImageUrls(
  record: ImageRecord,
  filenames: string | string[] | File | null | undefined,
  thumb?: string
): string[] {
  if (!filenames) return [];
  if (Array.isArray(filenames)) {
    return filenames
      .map((f) => getImageUrl(record, f, thumb))
      .filter((u): u is string => !!u);
  }
  const one = getImageUrl(record, filenames, thumb);
  return one ? [one] : [];
}

export function validateImageFile(
  file: File,
  maxSize: number = 5242880,
  allowedTypes: string[] = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
  ]
): string | null {
  if (!allowedTypes.includes(file.type)) {
    return "Invalid image type";
  }
  if (file.size > maxSize) {
    return "Image too large";
  }
  return null;
}

export function prepareImageForUpload(file: File): File {
  return file;
}

export function createFormDataWithImage(
  data: Record<string, unknown>,
  imageFile: File | null,
  fieldName: string = "image"
): FormData {
  const form = new FormData();
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null) continue;
    if (typeof value === "object" && !(value instanceof File)) {
      form.append(key, JSON.stringify(value));
    } else {
      form.append(key, value as string | Blob);
    }
  }
  if (imageFile) form.append(fieldName, imageFile);
  return form;
}

export async function getImageFileFromRecord(): Promise<File | null> {
  return null;
}