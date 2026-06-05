"use client";

import React, { useState, useEffect } from "react";
import {
  UploadCloud,
  FileText,
  Check,
  AlertCircle,
  Loader2,
  Sparkles,
  Cpu,
  Trash2
} from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import { useResumeStore } from "@/lib/resumeStore";

export function ResumeAnalyzerView() {
  const { user } = useAuth();
  const {
    resumes,
    selectedResumeId,
    activeReview,
    isUploading,
    isLoadingList,
    isLoadingReview,
    errorMsg,
    fetchResumes,
    setSelectedResumeId,
    uploadResume,
    deleteResume
  } = useResumeStore();

  const [activeSubTab, setActiveSubTab] = useState<"summary" | "bullets" | "keywords">("summary");
  const [resumeToDeleteId, setResumeToDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchResumes(user.id);
    }
  }, [user?.id]);

  // Silently poll the resume list if there's a pending or processing item
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    const hasPendingOrProcessing = resumes.some(
      (r) => r.status === "PENDING" || r.status === "PROCESSING"
    );
    
    if (hasPendingOrProcessing && user?.id) {
      intervalId = setInterval(async () => {
        await fetchResumes(user.id, undefined, true);
      }, 2000);
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [resumes, user?.id, fetchResumes]);

  const selectedResume = resumes.find(r => r.id === selectedResumeId);
  const isProcessing = selectedResume && (selectedResume.status === "PENDING" || selectedResume.status === "PROCESSING");
  const isFailed = selectedResume && selectedResume.status === "FAILED";

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleUpload(e.target.files[0]);
    }
  };

  const handleUpload = async (file: File) => {
    if (!user?.id) return;
    await uploadResume(file, user.id);
  };

  const confirmDeleteResume = async (id: string) => {
    if (!user?.id) return;
    await deleteResume(id, user.id);
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone & Resume Selector */}
      <div className="grid gap-6 md:grid-cols-3">
        <div
          className="md:col-span-2 rounded-xl border border-dashed border-line bg-panel p-6 shadow-soft text-center flex flex-col items-center justify-center min-h-[160px] relative hover:border-moss/70 transition"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {isUploading ? (
            <div className="space-y-3 py-6">
              <Loader2 className="size-10 animate-spin text-moss mx-auto" />
              <p className="text-sm font-semibold text-ink">Analyzing document text...</p>
              <p className="text-xs text-ink/50">Running parser and scanning keywords with AI</p>
            </div>
          ) : (
            <div className="space-y-3">
              <UploadCloud size={36} className="text-moss/70 mx-auto" />
              <div>
                <p className="text-sm font-semibold text-ink">Drag & drop your resume PDF or DOCX here</p>
                <p className="text-xs text-ink/50 mt-1">Supports PDF, DOCX, TXT up to 10MB</p>
              </div>
              <label className="inline-flex h-9 items-center justify-center rounded-lg bg-ink px-4 text-xs font-semibold text-shell hover:bg-moss cursor-pointer transition">
                Browse Files
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.docx,.txt"
                  onChange={handleFileChange}
                />
              </label>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-line bg-panel p-5 shadow-soft flex flex-col justify-between">
          <div>
            <h4 className="font-semibold text-ink text-sm">Select Active Resume</h4>
            <p className="text-xs text-ink/50 mt-1">Switch resumes to review analysis scoring profiles.</p>
            
            {isLoadingList ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="size-6 animate-spin text-moss" />
              </div>
            ) : resumes.length === 0 ? (
              <p className="text-xs text-ink/40 mt-6 italic text-center">No resumes uploaded yet.</p>
            ) : (
              <div className="mt-4 space-y-2 max-h-[130px] overflow-y-auto pr-1">
                {resumes.map((r) => (
                  <div
                    key={r.id}
                    className={`flex w-full items-center justify-between rounded-lg border p-2 text-left text-xs transition ${
                      selectedResumeId === r.id
                        ? "border-moss bg-mint text-moss font-semibold"
                        : "border-line bg-shell/40 text-ink/80 hover:bg-shell/70"
                    }`}
                  >
                    <button
                      onClick={() => setSelectedResumeId(r.id)}
                      className="flex items-center gap-2 flex-grow truncate text-left"
                      type="button"
                    >
                      <FileText size={14} className="shrink-0 text-ink/60" />
                      <span className="truncate flex-grow mr-2">{r.filename}</span>
                    </button>
                    <div className="flex items-center gap-2 shrink-0 ml-1">
                      {r.status === "PENDING" || r.status === "PROCESSING" ? (
                        <span className="text-[10px] bg-gold/10 text-gold px-1.5 py-0.5 rounded font-medium flex items-center gap-1 animate-pulse">
                          <Loader2 className="size-2.5 animate-spin" />
                          Processing
                        </span>
                      ) : r.status === "FAILED" ? (
                        <span className="text-[10px] bg-coral/10 text-coral px-1.5 py-0.5 rounded font-medium">
                          Failed
                        </span>
                      ) : (
                        <span className="text-[10px] bg-ink/5 px-1.5 py-0.5 rounded font-mono text-ink/60">
                          {r.score}%
                        </span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setResumeToDeleteId(r.id);
                        }}
                        className="text-ink/40 hover:text-coral transition p-0.5"
                        type="button"
                        title="Delete resume"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-coral/10 border border-coral/30 rounded-lg text-xs text-coral font-medium flex items-center gap-2">
          <AlertCircle size={14} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Analysis Results */}
      {isLoadingReview || isUploading || isProcessing ? (
        <div className="rounded-xl border border-line bg-panel p-8 text-center shadow-soft flex flex-col items-center justify-center min-h-[240px]">
          <Loader2 className="size-10 animate-spin text-moss mb-4" />
          <h4 className="font-semibold text-ink text-sm">
            {isProcessing ? "Analyzing Resume Details" : "Loading Review Details"}
          </h4>
          <p className="text-xs text-ink/50 mt-1 max-w-sm mx-auto">
            {isProcessing 
              ? `Gemini AI is parsing and evaluating "${selectedResume?.filename}". This typically takes 10-15 seconds.` 
              : "Fetching ATS alignment, keyword matching, and bullet suggestions..."}
          </p>
        </div>
      ) : isFailed ? (
        <div className="rounded-xl border border-line bg-panel p-8 text-center shadow-soft py-12">
          <AlertCircle size={48} className="text-coral mx-auto mb-4" />
          <h4 className="font-semibold text-coral text-sm">Analysis Failed</h4>
          <p className="text-xs text-ink/50 mt-1 max-w-md mx-auto">
            Gemini AI was unable to parse or analyze this resume. Please ensure the file is not corrupted and try uploading again.
          </p>
        </div>
      ) : !activeReview ? (
        <div className="rounded-xl border border-line bg-panel p-8 text-center shadow-soft">
          <FileText size={48} className="text-ink/20 mx-auto mb-4" />
          <h4 className="font-semibold text-ink text-sm">No Resume Selected</h4>
          <p className="text-xs text-ink/50 mt-1 max-w-md mx-auto">
            Upload a resume in PDF, DOCX, or TXT format above. Gemini AI will extract details, identify ATS keyword alignment, and offer structured tailoring feedback.
          </p>
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
                  <p className="text-5xl font-black text-ink">{activeReview.score}%</p>
                  <span className="text-[10px] uppercase font-bold text-ink/50">Ready Profile</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-ink/80">ATS Keyword Fit</span>
                  <span className="text-moss">{activeReview.atsKeywords}%</span>
                </div>
                <div className="h-2 rounded-full bg-ink/10 overflow-hidden">
                  <div className="h-full bg-moss rounded-full transition-all duration-500" style={{ width: `${activeReview.atsKeywords}%` }} />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-ink/80">Project Impact Metric</span>
                  <span className="text-coral">{activeReview.projectImpact}%</span>
                </div>
                <div className="h-2 rounded-full bg-ink/10 overflow-hidden">
                  <div className="h-full bg-coral rounded-full transition-all duration-500" style={{ width: `${activeReview.projectImpact}%` }} />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-ink/80">Technical Depth Rating</span>
                  <span className="text-gold">{activeReview.interviewDepth}%</span>
                </div>
                <div className="h-2 rounded-full bg-ink/10 overflow-hidden">
                  <div className="h-full bg-gold rounded-full transition-all duration-500" style={{ width: `${activeReview.interviewDepth}%` }} />
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

            <div className="flex-grow pt-4">
              {/* Tab: Summary */}
              {activeSubTab === "summary" && (
                <div className="space-y-4">
                  <div>
                    <h5 className="text-xs font-bold text-moss uppercase">Key Highlights</h5>
                    <div className="mt-2 space-y-2">
                      {activeReview.strengths.map((str, idx) => (
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
                      {activeReview.weaknesses.map((weak, idx) => (
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
                  {activeReview.bulletRewrites.map((item, idx) => (
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
                      {activeReview.missingKeywords.length === 0 ? (
                        <span className="text-xs text-ink/40 italic">None! Excellent keyword coverage.</span>
                      ) : (
                        activeReview.missingKeywords.map((word) => (
                          <span key={word} className="rounded bg-coral/10 border border-coral/30 px-2 py-0.5 text-xs text-coral font-medium">
                            + {word}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-line/40">
                    <h5 className="text-xs font-bold text-ink/70">Matched Keywords</h5>
                    <p className="text-xs text-ink/50 mt-0.5">Successfully identified skills in the parsing session.</p>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {activeReview.matchedKeywords.length === 0 ? (
                        <span className="text-xs text-ink/40 italic">None detected. Add tech stacks.</span>
                      ) : (
                        activeReview.matchedKeywords.map((word) => (
                          <span key={word} className="rounded bg-mint px-2.5 py-0.5 text-xs text-moss font-semibold">
                            ✓ {word}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {resumeToDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-line bg-panel p-6 shadow-soft space-y-4">
            <div className="flex items-center gap-3 text-coral">
              <AlertCircle size={20} className="shrink-0" />
              <h4 className="font-semibold text-sm text-ink">Delete Resume</h4>
            </div>
            <p className="text-xs text-ink/70 leading-relaxed">
              Are you sure you want to delete this resume? This action is permanent and cannot be undone.
            </p>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setResumeToDeleteId(null)}
                className="h-8 px-3 rounded-lg border border-line text-xs font-semibold text-ink/80 hover:bg-shell transition"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (resumeToDeleteId) {
                    confirmDeleteResume(resumeToDeleteId);
                    setResumeToDeleteId(null);
                  }
                }}
                className="h-8 px-3 rounded-lg bg-coral text-xs font-semibold text-white hover:bg-coral/90 transition"
                type="button"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
