import { create } from "zustand";
import { apiFetch } from "@/lib/api";

export type JobApplication = {
  id: string;
  company: string;
  role: string;
  status: "Saved" | "Applied" | "Phone Screen" | "Technical Round" | "Offer" | "Rejected";
  date: string;
  notes: string;
  resumeId: string | null;
  resumeFilename: string | null;
  jobDescriptionId: string | null;
  jobDescriptionTitle: string | null;
  matchScore: number | null;
};

interface JobTrackerState {
  applications: JobApplication[];
  isLoading: boolean;
  errorMsg: string | null;

  fetchApplications: (userId: string) => Promise<void>;
  addApplication: (
    userId: string,
    company: string,
    role: string,
    status: JobApplication["status"],
    date: string,
    notes: string,
    resumeId?: string | null,
    jobDescriptionId?: string | null
  ) => Promise<void>;
  updateApplication: (
    id: string,
    userId: string,
    updateData: {
      status?: JobApplication["status"];
      notes?: string;
      resumeId?: string | null;
      jobDescriptionId?: string | null;
      clearResume?: boolean;
      clearJobDescription?: boolean;
    }
  ) => Promise<void>;
  deleteApplication: (id: string, userId: string) => Promise<void>;
  clearError: () => void;
}

export const useJobTrackerStore = create<JobTrackerState>((set, get) => ({
  applications: [],
  isLoading: false,
  errorMsg: null,

  fetchApplications: async (userId: string) => {
    set({ isLoading: true, errorMsg: null });
    try {
      const data = await apiFetch<any[]>(`/api/applications?userId=${userId}`);
      const mapped: JobApplication[] = data.map(item => ({
        id: item.id,
        company: item.companyName,
        role: item.roleName,
        status: item.status,
        date: item.appliedDate || "",
        notes: item.notes || "",
        resumeId: item.resumeId || null,
        resumeFilename: item.resumeFilename || null,
        jobDescriptionId: item.jobDescriptionId || null,
        jobDescriptionTitle: item.jobDescriptionTitle || null,
        matchScore: item.matchScore || null
      }));
      set({ applications: mapped });
    } catch (err: any) {
      console.error("Error fetching applications:", err);
      set({ errorMsg: "Failed to load applications from database." });
    } finally {
      set({ isLoading: false });
    }
  },

  addApplication: async (
    userId: string,
    company: string,
    role: string,
    status: JobApplication["status"],
    date: string,
    notes: string,
    resumeId?: string | null,
    jobDescriptionId?: string | null
  ) => {
    set({ isLoading: true, errorMsg: null });
    try {
      await apiFetch("/api/applications", {
        method: "POST",
        bodyData: {
          userId,
          companyName: company,
          roleName: role,
          status,
          appliedDate: date,
          notes,
          resumeId: resumeId || null,
          jobDescriptionId: jobDescriptionId || null
        }
      });
      await get().fetchApplications(userId);
    } catch (err: any) {
      console.error("Error adding application:", err);
      set({ errorMsg: "Failed to create application entry." });
    } finally {
      set({ isLoading: false });
    }
  },

  updateApplication: async (
    id: string,
    userId: string,
    updateData: {
      status?: JobApplication["status"];
      notes?: string;
      resumeId?: string | null;
      jobDescriptionId?: string | null;
      clearResume?: boolean;
      clearJobDescription?: boolean;
    }
  ) => {
    try {
      await apiFetch(`/api/applications/${id}`, {
        method: "PUT",
        bodyData: {
          status: updateData.status,
          notes: updateData.notes,
          resumeId: updateData.resumeId,
          jobDescriptionId: updateData.jobDescriptionId,
          clearResume: updateData.clearResume,
          clearJobDescription: updateData.clearJobDescription
        }
      });
      await get().fetchApplications(userId);
    } catch (err: any) {
      console.error("Error updating application:", err);
      set({ errorMsg: "Failed to update application." });
    }
  },

  deleteApplication: async (id: string, userId: string) => {
    try {
      await apiFetch(`/api/applications/${id}`, {
        method: "DELETE"
      });
      await get().fetchApplications(userId);
    } catch (err: any) {
      console.error("Error deleting application:", err);
      set({ errorMsg: "Failed to delete application." });
    }
  },

  clearError: () => set({ errorMsg: null })
}));
