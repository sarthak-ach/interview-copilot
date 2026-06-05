import React, { useState, useRef, useEffect } from "react";
import {
  Mic,
  MessageSquare,
  Send,
  Loader2,
  Sparkles,
  Award,
  ChevronRight,
  RefreshCw,
  Info
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/components/AuthContext";

type Message = {
  role: "AI" | "user";
  content: string;
  time: string;
};

type TrackQuestions = {
  questions: string[];
  feedbacks: string[];
};

const tracks: Record<string, TrackQuestions> = {
  "Spring Boot": {
    questions: [
      "Explain how you would avoid N+1 queries in a Spring Boot service.",
      "How do you manage database transactions in Spring, and what are some common pitfalls with the @Transactional annotation?",
      "What is the difference between optimistic locking and pessimistic locking in Spring Data JPA, and when would you use each?"
    ],
    feedbacks: [
      "Excellent first answer. Fetch paths, entity graphs, and DTO projections are the standard ways to eliminate N+1 query loops. Let's move to database handling.",
      "Spot on about Spring's transactional proxy mechanism and the self-invocation pitfall! Now let's tackle database concurrency.",
      "Great distinction! Optimistic locking with @Version is perfect for low-contention scenarios, while pessimistic locking blocks rows for high-write safety."
    ]
  },
  "React & Frontend": {
    questions: [
      "How does the Virtual DOM work in React, and how does React optimize rendering updates?",
      "What are the benefits of using TanStack Query (React Query) over simple useEffect-based data fetching?",
      "Explain how you would optimize a React page that is running slowly due to excessive re-renders."
    ],
    feedbacks: [
      "Solid explanation of the reconciliation process and diffing algorithm. Now let's look at state management and server interactions.",
      "Exactly! Out-of-the-box caching, background updates, auto-retry, and state synchronization save tons of boilerplate. Let's discuss client optimization.",
      "Perfect use cases for useMemo, useCallback, and splitting state! Debouncing inputs and offloading heavy tables can make a night-and-day difference."
    ]
  },
  "System Design": {
    questions: [
      "If you were designing a messaging service like WhatsApp, how would you handle delivery status indicators (sent, delivered, read) at scale?",
      "How would you approach capacity estimation for a platform like YouTube, specifically for bandwidth and storage requirements?",
      "What is the role of a CDN in modern web architecture, and how do you handle cache invalidation?"
    ],
    feedbacks: [
      "Good job mapping state updates through WebSockets and database status flags. Let's shift to resource estimation.",
      "Clear estimations! Multiplying average uploads, compression rates, and request spikes is the exact mathematical path. Let's touch content delivery.",
      "Perfect breakdown of caching content closer to edge points. Using time-to-live configurations and versioned assets is key to invalidation strategies."
    ]
  }
};

export function MockInterviewView() {
  const { user } = useAuth();
  const [sessionState, setSessionState] = useState<"setup" | "chat" | "score">("setup");
  const [selectedTrack, setSelectedTrack] = useState<string>("Spring Boot");
  const [difficulty, setDifficulty] = useState<string>("Senior");
  const [interviewerStyle, setInterviewerStyle] = useState<string>("Standard");
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputVal, setInputVal] = useState<string>("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState<boolean>(false);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);

  const activeQuestions = tracks[selectedTrack]?.questions || [];
  const activeFeedbacks = tracks[selectedTrack]?.feedbacks || [];

  const getFormattedTime = () => {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleStartSession = async () => {
    setIsStarting(true);
    try {
      const data = await apiFetch("/api/interviews/start", {
        method: "POST",
        bodyData: {
          userId: user?.id || "00000000-0000-0000-0000-000000000000",
          category: selectedTrack,
          difficulty: difficulty,
          interviewerStyle: interviewerStyle
        }
      });
      setSessionId(data.id);
      setMessages([
        {
          role: "AI",
          content: `Welcome to your mock interview on the ${selectedTrack} track at ${difficulty} level. My role is to evaluate your answers. Let's begin with the first question:\n\n"${data.firstQuestion}"`,
          time: getFormattedTime()
        }
      ]);
      setCurrentQuestionIndex(0);
      setSessionState("chat");
    } catch (err) {
      console.error("Failed to start session:", err);
      // Fallback local start
      setSessionId(null);
      setMessages([
        {
          role: "AI",
          content: `Welcome to your mock interview (offline fallback). Let's begin with the first question:\n\n"${activeQuestions[0]}"`,
          time: getFormattedTime()
        }
      ]);
      setSessionState("chat");
    } finally {
      setIsStarting(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() || isTyping) return;

    const userText = inputVal.trim();
    setInputVal("");

    // Append user message
    setMessages(prev => [...prev, { role: "user", content: userText, time: getFormattedTime() }]);
    setIsTyping(true);

    try {
      if (sessionId) {
        const data = await apiFetch(`/api/interviews/${sessionId}/messages`, {
          method: "POST",
          bodyData: { content: userText }
        });
        setMessages(prev => [
          ...prev,
          {
            role: "AI",
            content: data.content,
            time: getFormattedTime()
          }
        ]);
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        // Fallback offline progression
        setTimeout(() => {
          setIsTyping(false);
          const nextIndex = currentQuestionIndex + 1;
          if (nextIndex < activeQuestions.length) {
            const feedback = activeFeedbacks[currentQuestionIndex];
            const nextQuestion = activeQuestions[nextIndex];
            setMessages(prev => [
              ...prev,
              {
                role: "AI",
                content: `${feedback}\n\nHere is the next question:\n\n"${nextQuestion}"`,
                time: getFormattedTime()
              }
            ]);
            setCurrentQuestionIndex(nextIndex);
          } else {
            setMessages(prev => [
              ...prev,
              {
                role: "AI",
                content: "Excellent response! That completes all questions in this session. Click the button below to retrieve your comprehensive evaluation and scorecard.",
                time: getFormattedTime()
              }
            ]);
            setCurrentQuestionIndex(nextIndex);
          }
        }, 1500);
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setIsTyping(false);
    }
  };

  const handleEvaluateSession = async () => {
    setSessionState("score");
    setIsEvaluating(true);
    try {
      if (sessionId) {
        const evalData = await apiFetch(`/api/interviews/${sessionId}/evaluate`, {
          method: "POST"
        });
        setEvaluation(evalData);
      } else {
        // Mock fallback evaluation
        setEvaluation({
          overallScore: 8.4,
          clarityScore: 8.5,
          fluencyScore: 9.0,
          concurrencyScore: 7.8,
          keyStrengths: [
            "Clear understanding of N+1 select patterns and resolution methods.",
            "Good layout of transactional annotation behaviors and proxy patterns."
          ],
          areasForGrowth: [
            "Ensure to touch upon write bottlenecks when choosing locking mechanisms.",
            "Could provide more details on transaction isolation levels."
          ]
        });
      }
    } catch (err) {
      console.error("Evaluation failed:", err);
    } finally {
      setIsEvaluating(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  return (
    <div className="rounded-xl border border-line bg-panel p-5 shadow-soft flex flex-col min-h-[500px]">
      {/* Tab Header bar */}
      <div className="flex items-center justify-between border-b border-line pb-4 mb-4">
        <div>
          <h4 className="font-semibold text-ink">AI Mock Interview</h4>
          <p className="text-xs text-ink/60">Practice technical and architectural rounds dynamically</p>
        </div>
        <div className="flex items-center gap-2">
          {sessionState === "chat" && (
            <span className="rounded-full bg-moss/10 px-2.5 py-0.5 text-xs font-semibold text-moss">
              Question {Math.min(currentQuestionIndex + 1, activeQuestions.length)} / {activeQuestions.length}
            </span>
          )}
        </div>
      </div>

      {/* Screen 1: SETUP */}
      {sessionState === "setup" && (
        <div className="flex-1 flex flex-col justify-between">
          <div className="grid gap-6 md:grid-cols-2 mt-4">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-ink/80">Select Tech Stack Track</label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.keys(tracks).map((track) => (
                    <button
                      key={track}
                      onClick={() => setSelectedTrack(track)}
                      className={`h-11 rounded-lg border text-xs font-semibold transition ${
                        selectedTrack === track
                          ? "border-moss bg-mint text-moss"
                          : "border-line bg-shell/30 text-ink/75 hover:bg-shell"
                      }`}
                      type="button"
                    >
                      {track}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-ink/80">Difficulty Level</label>
                <div className="grid grid-cols-3 gap-2">
                  {["Junior", "Mid", "Senior"].map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setDifficulty(lvl)}
                      className={`h-9 rounded-lg border text-xs font-semibold transition ${
                        difficulty === lvl
                          ? "border-moss bg-mint text-moss"
                          : "border-line bg-shell/30 text-ink/75 hover:bg-shell"
                      }`}
                      type="button"
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-ink/80">Interviewer Demeanor</label>
                <div className="grid grid-cols-3 gap-2">
                  {["Friendly", "Standard", "Grill"].map((style) => (
                    <button
                      key={style}
                      onClick={() => setInterviewerStyle(style)}
                      className={`h-9 rounded-lg border text-xs font-semibold transition ${
                        interviewerStyle === style
                          ? "border-moss bg-mint text-moss"
                          : "border-line bg-shell/30 text-ink/75 hover:bg-shell"
                      }`}
                      type="button"
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-shell/50 border border-line/60 p-4 space-y-4">
              <h5 className="text-xs font-bold text-moss flex items-center gap-1.5">
                <Info size={14} /> Session Instructions
              </h5>
              <div className="space-y-2.5 text-xs text-ink/75">
                <p>• You will face <strong>{activeQuestions.length} core questions</strong> related to the selected track.</p>
                <p>• Provide structured responses as you would in a real live interview.</p>
                <p>• The AI interviewer adapts dynamic feedback based on your points.</p>
                <p>• Click <strong>"End and Evaluate"</strong> at any time to calculate scores early.</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleStartSession}
            disabled={isStarting}
            className="flex w-full h-11 items-center justify-center gap-2 rounded-lg bg-ink text-shell text-sm font-semibold transition hover:bg-moss mt-6 disabled:opacity-50"
            type="button"
          >
            {isStarting ? "Initializing..." : "Start Practice Round"}
            {isStarting ? <Loader2 className="animate-spin" size={16} /> : <Mic size={16} />}
          </button>
        </div>
      )}

      {/* Screen 2: ACTIVE CHAT */}
      {sessionState === "chat" && (
        <div className="flex-1 flex flex-col justify-between h-[450px]">
          {/* Scrollable Conversation area */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col max-w-[85%] ${msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start"}`}
              >
                <div
                  className={`rounded-xl p-3.5 text-xs leading-5 ${
                    msg.role === "user" ? "bg-mint text-ink" : "bg-shell/90 border border-line text-ink"
                  }`}
                >
                  <p className="font-semibold text-[9px] uppercase tracking-wide text-moss mb-1">
                    {msg.role === "user" ? "You" : "AI Interviewer"}
                  </p>
                  <p className="whitespace-pre-line font-medium">{msg.content}</p>
                </div>
                <span className="text-[10px] text-ink/40 mt-1 px-1">{msg.time}</span>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-1 bg-shell/80 border border-line rounded-lg p-3 w-fit text-xs text-ink/60">
                <Loader2 size={13} className="animate-spin" />
                Interviewer is drafting comments...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Controls footer */}
          <div className="border-t border-line pt-3 flex flex-col gap-3">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                className="h-11 min-w-0 flex-1 rounded-lg border border-line bg-shell/20 px-3.5 text-xs outline-none focus:border-moss"
                placeholder={currentQuestionIndex >= activeQuestions.length ? "Interview finished." : "Type your technical response here..."}
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                disabled={currentQuestionIndex >= activeQuestions.length || isTyping}
              />
              <button
                type="submit"
                disabled={currentQuestionIndex >= activeQuestions.length || isTyping || !inputVal.trim()}
                className="grid size-11 place-items-center rounded-lg bg-ink text-shell hover:bg-moss transition disabled:opacity-50 shrink-0"
                aria-label="Send Answer"
              >
                <Send size={16} />
              </button>
            </form>

            <div className="flex justify-between items-center gap-2">
              <button
                onClick={() => setSessionState("setup")}
                className="text-xs font-semibold text-ink/60 hover:text-ink"
                type="button"
              >
                Exit Session
              </button>

              <button
                onClick={handleEvaluateSession}
                disabled={isEvaluating}
                className="flex h-9 items-center gap-1.5 rounded-lg bg-coral px-4 text-xs font-semibold text-shell hover:bg-ink transition disabled:opacity-50"
                type="button"
              >
                {isEvaluating ? (
                  <>
                    Evaluating...
                    <Loader2 size={14} className="animate-spin" />
                  </>
                ) : (
                  <>
                    {currentQuestionIndex >= 3 ? "Proceed to Evaluation" : "End & Evaluate"}
                    <ChevronRight size={14} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Screen 3: SCORECARD SUMMARY */}
      {sessionState === "score" && (
        <div className="flex-1 flex flex-col justify-between">
          {isEvaluating ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <Loader2 className="animate-spin text-moss" size={32} />
              <p className="text-sm font-semibold text-ink/70">Analyzing answers & compiling scorecard...</p>
            </div>
          ) : evaluation ? (
            <div className="space-y-5 py-2">
              {/* Score ring */}
              <div className="flex items-center gap-4 bg-shell/60 p-5 border border-line/40 rounded-xl">
                <div className="grid size-14 place-items-center rounded-full bg-mint text-moss shrink-0">
                  <Award size={28} />
                </div>
                <div>
                  <p className="text-xs text-moss font-semibold uppercase">Overall Session Performance</p>
                  <h5 className="text-3xl font-extrabold text-ink">{evaluation.overallScore} / 10</h5>
                </div>
                <div className="ml-auto text-right text-xs">
                  <span className="rounded bg-moss/10 px-2 py-1 text-moss font-bold">
                    {evaluation.overallScore >= 7 ? "Passed" : "Needs Practice"}
                  </span>
                  <p className="mt-1 text-ink/50 text-[10px]">Track: {selectedTrack}</p>
                </div>
              </div>

              {/* Categorized rating list */}
              <div className="space-y-3.5">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span>Explanation Clarity</span>
                    <span>{evaluation.clarityScore} / 10</span>
                  </div>
                  <div className="h-2 rounded-full bg-ink/10 overflow-hidden">
                    <div className="h-full bg-moss" style={{ width: `${evaluation.clarityScore * 10}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span>Framework API Fluency</span>
                    <span>{evaluation.fluencyScore} / 10</span>
                  </div>
                  <div className="h-2 rounded-full bg-ink/10 overflow-hidden">
                    <div className="h-full bg-moss" style={{ width: `${evaluation.fluencyScore * 10}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span>Concurrency & Tuning Principles</span>
                    <span>{evaluation.concurrencyScore} / 10</span>
                  </div>
                  <div className="h-2 rounded-full bg-ink/10 overflow-hidden">
                    <div className="h-full bg-gold" style={{ width: `${evaluation.concurrencyScore * 10}%` }} />
                  </div>
                </div>
              </div>

              {/* Highlights bullet boxes */}
              <div className="grid gap-4 sm:grid-cols-2 pt-2">
                <div className="rounded-lg bg-mint/45 border border-mint/60 p-3 space-y-1.5">
                  <span className="text-xs font-bold text-moss uppercase block mb-1">Key Strengths</span>
                  {evaluation.keyStrengths?.map((str: string, idx: number) => (
                    <p key={idx} className="text-xs text-ink/80">• {str}</p>
                  ))}
                </div>

                <div className="rounded-lg bg-coral/5 border border-coral/10 p-3 space-y-1.5">
                  <span className="text-xs font-bold text-coral uppercase block mb-1">Areas for Growth</span>
                  {evaluation.areasForGrowth?.map((str: string, idx: number) => (
                    <p key={idx} className="text-xs text-ink/80">• {str}</p>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-xs text-ink/50 py-10">No evaluation found.</div>
          )}

          <div className="flex gap-3 mt-6 border-t border-line pt-4">
            <button
              onClick={() => setSessionState("setup")}
              className="flex-1 flex h-11 items-center justify-center gap-1.5 rounded-lg border border-line bg-panel text-xs font-semibold text-ink hover:bg-shell transition"
              type="button"
            >
              <RefreshCw size={13} />
              Try Another Track
            </button>
            <button
              onClick={handleStartSession}
              className="flex-1 flex h-11 items-center justify-center gap-1.5 rounded-lg bg-ink text-xs font-semibold text-shell hover:bg-moss transition"
              type="button"
            >
              Restart This Track
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
