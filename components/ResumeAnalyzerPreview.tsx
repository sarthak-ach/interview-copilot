import { ArrowRight, Check, Gauge, Network, Sparkles, UploadCloud } from "lucide-react";

const strengths = ["Spring Boot APIs", "React performance", "Cloud deployment"];
const missingSkills = ["Kafka", "Redis cache strategy", "OAuth2 resource server"];

function ProgressBar({ value, color = "bg-moss" }: { value: number; color?: string }) {
  return (
    <div className="h-2 rounded-full bg-ink/10">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
    </div>
  );
}

export function ResumeAnalyzerPreview() {
  return (
    <>
      <div className="rounded-lg border border-line bg-panel p-5 shadow-soft">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-lg bg-mint px-3 py-1 text-sm font-medium text-moss">
              <Sparkles size={16} />
              AI + full stack showcase
            </div>
            <h2 className="mt-4 max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl">
              Practice interviews, tune resumes, and track every application.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-ink/68">
              A recruiter-friendly product surface that demonstrates authentication, file upload, AI orchestration,
              caching, analytics, and clean user workflows.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button className="flex h-11 items-center gap-2 rounded-lg bg-ink px-4 font-semibold text-shell" type="button">
                Upload Resume
                <UploadCloud size={18} />
              </button>
              <button className="flex h-11 items-center gap-2 rounded-lg border border-line bg-panel px-4 font-semibold text-ink" type="button">
                Analyze Job
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
          <div className="rounded-lg border border-line bg-shell p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-moss">Resume readiness</p>
                <p className="mt-1 text-4xl font-semibold">82%</p>
              </div>
              <div className="grid size-16 place-items-center rounded-lg bg-sky text-ink">
                <Gauge size={32} />
              </div>
            </div>
            <div className="mt-5 space-y-4">
              <div>
                <div className="mb-2 flex justify-between text-sm">
                  <span>ATS Keywords</span>
                  <span>74%</span>
                </div>
                <ProgressBar value={74} />
              </div>
              <div>
                <div className="mb-2 flex justify-between text-sm">
                  <span>Project Impact</span>
                  <span>88%</span>
                </div>
                <ProgressBar value={88} color="bg-coral" />
              </div>
              <div>
                <div className="mb-2 flex justify-between text-sm">
                  <span>Interview Depth</span>
                  <span>69%</span>
                </div>
                <ProgressBar value={69} color="bg-gold" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <div className="rounded-lg border border-line bg-panel p-5 shadow-soft">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">Job Match Analyzer</h3>
              <p className="text-sm text-ink/62">Resume compared with a pasted job description.</p>
            </div>
            <button className="grid size-9 place-items-center rounded-lg border border-line" type="button" aria-label="Open job match">
              <ArrowRight size={17} />
            </button>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-mint p-4">
              <p className="text-sm font-semibold text-moss">Strong Matches</p>
              <div className="mt-3 space-y-2">
                {strengths.map((item) => (
                  <p key={item} className="flex items-center gap-2 text-sm">
                    <Check size={15} /> {item}
                  </p>
                ))}
              </div>
            </div>
            <div className="rounded-lg bg-shell p-4">
              <p className="text-sm font-semibold text-moss">Missing Keywords</p>
              <div className="mt-3 space-y-2">
                {missingSkills.map((item) => (
                  <p key={item} className="text-sm text-ink/74">
                    {item}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-line bg-panel p-5 shadow-soft">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">System Design Coach</h3>
              <p className="text-sm text-ink/62">Guided practice for flagship architecture rounds.</p>
            </div>
            <Network size={22} className="text-moss" />
          </div>
          <div className="mt-5 rounded-lg border border-line bg-ink p-4 text-shell">
            <div className="flex items-center justify-between gap-3 text-sm text-shell/72">
              <span>Challenge</span>
              <span>Design YouTube</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              {["Requirements", "Capacity", "APIs", "Scaling"].map((item) => (
                <div key={item} className="rounded-lg bg-white/10 p-3">
                  <p>{item}</p>
                  <ProgressBar value={item === "Capacity" ? 58 : 76} color="bg-sky" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
