import { pb } from "../pocketbase";
import type { User } from "@/types";
import { logAuditEvent, createEntitySnapshot } from "../audit-logger";

export const usersApi = {
  // List users (admin only)
  async list(): Promise<User[]> {
    try {
      // Fetch all users using pagination to avoid 400 errors
      const allItems: unknown[] = [];
      let page = 1;
      const perPage = 100; // Reasonable page size
      let hasMore = true;

      while (hasMore) {
        // Try with sort first, fallback without sort if it fails
        let result;
        try {
          result = await pb.collection("users").getList(page, perPage, {
            sort: "-created",
          });
        } catch (sortError: unknown) {
          // If sort fails, try without sort
          console.warn("Sort failed, trying without sort:", sortError);
          result = await pb.collection("users").getList(page, perPage);
        }

        allItems.push(...result.items);

        // Check if there are more pages
        hasMore = result.page < result.totalPages;
        page++;
      }

      // Sort client-side if server-side sort failed
      const typedItems = allItems as Array<{ created?: string }>;
      if (typedItems.length > 0 && typedItems[0].created) {
        typedItems.sort((a, b) => {
          const aDate = new Date(a.created || 0).getTime();
          const bDate = new Date(b.created || 0).getTime();
          return bDate - aDate; // Newest first
        });
      }

      return typedItems as unknown as User[];
    } catch (error: unknown) {
      const errorObj =
        error && typeof error === "object" && "status" in error
          ? {
              status: error.status,
              message: "message" in error ? error.message : undefined,
              data: "data" in error ? error.data : undefined,
            }
          : { status: undefined, message: String(error), data: undefined };
      console.error("Failed to fetch users:", errorObj);
      throw error;
    }
  },

  // Get single user
  async get(id: string): Promise<User> {
    return (await pb.collection("users").getOne(id)) as unknown as User;
  },

  // Update user
  async update(id: string, data: Partial<User>): Promise<User> {
    // Get before state for audit log
    let beforeState: Record<string, unknown> | null = null;
    try {
      const existing = await pb.collection("users").getOne(id);
      beforeState = createEntitySnapshot(existing);
    } catch (error) {
      // If we can't get the before state, continue anyway
      console.warn("Could not fetch before state for audit log:", error);
    }

    const updatedUser = (await pb
      .collection("users")
      .update(id, data)) as unknown as User;

    // Log audit event
    await logAuditEvent(
      "update",
      "user",
      id,
      beforeState,
      createEntitySnapshot(updatedUser)
    );

    return updatedUser;
  },

  // Update current user profile (name, email)
  async updateProfile(data: { name?: string; email?: string }): Promise<User> {
    if (!pb.authStore.model) {
      throw new Error("User not authenticated");
    }
    return (await pb
      .collection("users")
      .update(pb.authStore.model.id, data)) as unknown as User;
  },

  // Update current user password
  async updatePassword(
    oldPassword: string,
    newPassword: string,
    passwordConfirm: string
  ): Promise<void> {
    if (!pb.authStore.model) {
      throw new Error("User not authenticated");
    }
    // First verify old password by attempting to re-authenticate
    try {
      await pb
        .collection("users")
        .authWithPassword(pb.authStore.model.email, oldPassword);
    } catch (error) {
      throw new Error("Current password is incorrect");
    }
    // Update password
    await pb.collection("users").update(pb.authStore.model.id, {
      password: newPassword,
      passwordConfirm: passwordConfirm,
    });
  },

  // Request password reset (sends email)
  async requestPasswordReset(email: string): Promise<void> {
    await pb.collection("users").requestPasswordReset(email);
  },

  // Delete user
  async delete(id: string): Promise<boolean> {
    // Get before state for audit log
    let beforeState: Record<string, unknown> | null = null;
    try {
      const existing = await pb.collection("users").getOne(id);
      beforeState = createEntitySnapshot(existing);
    } catch (error) {
      // If we can't get the before state, continue anyway
      console.warn("Could not fetch before state for audit log:", error);
    }

    await pb.collection("users").delete(id);

    // Log audit event
    await logAuditEvent("delete", "user", id, beforeState, null);

    return true;
  },
};
