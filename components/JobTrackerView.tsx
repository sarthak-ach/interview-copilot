import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthContext";
import { useJobTrackerStore, type JobApplication } from "@/lib/jobTrackerStore";
import { useResumeStore } from "@/lib/resumeStore";
import { apiFetch } from "@/lib/api";
import {
  Briefcase,
  Plus,
  Trash2,
  Calendar,
  CheckCircle,
  FileText,
  Clock,
  ArrowRight,
  TrendingUp,
  X,
  Search,
  Globe,
  Loader2,
  Sparkles,
  Check,
  AlertCircle
} from "lucide-react";

const columns: { id: JobApplication["status"]; label: string; bg: string; text: string }[] = [
  { id: "Saved", label: "Saved", bg: "bg-shell/70", text: "text-ink/70" },
  { id: "Applied", label: "Applied", bg: "bg-sky/20", text: "text-sky-800" },
  { id: "Phone Screen", label: "Phone Screen", bg: "bg-gold/20", text: "text-amber-800" },
  { id: "Technical Round", label: "Technical Round", bg: "bg-coral/10", text: "text-coral" },
  { id: "Offer", label: "Offer", bg: "bg-mint", text: "text-moss" },
  { id: "Rejected", label: "Rejected", bg: "bg-ink/10", text: "text-ink/60" }
];

const mapDbJobToCard = (job: any) => {
  const parts = job.title.split(" - ");
  const company = parts[0] || "Company";
  const role = parts[1] || job.title;
  
  // Extract initial for logo
  const logoText = company.charAt(0);
  
  // Choose logo background color based on name hash
  const colors = [
    "bg-red-600", "bg-blue-600", "bg-green-600", "bg-yellow-600", 
    "bg-purple-600", "bg-pink-600", "bg-indigo-600", "bg-teal-600", "bg-black"
  ];
  const charCodeSum = company.split("").reduce((sum: number, char: string) => sum + char.charCodeAt(0), 0);
  const logoBg = colors[charCodeSum % colors.length];

  // Try to parse some skill tags from description
  const skillsList = ["React", "Spring Boot", "TypeScript", "Java", "Go", "Python", "Kubernetes", "Docker", "PostgreSQL", "Redis", "Kafka", "Next.js", "Vue.js", "Node.js", "Django"];
  const skills = skillsList.filter((s: string) => job.description.toLowerCase().includes(s.toLowerCase()));
  if (skills.length === 0) {
    skills.push("Software", "Engineering");
  }

  // Generate a random stable location and salary based on title length or character code
  const locations = ["Remote", "San Francisco, CA", "New York, NY", "Seattle, WA", "Austin, TX", "Chicago, IL"];
  const location = locations[charCodeSum % locations.length];
  
  const salaries = ["$110k - $140k", "$130k - $170k", "$160k - $200k", "$180k - $220k"];
  const salary = salaries[charCodeSum % salaries.length];

  return {
    ...job,
    company,
    role,
    logoBg,
    logoText,
    location,
    salary,
    skills,
    rawDescription: job.description
  };
};

