import { pb } from "../pocketbase";
import type { Activity } from "@/types";

export const activitiesApi = {
  // List activities for a mosque
  async listByMosque(mosqueId: string): Promise<Activity[]> {
    const result = await pb.collection("activities").getList(1, 100, {
      filter: `mosque_id = "${mosqueId}" && status = "active"`,
      sort: "-created",
    });
    return result.items as unknown as Activity[];
  },

  // Get single activity
  async get(id: string): Promise<Activity> {
    return (await pb
      .collection("activities")
      .getOne(id)) as unknown as Activity;
  },

  // Create activity
  async create(data: Partial<Activity>): Promise<Activity> {
    return (await pb
      .collection("activities")
      .create(data)) as unknown as Activity;
  },

  // Update activity
  async update(id: string, data: Partial<Activity>): Promise<Activity> {
    return (await pb
      .collection("activities")
      .update(id, data)) as unknown as Activity;
  },

  // Delete activity
  async delete(id: string): Promise<boolean> {
    await pb.collection("activities").delete(id);
    return true;
  },
};
