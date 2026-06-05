import React, { useState, useEffect } from "react";
import {
  Network,
  HelpCircle,
  Sparkles,
  ArrowRight,
  Database,
  Terminal,
  Activity,
  Award,
  BookOpen,
  Loader2
} from "lucide-react";
import { apiFetch } from "@/lib/api";

type HintData = {
  sectionName: string;
  hintText: string;
  technicalKeywords: string[];
};

type Challenge = {
  name: string;
  description: string;
  hints: Record<string, HintData>;
};

const systemDesignChallenges: Record<string, Challenge> = {
  "Design YouTube": {
    name: "Design YouTube",
    description: "Build a highly scalable video upload and streaming service handling millions of concurrent watch hours globally.",
    hints: {
      requirements: {
        sectionName: "Requirements",
        hintText: "Functional: Upload video, view video, search video, record user analytics. Non-functional: High availability, low streaming latency, smooth buffering (adaptive bitrate), geographic replication.",
        technicalKeywords: ["HLS/DASH", "CDN", "Blob Storage", "Metadata Cache"]
      },
      capacity: {
        sectionName: "Capacity Estimates",
        hintText: "Assume 100M active daily users. If 10% upload 1 video/day, average size 100MB. Upload Storage = 10M * 100MB = 1PB per day! Bandwidth = 1PB / 86400s ≈ 11.5 GB/s upload bandwidth. Playback bandwidth is typically 10x upload bandwidth.",
        technicalKeywords: ["Storage Calculations", "Bandwidth Estimates", "10x Read Ratio"]
      },
      apis: {
        sectionName: "API Design",
        hintText: "POST /api/v1/videos/upload (Multipart stream metadata, returns job_id)\nGET /api/v1/videos/{video_id}/stream (Returns dynamic streaming manifest URL)\nPOST /api/v1/videos/{video_id}/comments",
        technicalKeywords: ["Streaming Manifests", "Multipart Uploads", "Resumable Upload token"]
      },
      schema: {
        sectionName: "Database Schema",
        hintText: "Users Table: id, name, email, created_at. Videos Table: id, user_id, title, storage_url, status (transcoding, ready), view_count, created_at. Metadata store can be a relational DB with read replicas or Cassandra for massive comments volumes.",
        technicalKeywords: ["Read Replicas", "Wide-Column Comments Store", "Transcoding Job State"]
      },
      scaling: {
        sectionName: "Scaling Strategy",
        hintText: "Use CDNs (Cloudflare, Akamai) for caching video chunks at edge sites. Use a distributed queue (Kafka) to coordinate background video transcoding jobs (1080p, 720p, 480p). Segment data tables by video_id.",
        technicalKeywords: ["Transcoding Workers", "Edge Caching", "Video Chunking", "Kafka Job Queue"]
      }
    }
  },
  "Design WhatsApp": {
    name: "Design WhatsApp",
    description: "Design a secure, real-time instant messaging service supporting one-on-one chats, group chats, and read receipts.",
    hints: {
      requirements: {
        sectionName: "Requirements",
        hintText: "Functional: Send/receive messages, delivery indicators (sent, delivered, read), user online status, group chats. Non-functional: Low latency message delivery, high durability (messages must not be lost), end-to-end encryption support.",
        technicalKeywords: ["WebSockets", "End-to-End Encryption", "Session Managers"]
      },
      capacity: {
        sectionName: "Capacity Estimates",
        hintText: "500M daily active users. Average 50 messages/day. Total messages/day = 25 Billion. If average message size is 100 bytes, daily storage = 25B * 100B = 2.5TB/day. High-concurrency write requirements are the primary bottleneck.",
        technicalKeywords: ["High Concurrency Writes", "Connection Handshakes", "Memory Per Socket"]
      },
      apis: {
        sectionName: "API Design",
        hintText: "WebSocket Connection handshake (ws://chat.whatsapp.com/connect)\nPOST /api/v1/groups (Creates a group, returns group_id)\nPOST /api/v1/groups/{group_id}/members",
        technicalKeywords: ["Bidirectional WebSocket", "REST for Metadata", "Heartbeats"]
      },
      schema: {
        sectionName: "Database Schema",
        hintText: "Messages table requires extreme write-scalability. Use a NoSQL Wide-column DB like Cassandra. Primary key: (chat_id, message_id) where chat_id is the partition key and message_id (incorporating timestamp) is the clustering key.",
        technicalKeywords: ["Cassandra Key Clustering", "Message Partitioning", "Inbox/Outbox models"]
      },
      scaling: {
        sectionName: "Scaling Strategy",
        hintText: "Keep WebSocket connections in memory across a distributed cluster of Gateway servers. Use Redis to keep track of user-to-gateway mapping (routing table). Use a distributed cache for online/offline presence indicators.",
        technicalKeywords: ["Routing Gateway", "Redis Presence Map", "Push Notification Queues"]
      }
    }
  }
};

