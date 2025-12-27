import { pb } from '../pocketbase';
import type { User } from '@/types';

export const usersApi = {
  // List users (admin only)
  async list(): Promise<User[]> {
    try {
      // Fetch all users using pagination to avoid 400 errors
      const allItems: any[] = [];
      let page = 1;
      const perPage = 100; // Reasonable page size
      let hasMore = true;
      
      while (hasMore) {
        // Try with sort first, fallback without sort if it fails
        let result;
        try {
          result = await pb.collection('users').getList(page, perPage, {
            sort: '-created',
          });
        } catch (sortError: any) {
          // If sort fails, try without sort
          console.warn('Sort failed, trying without sort:', sortError);
          result = await pb.collection('users').getList(page, perPage);
        }
        
        allItems.push(...result.items);
        
        // Check if there are more pages
        hasMore = result.page < result.totalPages;
        page++;
      }
      
      // Sort client-side if server-side sort failed
      if (allItems.length > 0 && allItems[0].created) {
        allItems.sort((a, b) => {
          const aDate = new Date(a.created || 0).getTime();
          const bDate = new Date(b.created || 0).getTime();
          return bDate - aDate; // Newest first
        });
      }
      
      return allItems as unknown as User[];
    } catch (error: any) {
      console.error('Failed to fetch users:', {
        status: error.status,
        message: error.message,
        data: error.data,
      });
      throw error;
    }
  },

  // Get single user
  async get(id: string): Promise<User> {
    return await pb.collection('users').getOne(id) as unknown as User;
  },

  // Update user
  async update(id: string, data: Partial<User>): Promise<User> {
    return await pb.collection('users').update(id, data) as unknown as User;
  },

  // Update current user profile (name, email)
  async updateProfile(data: { name?: string; email?: string }): Promise<User> {
    if (!pb.authStore.model) {
      throw new Error('User not authenticated');
    }
    return await pb.collection('users').update(pb.authStore.model.id, data) as unknown as User;
  },

  // Update current user password
  async updatePassword(oldPassword: string, newPassword: string, passwordConfirm: string): Promise<void> {
    if (!pb.authStore.model) {
      throw new Error('User not authenticated');
    }
    // First verify old password by attempting to re-authenticate
    try {
      await pb.collection('users').authWithPassword(pb.authStore.model.email, oldPassword);
    } catch (error) {
      throw new Error('Current password is incorrect');
    }
    // Update password
    await pb.collection('users').update(pb.authStore.model.id, {
      password: newPassword,
      passwordConfirm: passwordConfirm,
    });
  },

  // Request password reset (sends email)
  async requestPasswordReset(email: string): Promise<void> {
    await pb.collection('users').requestPasswordReset(email);
  },

  // Delete user
  async delete(id: string): Promise<boolean> {
    await pb.collection('users').delete(id);
    return true;
  },
};

