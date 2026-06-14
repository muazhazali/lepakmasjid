import { apiFetch } from "../api-client";
import type { Amenity, MosqueAmenity } from "@/types";

export const amenitiesApi = {
  async list(): Promise<Amenity[]> {
    const res = await apiFetch<{ items: Amenity[] }>("/amenities");
    return res.items;
  },

  async get(id: string): Promise<Amenity> {
    const items = await this.list();
    const found = items.find((a) => a.id === id);
    if (!found) throw new Error("Amenity not found");
    return found;
  },

  async createCustom(): Promise<Amenity> {
    throw new Error("Custom amenity API not implemented yet");
  },
};

export const mosqueAmenitiesApi = {
  async getByMosque(): Promise<MosqueAmenity[]> {
    return [];
  },
  async create(): Promise<MosqueAmenity> {
    throw new Error("Not implemented");
  },
  async update(): Promise<MosqueAmenity> {
    throw new Error("Not implemented");
  },
  async delete(): Promise<boolean> {
    throw new Error("Not implemented");
  },
  async replaceAll(): Promise<MosqueAmenity[]> {
    throw new Error("Not implemented");
  },
};