import { apiFetch } from "../api-client";
import type { User } from "@/types";

export const usersApi = {
  async list(): Promise<User[]> {
    try {
      const res = await apiFetch<{ items: User[] }>("/users");
      return res.items;
    } catch {
      return [];
    }
  },

  async get(id: string): Promise<User> {
    const res = await apiFetch<{ record: User }>(`/users/${id}`);
    return res.record;
  },

  async update(): Promise<User> {
    throw new Error("Users update API not implemented yet");
  },

  async updateProfile(): Promise<User> {
    throw new Error("Not implemented");
  },

  async updatePassword(): Promise<void> {
    throw new Error("Not implemented");
  },

  async requestPasswordReset(): Promise<void> {
    throw new Error("Not implemented");
  },

  async delete(): Promise<boolean> {
    throw new Error("Not implemented");
  },
};