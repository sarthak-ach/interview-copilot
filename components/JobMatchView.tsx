import React, { useState, useEffect } from "react";
import {
  Search,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Sparkles,
  ArrowRight,
  Clipboard,
  FileText,
  Check,
  AlertCircle,
  PlusCircle,
  HelpCircle,
  Sparkle
} from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import { useResumeStore } from "@/lib/resumeStore";
import { apiFetch } from "@/lib/api";

type MatchResult = {
  score: number;
  strongMatches: string[];
  missingSkills: string[];
  recommendations: string[];
};

type TailoringResult = {
  bulletRewrites: { original: string; suggested: string; benefit: string }[];
  keywordOptimizedContent: string;
};

export function JobMatchView() {
  const { user } = useAuth();
  const { resumes, fetchResumes } = useResumeStore();

  const [selectedResumeId, setSelectedResumeId] = useState<string>("");
  const [savedJDs, setSavedJDs] = useState<any[]>([]);
  const [selectedJdId, setSelectedJdId] = useState<string>("");
  const [jobTitle, setJobTitle] = useState<string>("");
  const [jobDescription, setJobDescription] = useState<string>("");
  const [isCustom, setIsCustom] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"analysis" | "tailor">("analysis");
  const [isTailoring, setIsTailoring] = useState<boolean>(false);
  const [tailoringResult, setTailoringResult] = useState<TailoringResult | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchResumes(user.id);
      fetchJobDescriptions();
    }
  }, [user?.id]);

  useEffect(() => {
    if (resumes.length > 0 && !selectedResumeId) {
      setSelectedResumeId(resumes[0].id);
    }
  }, [resumes, selectedResumeId]);

  const fetchJobDescriptions = async () => {
    if (!user?.id) return;
    try {
      const data = await apiFetch<any[]>(`/api/jobs/descriptions?userId=${user.id}`);
      setSavedJDs(data);
      if (data.length > 0 && !selectedJdId) {
        setSelectedJdId(data[0].id);
        setJobTitle(data[0].title);
        setJobDescription(data[0].description);
        setIsCustom(false);
      }
    } catch (e) {
      console.error("Failed to load job descriptions:", e);
    }
  };

  const handleSelectJd = (id: string) => {
    setSelectedJdId(id);
    setMatchResult(null);
    setTailoringResult(null);

    if (id === "custom") {
      setIsCustom(true);
      setJobTitle("");
      setJobDescription("");
    } else {
      setIsCustom(false);
      const jd = savedJDs.find((item) => item.id === id);
      if (jd) {
        setJobTitle(jd.title);
        setJobDescription(jd.description);
      }
    }
  };

  const handleRunMatch = async () => {
    if (!user?.id || !selectedResumeId) return;
    setIsLoading(true);
    setErrorMsg(null);
    setMatchResult(null);
    setTailoringResult(null);

    try {
      let finalJdId = selectedJdId;

      // If custom, save it first
      if (isCustom || selectedJdId === "custom") {
        if (!jobTitle.trim() || !jobDescription.trim()) {
          throw new Error("Job Title and Job Description are required for custom entry.");
        }
        const jd = await apiFetch<any>("/api/jobs/descriptions", {
          method: "POST",
          bodyData: {
            userId: user.id,
            title: jobTitle.trim(),
            description: jobDescription.trim()
          }
        });
        finalJdId = jd.id;
        setSelectedJdId(finalJdId);
        setIsCustom(false);
        await fetchJobDescriptions();
      }

      const matchData = await apiFetch<any>("/api/jobs/matches", {
        method: "POST",
        bodyData: {
          resumeId: selectedResumeId,
          jobDescriptionId: finalJdId
        }
      });

      setMatchResult({
        score: matchData.matchScore,
        strongMatches: matchData.strongMatches || [],
        missingSkills: matchData.missingSkills || [],
        recommendations: matchData.recommendations || []
      });
      setActiveTab("analysis");
    } catch (err: any) {
      console.error("Failed to run match:", err);
      setErrorMsg(err.message || "Failed to analyze compatibility. Make sure backend is running.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunTailoring = async () => {
    if (!selectedResumeId || !selectedJdId || selectedJdId === "custom") return;
    setIsTailoring(true);
    setErrorMsg(null);

    try {
      const data = await apiFetch<any>(`/api/resumes/${selectedResumeId}/tailor`, {
        method: "POST",
        bodyData: {
          jobDescriptionId: selectedJdId
        }
      });
      setTailoringResult({
        bulletRewrites: data.bulletRewrites || [],
        keywordOptimizedContent: data.keywordOptimizedContent || ""
      });
    } catch (err: any) {
      console.error("Failed to run tailoring:", err);
      setErrorMsg(err.message || "Failed to generate tailoring recommendations.");
    } finally {
      setIsTailoring(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Side - Input JD and select Resume */}
        <div className="rounded-xl border border-line bg-panel p-5 shadow-soft space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h4 className="font-semibold text-ink text-sm">Select Profile and Job Description</h4>
              <Search size={18} className="text-moss" />
            </div>

            {/* Select Resume */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink/70">Compare Against Resume</label>
              {resumes.length === 0 ? (
                <div className="p-3 bg-gold/10 border border-gold/30 rounded-lg text-xs text-amber-800 font-medium flex items-center gap-2">
                  <AlertCircle size={14} />
                  <span>No resumes uploaded. Please upload a resume in the <strong>Resume Analyzer</strong> tab first.</span>
                </div>
              ) : (
                <select
                  className="w-full h-10 rounded-lg border border-line bg-shell/45 px-3 text-xs font-semibold outline-none"
                  value={selectedResumeId}
                  onChange={(e) => {
                    setSelectedResumeId(e.target.value);
                    setMatchResult(null);
                    setTailoringResult(null);
                  }}
                >
                  {resumes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.filename} ({r.score}% rating)
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Quick JD Templates */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink/70">Select Job Opening</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  className="flex-1 h-10 rounded-lg border border-line bg-shell/45 px-3 text-xs font-semibold outline-none"
                  value={selectedJdId}
                  onChange={(e) => handleSelectJd(e.target.value)}
                >
                  {savedJDs.map((jd) => (
                    <option key={jd.id} value={jd.id}>
                      {jd.title}
                    </option>
                  ))}
                  <option value="custom">-- Custom Job Description --</option>
                </select>
              </div>
            </div>

            {/* Custom JD Title (only show if Custom JD selected) */}
            {isCustom && (
              <div className="space-y-1.5 animate-fadeIn">
                <label className="text-xs font-semibold text-ink/70">Job Title / Role Name</label>
                <input
                  type="text"
                  className="w-full h-10 rounded-lg border border-line bg-shell/45 px-3 text-xs outline-none focus:border-moss"
                  placeholder="e.g. Stripe - Senior Backend Engineer"
                  value={jobTitle}
                  onChange={(e) => {
                    setJobTitle(e.target.value);
                    setMatchResult(null);
                  }}
                />
              </div>
            )}

            {/* Text Area JD */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink/70">
                {isCustom ? "Paste Job Description Text" : "Job Description Preview"}
              </label>
              <textarea
                className={`w-full h-44 rounded-lg border border-line p-3 text-xs outline-none focus:border-moss transition ${
                  isCustom ? "bg-shell/25" : "bg-shell/10 text-ink/75"
                }`}
                placeholder="Paste job details, responsibilities, and qualifications..."
                value={jobDescription}
                readOnly={!isCustom}
                onChange={(e) => {
                  if (isCustom) {
                    setJobDescription(e.target.value);
                    setMatchResult(null);
                  }
                }}
              />
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-line/45">
            {errorMsg && (
              <div className="p-3 bg-coral/10 border border-coral/30 rounded-lg text-xs text-coral font-medium flex items-center gap-2">
                <AlertCircle size={14} />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              onClick={handleRunMatch}
              disabled={isLoading || resumes.length === 0 || !jobDescription.trim() || (isCustom && !jobTitle.trim())}
              className="flex w-full h-11 items-center justify-center gap-2 rounded-lg bg-ink text-shell text-sm font-semibold transition hover:bg-moss disabled:opacity-50 cursor-pointer"
              type="button"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Analyzing Job Fit...
                </>
              ) : (
                <>
                  Analyze Job Fit
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Side - Analysis & Tailoring Results */}
        <div className="rounded-xl border border-line bg-panel p-5 shadow-soft flex flex-col min-h-[480px]">
          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-3 py-12">
              <Loader2 className="size-10 animate-spin text-moss" />
              <p className="text-sm font-semibold text-ink">Analyzing overlaps...</p>
              <p className="text-xs text-ink/50">Parsing requirements, assessing keyword intersections</p>
            </div>
          ) : matchResult ? (
            <div className="space-y-5 flex-1 flex flex-col">
              {/* Tab Navigation */}
              <div className="flex border-b border-line gap-2 pb-1 shrink-0">
                <button
                  onClick={() => setActiveTab("analysis")}
                  className={`h-9 px-4 text-xs font-semibold border-b-2 transition ${
                    activeTab === "analysis"
                      ? "border-moss text-moss font-bold"
                      : "border-transparent text-ink/60 hover:text-ink"
                  }`}
                  type="button"
                >
                  Fit Analysis
                </button>
                <button
                  onClick={() => setActiveTab("tailor")}
                  className={`h-9 px-4 text-xs font-semibold border-b-2 transition ${
                    activeTab === "tailor"
                      ? "border-moss text-moss font-bold"
                      : "border-transparent text-ink/60 hover:text-ink"
                  }`}
                  type="button"
                >
                  Tailor Resume (Diff)
                </button>
              </div>

              {/* Tab Content 1: Analysis */}
              {activeTab === "analysis" && (
                <div className="space-y-4 flex-grow overflow-y-auto">
                  {/* Score Display */}
                  <div className="flex items-center gap-4 bg-shell/50 p-4 border border-line/45 rounded-xl">
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

                  {/* Signals & Gaps */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-lg bg-mint/45 border border-mint/60 p-3 space-y-2">
                      <span className="text-xs font-bold text-moss uppercase flex items-center gap-1">
                        <CheckCircle2 size={13} /> Strong Signals ({matchResult.strongMatches.length})
                      </span>
                      <div className="space-y-1.5 max-h-[140px] overflow-y-auto">
                        {matchResult.strongMatches.length === 0 ? (
                          <p className="text-xs text-ink/40 italic">None detected</p>
                        ) : (
                          matchResult.strongMatches.map((item, idx) => (
                            <p key={idx} className="text-xs text-ink/80 flex items-start gap-1">
                              <span className="text-moss shrink-0">•</span>
                              <span>{item}</span>
                            </p>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="rounded-lg bg-coral/5 border border-coral/10 p-3 space-y-2">
                      <span className="text-xs font-bold text-coral uppercase flex items-center gap-1">
                        <AlertTriangle size={13} /> Critical Gaps ({matchResult.missingSkills.length})
                      </span>
                      <div className="space-y-1.5 max-h-[140px] overflow-y-auto">
                        {matchResult.missingSkills.length === 0 ? (
                          <p className="text-xs text-ink/40 italic">None detected</p>
                        ) : (
                          matchResult.missingSkills.map((item, idx) => (
                            <p key={idx} className="text-xs text-ink/80 flex items-start gap-1">
                              <span className="text-coral shrink-0">•</span>
                              <span>{item}</span>
                            </p>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="pt-2 border-t border-line/45">
                    <h5 className="text-xs font-bold text-ink/80 uppercase">AI Recommendations</h5>
                    <div className="mt-2 space-y-2">
                      {matchResult.recommendations.length === 0 ? (
                        <p className="text-xs text-ink/50 italic">Everything looks aligned!</p>
                      ) : (
                        matchResult.recommendations.map((rec, idx) => (
                          <div key={idx} className="rounded border border-line bg-shell/40 p-2.5 text-xs text-ink/75">
                            <strong>Tip {idx + 1}:</strong> {rec}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab Content 2: Resume Tailoring */}
              {activeTab === "tailor" && (
                <div className="flex-grow flex flex-col justify-between space-y-4">
                  {isTailoring ? (
                    <div className="flex-grow flex flex-col items-center justify-center space-y-3 py-12">
                      <Loader2 className="size-8 animate-spin text-moss" />
                      <p className="text-sm font-semibold text-ink">Tailoring resume content...</p>
                      <p className="text-xs text-ink/50">Aligning experience bullets with targeted JD requirements</p>
                    </div>
                  ) : tailoringResult ? (
                    <div className="space-y-4 flex-grow overflow-y-auto max-h-[380px] pr-1">
                      {/* Keyword Optimization Banner */}
                      <div className="rounded-lg border border-moss/20 bg-mint/30 p-3.5 space-y-1.5 text-xs">
                        <span className="font-bold text-moss flex items-center gap-1.5 uppercase">
                          <Sparkles size={14} className="text-gold fill-gold animate-pulse" />
                          ATS Keyword Optimization
                        </span>
                        <p className="text-ink/80 leading-relaxed whitespace-pre-line">
                          {tailoringResult.keywordOptimizedContent}
                        </p>
                      </div>

                      {/* Bullet Diff View */}
                      <div className="space-y-3">
                        <h5 className="text-xs font-bold text-ink/85 uppercase flex items-center gap-1">
                          <Sparkle size={13} className="text-moss" />
                          Bullet Rewrites (Original vs Tailored)
                        </h5>
                        <div className="space-y-3">
                          {tailoringResult.bulletRewrites.map((item, idx) => (
                            <div key={idx} className="rounded-xl border border-line bg-shell/20 p-3.5 space-y-2.5 shadow-soft transition hover:border-moss/40">
                              <div className="grid gap-2 sm:grid-cols-2">
                                <div className="space-y-1 bg-coral/5 border border-coral/10 p-2 rounded-lg text-xs">
                                  <span className="text-[10px] font-bold text-coral uppercase block">Original Bullet</span>
                                  <p className="text-ink/70 italic leading-relaxed">"{item.original}"</p>
                                </div>
                                <div className="space-y-1 bg-mint/55 border border-mint/70 p-2 rounded-lg text-xs font-medium">
                                  <span className="text-[10px] font-bold text-moss uppercase flex items-center gap-1">
                                    <Sparkles size={10} className="text-gold" /> Suggested Rewrite
                                  </span>
                                  <p className="text-ink leading-relaxed">"{item.suggested}"</p>
                                </div>
                              </div>
                              <div className="text-[10px] text-ink/65 bg-shell/55 border border-line/60 px-2 py-1.5 rounded-md leading-relaxed">
                                <strong>Rationale:</strong> {item.benefit}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-grow flex flex-col items-center justify-center text-center p-8 space-y-4 bg-shell/15 border border-line/30 rounded-xl">
                      <Sparkles size={36} className="text-moss/60 animate-pulse" />
                      <div>
                        <h5 className="text-sm font-semibold text-ink">Ready to Tailor Resume</h5>
                        <p className="text-xs text-ink/50 max-w-sm mt-1 mx-auto leading-relaxed">
                          Click below to trigger AI tailoring. This will generate optimized, high-impact resume bullets highlighting key achievements and integrating relevant JD keywords.
                        </p>
                      </div>
                      <button
                        onClick={handleRunTailoring}
                        className="flex h-9 items-center justify-center gap-2 rounded-lg bg-ink text-shell px-4 text-xs font-semibold hover:bg-moss transition cursor-pointer"
                        type="button"
                      >
                        Generate Tailored Suggestions
                      </button>
                    </div>
                  )}
                </div>
              )}
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
