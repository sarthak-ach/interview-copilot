import React from "react";
import {
  FileText,
  Mic,
  Network,
  Briefcase,
  TrendingUp,
  Award,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { DashboardCards } from "./DashboardCards";
import { useAuth } from "./AuthContext";

type DashboardViewProps = {
  onNavigate: (tab: string) => void;
};

export function DashboardView({ onNavigate }: DashboardViewProps) {
  const { user } = useAuth();

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
      <DashboardCards />

      {/* Main Content Splitting */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Resume Audit Summary */}
        <div className="rounded-xl border border-line bg-panel p-5 shadow-soft hover:shadow-md transition">
          <div className="flex items-center justify-between border-b border-line pb-4">
            <div className="flex items-center gap-2">
              <div className="grid size-9 place-items-center rounded-lg bg-sky/20 text-sky">
                <FileText size={18} className="text-ink" />
              </div>
              <div>
                <h4 className="font-semibold text-ink">Resume Audit Summary</h4>
                <p className="text-xs text-ink/60">Updated 2 hours ago</p>
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

          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-ink">Sarthak_Resume_FullStack.pdf</p>
                <p className="text-xs text-ink/50">ATS Match Score: Excellent</p>
              </div>
              <span className="rounded-full bg-mint px-2.5 py-0.5 text-xs font-bold text-moss">82%</span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-ink/70">ATS Keywords Matching</span>
                <span className="font-semibold">74%</span>
              </div>
              <div className="h-1.5 rounded-full bg-ink/10">
                <div className="h-full rounded-full bg-moss" style={{ width: "74%" }} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-ink/70">Project Impact Depth</span>
                <span className="font-semibold">88%</span>
              </div>
              <div className="h-1.5 rounded-full bg-ink/10">
                <div className="h-full rounded-full bg-coral" style={{ width: "88%" }} />
              </div>
            </div>

            <div className="rounded-lg bg-shell/80 p-3 text-xs text-ink/75 border border-line/60">
              <span className="font-semibold text-moss">AI Suggestion:</span> Add missing keywords like <strong className="text-coral">Kafka</strong> and <strong className="text-coral">Redis cache strategy</strong> to boost score to 90%+.
            </div>
          </div>
        </div>

        {/* Mock Interview Launchpad */}
        <div className="rounded-xl border border-line bg-panel p-5 shadow-soft hover:shadow-md transition">
          <div className="flex items-center justify-between border-b border-line pb-4">
            <div className="flex items-center gap-2">
              <div className="grid size-9 place-items-center rounded-lg bg-gold/20 text-gold">
                <Mic size={18} className="text-ink" />
              </div>
              <div>
                <h4 className="font-semibold text-ink">Interview Preparation</h4>
                <p className="text-xs text-ink/60">Active track: Java & Spring Boot</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate("Mock Interview")}
              className="text-xs font-semibold text-moss hover:underline flex items-center gap-1"
              type="button"
            >
              All Sessions
              <ArrowRight size={12} />
            </button>
          </div>

          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between rounded-lg bg-shell/50 p-3 border border-line/40">
              <div>
                <p className="text-sm font-semibold text-ink">Last Mock Session</p>
                <p className="text-xs text-ink/60">Completed on Jun 02</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-moss">8.1<span className="text-xs text-ink/50">/10</span></p>
                <span className="rounded-full bg-mint px-2 py-0.5 text-[10px] font-semibold text-moss">Passed</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-line bg-shell/45 p-3 text-center">
                <p className="text-xs text-ink/50">Questions Solved</p>
                <p className="mt-1 text-xl font-bold text-ink">24</p>
              </div>
              <div className="rounded-lg border border-line bg-shell/45 p-3 text-center">
                <p className="text-xs text-ink/50">Total Time Practiced</p>
                <p className="mt-1 text-xl font-bold text-ink">1.8 hrs</p>
              </div>
            </div>

            <button
              onClick={() => onNavigate("Mock Interview")}
              className="flex w-full h-10 items-center justify-center gap-2 rounded-lg bg-moss text-shell text-sm font-semibold transition hover:bg-ink"
              type="button"
            >
              Resume Spring Boot Practice
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
