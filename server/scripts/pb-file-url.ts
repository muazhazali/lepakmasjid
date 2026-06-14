export function pocketbaseFileUrl(
  baseUrl: string,
  collectionId: string,
  recordId: string,
  filename: string
): string {
  const base = baseUrl.replace(/\/$/, "");
  const enc = encodeURIComponent(filename);
  return `${base}/api/files/${collectionId}/${recordId}/${enc}`;
}