export function JobTrackerView() {
  const { user } = useAuth();
  const {
    applications,
    isLoading: isStoreLoading,
    fetchApplications,
    addApplication,
    updateApplication,
    deleteApplication
  } = useJobTrackerStore();

  const { resumes, fetchResumes } = useResumeStore();

  // Navigation tab
  const [activeSubTab, setActiveSubTab] = useState<"board" | "linkedin">("board");

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCompany, setNewCompany] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newStatus, setNewStatus] = useState<JobApplication["status"]>("Saved");
  const [newDate, setNewDate] = useState(new Date().toISOString().split("T")[0]);
  const [newNotes, setNewNotes] = useState("");
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");
  const [selectedJdId, setSelectedJdId] = useState<string>("");
  const [savedJDs, setSavedJDs] = useState<any[]>([]);

  // Detailed Modal state
  const [selectedApp, setSelectedApp] = useState<JobApplication | null>(null);

  // LinkedIn Search states
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addedJobIds, setAddedJobIds] = useState<Record<string, boolean>>({});

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const jobsPerPage = 8;

  // LinkedIn Match & Track Wizard state
  const [showMatchWizard, setShowMatchWizard] = useState(false);
  const [wizardJob, setWizardJob] = useState<any | null>(null);
  const [wizardResumeId, setWizardResumeId] = useState("");
  const [isMatching, setIsMatching] = useState(false);

  // Fetch initial data
  useEffect(() => {
    if (user?.id) {
      fetchApplications(user.id);
      fetchResumes(user.id);
      fetchSavedJDs();
    }
  }, [user?.id]);

  const fetchSavedJDs = async () => {
    if (!user?.id) return;
    try {
      const jds = await apiFetch<any[]>(`/api/jobs/descriptions?userId=${user.id}`);
      setSavedJDs(jds);
    } catch (e) {
      console.error("Failed to load job descriptions:", e);
    }
  };

  const fetchLinkedInPage = async (pageNumber: number, searchKeyword: string) => {
    if (!user?.id) return;
    setIsSearching(true);
    try {
      const response = await apiFetch<any>(
        `/api/jobs/descriptions?userId=${user.id}&keyword=${encodeURIComponent(searchKeyword)}&page=${pageNumber - 1}&size=${jobsPerPage}`
      );
      if (response && response.content) {
        setSearchResults(response.content.map(mapDbJobToCard));
        setTotalPages(response.totalPages || 1);
        setTotalElements(response.totalElements || 0);
      } else {
        setSearchResults([]);
        setTotalPages(1);
        setTotalElements(0);
      }
    } catch (e) {
      console.error("Failed to load paginated jobs:", e);
      setSearchResults([]);
      setTotalPages(1);
      setTotalElements(0);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === "linkedin" && user?.id) {
      setCurrentPage(1);
      fetchLinkedInPage(1, keyword);
    }
  }, [activeSubTab, user?.id]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    fetchLinkedInPage(newPage, keyword);
  };

  const handleAddApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !newCompany.trim() || !newRole.trim()) return;

    await addApplication(
      user.id,
      newCompany.trim(),
      newRole.trim(),
      newStatus,
      newDate,
      newNotes.trim(),
      selectedResumeId || null,
      selectedJdId || null
    );

    // Reset states
    setNewCompany("");
    setNewRole("");
    setNewStatus("Saved");
    setNewNotes("");
    setSelectedResumeId("");
    setSelectedJdId("");
    setShowAddForm(false);
  };

  const handleDelete = async (id: string) => {
    if (!user?.id) return;
    await deleteApplication(id, user.id);
  };

  const handleMoveStatus = async (id: string, targetStatus: JobApplication["status"]) => {
    if (!user?.id) return;
    await updateApplication(id, user.id, { status: targetStatus });
  };

  const handleUpdateNotes = async (id: string, notesText: string) => {
    if (!user?.id) return;
    await updateApplication(id, user.id, { notes: notesText });
  };

  // LinkedIn search action
  const handleLinkedInSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchLinkedInPage(1, keyword);
  };

  // Direct track from LinkedIn
  const handleDirectTrack = async (job: any, index: number) => {
    if (!user?.id) return;
    setIsSearching(true);
    try {
      let jdId = job.id;
      if (!jdId) {
        const jd = await apiFetch("/api/jobs/descriptions", {
          method: "POST",
          bodyData: {
            userId: user.id,
            title: `${job.company} - ${job.role}`,
            description: job.description
          }
        });
        jdId = jd.id;
      }

      // 2. Track on the board
      await addApplication(
        user.id,
        job.company,
        job.role,
        "Saved",
        new Date().toISOString().split("T")[0],
        `Salary: ${job.salary}\nLocation: ${job.location}\nSkills: ${job.skills.join(", ")}\n\n${job.description}`,
        null,
        jdId
      );

      setAddedJobIds((prev) => ({ ...prev, [job.id]: true }));
      fetchSavedJDs();
    } catch (e) {
      console.error("Failed to track LinkedIn job:", e);
    } finally {
      setIsSearching(false);
    }
  };

  // Open matching wizard
  const openMatchWizard = (job: any) => {
    setWizardJob(job);
    if (resumes.length > 0) {
      setWizardResumeId(resumes[0].id);
    } else {
      setWizardResumeId("");
    }
    setShowMatchWizard(true);
  };

  // Run match and save application
  const handleMatchAndTrack = async () => {
    if (!user?.id || !wizardJob || !wizardResumeId) return;
    setIsMatching(true);

    try {
      let jdId = wizardJob.id;
      if (!jdId) {
        // Save Job Description to database
        const jd = await apiFetch("/api/jobs/descriptions", {
          method: "POST",
          bodyData: {
            userId: user.id,
            title: `${wizardJob.company} - ${wizardJob.role}`,
            description: wizardJob.description
          }
        });
        jdId = jd.id;
      }

      // 2. Perform AI Match Analysis
      await apiFetch("/api/jobs/matches", {
        method: "POST",
        bodyData: {
          resumeId: wizardResumeId,
          jobDescriptionId: jdId
        }
      });

      // 3. Save application linked to resume and job description (this will auto-copy the matchScore)
      await addApplication(
        user.id,
        wizardJob.company,
        wizardJob.role,
        "Saved",
        new Date().toISOString().split("T")[0],
        `Salary: ${wizardJob.salary}\nLocation: ${wizardJob.location}\n\n${wizardJob.description}`,
        wizardResumeId,
        jdId
      );

      setAddedJobIds((prev) => ({ ...prev, [wizardJob.id]: true }));
      setShowMatchWizard(false);
      setWizardJob(null);
      setWizardResumeId("");
      fetchSavedJDs();
      setActiveSubTab("board"); // Switch back to see the new card
    } catch (e) {
      console.error("Match and track operation failed:", e);
    } finally {
      setIsMatching(false);
    }
  };

  // Paginated job lists
  const currentJobs = searchResults;

  return (
    <div className="space-y-6">
      {/* Top Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xl border border-line bg-panel p-4 shadow-soft">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-lg bg-mint text-moss">
            <Briefcase size={20} />
          </div>
          <div>
            <h4 className="text-lg font-bold text-ink">Job Application Center</h4>
            <p className="text-xs text-ink/60">Track pipelines and sync resumes/job matches.</p>
          </div>
        </div>

        {/* Sub tab navigation */}
        <div className="flex gap-1.5 bg-shell/55 p-1 rounded-lg border border-line">
          <button
            onClick={() => setActiveSubTab("board")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
              activeSubTab === "board"
                ? "bg-panel text-ink shadow-soft"
                : "text-ink/65 hover:text-ink"
            }`}
          >
            Pipeline Board
          </button>
          <button
            onClick={() => setActiveSubTab("linkedin")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
              activeSubTab === "linkedin"
                ? "bg-panel text-ink shadow-soft"
                : "text-ink/65 hover:text-ink"
            }`}
          >
            LinkedIn Job Finder
          </button>
        </div>
      </div>

      {activeSubTab === "board" ? (
        <>
          {/* Controls Bar */}
          <div className="flex items-center justify-between gap-4 rounded-xl border border-line bg-panel px-4 py-3 shadow-soft">
            <p className="text-xs font-semibold text-ink/60">
              Click a card to edit notes, link resumes, or update details in a detailed view.
            </p>
            <button
              onClick={() => {
                setNewDate(new Date().toISOString().split("T")[0]);
                setShowAddForm(true);
              }}
              className="flex h-9 items-center justify-center gap-1.5 rounded-lg bg-ink px-4 text-xs font-semibold text-shell hover:bg-moss transition cursor-pointer"
              type="button"
            >
              <Plus size={15} />
              Add Custom Job
            </button>
          </div>

          {/* Add Job Dialog Popup */}
          {showAddForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
              <div className="w-full max-w-md rounded-xl border border-line bg-panel p-6 shadow-soft animate-scaleUp">
                <div className="flex items-center justify-between border-b border-line pb-3 mb-4">
                  <h5 className="font-bold text-ink text-sm flex items-center gap-2">
                    <Briefcase size={16} /> Track New Application
                  </h5>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="text-ink/50 hover:text-ink cursor-pointer"
                    type="button"
                    aria-label="Close"
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleAddApplication} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-ink/70">Company Name</label>
                      <input
                        required
                        className="w-full h-10 rounded-lg border border-line bg-shell/45 px-3 text-xs outline-none focus:border-moss"
                        placeholder="e.g. Amazon"
                        value={newCompany}
                        onChange={(e) => setNewCompany(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-ink/70">Role / Title</label>
                      <input
                        required
                        className="w-full h-10 rounded-lg border border-line bg-shell/45 px-3 text-xs outline-none focus:border-moss"
                        placeholder="e.g. Backend Dev"
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-ink/70">Current Stage</label>
                      <select
                        className="w-full h-10 rounded-lg border border-line bg-panel px-2 text-xs font-semibold outline-none"
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value as any)}
                      >
                        {columns.map((col) => (
                          <option key={col.id} value={col.id}>
                            {col.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-ink/70">Date Applied</label>
                      <input
                        type="date"
                        className="w-full h-10 rounded-lg border border-line bg-shell/45 px-3 text-xs outline-none"
                        value={newDate}
                        onChange={(e) => setNewDate(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Linking Sections */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-ink/70">Link Resume</label>
                      <select
                        className="w-full h-10 rounded-lg border border-line bg-panel px-2 text-xs outline-none"
                        value={selectedResumeId}
                        onChange={(e) => setSelectedResumeId(e.target.value)}
                      >
                        <option value="">-- Optional --</option>
                        {resumes.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.filename}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-ink/70">Link Job Match</label>
                      <select
                        className="w-full h-10 rounded-lg border border-line bg-panel px-2 text-xs outline-none"
                        value={selectedJdId}
                        onChange={(e) => setSelectedJdId(e.target.value)}
                      >
                        <option value="">-- Optional --</option>
                        {savedJDs.map((jd) => (
                          <option key={jd.id} value={jd.id}>
                            {jd.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-ink/70">Notes / Details</label>
                    <textarea
                      className="w-full h-20 rounded-lg border border-line bg-shell/25 p-3 text-xs outline-none focus:border-moss"
                      placeholder="Review material, target deadlines..."
                      value={newNotes}
                      onChange={(e) => setNewNotes(e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full h-10 items-center justify-center rounded-lg bg-ink text-shell text-xs font-semibold hover:bg-moss transition cursor-pointer"
                  >
                    Create Application Entry
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Kanban Board Container with horizontal scroll */}
          <div className="flex gap-4 overflow-x-auto pb-4 pt-1 select-none scrollbar-thin">
            {columns.map((col) => {
              const colApps = applications.filter((app) => app.status === col.id);
              return (
                <div
                  key={col.id}
                  className="rounded-xl border border-line bg-panel p-3 shadow-soft flex flex-col min-w-[260px] md:min-w-[280px] max-w-[320px] flex-1 min-h-[500px] overflow-hidden shrink-0"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-line pb-2 mb-3">
                    <span className="text-xs font-bold text-ink/80">{col.label}</span>
                    <span className="rounded-full bg-shell border border-line/60 px-2 py-0.5 text-[10px] font-bold text-ink/70">
                      {colApps.length}
                    </span>
                  </div>

                  {/* Cards wrapper */}
                  <div className="flex-1 space-y-3 overflow-y-auto overflow-x-hidden max-h-[550px] pr-0.5 scrollbar-thin">
                    {isStoreLoading && colApps.length === 0 ? (
                      <div className="flex justify-center py-10">
                        <Loader2 className="animate-spin text-ink/20" size={18} />
                      </div>
                    ) : colApps.length === 0 ? (
                      <div className="text-center py-12 text-[10px] text-ink/30 italic">No apps</div>
                    ) : (
                      colApps.map((app) => (
                        <div
                          key={app.id}
                          onClick={() => setSelectedApp(app)}
                          className={`rounded-lg border border-line/75 p-3 ${col.bg} transition-all hover:shadow-md hover:scale-[1.01] space-y-2.5 relative group cursor-pointer overflow-hidden`}
                        >
                          {/* Delete Card Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(app.id);
                            }}
                            className="absolute right-2 top-2 size-6 place-items-center rounded bg-panel border border-line/45 text-coral/80 hover:text-coral hover:bg-shell hidden group-hover:grid cursor-pointer z-10"
                            type="button"
                            title="Delete Card"
                          >
                            <Trash2 size={11} />
                          </button>

                          <div>
                            <div className="flex items-start justify-between gap-1">
                              <p className="font-bold text-ink text-xs truncate max-w-[70%]">
                                {app.company}
                              </p>
                              {/* Match Score Badge */}
                              {app.matchScore !== null && (
                                <span
                                  className={`px-1.5 py-0.5 text-[9px] font-black rounded-md flex items-center gap-0.5 shrink-0 select-none ${
                                    app.matchScore >= 80
                                      ? "bg-mint text-moss border border-moss/10"
                                      : app.matchScore >= 60
                                      ? "bg-amber-100 text-amber-800 border border-amber-300/10"
                                      : "bg-red-50 text-red-700 border border-red-200/10"
                                  }`}
                                  title={`Linked Score: ${app.matchScore}% Compatibility`}
                                >
                                  <Sparkles size={8} />
                                  {app.matchScore}%
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-ink/65 font-medium truncate mt-0.5">
                              {app.role}
                            </p>
                          </div>

                          {/* Link Indicators */}
                          {(app.resumeFilename || app.jobDescriptionTitle) && (
                            <div className="space-y-0.5 border-t border-line/25 pt-1.5">
                              {app.resumeFilename && (
                                <div
                                  className="flex items-center gap-1 text-[8px] text-ink/50 truncate"
                                  title={`Linked: ${app.resumeFilename}`}
                                >
                                  <FileText size={8} className="shrink-0" />
                                  <span className="truncate">{app.resumeFilename}</span>
                                </div>
                              )}
                              {app.jobDescriptionTitle && (
                                <div
                                  className="flex items-center gap-1 text-[8px] text-ink/50 truncate"
                                  title={`Linked: ${app.jobDescriptionTitle}`}
                                >
                                  <Globe size={8} className="shrink-0" />
                                  <span className="truncate">{app.jobDescriptionTitle}</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Notes Preview Paragraph */}
                          {app.notes ? (
                            <p className="text-[10px] text-ink/65 line-clamp-2 bg-shell/30 rounded p-1.5 italic leading-snug overflow-hidden">
                              {app.notes}
                            </p>
                          ) : (
                            <p className="text-[9px] text-ink/40 italic">Click to add notes...</p>
                          )}

                          {/* Footer Actions */}
                          <div className="flex items-center justify-between gap-1.5 pt-1.5 border-t border-line/35">
                            <div className="flex items-center gap-1 text-[9px] text-ink/50">
                              <Calendar size={10} />
                              <span>{app.date.split("-").slice(1).join("/")}</span>
                            </div>

                            {/* Quick Shift selector */}
                            <select
                              className="h-5 rounded bg-panel border border-line text-[9px] outline-none font-semibold px-1 text-ink/70 max-w-[85px] truncate"
                              value={app.status}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleMoveStatus(app.id, e.target.value as any);
                              }}
                            >
                              <option value={app.status}>Move To...</option>
                              {columns
                                .filter((c) => c.id !== app.status)
                                .map((c) => (
                                  <option key={c.id} value={c.id}>
                                    {c.label}
                                  </option>
                                ))}
                            </select>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        /* LinkedIn Job Finder Panel */
        <div className="space-y-6">
          {/* LinkedIn Search Bar */}
          <form
            onSubmit={handleLinkedInSearch}
            className="flex flex-col sm:flex-row gap-3 rounded-xl border border-line bg-panel p-4 shadow-soft"
          >
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 text-ink/40" size={16} />
              <input
                className="w-full h-10 rounded-lg border border-line bg-shell/45 pl-9 pr-3 text-xs outline-none focus:border-moss"
                placeholder="Job Title, skill, or keywords (e.g. React, Java, Backend)..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-60 relative">
              <Globe className="absolute left-3 top-3 text-ink/40" size={16} />
              <input
                className="w-full h-10 rounded-lg border border-line bg-shell/45 pl-9 pr-3 text-xs outline-none focus:border-moss"
                placeholder="City, state, or Remote..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="h-10 px-5 rounded-lg bg-ink text-shell font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-moss transition cursor-pointer"
            >
              {isSearching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
              Search Jobs
            </button>
          </form>

          {/* Search Results */}
          <div className="grid gap-4 md:grid-cols-2">
            {currentJobs.length === 0 ? (
              <div className="col-span-2 text-center py-16 border border-line bg-panel rounded-xl">
                <AlertCircle className="mx-auto text-ink/20 mb-3" size={32} />
                <h5 className="text-sm font-bold text-ink">No Job Listings Found</h5>
                <p className="text-xs text-ink/60 mt-1">
                  Try adjusting keywords or clearing search inputs to find active openings.
                </p>
              </div>
            ) : (
              currentJobs.map((job) => {
                const isTracked = addedJobIds[job.id] || applications.some((app) => app.jobDescriptionId === job.id);
                return (
                  <div
                    key={job.id}
                    className="rounded-xl border border-line bg-panel p-5 shadow-soft hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div className="space-y-3.5">
                      {/* Top Meta Info */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div
                            className={`size-10 rounded-lg grid place-items-center font-bold text-shell select-none ${job.logoBg}`}
                          >
                            {job.logoText}
                          </div>
                          <div>
                            <h5 className="font-bold text-ink text-sm leading-tight">{job.role}</h5>
                            <p className="text-[11px] text-ink/75 font-semibold mt-0.5">
                              {job.company}
                            </p>
                            <p className="text-[10px] text-ink/55 mt-0.5">{job.location}</p>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-moss/10 text-moss text-[10px] font-bold select-none shrink-0">
                          {job.salary}
                        </span>
                      </div>

                      {/* Description excerpt */}
                      <p className="text-xs text-ink/70 leading-relaxed font-sans line-clamp-3">
                        {job.description}
                      </p>

                      {/* Skill Tags */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {job.skills.map((s: string) => (
                          <span
                            key={s}
                            className="px-2 py-0.5 rounded-full border border-line bg-shell text-[9px] font-semibold text-ink/75"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Actions footer */}
                    <div className="flex items-center gap-2 border-t border-line/35 pt-4 mt-5">
                      {isTracked ? (
                        <div className="flex-1 flex items-center justify-center h-9 gap-1 text-[11px] font-bold text-moss bg-mint rounded-lg border border-moss/15">
                          <Check size={14} /> Added to Board
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => handleDirectTrack(job, 0)}
                            disabled={isSearching}
                            className="flex-1 h-9 rounded-lg border border-line bg-shell/35 text-ink text-xs font-semibold hover:bg-shell transition flex items-center justify-center gap-1 cursor-pointer"
                          >
                            Track Job
                          </button>
                          <button
                            onClick={() => openMatchWizard(job)}
                            disabled={isSearching}
                            className="flex-1 h-9 rounded-lg bg-ink text-shell text-xs font-semibold hover:bg-moss transition flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Sparkles size={12} />
                            Match & Track
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-4 border-t border-line/30">
              <button
                onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 h-8 text-xs font-semibold rounded-lg border border-line hover:bg-shell disabled:opacity-40 transition cursor-pointer"
              >
                Previous
              </button>
              <span className="text-xs font-semibold text-ink/70">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 h-8 text-xs font-semibold rounded-lg border border-line hover:bg-shell disabled:opacity-40 transition cursor-pointer"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Application Details Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-line bg-panel p-6 shadow-soft animate-scaleUp space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h5 className="font-bold text-ink text-sm flex items-center gap-2">
                <Briefcase size={16} /> Application Details
              </h5>
              <button
                onClick={() => setSelectedApp(null)}
                className="text-ink/50 hover:text-ink cursor-pointer"
                type="button"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase text-ink/60">Company</label>
                  <p className="text-xs font-bold mt-0.5">{selectedApp.company}</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-ink/60">Role</label>
                  <p className="text-xs font-bold mt-0.5">{selectedApp.role}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-ink/70">Stage</label>
                  <select
                    className="w-full h-10 rounded-lg border border-line bg-panel px-2 text-xs font-semibold outline-none"
                    value={selectedApp.status}
                    onChange={(e) => {
                      const newStatus = e.target.value as any;
                      handleMoveStatus(selectedApp.id, newStatus).then(() => {
                        setSelectedApp((prev) => (prev ? { ...prev, status: newStatus } : null));
                      });
                    }}
                  >
                    {columns.map((col) => (
                      <option key={col.id} value={col.id}>
                        {col.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-ink/70">Applied Date</label>
                  <input
                    type="date"
                    className="w-full h-10 rounded-lg border border-line bg-shell/45 px-3 text-xs outline-none"
                    value={selectedApp.date}
                    onChange={(e) => {
                      const newDate = e.target.value;
                      updateApplication(selectedApp.id, user?.id || "", {
                        status: selectedApp.status,
                        notes: selectedApp.notes
                      } /* standard call */).then(() => {
                        // Backend gets date as appliedDate when created, update allows passing date
                        setSelectedApp((prev) => (prev ? { ...prev, date: newDate } : null));
                      });
                    }}
                  />
                </div>
              </div>

              {/* Linking Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-ink/70">Linked Resume</label>
                  <select
                    className="w-full h-10 rounded-lg border border-line bg-panel px-2 text-xs outline-none"
                    value={selectedApp.resumeId || ""}
                    onChange={(e) => {
                      const resId = e.target.value;
                      updateApplication(selectedApp.id, user?.id || "", {
                        resumeId: resId || null,
                        clearResume: !resId
                      }).then(() => {
                        setSelectedApp((prev) =>
                          prev
                            ? {
                                ...prev,
                                resumeId: resId || null,
                                resumeFilename: resumes.find((r) => r.id === resId)?.filename || null
                              }
                            : null
                        );
                      });
                    }}
                  >
                    <option value="">-- None --</option>
                    {resumes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.filename}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-ink/70">Linked Job Match</label>
                  <select
                    className="w-full h-10 rounded-lg border border-line bg-panel px-2 text-xs outline-none"
                    value={selectedApp.jobDescriptionId || ""}
                    onChange={(e) => {
                      const jdId = e.target.value;
                      updateApplication(selectedApp.id, user?.id || "", {
                        jobDescriptionId: jdId || null,
                        clearJobDescription: !jdId
                      }).then(() => {
                        setSelectedApp((prev) =>
                          prev
                            ? {
                                ...prev,
                                jobDescriptionId: jdId || null,
                                jobDescriptionTitle: savedJDs.find((jd) => jd.id === jdId)?.title || null
                              }
                            : null
                        );
                      });
                    }}
                  >
                    <option value="">-- None --</option>
                    {savedJDs.map((jd) => (
                      <option key={jd.id} value={jd.id}>
                        {jd.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-ink/70">
                  Notes & Details
                </label>
                <textarea
                  className="w-full h-28 rounded-lg border border-line bg-shell/25 p-3 text-xs outline-none focus:border-moss"
                  placeholder="Interview prep, recruiter info, dates..."
                  value={selectedApp.notes}
                  onChange={(e) => {
                    const txt = e.target.value;
                    setSelectedApp((prev) => (prev ? { ...prev, notes: txt } : null));
                    handleUpdateNotes(selectedApp.id, txt);
                  }}
                />
              </div>
            </div>

            <div className="flex justify-between border-t border-line pt-3 mt-4">
              <button
                onClick={() => {
                  handleDelete(selectedApp.id);
                  setSelectedApp(null);
                }}
                className="h-10 px-4 rounded-lg border border-coral text-coral hover:bg-coral/10 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 size={14} /> Delete Position
              </button>
              <button
                onClick={() => setSelectedApp(null)}
                className="h-10 px-5 rounded-lg bg-ink text-shell text-xs font-semibold hover:bg-moss cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LinkedIn Match & Track Wizard Dialog */}
      {showMatchWizard && wizardJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-line bg-panel p-6 shadow-soft animate-scaleUp">
            <div className="flex items-center justify-between border-b border-line pb-3 mb-4">
              <h5 className="font-bold text-ink text-sm flex items-center gap-2">
                <Sparkles size={16} className="text-moss" /> Match & Track Position
              </h5>
              <button
                onClick={() => setShowMatchWizard(false)}
                className="text-ink/50 hover:text-ink cursor-pointer"
                type="button"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-shell/55 p-3 rounded-lg border border-line/60">
                <p className="text-[10px] font-bold uppercase tracking-wider text-moss">Target Job</p>
                <p className="text-xs font-bold text-ink mt-1">
                  {wizardJob.role} at {wizardJob.company}
                </p>
                <p className="text-[10px] text-ink/60 mt-0.5">{wizardJob.location}</p>
              </div>

              {resumes.length === 0 ? (
                <div className="text-center py-6">
                  <AlertCircle className="mx-auto text-coral/80 mb-2" size={24} />
                  <p className="text-xs font-bold text-ink">No resumes found</p>
                  <p className="text-[10px] text-ink/60 mt-1">
                    Please upload a resume under the Resume Analyzer tab before running compatibility matching.
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-ink/70">
                      Select Resume for Analysis
                    </label>
                    <select
                      className="w-full h-10 rounded-lg border border-line bg-panel px-3 text-xs font-semibold outline-none"
                      value={wizardResumeId}
                      onChange={(e) => setWizardResumeId(e.target.value)}
                    >
                      {resumes.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.filename}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handleMatchAndTrack}
                    disabled={isMatching || !wizardResumeId}
                    className="w-full h-10 rounded-lg bg-ink text-shell text-xs font-semibold hover:bg-moss transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {isMatching ? (
                      <>
                        <Loader2 className="animate-spin" size={14} />
                        Calculating AI Match Score...
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} /> Run Analysis & Add to Board
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
