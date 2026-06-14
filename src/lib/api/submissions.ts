import { apiFetch } from "../api-client";
import type { Submission } from "@/types";
import { sanitizeError } from "../error-handler";
import { validateImageFile } from "../pocketbase-images";

export const submissionsApi = {
  async list(
    status?: "pending" | "approved" | "rejected"
  ): Promise<Submission[]> {
    try {
      const q = status ? `?status=${status}` : "";
      const res = await apiFetch<{ items: Submission[] }>(
        `/submissions${q}`
      );
      return res.items;
    } catch (error: unknown) {
      throw new Error(sanitizeError(error));
    }
  },

  async listMySubmissions(
    status?: "pending" | "approved" | "rejected"
  ): Promise<Submission[]> {
    const q = status ? `?status=${status}` : "";
    const res = await apiFetch<{ items: Submission[] }>(
      `/submissions/mine${q}`
    );
    return res.items;
  },

  async get(id: string): Promise<Submission> {
    const res = await apiFetch<{ record: Submission }>(`/submissions/${id}`);
    return res.record;
  },

  async create(
    data: Partial<Submission> & { imageFile?: File }
  ): Promise<Submission> {
    const { imageFile, ...submissionData } = data;
    if (imageFile) {
      const validationError = validateImageFile(imageFile);
      if (validationError) throw new Error(validationError);
    }

    const form = new FormData();
    if (submissionData.type) form.append("type", submissionData.type);
    if (submissionData.mosque_id) {
      form.append("mosque_id", submissionData.mosque_id);
    }
    form.append("data", JSON.stringify(submissionData.data ?? {}));
    if (imageFile) form.append("image", imageFile, imageFile.name);

    const res = await apiFetch<{ record: Submission }>("/submissions", {
      method: "POST",
      body: form,
    });
    return res.record;
  },

  async update(): Promise<Submission> {
    throw new Error("Direct submission update not supported");
  },

  async approve(id: string, _reviewedBy: string): Promise<Submission> {
    const res = await apiFetch<{ record: Submission }>(
      `/submissions/${id}/approve`,
      { method: "POST", body: JSON.stringify({}) }
    );
    return res.record;
  },

  async reject(
    id: string,
    _reviewedBy: string,
    reason: string
  ): Promise<Submission> {
    const res = await apiFetch<{ record: Submission }>(
      `/submissions/${id}/reject`,
      { method: "POST", body: JSON.stringify({ reason }) }
    );
    return res.record;
  },
};