import { apiFetch } from "../api-client";
import type {
  Mosque,
  MosqueFilters,
  MosqueWithDetails,
  PaginatedResponse,
} from "@/types";
import { sanitizeError } from "../error-handler";

function buildQuery(filters?: MosqueFilters): string {
  const p = new URLSearchParams();
  if (!filters) return "";
  if (filters.page) p.set("page", String(filters.page));
  if (filters.perPage) p.set("perPage", String(filters.perPage));
  if (filters.state) p.set("state", filters.state);
  if (filters.search) p.set("search", filters.search);
  if (filters.sortBy) p.set("sortBy", filters.sortBy);
  if (filters.amenities?.length) p.set("amenities", filters.amenities.join(","));
  const q = p.toString();
  return q ? `?${q}` : "";
}

export const mosquesApi = {
  async list(filters?: MosqueFilters): Promise<PaginatedResponse<Mosque>> {
    try {
      return await apiFetch<PaginatedResponse<Mosque>>(
        `/mosques${buildQuery(filters)}`
      );
    } catch (error: unknown) {
      throw new Error(sanitizeError(error));
    }
  },

  async listAll(
    filters?: Omit<MosqueFilters, "page" | "perPage">
  ): Promise<Mosque[]> {
    const p = new URLSearchParams();
    if (filters?.state) p.set("state", filters.state);
    if (filters?.search) p.set("search", filters.search);
    const q = p.toString();
    const res = await apiFetch<{ items: Mosque[] }>(
      `/mosques/all${q ? `?${q}` : ""}`
    );
    return res.items;
  },

  async get(id: string): Promise<MosqueWithDetails> {
    const res = await apiFetch<{ record: MosqueWithDetails }>(`/mosques/${id}`);
    return res.record;
  },

  async create(): Promise<Mosque> {
    throw new Error("Use submissions API");
  },

  async update(): Promise<Mosque> {
    throw new Error("Mosque update API not implemented yet");
  },

  async delete(): Promise<boolean> {
    throw new Error("Mosque delete API not implemented yet");
  },

  async listAllAdmin(): Promise<Mosque[]> {
    const res = await apiFetch<{ items: Mosque[] }>("/mosques/admin/all");
    return res.items;
  },

  getSortString(): string {
    return "";
  },
};