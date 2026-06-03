import React, { useState } from "react";
import {
  Search,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Sparkles,
  ArrowRight,
  Clipboard
} from "lucide-react";

type MatchResult = {
  score: number;
  strongMatches: string[];
  missingSkills: string[];
  recommendations: string[];
};

const mockJDs: Record<string, { title: string; text: string; matches: Record<string, MatchResult> }> = {
  "Stripe - Senior Full Stack Engineer": {
    title: "Stripe - Senior Full Stack Engineer",
    text: `About the Role:
We are looking for a Senior Full Stack Engineer to join our dashboard team. You will write high-quality APIs and build responsive user interfaces.

Requirements:
- 5+ years of experience building web applications.
- Strong proficiency in React, TypeScript, and state management.
- Solid experience writing backend REST APIs in Java or Ruby.
- Experience with databases like PostgreSQL and cache layers like Redis.
- Familiarity with secure coding standards (OAuth2, OAuth).
- Outstanding communication and collaboration skills.`,
    matches: {
      "Sarthak_Resume_FullStack.pdf": {
        score: 84,
        strongMatches: ["React component design and hooks", "Java REST APIs using Spring Boot", "PostgreSQL database schemas", "TypeScript usage"],
        missingSkills: ["OAuth2 security flows", "Redis cache integrations", "Production load balancing"],
        recommendations: [
          "Incorporate a dedicated section explaining state management choices (e.g., Redux, Context).",
          "Clarify security configurations by explicitly mentioning JWT validation and Spring Security."
        ]
      },
      "Sarthak_Resume_Backend.pdf": {
        score: 65,
        strongMatches: ["Java and Spring Boot API architecture", "PostgreSQL and Redis caches"],
        missingSkills: ["Frontend proficiency (React, TypeScript)", "UI state management", "CSS layout styling"],
        recommendations: [
          "Highlight frontend work, or showcase dashboard integration experience to meet the full-stack requirement.",
          "Add mention of TypeScript or React frameworks if you have any historical project experience."
        ]
      },
      "Sarthak_Resume_Frontend.pdf": {
        score: 72,
        strongMatches: ["React UI dashboards", "TypeScript typing", "Responsive CSS components"],
        missingSkills: ["Spring Boot/Java REST APIs", "Database schemas (PostgreSQL)", "Redis caching"],
        recommendations: [
          "Explain server-side rendering or node API orchestration experiences to address backend requirements.",
          "Add mention of relational databases or basic SQL query writing."
        ]
      }
    }
  },
  "Netflix - Senior Backend Engineer": {
    title: "Netflix - Senior Backend Engineer",
    text: `About the Role:
As a Senior Backend Engineer on the streaming infrastructure team, you will design microservices handling millions of concurrent requests.

Requirements:
- Extensive experience in Java 17+, Spring Boot, and JPA/Hibernate.
- Strong understanding of Distributed Systems, Caching (Redis/Memcached), and Message Brokers (Kafka/RabbitMQ).
- Performance tuning of PostgreSQL databases and complex query structures.
- AWS cloud infrastructure experience (EC2, ECS, S3).
- Experience with Docker, Kubernetes, and automated CI/CD pipelines.`,
    matches: {
      "Sarthak_Resume_FullStack.pdf": {
        score: 68,
        strongMatches: ["Java & Spring Boot APIs", "PostgreSQL basic queries", "AWS deployment basics"],
        missingSkills: ["Kafka/RabbitMQ message queues", "Advanced Redis caching", "Docker containerization", "Kubernetes orchestration"],
        recommendations: [
          "Detail how your Spring Boot APIs handle heavy workloads.",
          "Mention any message brokers (even local queues) to satisfy distributed flow needs.",
          "Explicitly detail containerization experience using Docker."
        ]
      },
      "Sarthak_Resume_Backend.pdf": {
        score: 91,
        strongMatches: ["Java 21 backend microservices", "PostgreSQL query tuning & indexing", "Redis cache setup", "Docker container deployment", "AWS EC2/S3"],
        missingSkills: ["Kafka pipeline streaming", "Kubernetes active clustering"],
        recommendations: [
          "Expand on your cache-eviction policies and Redis caching strategies.",
          "Incorporate any experience with event-driven models or message structures."
        ]
      },
      "Sarthak_Resume_Frontend.pdf": {
        score: 35,
        strongMatches: ["Basic deployment awareness"],
        missingSkills: ["Java/Spring Boot ecosystem", "Relational database tuning", "Distributed systems caching", "Docker/Kubernetes", "AWS infrastructure"],
        recommendations: [
          "This profile is heavily mismatched for a Senior Backend position. Consider tailoring toward frontend or fullstack tracks.",
          "If applying, emphasize node-based backend microservices or express REST frameworks."
        ]
      }
    }
  }
};

