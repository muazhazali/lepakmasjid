import { useEffect } from "react";
import { pb } from "@/lib/pocketbase";

export const usePocketBase = () => {
  useEffect(() => {
    // Ensure auth state is synced
    const authData = localStorage.getItem("pocketbase_auth");
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        pb.authStore.save(parsed.token, parsed.model);
      } catch (e) {
        localStorage.removeItem("pocketbase_auth");
      }
    }
  }, []);

  return pb;
};
