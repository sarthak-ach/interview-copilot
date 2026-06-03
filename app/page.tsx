"use client";

import { useEffect, useState } from "react";
import {
  Briefcase,
  ChevronDown,
  FileText,
  LayoutDashboard,
  Mic,
  Moon,
  Network,
  Search,
  Sun,
  Zap
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import { Loader2 } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { DashboardView } from "@/components/DashboardView";
import { ResumeAnalyzerView } from "@/components/ResumeAnalyzerView";
import { JobMatchView } from "@/components/JobMatchView";
import { MockInterviewView } from "@/components/MockInterviewView";
import { SystemDesignView } from "@/components/SystemDesignView";
import { JobTrackerView } from "@/components/JobTrackerView";

const modules = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Resume Analyzer", icon: FileText },
  { label: "Job Match", icon: Search },
  { label: "Mock Interview", icon: Mic },
  { label: "System Design", icon: Network },
  { label: "Job Tracker", icon: Briefcase }
];

const tabContent: Record<string, { title: string; description: string; stats: string[] }> = {
  Dashboard: {
    title: "Dashboard overview",
    description: "A snapshot of resume readiness, interview practice, and application progress.",
    stats: ["Resume score: 82%", "Upcoming rounds: 3", "Saved analyses: 14"]
  },
  "Resume Analyzer": {
    title: "Resume Analyzer",
    description: "Upload resumes, scan keyword alignment, and get AI bullet optimization suggestions.",
    stats: ["Latest score: 82%", "Keyword gaps: 5", "Rewrite recommendations: 2"]
  },
  "Job Match": {
    title: "Job Match",
    description: "Compare your resume against pasted job descriptions to inspect skills matching.",
    stats: ["Stripe match: 84%", "Netflix match: 68%", "Custom match: ready"]
  },
  "Mock Interview": {
    title: "Mock Interview",
    description: "Conduct technical rounds with our interactive chatbot and get instant scorecards.",
    stats: ["Spring Boot score: 8.4", "Difficulty: Senior", "Mock interview passes: 1"]
  },
  "System Design": {
    title: "System Design",
    description: "Practice core database scaling, capacity, and API design checkpoints with AI hints.",
    stats: ["YouTube draft: ready", "WhatsApp draft: ready", "Design evaluations: 82%"]
  },
  "Job Tracker": {
    title: "Job Tracker",
    description: "Organize applications and monitor pipeline stages with an interactive Kanban board.",
    stats: ["Total jobs tracked: 4", "Active interviews: 2", "Applications: 1"]
  }
};

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(modules[0].label);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const currentTab = tabContent[activeTab];

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("interview-copilot-theme");
    const initialTheme = savedTheme === "dark" ? "dark" : "light";

    document.documentElement.dataset.theme = initialTheme;
    window.requestAnimationFrame(() => setTheme(initialTheme));
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";

    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem("interview-copilot-theme", nextTheme);
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-shell">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-moss" size={36} />
          <p className="text-sm font-semibold text-moss">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <main className="min-h-screen text-ink">
      <div className="mx-auto flex min-h-screen w-full max-w-[1500px]">
        <Sidebar activeTab={activeTab} modules={modules} onTabChange={setActiveTab} />

        <section className="flex-grow px-4 py-4 sm:px-6 lg:px-8 flex flex-col min-w-0">
          <Topbar theme={theme} onThemeToggle={toggleTheme} />

          <div className="pt-5 lg:hidden">
            <div className="flex gap-2 overflow-x-auto rounded-lg border border-line bg-panel/70 p-2 shadow-soft hide-scrollbar">
              {modules.map((item) => (
                <button
                  key={item.label}
                  className={`flex h-10 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-semibold transition ${
                    activeTab === item.label ? "bg-ink text-shell" : "text-ink/68 hover:bg-shell"
                  }`}
                  type="button"
                  onClick={() => setActiveTab(item.label)}
                >
                  <item.icon size={16} />
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="py-5 flex-1 flex flex-col min-w-0">
            {activeTab === "Dashboard" && <DashboardView onNavigate={setActiveTab} />}
            {activeTab === "Resume Analyzer" && <ResumeAnalyzerView />}
            {activeTab === "Job Match" && <JobMatchView />}
            {activeTab === "Mock Interview" && <MockInterviewView />}
            {activeTab === "System Design" && <SystemDesignView />}
            {activeTab === "Job Tracker" && <JobTrackerView />}
          </div>
        </section>
      </div>
    </main>
  );
}
