import { getApiBase } from "./api-client";

type ImageRecord = {
  id?: string;
  image?: string | string[] | File | null;
};

export function getImageUrl(
  record: ImageRecord,
  filename: string | string[] | File | null | undefined
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

  if (candidate.startsWith("/")) return candidate;

  const apiBase = getApiBase().replace(/\/$/, "");
  return `${apiBase}/uploads/${candidate.replace(/^\//, "")}`;
}

export function getImageUrls(
  record: ImageRecord,
  filenames: string | string[] | File | null | undefined
): string[] {
  if (!filenames) return [];
  if (Array.isArray(filenames)) {
    return filenames
      .map((f) => getImageUrl(record, f))
      .filter((u): u is string => !!u);
  }
  const one = getImageUrl(record, filenames);
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
  if (!allowedTypes.includes(file.type)) return "Invalid image type";
  if (file.size > maxSize) return "Image too large";
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