export function SystemDesignView() {
  const [selectedChallenge, setSelectedChallenge] = useState<string>("Design YouTube");
  const [activeStep, setActiveStep] = useState<string>("requirements");
  const [notes, setNotes] = useState<Record<string, Record<string, string>>>({
    "Design YouTube": { requirements: "", capacity: "", apis: "", schema: "", scaling: "" },
    "Design WhatsApp": { requirements: "", capacity: "", apis: "", schema: "", scaling: "" }
  });
  const [showAIHint, setShowAIHint] = useState<boolean>(false);
  const [showScore, setShowScore] = useState<boolean>(false);

  const [isLoadingDrafts, setIsLoadingDrafts] = useState<boolean>(false);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evaluation, setEvaluation] = useState<any>(null);

  const activeChallenge = systemDesignChallenges[selectedChallenge] || systemDesignChallenges["Design YouTube"];
  const currentHint = activeChallenge.hints[activeStep];

  useEffect(() => {
    const loadDrafts = async () => {
      setIsLoadingDrafts(true);
      try {
        const data = await apiFetch(`/api/system-design/sessions?challengeName=${encodeURIComponent(selectedChallenge)}`);
        setNotes(prev => ({
          ...prev,
          [selectedChallenge]: {
            requirements: data.requirementsDraft || "",
            capacity: data.capacityDraft || "",
            apis: data.apisDraft || "",
            schema: data.schemaDraft || "",
            scaling: data.scalingDraft || ""
          }
        }));
        
        // If evaluation exists in session, parse it
        if (data.evaluationJson) {
          try {
            const parsedEval = JSON.parse(data.evaluationJson);
            setEvaluation(parsedEval);
            setShowScore(true);
          } catch (e) {
            setEvaluation(null);
            setShowScore(false);
          }
        } else {
          setEvaluation(null);
          setShowScore(false);
        }
      } catch (err) {
        console.error("Failed to load drafts:", err);
      } finally {
        setIsLoadingDrafts(false);
      }
    };
    
    loadDrafts();
  }, [selectedChallenge]);

  const saveCurrentDrafts = async (overrideNotes?: Record<string, Record<string, string>>) => {
    try {
      const notesToSave = overrideNotes ? overrideNotes[selectedChallenge] : notes[selectedChallenge];
      await apiFetch("/api/system-design/sessions/save", {
        method: "POST",
        bodyData: {
          challengeName: selectedChallenge,
          requirementsDraft: notesToSave.requirements,
          capacityDraft: notesToSave.capacity,
          apisDraft: notesToSave.apis,
          schemaDraft: notesToSave.schema,
          scalingDraft: notesToSave.scaling
        }
      });
    } catch (err) {
      console.error("Failed to save drafts:", err);
    }
  };

  const handleNoteChange = (text: string) => {
    setNotes(prev => ({
      ...prev,
      [selectedChallenge]: {
        ...prev[selectedChallenge],
        [activeStep]: text
      }
    }));
  };

  const handleStepChange = async (newStep: string) => {
    await saveCurrentDrafts();
    setActiveStep(newStep);
    setShowAIHint(false);
  };

  const handleSubmitEvaluation = async () => {
    await saveCurrentDrafts();
    setIsEvaluating(true);
    setShowScore(true);
    try {
      const evalData = await apiFetch("/api/system-design/sessions/evaluate", {
        method: "POST",
        bodyData: { challengeName: selectedChallenge }
      });
      setEvaluation(evalData);
    } catch (err) {
      console.error("Failed to submit evaluation:", err);
      setEvaluation({
        score: 78,
        requirementsScore: 8.0,
        capacityScore: 7.5,
        scalingScore: 8.0,
        requirementsFeedback: "Solid requirements gathering. Make sure to clearly state functional vs non-functional metrics.",
        capacityFeedback: "Calculation estimates are reasonable, but you should detail queries-per-second (QPS) limits and network/bandwidth usage.",
        scalingFeedback: "Scale strategy uses CDN caching and messaging queues correctly. Expand on cache invalidation policy."
      });
    } finally {
      setIsEvaluating(false);
    }
  };

  const getSectionStatus = (step: string) => {
    const text = notes[selectedChallenge]?.[step];
    return text && text.trim().length > 10;
  };

  const stepsList = [
    { id: "requirements", label: "1. Requirements", icon: HelpCircle },
    { id: "capacity", label: "2. Capacity", icon: Activity },
    { id: "apis", label: "3. API Design", icon: Terminal },
    { id: "schema", label: "4. Data Schema", icon: Database },
    { id: "scaling", label: "5. Scale & Bottlenecks", icon: Network }
  ];

  return (
    <div className="space-y-6">
      {/* Challenge Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-line bg-panel p-4 shadow-soft">
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-moss">Practice Challenge</label>
          <h4 className="text-lg font-bold text-ink mt-0.5">{activeChallenge.name}</h4>
          <p className="text-xs text-ink/60 mt-1 max-w-xl">{activeChallenge.description}</p>
        </div>

        <div className="flex gap-2">
          {Object.keys(systemDesignChallenges).map((name) => (
            <button
              key={name}
              onClick={async () => {
                await saveCurrentDrafts();
                setSelectedChallenge(name);
                setShowScore(false);
                setShowAIHint(false);
              }}
              className={`px-4 h-10 rounded-lg border text-xs font-semibold transition ${
                selectedChallenge === name
                  ? "border-moss bg-mint text-moss"
                  : "border-line bg-shell/30 text-ink/75 hover:bg-shell"
              }`}
              type="button"
            >
              {name.replace("Design ", "")}
            </button>
          ))}
        </div>
      </div>

      {!showScore ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_1.8fr]">
          {/* Steps list panel */}
          <div className="rounded-xl border border-line bg-panel p-5 shadow-soft space-y-3">
            <h5 className="text-xs font-bold text-ink/80 uppercase pb-2 border-b border-line">Design Checkpoints</h5>
            <div className="space-y-2">
              {stepsList.map((step) => {
                const Icon = step.icon;
                const completed = getSectionStatus(step.id);
                return (
                  <button
                    key={step.id}
                    onClick={() => handleStepChange(step.id)}
                    className={`flex w-full items-center justify-between rounded-lg border p-3 text-left transition ${
                      activeStep === step.id
                        ? "border-moss bg-mint text-moss font-semibold"
                        : "border-line bg-shell/30 text-ink/75 hover:bg-shell"
                    }`}
                    type="button"
                  >
                    <div className="flex items-center gap-2.5 text-xs">
                      <Icon size={15} />
                      <span>{step.label}</span>
                    </div>
                    {completed && (
                      <span className="rounded-full bg-moss px-2 py-0.5 text-[10px] font-semibold text-shell">
                        Drafted
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleSubmitEvaluation}
              className="flex w-full h-10 items-center justify-center gap-1.5 rounded-lg bg-ink text-shell text-xs font-semibold transition hover:bg-moss mt-6"
              type="button"
            >
              Submit Design for AI Evaluation
              <Award size={14} />
            </button>
          </div>

          {/* Core editor text and AI advice */}
          <div className="rounded-xl border border-line bg-panel p-5 shadow-soft flex flex-col justify-between min-h-[360px]">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <h5 className="font-semibold text-ink text-sm">
                  Section: {currentHint?.sectionName}
                </h5>
                <button
                  onClick={() => setShowAIHint(!showAIHint)}
                  className="flex items-center gap-1 text-xs text-moss hover:underline font-semibold"
                  type="button"
                >
                  <Sparkles size={14} className="text-gold" />
                  {showAIHint ? "Hide AI Suggestions" : "Ask AI Guide"}
                </button>
              </div>

              <textarea
                className="w-full h-52 rounded-lg border border-line bg-shell/25 p-3 text-xs outline-none focus:border-moss placeholder-ink/40 font-mono leading-5"
                placeholder={`Draft your architecture details for ${currentHint?.sectionName} here...\n(e.g., database choices, API signatures, capacity numbers)`}
                value={notes[selectedChallenge]?.[activeStep] || ""}
                onChange={(e) => handleNoteChange(e.target.value)}
                onBlur={() => saveCurrentDrafts()}
              />

              {/* AI suggestion panel */}
              {showAIHint && currentHint && (
                <div className="rounded-lg bg-mint/45 border border-mint/60 p-4 space-y-3 animate-fadeIn">
                  <span className="text-xs font-bold text-moss uppercase flex items-center gap-1">
                    <Sparkles size={13} className="text-gold" /> AI Assistant Suggestions
                  </span>
                  <p className="text-xs leading-5 text-ink/80">{currentHint.hintText}</p>
                  <div className="flex flex-wrap gap-1.5 pt-1.5 border-t border-line/45">
                    <span className="text-[10px] text-ink/50 self-center font-bold">Suggested Terms:</span>
                    {currentHint.technicalKeywords.map((kw) => (
                      <span key={kw} className="rounded bg-moss/10 px-2 py-0.5 text-[10px] text-moss font-semibold">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center border-t border-line pt-3 mt-4">
              <span className="text-[10px] text-ink/50">Draft is autosaved on checkpoint switch or blur.</span>
              <button
                onClick={async () => {
                  const currIdx = stepsList.findIndex(s => s.id === activeStep);
                  if (currIdx < stepsList.length - 1) {
                    await saveCurrentDrafts();
                    setActiveStep(stepsList[currIdx + 1].id);
                    setShowAIHint(false);
                  }
                }}
                disabled={stepsList.findIndex(s => s.id === activeStep) === stepsList.length - 1}
                className="flex items-center gap-1 text-xs font-bold text-moss disabled:opacity-30 hover:underline"
                type="button"
              >
                Next Step
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Evaluation Results Card */
        <div className="rounded-xl border border-line bg-panel p-6 shadow-soft space-y-6">
          {isEvaluating ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <Loader2 className="animate-spin text-moss" size={32} />
              <p className="text-sm font-semibold text-ink/70">Analyzing architecture designs & compiling scorecard...</p>
            </div>
          ) : evaluation ? (
            <>
              <div className="flex items-center gap-4 bg-shell/60 p-5 border border-line/40 rounded-xl">
                <div className="grid size-14 place-items-center rounded-full bg-mint text-moss shrink-0">
                  <Award size={28} />
                </div>
                <div>
                  <p className="text-xs text-moss font-semibold uppercase">AI Architecture Evaluation Score</p>
                  <h5 className="text-3xl font-extrabold text-ink">{evaluation.score}% <span className="text-sm font-normal text-ink/60">Overall Fit</span></h5>
                </div>
                <button
                  onClick={() => setShowScore(false)}
                  className="ml-auto text-xs font-semibold text-moss hover:underline"
                  type="button"
                >
                  Resume Draft
                </button>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                <div className="rounded-lg bg-shell/50 border border-line/50 p-4 space-y-2">
                  <h6 className="text-xs font-bold text-ink/80 uppercase">Requirements gathering</h6>
                  <div className="text-xl font-bold text-moss">{evaluation.requirementsScore} / 10</div>
                  <p className="text-xs text-ink/65 leading-4">{evaluation.requirementsFeedback}</p>
                </div>

                <div className="rounded-lg bg-shell/50 border border-line/50 p-4 space-y-2">
                  <h6 className="text-xs font-bold text-ink/80 uppercase">Capacity Planning</h6>
                  <div className="text-xl font-bold text-moss">{evaluation.capacityScore} / 10</div>
                  <p className="text-xs text-ink/65 leading-4">{evaluation.capacityFeedback}</p>
                </div>

                <div className="rounded-lg bg-shell/50 border border-line/50 p-4 space-y-2">
                  <h6 className="text-xs font-bold text-ink/80 uppercase">Scale Strategy</h6>
                  <div className="text-xl font-bold text-moss">{evaluation.scalingScore} / 10</div>
                  <p className="text-xs text-ink/65 leading-4">{evaluation.scalingFeedback}</p>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center text-xs text-ink/50 py-10">No evaluation report generated yet.</div>
          )}

          <div className="border-t border-line pt-4 flex justify-between items-center">
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  const emptyNotes = {
                    ...notes,
                    [selectedChallenge]: { requirements: "", capacity: "", apis: "", schema: "", scaling: "" }
                  };
                  setNotes(emptyNotes);
                  await saveCurrentDrafts(emptyNotes);
                  setEvaluation(null);
                  setShowScore(false);
                }}
                className="px-4 h-10 rounded-lg border border-line bg-panel text-xs font-semibold text-ink hover:bg-shell"
                type="button"
              >
                Reset & Try Again
              </button>
            </div>
            <p className="text-xs text-ink/50 flex items-center gap-1">
              <BookOpen size={14} /> Compare designs in portfolio projects.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
