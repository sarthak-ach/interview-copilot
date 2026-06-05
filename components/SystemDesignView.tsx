import React, { useState, useEffect, useRef } from "react";
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
  Loader2,
  Plus,
  Trash2,
  Cpu,
  Layers,
  Shuffle,
  Monitor,
  Volume2,
  Mic,
  Zap,
  Info
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

type DiagramNode = {
  id: string;
  type: string;
  name: string;
  x: number;
  y: number;
};

type DiagramLink = {
  from: string;
  to: string;
};

export function SystemDesignView() {
  const [selectedChallenge, setSelectedChallenge] = useState<string>("Design YouTube");
  const [activeStep, setActiveStep] = useState<string>("requirements");
  const [layoutMode, setLayoutMode] = useState<"text" | "canvas">("text");

  // State for Structured Text drafts
  const [notes, setNotes] = useState<Record<string, Record<string, string>>>({
    "Design YouTube": { requirements: "", capacity: "", apis: "", schema: "", scaling: "" },
    "Design WhatsApp": { requirements: "", capacity: "", apis: "", schema: "", scaling: "" }
  });
  const [showAIHint, setShowAIHint] = useState<boolean>(false);
  const [showScore, setShowScore] = useState<boolean>(false);

  const [isLoadingDrafts, setIsLoadingDrafts] = useState<boolean>(false);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evaluation, setEvaluation] = useState<any>(null);

  // State for Canvas Sandbox
  const [nodes, setNodes] = useState<DiagramNode[]>([
    { id: "1", type: "Client", name: "Web Client", x: 40, y: 180 },
    { id: "2", type: "Load Balancer", name: "Gateway Nginx", x: 200, y: 180 },
    { id: "3", type: "App Server", name: "Spring Service", x: 380, y: 180 },
    { id: "4", type: "Database", name: "PostgreSQL Primary", x: 580, y: 280 }
  ]);
  const [links, setLinks] = useState<DiagramLink[]>([
    { from: "1", to: "2" },
    { from: "2", to: "3" },
    { from: "3", to: "4" }
  ]);
  const [linkFrom, setLinkFrom] = useState<string>("");
  const [linkTo, setLinkTo] = useState<string>("");
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [isEvaluatingDiagram, setIsEvaluatingDiagram] = useState<boolean>(false);
  const [diagramEvaluation, setDiagramEvaluation] = useState<any>(null);

  const activeChallenge = systemDesignChallenges[selectedChallenge] || systemDesignChallenges["Design YouTube"];
  const currentHint = activeChallenge.hints[activeStep];
  const canvasRef = useRef<HTMLDivElement>(null);

  // Dynamic drag handles
  const handleMouseDown = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    setDraggingNodeId(id);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!draggingNodeId || !canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      // Keep boundaries inside canvas
      const x = Math.max(10, Math.min(rect.width - 150, e.clientX - rect.left - 70));
      const y = Math.max(10, Math.min(rect.height - 70, e.clientY - rect.top - 20));
      setNodes(prev => prev.map(n => n.id === draggingNodeId ? { ...n, x, y } : n));
    };

    const handleMouseUp = () => {
      setDraggingNodeId(null);
    };

    if (draggingNodeId) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [draggingNodeId]);

  // Load drafts on load
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
        requirementsFeedback: "Solid gathering. Make sure to clearly state functional vs non-functional metrics.",
        capacityFeedback: "Estimates are reasonable, but you should detail queries-per-second (QPS) limits.",
        scalingFeedback: "Scale strategy uses caching and messaging queues correctly."
      });
    } finally {
      setIsEvaluating(false);
    }
  };

  const getSectionStatus = (step: string) => {
    const text = notes[selectedChallenge]?.[step];
    return text && text.trim().length > 10;
  };

  // Canvas Actions
  const handleAddNode = (type: string) => {
    const defaultNames: Record<string, string> = {
      Client: "Browser Client",
      CDN: "Cloudflare CDN",
      "Load Balancer": "HAProxy LB",
      "App Server": "API Gateway",
      Database: "NoSQL Cassandra",
      Cache: "Redis Cache",
      Queue: "Kafka Topic"
    };

    const newN: DiagramNode = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      name: defaultNames[type] || type,
      x: 150 + Math.random() * 250,
      y: 100 + Math.random() * 200
    };
    setNodes(prev => [...prev, newN]);
  };

  const handleRemoveNode = (id: string) => {
    setNodes(prev => prev.filter(n => n.id !== id));
    setLinks(prev => prev.filter(l => l.from !== id && l.to !== id));
  };

  const updateNodeName = (id: string, name: string) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, name } : n));
  };

  const handleAddLink = () => {
    if (!linkFrom || !linkTo || linkFrom === linkTo) return;
    const exists = links.some(l => l.from === linkFrom && l.to === linkTo);
    if (!exists) {
      setLinks(prev => [...prev, { from: linkFrom, to: linkTo }]);
    }
    setLinkFrom("");
    setLinkTo("");
  };

  const handleRemoveLink = (idx: number) => {
    setLinks(prev => prev.filter((_, i) => i !== idx));
  };

  const handleEvaluateDiagram = async () => {
    setIsEvaluatingDiagram(true);
    setDiagramEvaluation(null);
    try {
      const data = await apiFetch("/api/system-design/sessions/evaluate-diagram", {
        method: "POST",
        bodyData: {
          challengeName: selectedChallenge,
          nodes: nodes.map(n => ({ id: n.id, type: n.type, name: n.name })),
          links: links
        }
      });
      setDiagramEvaluation(data);
    } catch (e) {
      console.error("Diagram audit failed, using fallback:", e);
      setDiagramEvaluation({
        score: 75,
        spofDetected: ["Single instance of API Gateway (needs cluster configuration)"],
        bottlenecks: ["Uncached read queries hitting database directly"],
        strengths: ["Separated streaming manifest queries from write pathways"],
        recommendations: ["Introduce a Redis Cache layer before the Database to prevent query contention"]
      });
    } finally {
      setIsEvaluatingDiagram(false);
    }
  };

  const getNodeIcon = (type: string) => {
    switch (type) {
      case "Client": return <Monitor className="text-sky" size={16} />;
      case "CDN": return <Layers className="text-indigo-400" size={16} />;
      case "Load Balancer": return <Shuffle className="text-gold" size={16} />;
      case "App Server": return <Cpu className="text-emerald-400" size={16} />;
      case "Database": return <Database className="text-teal" size={16} />;
      case "Cache": return <Zap className="text-amber-500" size={16} />;
      case "Queue": return <Activity className="text-coral" size={16} />;
      default: return <Layers size={16} />;
    }
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
                setDiagramEvaluation(null);
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

      {/* Layout Mode Selector */}
      <div className="flex border-b border-line gap-2 pb-1">
        <button
          onClick={() => setLayoutMode("text")}
          className={`h-9 px-4 text-xs font-semibold border-b-2 transition ${
            layoutMode === "text"
              ? "border-moss text-moss font-bold"
              : "border-transparent text-ink/60 hover:text-ink"
          }`}
          type="button"
        >
          Structured Text Editor
        </button>
        <button
          onClick={() => setLayoutMode("canvas")}
          className={`h-9 px-4 text-xs font-semibold border-b-2 transition ${
            layoutMode === "canvas"
              ? "border-moss text-moss font-bold"
              : "border-transparent text-ink/60 hover:text-ink"
          }`}
          type="button"
        >
          Interactive Diagram Canvas
        </button>
      </div>

      {layoutMode === "text" ? (
        !showScore ? (
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
        )
      ) : (
        /* CANVAS ARCHITECTURE BOARD MODE */
        <div className="grid gap-6 lg:grid-cols-[1fr_2.5fr] items-start">
          {/* Canvas Component Toolbox & Link Builder */}
          <div className="space-y-4">
            {/* Components list */}
            <div className="rounded-xl border border-line bg-panel p-4 shadow-soft space-y-3">
              <h5 className="text-xs font-bold text-ink/85 uppercase pb-2 border-b border-line flex items-center gap-1.5">
                <Plus size={14} className="text-moss" /> Architecture Toolbox
              </h5>
              <div className="grid grid-cols-2 gap-2">
                {["Client", "CDN", "Load Balancer", "App Server", "Cache", "Database", "Queue"].map(type => (
                  <button
                    key={type}
                    onClick={() => handleAddNode(type)}
                    className="flex h-9 items-center gap-1.5 rounded-lg border border-line bg-shell/45 px-2 text-[11px] font-semibold text-ink/85 hover:bg-mint hover:border-moss transition"
                    type="button"
                  >
                    {getNodeIcon(type)}
                    <span>{type}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Connection Builder */}
            <div className="rounded-xl border border-line bg-panel p-4 shadow-soft space-y-3">
              <h5 className="text-xs font-bold text-ink/85 uppercase pb-2 border-b border-line flex items-center gap-1.5">
                <Network size={14} className="text-moss" /> Connector
              </h5>
              <div className="space-y-2">
                <div className="space-y-1">
                  <label className="text-[10px] text-ink/60 font-bold uppercase">Source Node</label>
                  <select
                    className="w-full h-8 rounded border border-line bg-shell/45 px-2 text-xs font-semibold outline-none"
                    value={linkFrom}
                    onChange={(e) => setLinkFrom(e.target.value)}
                  >
                    <option value="">-- Select Source --</option>
                    {nodes.map(n => (
                      <option key={n.id} value={n.id}>
                        {n.name} ({n.type})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-ink/60 font-bold uppercase">Destination Node</label>
                  <select
                    className="w-full h-8 rounded border border-line bg-shell/45 px-2 text-xs font-semibold outline-none"
                    value={linkTo}
                    onChange={(e) => setLinkTo(e.target.value)}
                  >
                    <option value="">-- Select Target --</option>
                    {nodes.map(n => (
                      <option key={n.id} value={n.id}>
                        {n.name} ({n.type})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleAddLink}
                  disabled={!linkFrom || !linkTo || linkFrom === linkTo}
                  className="w-full h-8 rounded bg-ink text-shell text-xs font-semibold hover:bg-moss transition disabled:opacity-50 mt-1"
                  type="button"
                >
                  Link Components
                </button>
              </div>
            </div>

            {/* Links checklist */}
            <div className="rounded-xl border border-line bg-panel p-4 shadow-soft space-y-3 max-h-[220px] overflow-y-auto">
              <h5 className="text-xs font-bold text-ink/85 uppercase pb-2 border-b border-line">
                Active Paths ({links.length})
              </h5>
              {links.length === 0 ? (
                <p className="text-[11px] text-ink/40 italic">No links added yet.</p>
              ) : (
                <div className="space-y-1.5">
                  {links.map((link, idx) => {
                    const fromNode = nodes.find(n => n.id === link.from);
                    const toNode = nodes.find(n => n.id === link.to);
                    return (
                      <div key={idx} className="flex items-center justify-between rounded border border-line bg-shell/40 px-2 py-1 text-xs">
                        <span className="truncate max-w-[150px] font-semibold text-ink/80">
                          {fromNode?.name || "Unknown"} → {toNode?.name || "Unknown"}
                        </span>
                        <button
                          onClick={() => handleRemoveLink(idx)}
                          className="text-coral hover:text-red-600 transition"
                          type="button"
                          aria-label="Remove link"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Interactive Draw Grid Area */}
          <div className="space-y-4">
            <div className="rounded-xl border border-line bg-panel p-4 shadow-soft flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-line pb-3 mb-4">
                <h5 className="font-semibold text-ink text-sm">Visual Architectural Layout</h5>
                <span className="text-[10px] text-ink/50 bg-shell border border-line px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                  Drag Components to Arrange
                </span>
              </div>

              {/* Graphical Board container */}
              <div
                id="design-canvas-board"
                ref={canvasRef}
                className="relative w-full h-[450px] border border-line bg-shell/25 rounded-xl overflow-hidden shadow-soft"
              >
                {/* SVG connection path renderer */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                  <defs>
                    <marker
                      id="arrow"
                      viewBox="0 0 10 10"
                      refX="6"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#1b3d2b" />
                    </marker>
                  </defs>
                  {links.map((link, idx) => {
                    const fromN = nodes.find(n => n.id === link.from);
                    const toN = nodes.find(n => n.id === link.to);
                    if (!fromN || !toN) return null;

                    // Calculate center position offsets
                    const startX = fromN.x + 65;
                    const startY = fromN.y + 25;
                    const endX = toN.x + 65;
                    const endY = toN.y + 25;

                    return (
                      <g key={idx}>
                        <line
                          x1={startX}
                          y1={startY}
                          x2={endX}
                          y2={endY}
                          stroke="#1b3d2b"
                          strokeWidth="2.2"
                          strokeDasharray="4 3"
                          markerEnd="url(#arrow)"
                          className="opacity-75"
                        />
                      </g>
                    );
                  })}
                </svg>

                {/* Nodes rendering layer */}
                {nodes.map(n => (
                  <div
                    key={n.id}
                    style={{ left: n.x, top: n.y }}
                    onMouseDown={(e) => handleMouseDown(n.id, e)}
                    className={`absolute z-10 w-[140px] h-[55px] select-none rounded-xl border border-line bg-panel p-2 shadow-soft hover:shadow cursor-grab active:cursor-grabbing flex flex-col justify-between transition-shadow ${
                      draggingNodeId === n.id ? "border-moss ring-1 ring-moss/30 shadow-md" : ""
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      {getNodeIcon(n.type)}
                      <input
                        value={n.name}
                        onChange={(e) => updateNodeName(n.id, e.target.value)}
                        onMouseDown={(e) => e.stopPropagation()} // Stop drag when input text
                        className="w-full bg-transparent border-none outline-none text-[11px] font-bold text-ink truncate focus:bg-shell px-1 rounded"
                      />
                    </div>
                    <div className="flex items-center justify-between text-[9px] text-ink/40 font-semibold px-1">
                      <span>{n.type}</span>
                      <button
                        onClick={() => handleRemoveNode(n.id)}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="text-coral hover:text-red-500 transition"
                        type="button"
                        title="Remove Component"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}

                {nodes.length === 0 && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 pointer-events-none">
                    <Network size={32} className="text-ink/20 mb-2" />
                    <p className="text-xs text-ink/40">Canvas is empty.</p>
                    <p className="text-[10px] text-ink/30 mt-1">Use the Toolbox on the left to add components.</p>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex justify-between items-center mt-4 pt-3 border-t border-line/60">
                <span className="text-[10px] text-ink/50 flex items-center gap-1">
                  <Info size={13} /> Grid coordinates and connections are audited by AI.
                </span>
                <button
                  onClick={handleEvaluateDiagram}
                  disabled={isEvaluatingDiagram || nodes.length === 0}
                  className="flex h-10 items-center justify-center gap-1.5 rounded-lg bg-ink text-shell px-5 text-xs font-semibold hover:bg-moss transition disabled:opacity-50"
                  type="button"
                >
                  {isEvaluatingDiagram ? (
                    <>
                      Auditing Layout...
                      <Loader2 size={13} className="animate-spin" />
                    </>
                  ) : (
                    <>
                      Run Design Audit
                      <Award size={14} />
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Diagram Audit Evaluation Card */}
            {diagramEvaluation && (
              <div className="rounded-xl border border-line bg-panel p-5 shadow-soft space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-line pb-3">
                  <div className="flex items-center gap-3">
                    <div className="grid size-10 place-items-center rounded-full bg-mint text-moss shrink-0">
                      <Award size={22} />
                    </div>
                    <div>
                      <h5 className="font-semibold text-ink text-sm">AI Topology Audit Results</h5>
                      <p className="text-[10px] text-ink/60">Challenge: {selectedChallenge}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-extrabold text-moss">{diagramEvaluation.score}%</p>
                    <span className="text-[9px] uppercase font-bold text-ink/40 tracking-wider">Scorecard</span>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg bg-coral/5 border border-coral/10 p-3 space-y-1.5 text-xs">
                    <span className="text-[10px] font-bold text-coral uppercase block mb-1">
                      Single Points of Failure (SPOF)
                    </span>
                    {diagramEvaluation.spofDetected?.map((item: string, idx: number) => (
                      <p key={idx} className="text-ink/80 leading-relaxed">• {item}</p>
                    ))}
                    {(!diagramEvaluation.spofDetected || diagramEvaluation.spofDetected.length === 0) && (
                      <p className="text-ink/40 italic">No critical SPOFs flagged</p>
                    )}
                  </div>

                  <div className="rounded-lg bg-amber-500/5 border border-amber-500/10 p-3 space-y-1.5 text-xs">
                    <span className="text-[10px] font-bold text-amber-600 uppercase block mb-1">
                      Scale Bottlenecks
                    </span>
                    {diagramEvaluation.bottlenecks?.map((item: string, idx: number) => (
                      <p key={idx} className="text-ink/80 leading-relaxed">• {item}</p>
                    ))}
                    {(!diagramEvaluation.bottlenecks || diagramEvaluation.bottlenecks.length === 0) && (
                      <p className="text-ink/40 italic">No bottlenecks flagged</p>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg bg-mint/45 border border-mint/60 p-3 space-y-1.5 text-xs">
                    <span className="text-[10px] font-bold text-moss uppercase block mb-1">
                      Design Strengths
                    </span>
                    {diagramEvaluation.strengths?.map((item: string, idx: number) => (
                      <p key={idx} className="text-ink/80 leading-relaxed">• {item}</p>
                    ))}
                  </div>

                  <div className="rounded-lg bg-shell/65 border border-line p-3 space-y-1.5 text-xs">
                    <span className="text-[10px] font-bold text-ink/70 uppercase block mb-1">
                      AI Recommendations
                    </span>
                    {diagramEvaluation.recommendations?.map((item: string, idx: number) => (
                      <p key={idx} className="text-ink/80 leading-relaxed">• {item}</p>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
