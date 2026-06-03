import React, { useState } from "react";
import {
  UploadCloud,
  FileText,
  Check,
  AlertCircle,
  Gauge,
  Loader2,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Cpu
} from "lucide-react";

type ResumeData = {
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

const mockResumes: Record<string, ResumeData> = {
  "Sarthak_Resume_FullStack.pdf": {
    filename: "Sarthak_Resume_FullStack.pdf",
    score: 82,
    atsKeywords: 74,
    projectImpact: 88,
    interviewDepth: 69,
    strengths: ["Strong backend RESTful service architecture", "Good React component design and hook optimization", "Solid AWS deployment basics"],
    weaknesses: ["Lacks robust caching explanations", "No documentation of async processing workflows", "Weak explanation of security integrations"],
    missingKeywords: ["Kafka", "Redis cache strategy", "OAuth2 resource server", "Docker Compose", "CI/CD Pipeline"],
    matchedKeywords: ["Spring Boot", "React", "TypeScript", "PostgreSQL", "REST APIs", "AWS EC2", "Java 21"],
    bulletRewrites: [
      {
        original: "Responsible for writing backend APIs in Spring Boot.",
        suggested: "Architected high-throughput REST APIs in Spring Boot 3, reducing latency by 28% through Hibernate query plans.",
        benefit: "Highlights technical depth and measurable performance outcomes."
      },
      {
        original: "Worked on React frontend and styling changes.",
        suggested: "Engineered modular React hooks and UI components, leading to a 34% reduction in redundant re-renders.",
        benefit: "Showcases modern frontend paradigms and performance optimization focus."
      }
    ]
  },
  "Sarthak_Resume_Backend.pdf": {
    filename: "Sarthak_Resume_Backend.pdf",
    score: 89,
    atsKeywords: 87,
    projectImpact: 92,
    interviewDepth: 84,
    strengths: ["Excellent Java 21 feature utilization", "Detailed transactional configuration description", "Robust caching architectures"],
    weaknesses: ["Minimal description of UI integrations", "Limited mention of message brokers or queue back-offs"],
    missingKeywords: ["Next.js 16", "Tailwind CSS", "Redux Toolkit", "TanStack Query", "Kafka Client"],
    matchedKeywords: ["Spring Boot", "Java 21", "PostgreSQL", "Redis cache", "Hibernate", "Docker", "JUnit 5", "CI/CD"],
    bulletRewrites: [
      {
        original: "Maintained PostgreSQL database tables and queries.",
        suggested: "Designed relational database schemas and index partitions in PostgreSQL, optimizing query times by 45%.",
        benefit: "Demonstrates database-level scaling proficiency."
      }
    ]
  },
  "Sarthak_Resume_Frontend.pdf": {
    filename: "Sarthak_Resume_Frontend.pdf",
    score: 71,
    atsKeywords: 64,
    projectImpact: 76,
    interviewDepth: 58,
    strengths: ["Strong CSS and responsive layout construction", "Proficient in Next.js folder routing"],
    weaknesses: ["Lacks database modeling experience", "Low mention of backend service integrations or cloud deployment"],
    missingKeywords: ["Spring Boot", "Spring Data JPA", "PostgreSQL", "Docker", "Spring Security"],
    matchedKeywords: ["React", "TypeScript", "Next.js", "Tailwind CSS", "HTML5/CSS3", "Redux", "Vite"],
    bulletRewrites: [
      {
        original: "Integrated backend endpoints with frontend forms.",
        suggested: "Integrated secure backend APIs with typed Next.js client forms, optimizing error states and data queries.",
        benefit: "Frames integration skills under security and clean state management."
      }
    ]
  }
};

export function ResumeAnalyzerView() {
  const [selectedResume, setSelectedResume] = useState<string>("Sarthak_Resume_FullStack.pdf");
  const [isUploading, setIsUploading] = useState(false);
  const [customResumes, setCustomResumes] = useState<string[]>(Object.keys(mockResumes));
  const [activeSubTab, setActiveSubTab] = useState<"summary" | "bullets" | "keywords">("summary");

  const currentData = mockResumes[selectedResume] || mockResumes["Sarthak_Resume_FullStack.pdf"];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    simulateUpload("Uploaded_Resume_" + Math.floor(Math.random() * 100) + ".pdf");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      simulateUpload(e.target.files[0].name);
    }
  };

  const simulateUpload = (name: string) => {
    setIsUploading(true);
    setTimeout(() => {
      // Create clone mock record for upload
      mockResumes[name] = {
        filename: name,
        score: 75 + Math.floor(Math.random() * 20),
        atsKeywords: 70 + Math.floor(Math.random() * 25),
        projectImpact: 72 + Math.floor(Math.random() * 23),
        interviewDepth: 65 + Math.floor(Math.random() * 30),
        strengths: ["Custom uploaded profile matching", "Demonstrates file parser integration support", "Clean typography structure"],
        weaknesses: ["Add specific quantitative achievements to show scale", "Missing comprehensive integration logs"],
        missingKeywords: ["Redis Cloud", "Neon Database", "JWT Security"],
        matchedKeywords: ["React", "CSS3", "JSON API", "GitHub Actions"],
        bulletRewrites: [
          {
            original: "Built standard user forms and dashboard items.",
            suggested: "Engineered scalable responsive state controls and client authentication layers, accelerating rendering by 15%.",
            benefit: "Highlights state optimization and client security."
          }
        ]
      };
      setCustomResumes(prev => [...prev, name]);
      setSelectedResume(name);
      setIsUploading(false);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone & Select Selector */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 rounded-xl border border-dashed border-line bg-panel p-6 shadow-soft text-center flex flex-col items-center justify-center min-h-[160px] relative hover:border-moss/70 transition"
             onDragOver={handleDragOver}
             onDrop={handleDrop}>
          {isUploading ? (
            <div className="space-y-3 py-6">
              <Loader2 className="size-10 animate-spin text-moss mx-auto" />
              <p className="text-sm font-semibold text-ink">Analyzing document text...</p>
              <p className="text-xs text-ink/50">Extracting AST categories and scanning keywords</p>
            </div>
          ) : (
            <div className="space-y-3">
              <UploadCloud size={36} className="text-moss/70 mx-auto" />
              <div>
                <p className="text-sm font-semibold text-ink">Drag & drop your resume PDF here</p>
                <p className="text-xs text-ink/50 mt-1">Supports PDF, DOCX up to 5MB</p>
              </div>
              <label className="inline-flex h-9 items-center justify-center rounded-lg bg-ink px-4 text-xs font-semibold text-shell hover:bg-moss cursor-pointer transition">
                Browse Files
                <input type="file" className="hidden" accept=".pdf,.docx" onChange={handleFileChange} />
              </label>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-line bg-panel p-5 shadow-soft flex flex-col justify-between">
          <div>
            <h4 className="font-semibold text-ink text-sm">Select Active Resume</h4>
            <p className="text-xs text-ink/50 mt-1">Switch resumes to review analysis scoring profiles.</p>
            <div className="mt-4 space-y-2 max-h-[130px] overflow-y-auto pr-1">
              {customResumes.map((filename) => (
                <button
                  key={filename}
                  onClick={() => setSelectedResume(filename)}
                  className={`flex w-full items-center gap-2 rounded-lg border p-2 text-left text-xs transition ${
                    selectedResume === filename
                      ? "border-moss bg-mint text-moss font-semibold"
                      : "border-line bg-shell/40 text-ink/80 hover:bg-shell"
                  }`}
                  type="button"
                >
                  <FileText size={14} className="shrink-0" />
                  <span className="truncate">{filename}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Analysis Results */}
      {isUploading ? (
        <div className="rounded-xl border border-line bg-panel p-8 text-center animate-pulse">
          <div className="h-6 w-32 bg-ink/10 rounded mx-auto mb-4"></div>
          <div className="h-4 w-64 bg-ink/10 rounded mx-auto"></div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_1.6fr]">
          {/* Gauges Side */}
          <div className="rounded-xl border border-line bg-panel p-5 shadow-soft space-y-6">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h4 className="font-semibold text-ink text-sm">ATS Metric Dashboard</h4>
              <Cpu size={18} className="text-moss" />
            </div>

            <div className="flex flex-col items-center justify-center py-4 border border-line/40 rounded-xl bg-shell/40">
              <p className="text-xs font-semibold text-moss">Overall Score</p>
              <div className="relative mt-3 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-5xl font-black text-ink">{currentData.score}%</p>
                  <span className="text-[10px] uppercase font-bold text-ink/50">Ready Profile</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-ink/80">ATS Keyword Fit</span>
                  <span className="text-moss">{currentData.atsKeywords}%</span>
                </div>
                <div className="h-2 rounded-full bg-ink/10 overflow-hidden">
                  <div className="h-full bg-moss rounded-full transition-all duration-500" style={{ width: `${currentData.atsKeywords}%` }} />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-ink/80">Project Impact Metric</span>
                  <span className="text-coral">{currentData.projectImpact}%</span>
                </div>
                <div className="h-2 rounded-full bg-ink/10 overflow-hidden">
                  <div className="h-full bg-coral rounded-full transition-all duration-500" style={{ width: `${currentData.projectImpact}%` }} />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-ink/80">Technical Depth Rating</span>
                  <span className="text-gold">{currentData.interviewDepth}%</span>
                </div>
                <div className="h-2 rounded-full bg-ink/10 overflow-hidden">
                  <div className="h-full bg-gold rounded-full transition-all duration-500" style={{ width: `${currentData.interviewDepth}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Feedback Tab Panel */}
          <div className="rounded-xl border border-line bg-panel p-5 shadow-soft flex flex-col">
            <div className="flex border-b border-line overflow-x-auto hide-scrollbar gap-1">
              {[
                { id: "summary", label: "Analysis Summary" },
                { id: "bullets", label: "Bullet Optimizer" },
                { id: "keywords", label: "ATS Keyword Gaps" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id as any)}
                  className={`h-10 px-4 text-xs font-semibold border-b-2 shrink-0 transition ${
                    activeSubTab === tab.id
                      ? "border-moss text-moss"
                      : "border-transparent text-ink/60 hover:text-ink"
                  }`}
                  type="button"
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex-1 pt-4">
              {/* Tab: Summary */}
              {activeSubTab === "summary" && (
                <div className="space-y-4">
                  <div>
                    <h5 className="text-xs font-bold text-moss uppercase">Key Highlights</h5>
                    <div className="mt-2 space-y-2">
                      {currentData.strengths.map((str, idx) => (
                        <div key={idx} className="flex gap-2 items-start text-xs text-ink/80">
                          <Check size={14} className="text-moss mt-0.5 shrink-0" />
                          <span>{str}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2">
                    <h5 className="text-xs font-bold text-coral uppercase">Areas to Improve</h5>
                    <div className="mt-2 space-y-2">
                      {currentData.weaknesses.map((weak, idx) => (
                        <div key={idx} className="flex gap-2 items-start text-xs text-ink/80">
                          <AlertCircle size={14} className="text-coral mt-0.5 shrink-0" />
                          <span>{weak}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Bullet Rewrites */}
              {activeSubTab === "bullets" && (
                <div className="space-y-4 max-h-[320px] overflow-y-auto pr-1">
                  <p className="text-xs text-ink/60 mb-2">Original phrasing vs AI-enhanced project bullets demonstrating quantified business values:</p>
                  {currentData.bulletRewrites.map((item, idx) => (
                    <div key={idx} className="rounded-lg border border-line bg-shell/40 p-3 space-y-2">
                      <div className="text-xs">
                        <span className="font-semibold text-coral block mb-0.5">Original:</span>
                        <span className="text-ink/70 italic">"{item.original}"</span>
                      </div>
                      <div className="text-xs border-t border-line/40 pt-2">
                        <span className="font-semibold text-moss flex items-center gap-1 mb-0.5">
                          <Sparkles size={12} className="text-gold" /> Suggested Tailoring:
                        </span>
                        <span className="text-ink font-medium">"{item.suggested}"</span>
                      </div>
                      <div className="text-[10px] text-moss/90 bg-mint/55 px-2 py-1 rounded inline-block">
                        <strong>Reason:</strong> {item.benefit}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab: Keywords */}
              {activeSubTab === "keywords" && (
                <div className="space-y-4">
                  <div>
                    <h5 className="text-xs font-bold text-ink/70">Missing ATS Search Keywords</h5>
                    <p className="text-xs text-ink/50 mt-0.5">These technologies were not detected but are highly sought in standard stacks.</p>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {currentData.missingKeywords.map((word) => (
                        <span key={word} className="rounded bg-coral/10 border border-coral/30 px-2 py-0.5 text-xs text-coral font-medium">
                          + {word}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-line/40">
                    <h5 className="text-xs font-bold text-ink/70">Matched Keywords</h5>
                    <p className="text-xs text-ink/50 mt-0.5">Successfully identified skills in the parsing session.</p>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {currentData.matchedKeywords.map((word) => (
                        <span key={word} className="rounded bg-mint px-2.5 py-0.5 text-xs text-moss font-semibold">
                          ✓ {word}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
