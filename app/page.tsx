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
import { ApplicationPipeline } from "@/components/ApplicationPipeline";
import { DashboardCards } from "@/components/DashboardCards";
import { InterviewChatPreview } from "@/components/InterviewChatPreview";
import { ResumeAnalyzerPreview } from "@/components/ResumeAnalyzerPreview";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";

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
    description: "Dummy workspace for uploaded resumes, ATS scoring, and project impact feedback.",
    stats: ["Latest upload: pending", "Keyword gaps: 7", "Rewrite suggestions: 12"]
  },
  "Job Match": {
    title: "Job Match",
    description: "Dummy content for comparing a resume against a pasted job description.",
    stats: ["Match score: 76%", "Strong signals: 9", "Missing skills: 3"]
  },
  "Mock Interview": {
    title: "Mock Interview",
    description: "Dummy practice area for AI-led technical rounds and scored answers.",
    stats: ["Track: Spring Boot", "Last score: 8.1", "Questions queued: 10"]
  },
  "System Design": {
    title: "System Design",
    description: "Dummy canvas for requirements, capacity estimates, APIs, and scaling notes.",
    stats: ["Challenge: Design YouTube", "Sections ready: 4", "Follow-ups: 6"]
  },
  "Job Tracker": {
    title: "Job Tracker",
    description: "Dummy pipeline for saved companies, interviews, and next actions.",
    stats: ["Active jobs: 12", "Interviews: 3", "Follow-ups due: 2"]
  }
};

export default function Home() {
  const [activeTab, setActiveTab] = useState(modules[0].label);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const currentTab = tabContent[activeTab];

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("interview-copilot-theme");
    const initialTheme = savedTheme === "dark" ? "dark" : "light";

    document.documentElement.dataset.theme = initialTheme;
    window.requestAnimationFrame(() => setTheme(initialTheme));
  }, []);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";

    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem("interview-copilot-theme", nextTheme);
  }

  return (
    <main className="min-h-screen text-ink">
      <div className="mx-auto flex min-h-screen w-full max-w-[1500px]">
        <Sidebar activeTab={activeTab} modules={modules} onTabChange={setActiveTab} />

        <section className="flex-1 px-4 py-4 sm:px-6 lg:px-8">
          <Topbar theme={theme} onThemeToggle={toggleTheme} />

          <div className="pt-5">
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

            <section className="mt-5 rounded-lg border border-line bg-panel p-5 shadow-soft">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-medium text-moss">Active tab</p>
                  <h2 className="mt-1 text-2xl font-semibold">{currentTab.title}</h2>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-ink/66">{currentTab.description}</p>
                </div>
                <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[520px]">
                  {currentTab.stats.map((stat) => (
                    <div key={stat} className="rounded-lg border border-line bg-shell px-3 py-3 text-sm font-semibold text-ink/78">
                      {stat}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>

          <div className="grid gap-5 py-5 xl:grid-cols-[1.45fr_0.95fr]">
            <section className="space-y-5">
              <ResumeAnalyzerPreview />
              <DashboardCards />
            </section>

            <aside className="space-y-5">
              <InterviewChatPreview />
              <ApplicationPipeline />

              <div className="rounded-lg border border-line bg-ink p-5 text-shell shadow-soft">
                <div className="flex items-center gap-2">
                  <Zap size={20} className="text-gold" />
                  <h3 className="text-lg font-semibold">Backend Preview</h3>
                </div>
                <div className="mt-4 grid gap-3 text-sm text-shell/76">
                  <p className="flex items-center justify-between gap-3">
                    Auth API <span className="rounded-lg bg-white/10 px-2 py-1">JWT</span>
                  </p>
                  <p className="flex items-center justify-between gap-3">
                    Resume AI <span className="rounded-lg bg-white/10 px-2 py-1">Async</span>
                  </p>
                  <p className="flex items-center justify-between gap-3">
                    Provider <span className="rounded-lg bg-white/10 px-2 py-1">OpenAI/Ollama</span>
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </section>
      </div>

      <div className="fixed bottom-4 left-4 right-4 z-30 flex items-center justify-between gap-3 rounded-lg border border-line bg-panel/95 p-3 shadow-soft backdrop-blur lg:hidden">
        <select
          className="h-10 min-w-0 flex-1 rounded-lg border border-line bg-shell px-3 text-sm font-semibold"
          value={activeTab}
          onChange={(event) => setActiveTab(event.target.value)}
        >
          {modules.map((item) => (
            <option key={item.label} value={item.label}>
              {item.label}
            </option>
          ))}
        </select>
        <button
          className="grid size-10 place-items-center rounded-lg border border-line bg-shell text-ink"
          type="button"
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          onClick={toggleTheme}
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button className="grid size-10 place-items-center rounded-lg bg-ink text-shell" type="button" aria-label="Open mobile menu">
          <ChevronDown size={18} />
        </button>
      </div>
    </main>
  );
}