export function JobMatchView() {
  const [selectedResume, setSelectedResume] = useState<string>("Sarthak_Resume_FullStack.pdf");
  const [jobDescription, setJobDescription] = useState<string>(mockJDs["Stripe - Senior Full Stack Engineer"].text);
  const [activeTemplate, setActiveTemplate] = useState<string>("Stripe - Senior Full Stack Engineer");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);

  // Load a job description template
  const handleLoadTemplate = (key: string) => {
    setActiveTemplate(key);
    setJobDescription(mockJDs[key].text);
    setMatchResult(null); // Reset match to force run
  };

  // Run the match algorithm
  const handleRunMatch = () => {
    setIsLoading(true);
    setTimeout(() => {
      // Find matches in mock data
      const template = mockJDs[activeTemplate];
      if (template && template.matches[selectedResume]) {
        setMatchResult(template.matches[selectedResume]);
      } else {
        // Fallback for custom text
        setMatchResult({
          score: 55 + Math.floor(Math.random() * 30),
          strongMatches: ["React layout integration", "Spring Boot API controllers"],
          missingSkills: ["Kubernetes", "Kafka streaming", "Spring Security configuration"],
          recommendations: [
            "Tailor your project summary to align with the core requirements of this JD.",
            "List specific versions of frameworks used in your projects."
          ]
        });
      }
      setIsLoading(false);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Side - Input JD and select Resume */}
        <div className="rounded-xl border border-line bg-panel p-5 shadow-soft space-y-4">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <h4 className="font-semibold text-ink text-sm">Select Profile and Job Description</h4>
            <Search size={18} className="text-moss" />
          </div>

          {/* Select Resume */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink/70">Compare Against Resume</label>
            <select
              className="w-full h-10 rounded-lg border border-line bg-shell/45 px-3 text-xs font-semibold outline-none"
              value={selectedResume}
              onChange={(e) => {
                setSelectedResume(e.target.value);
                setMatchResult(null);
              }}
            >
              <option value="Sarthak_Resume_FullStack.pdf">Sarthak_Resume_FullStack.pdf (Fullstack)</option>
              <option value="Sarthak_Resume_Backend.pdf">Sarthak_Resume_Backend.pdf (Backend Dev)</option>
              <option value="Sarthak_Resume_Frontend.pdf">Sarthak_Resume_Frontend.pdf (Frontend Dev)</option>
            </select>
          </div>

          {/* Quick JD Templates */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink/70">Load Prebuilt Job Openings</label>
            <div className="flex gap-2">
              {Object.keys(mockJDs).map((key) => (
                <button
                  key={key}
                  onClick={() => handleLoadTemplate(key)}
                  className={`flex-1 h-9 rounded-lg border text-xs font-semibold transition ${
                    activeTemplate === key
                      ? "border-moss bg-mint text-moss"
                      : "border-line bg-shell/30 text-ink/80 hover:bg-shell"
                  }`}
                  type="button"
                >
                  {key.split(" - ")[0]}
                </button>
              ))}
              <button
                onClick={() => {
                  setActiveTemplate("Custom");
                  setJobDescription("");
                  setMatchResult(null);
                }}
                className={`px-3 h-9 rounded-lg border text-xs font-semibold transition ${
                  activeTemplate === "Custom"
                    ? "border-moss bg-mint text-moss"
                    : "border-line bg-shell/30 text-ink/80 hover:bg-shell"
                }`}
                type="button"
              >
                Custom JD
              </button>
            </div>
          </div>

          {/* Text Area JD */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink/70">Paste Job Description Text</label>
            <textarea
              className="w-full h-44 rounded-lg border border-line bg-shell/25 p-3 text-xs outline-none focus:border-moss"
              placeholder="Paste job details, responsibilities, and qualifications..."
              value={jobDescription}
              onChange={(e) => {
                setJobDescription(e.target.value);
                setActiveTemplate("Custom");
                setMatchResult(null);
              }}
            />
          </div>

          <button
            onClick={handleRunMatch}
            disabled={isLoading || !jobDescription.trim()}
            className="flex w-full h-11 items-center justify-center gap-2 rounded-lg bg-ink text-shell text-sm font-semibold transition hover:bg-moss disabled:opacity-50"
            type="button"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Comparing Resume against JD...
              </>
            ) : (
              <>
                Analyze Job Fit
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>

        {/* Right Side - Analysis Results */}
        <div className="rounded-xl border border-line bg-panel p-5 shadow-soft flex flex-col justify-between min-h-[300px]">
          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-3 py-12">
              <Loader2 className="size-10 animate-spin text-moss" />
              <p className="text-sm font-semibold text-ink">Analyzing overlaps...</p>
              <p className="text-xs text-ink/50">Parsing requirements, assessing keyword intersections</p>
            </div>
          ) : matchResult ? (
            <div className="space-y-5 flex-1">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <h4 className="font-semibold text-ink text-sm">Match Analysis Results</h4>
                <div className="flex items-center gap-1.5 rounded-lg bg-mint px-2 py-1 text-xs font-bold text-moss">
                  <Sparkles size={13} className="text-moss" />
                  AI Computed
                </div>
              </div>

              {/* Score Display */}
              <div className="flex items-center gap-4 bg-shell/50 p-4 border border-line/40 rounded-xl">
                <div>
                  <p className="text-xs text-moss font-semibold uppercase">Match Score</p>
                  <p className="mt-1 text-4xl font-extrabold text-ink">{matchResult.score}%</p>
                </div>
                <div className="flex-1 h-3 rounded-full bg-ink/10 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      matchResult.score >= 80 ? "bg-moss" : matchResult.score >= 60 ? "bg-gold" : "bg-coral"
                    }`}
                    style={{ width: `${matchResult.score}%` }}
                  />
                </div>
              </div>

              {/* Grid content */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg bg-mint/45 border border-mint/60 p-3 space-y-2">
                  <span className="text-xs font-bold text-moss uppercase flex items-center gap-1">
                    <CheckCircle2 size={13} /> Strong Signals ({matchResult.strongMatches.length})
                  </span>
                  <div className="space-y-1.5 max-h-[140px] overflow-y-auto">
                    {matchResult.strongMatches.map((item, idx) => (
                      <p key={idx} className="text-xs text-ink/80 flex items-start gap-1">
                        <span className="text-moss shrink-0">•</span>
                        <span>{item}</span>
                      </p>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg bg-coral/5 border border-coral/10 p-3 space-y-2">
                  <span className="text-xs font-bold text-coral uppercase flex items-center gap-1">
                    <AlertTriangle size={13} /> Critical Gaps ({matchResult.missingSkills.length})
                  </span>
                  <div className="space-y-1.5 max-h-[140px] overflow-y-auto">
                    {matchResult.missingSkills.map((item, idx) => (
                      <p key={idx} className="text-xs text-ink/80 flex items-start gap-1">
                        <span className="text-coral shrink-0">•</span>
                        <span>{item}</span>
                      </p>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="pt-2 border-t border-line/40">
                <h5 className="text-xs font-bold text-ink/80 uppercase">AI Tailoring Recommendations</h5>
                <div className="mt-2 space-y-2">
                  {matchResult.recommendations.map((rec, idx) => (
                    <div key={idx} className="rounded border border-line bg-shell/40 p-2.5 text-xs text-ink/75">
                      <strong>Tip {idx + 1}:</strong> {rec}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center space-y-3 py-12 text-center">
              <Clipboard size={38} className="text-ink/30 mx-auto" />
              <div>
                <p className="text-sm font-semibold text-ink">No Match Results Yet</p>
                <p className="text-xs text-ink/50 max-w-xs mt-1 mx-auto">
                  Select a resume, choose or paste a job description, and click "Analyze Job Fit" to calculate scores.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
