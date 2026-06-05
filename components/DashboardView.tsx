import React, { useEffect, useState } from "react";
import {
  FileText,
  Mic,
  Network,
  Briefcase,
  TrendingUp,
  Award,
  Sparkles,
  ArrowRight,
  Loader2
} from "lucide-react";
import { DashboardCards } from "./DashboardCards";
import { useAuth } from "./AuthContext";
import { useResumeStore } from "@/lib/resumeStore";
import { apiFetch } from "@/lib/api";

type DashboardViewProps = {
  onNavigate: (tab: string) => void;
};

export function DashboardView({ onNavigate }: DashboardViewProps) {
  const { user } = useAuth();
  const {
    resumes,
    activeReview,
    isLoadingList,
    isLoadingReview,
    fetchResumes
  } = useResumeStore();

  const [stats, setStats] = useState<any>(null);
  const [isLoadingStats, setIsLoadingStats] = useState<boolean>(true);

  const fetchDashboardStats = async () => {
    try {
      setIsLoadingStats(true);
      const data = await apiFetch<any>("/api/dashboard/stats");
      setStats(data);
    } catch (e) {
      console.error("Failed to load dashboard stats:", e);
    } finally {
      setIsLoadingStats(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchResumes(user.id);
      fetchDashboardStats();
    }
  }, [user?.id]);

  const getATSScoreCategory = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Needs Work";
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-xl border border-line bg-gradient-to-r from-mint via-panel to-shell p-6 shadow-soft">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-lg bg-moss/10 px-3 py-1 text-xs font-semibold text-moss">
              <Sparkles size={14} className="animate-pulse text-moss" />
              Welcome back, {user?.fullName || "Candidate"}
            </div>
            <h3 className="mt-3 text-2xl font-bold text-ink">Ready to ace your next technical round?</h3>
            <p className="mt-1 text-sm text-ink/70 max-w-xl">
              Optimize your resume, benchmark against real JDs, and perform interactive mock interviews using our AI modules.
            </p>
          </div>
          <button
            onClick={() => onNavigate("Mock Interview")}
            className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-ink px-5 text-sm font-semibold text-shell transition hover:bg-moss hover:scale-[1.02]"
            type="button"
          >
            Start Practice
            <ArrowRight size={16} />
          </button>
        </div>
        <div className="absolute right-0 top-0 -mr-6 -mt-6 size-32 rounded-full bg-mint/50 blur-3xl"></div>
      </div>

      {/* Primary Analytics Grid */}
      <DashboardCards stats={stats} />

      {/* Main Content Splitting */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Resume Audit Summary */}
        {isLoadingList || isLoadingReview ? (
          <div className="rounded-xl border border-line bg-panel p-5 shadow-soft hover:shadow-md transition">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div className="flex items-center gap-2">
                <div className="grid size-9 place-items-center rounded-lg bg-sky/20 text-sky">
                  <FileText size={18} className="text-ink" />
                </div>
                <div>
                  <h4 className="font-semibold text-ink">Resume Audit Summary</h4>
                  <p className="text-xs text-ink/60">Loading...</p>
                </div>
              </div>
              <button
                onClick={() => onNavigate("Resume Analyzer")}
                className="text-xs font-semibold text-moss hover:underline flex items-center gap-1"
                type="button"
              >
                Analyze
                <ArrowRight size={12} />
              </button>
            </div>
            <div className="mt-5 flex flex-col items-center justify-center py-8">
              <Loader2 className="size-8 animate-spin text-moss" />
              <p className="text-xs text-ink/50 mt-2">Retrieving resume profile...</p>
            </div>
          </div>
        ) : resumes.length === 0 || !activeReview ? (
          <div className="rounded-xl border border-line bg-panel p-5 shadow-soft hover:shadow-md transition">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div className="flex items-center gap-2">
                <div className="grid size-9 place-items-center rounded-lg bg-sky/20 text-sky">
                  <FileText size={18} className="text-ink" />
                </div>
                <div>
                  <h4 className="font-semibold text-ink">Resume Audit Summary</h4>
                  <p className="text-xs text-ink/60">No resume analyzed yet</p>
                </div>
              </div>
              <button
                onClick={() => onNavigate("Resume Analyzer")}
                className="text-xs font-semibold text-moss hover:underline flex items-center gap-1"
                type="button"
              >
                Analyze
                <ArrowRight size={12} />
              </button>
            </div>
            <div className="mt-5 space-y-4 text-center py-4">
              <p className="text-xs text-ink/60">Upload your resume to get AI-powered ATS keyword matching, project impact depth, and optimization rewrites.</p>
              <button
                onClick={() => onNavigate("Resume Analyzer")}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-moss px-4 text-xs font-semibold text-shell hover:bg-ink transition hover:scale-[1.02]"
                type="button"
              >
                Upload Resume
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-line bg-panel p-5 shadow-soft hover:shadow-md transition">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div className="flex items-center gap-2">
                <div className="grid size-9 place-items-center rounded-lg bg-sky/20 text-sky">
                  <FileText size={18} className="text-ink" />
                </div>
                <div>
                  <h4 className="font-semibold text-ink">Resume Audit Summary</h4>
                  <p className="text-xs text-ink/60">Active profile review</p>
                </div>
              </div>
              <button
                onClick={() => onNavigate("Resume Analyzer")}
                className="text-xs font-semibold text-moss hover:underline flex items-center gap-1"
                type="button"
              >
                View Full Review
                <ArrowRight size={12} />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-ink truncate max-w-[200px]" title={activeReview.filename}>
                    {activeReview.filename}
                  </p>
                  <p className="text-xs text-ink/50">ATS Match Score: {getATSScoreCategory(activeReview.score)}</p>
                </div>
                <span className="rounded-full bg-mint px-2.5 py-0.5 text-xs font-bold text-moss">
                  {activeReview.score}%
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-ink/70">ATS Keywords Matching</span>
                  <span className="font-semibold">{activeReview.atsKeywords}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-ink/10">
                  <div className="h-full rounded-full bg-moss transition-all duration-500" style={{ width: `${activeReview.atsKeywords}%` }} />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-ink/70">Project Impact Depth</span>
                  <span className="font-semibold">{activeReview.projectImpact}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-ink/10">
                  <div className="h-full rounded-full bg-coral transition-all duration-500" style={{ width: `${activeReview.projectImpact}%` }} />
                </div>
              </div>

              <div className="rounded-lg bg-shell/80 p-3 text-xs text-ink/75 border border-line/60">
                <span className="font-semibold text-moss">AI Suggestion: </span>
                {activeReview.missingKeywords && activeReview.missingKeywords.length > 0 ? (
                  <>
                    Add missing keywords like{" "}
                    {activeReview.missingKeywords.slice(0, 3).map((keyword, index, array) => (
                      <span key={keyword}>
                        <strong className="text-coral">{keyword}</strong>
                        {index < array.length - 1 ? (index === array.length - 2 ? " and " : ", ") : ""}
                      </span>
                    ))}
                    {" "}to boost your score.
                  </>
                ) : (
                  "Excellent work! Your resume contains a robust keyword profile. Tailor bullets in the optimizer for specific job targets."
                )}
              </div>
            </div>
          </div>
        )}

        {/* Mock Interview Launchpad */}
        <div className="rounded-xl border border-line bg-panel p-5 shadow-soft hover:shadow-md transition">
          <div className="flex items-center justify-between border-b border-line pb-4">
            <div className="flex items-center gap-2">
              <div className="grid size-9 place-items-center rounded-lg bg-gold/20 text-gold">
                <Mic size={18} className="text-ink" />
              </div>
              <div>
                <h4 className="font-semibold text-ink">Interview Preparation</h4>
                <p className="text-xs text-ink/60">
                  Active track: {stats?.latestMockInterviewCategory || "None started yet"}
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigate("Mock Interview")}
              className="text-xs font-semibold text-moss hover:underline flex items-center gap-1"
              type="button"
            >
              Start Session
              <ArrowRight size={12} />
            </button>
          </div>

          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between rounded-lg bg-shell/50 p-3 border border-line/40">
              <div>
                <p className="text-sm font-semibold text-ink">Last Mock Session</p>
                <p className="text-xs text-ink/60">
                  {stats?.latestMockInterviewCategory
                    ? stats.latestMockInterviewDate
                      ? `Completed on ${stats.latestMockInterviewDate}`
                      : "In progress"
                    : "No mock sessions yet"}
                </p>
              </div>
              <div className="text-right">
                {stats?.latestMockInterviewCategory ? (
                  <>
                    <p className="text-lg font-bold text-moss">
                      {stats.latestMockInterviewScore != null ? stats.latestMockInterviewScore : "N/A"}
                      <span className="text-xs text-ink/50">/10</span>
                    </p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      stats.latestMockInterviewStatus === "Passed"
                        ? "bg-mint text-moss"
                        : stats.latestMockInterviewStatus === "In Progress"
                        ? "bg-sky/20 text-ink"
                        : "bg-coral/15 text-coral"
                    }`}>
                      {stats.latestMockInterviewStatus || "In Progress"}
                    </span>
                  </>
                ) : (
                  <>
                    <p className="text-lg font-bold text-ink/40">N/A</p>
                    <span className="rounded-full bg-shell/70 border border-line px-2 py-0.5 text-[10px] font-semibold text-ink/40">
                      No Data
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-line bg-shell/45 p-3 text-center">
                <p className="text-xs text-ink/50">Questions Solved</p>
                <p className="mt-1 text-xl font-bold text-ink">
                  {stats?.totalQuestionsSolved != null ? stats.totalQuestionsSolved : 0}
                </p>
              </div>
              <div className="rounded-lg border border-line bg-shell/45 p-3 text-center">
                <p className="text-xs text-ink/50">Total Time Practiced</p>
                <p className="mt-1 text-xl font-bold text-ink">
                  {stats?.totalHoursPracticed != null ? `${stats.totalHoursPracticed} hrs` : "0.0 hrs"}
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigate("Mock Interview")}
              className="flex w-full h-10 items-center justify-center gap-2 rounded-lg bg-moss text-shell text-sm font-semibold transition hover:bg-ink"
              type="button"
            >
              {stats?.latestMockInterviewCategory
                ? stats.latestMockInterviewStatus === "In Progress"
                  ? `Resume ${stats.latestMockInterviewCategory} Practice`
                  : `Start New ${stats.latestMockInterviewCategory} Session`
                : "Start AI Mock Interview"}
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Secondary Quick Action / System Design Feature */}
      <div className="rounded-xl border border-line bg-panel p-5 shadow-soft">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="grid size-10 place-items-center rounded-lg bg-mint text-moss shrink-0">
              <Network size={20} />
            </div>
            <div>
              <h4 className="font-semibold text-ink">System Design Coach</h4>
              <p className="text-sm text-ink/65 mt-0.5">
                Practice designing high-scale architectures like YouTube or Uber with interactive checkpoints.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate("System Design")}
            className="flex h-10 items-center justify-center gap-1.5 rounded-lg border border-line bg-panel px-4 text-sm font-semibold text-ink hover:bg-shell"
            type="button"
          >
            Open Coach
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
