import { create } from "zustand";
import { apiFetch } from "@/lib/api";

export type ResumeData = {
  filename: string;
  score: number;
  atsKeywords: number;
  projectImpact: number;
  interviewDepth: number;
  strengths: string[];
  weaknesses: string[];
  missingKeywords: string[];
  matchedKeywords: string[];
  bulletRewrites: { original: string; suggested: string; benefit: string }[];
};

export type ResumeListItem = {
  id: string;
  filename: string;
  score: number;
  uploadedAt: string;
  status: string;
};

interface ResumeState {
  resumes: ResumeListItem[];
  selectedResumeId: string | null;
  loadedReviewResumeId: string | null;
  activeReview: ResumeData | null;
  isUploading: boolean;
  isLoadingList: boolean;
  isLoadingReview: boolean;
  errorMsg: string | null;

  fetchResumes: (userId: string, selectNewId?: string, silent?: boolean) => Promise<void>;
  fetchReview: (resumeId: string) => Promise<void>;
  setSelectedResumeId: (id: string | null) => Promise<void>;
  uploadResume: (file: File, userId: string) => Promise<void>;
  deleteResume: (id: string, userId: string) => Promise<void>;
  clearError: () => void;
}

export const useResumeStore = create<ResumeState>((set, get) => ({
  resumes: [],
  selectedResumeId: null,
  loadedReviewResumeId: null,
  activeReview: null,
  isUploading: false,
  isLoadingList: false,
  isLoadingReview: false,
  errorMsg: null,

  fetchResumes: async (userId: string, selectNewId?: string, silent?: boolean) => {
    if (!silent) {
      set({ isLoadingList: true, errorMsg: null });
    }
    try {
      const data = await apiFetch<ResumeListItem[]>(`/api/resumes?userId=${userId}`);
      set({ resumes: data });
      
      if (data.length > 0) {
        const currentSelectedId = get().selectedResumeId;
        const targetId = selectNewId || (currentSelectedId && data.some(r => r.id === currentSelectedId) ? currentSelectedId : data[0].id);
        
        set({ selectedResumeId: targetId });
        
        const selectedResume = data.find(r => r.id === targetId);
        if (selectedResume && selectedResume.status === "COMPLETED") {
          if (get().loadedReviewResumeId !== targetId) {
            await get().fetchReview(targetId);
          }
        } else {
          set({ activeReview: null, loadedReviewResumeId: null });
        }
      } else {
        set({ selectedResumeId: null, loadedReviewResumeId: null, activeReview: null });
      }
    } catch (err: any) {
      console.error("Error fetching resumes in store:", err);
      if (!silent) {
        set({ errorMsg: "Failed to load resumes. Make sure the backend is running." });
      }
    } finally {
      if (!silent) {
        set({ isLoadingList: false });
      }
    }
  },

  fetchReview: async (resumeId: string) => {
    set({ isLoadingReview: true, errorMsg: null });
    try {
      const data = await apiFetch<ResumeData>(`/api/resumes/${resumeId}/review`);
      set({ activeReview: data, loadedReviewResumeId: resumeId });
    } catch (err: any) {
      console.error("Error fetching review in store:", err);
      set({ errorMsg: "Failed to load resume review details.", activeReview: null, loadedReviewResumeId: null });
    } finally {
      set({ isLoadingReview: false });
    }
  },

  setSelectedResumeId: async (id: string | null) => {
    set({ selectedResumeId: id });
    if (id) {
      const selectedResume = get().resumes.find(r => r.id === id);
      if (selectedResume && selectedResume.status === "COMPLETED") {
        await get().fetchReview(id);
      } else {
        set({ activeReview: null, loadedReviewResumeId: null });
      }
    } else {
      set({ activeReview: null, loadedReviewResumeId: null });
    }
  },

  uploadResume: async (file: File, userId: string) => {
    set({ isUploading: true, errorMsg: null });
    const formData = new FormData();
    formData.append("file", file);
    formData.append("userId", userId);

    try {
      const response = await apiFetch<{ id: string; filename: string }>(
        "/api/resumes/upload",
        {
          method: "POST",
          body: formData,
        }
      );
      await get().fetchResumes(userId, response.id);
    } catch (err: any) {
      console.error("Upload error in store:", err);
      set({ errorMsg: err.message || "File upload failed. Please try again." });
    } finally {
      set({ isUploading: false });
    }
  },

  deleteResume: async (id: string, userId: string) => {
    set({ errorMsg: null });
    try {
      await apiFetch(`/api/resumes/${id}`, {
        method: "DELETE",
      });
      
      const currentSelected = get().selectedResumeId;
      if (currentSelected === id) {
        const remaining = get().resumes.filter((r) => r.id !== id);
        if (remaining.length > 0) {
          set({ selectedResumeId: remaining[0].id });
        } else {
          set({ selectedResumeId: null, activeReview: null });
        }
      }
      await get().fetchResumes(userId);
    } catch (err: any) {
      console.error("Delete error in store:", err);
      set({ errorMsg: err.message || "Failed to delete resume. Please try again." });
    }
  },

  clearError: () => set({ errorMsg: null }),
}));
