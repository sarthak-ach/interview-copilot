import { MessageSquareText, Mic } from "lucide-react";

const interviewTurns = [
  { who: "AI", text: "Explain how you would avoid N+1 queries in a Spring Boot service." },
  { who: "You", text: "I would inspect fetch paths, use entity graphs where useful, and prefer DTO projections for read-heavy screens." }
];

export function InterviewChatPreview() {
  return (
    <div className="rounded-lg border border-line bg-panel p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">AI Mock Interview</h3>
          <p className="text-sm text-ink/62">Java + Spring Boot track</p>
        </div>
        <button className="flex h-9 items-center gap-2 rounded-lg bg-ink px-3 text-sm font-semibold text-shell" type="button">
          <Mic size={16} />
          Start
        </button>
      </div>
      <div className="mt-5 space-y-3">
        {interviewTurns.map((turn) => (
          <div key={turn.text} className={`rounded-lg p-4 ${turn.who === "AI" ? "bg-shell" : "bg-mint"}`}>
            <p className="mb-2 text-xs font-semibold uppercase text-moss">{turn.who}</p>
            <p className="text-sm leading-6 text-ink/78">{turn.text}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <input
          className="h-10 min-w-0 flex-1 rounded-lg border border-line px-3 text-sm outline-none focus:border-moss"
          placeholder="Type your answer..."
        />
        <button className="grid size-10 place-items-center rounded-lg bg-coral text-white" type="button" aria-label="Send message">
          <MessageSquareText size={18} />
        </button>
      </div>
    </div>
  );
}
