import type { Activity } from "@/types";

export const activitiesApi = {
  async listByMosque(_mosqueId: string): Promise<Activity[]> {
    return [];
  },
  async get(): Promise<Activity> {
    throw new Error("Not implemented");
  },
  async create(): Promise<Activity> {
    throw new Error("Not implemented");
  },
  async update(): Promise<Activity> {
    throw new Error("Not implemented");
  },
  async delete(): Promise<boolean> {
    throw new Error("Not implemented");
  },
};