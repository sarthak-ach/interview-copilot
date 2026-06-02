import { CalendarClock } from "lucide-react";

const applications = [
  { company: "Stripe", role: "Full Stack Engineer", status: "Technical Round", date: "Jun 06" },
  { company: "Atlassian", role: "Senior Java Developer", status: "Recruiter Screen", date: "Jun 10" },
  { company: "Shopify", role: "Backend Engineer", status: "Applied", date: "Jun 14" }
];

export function ApplicationPipeline() {
  return (
    <div className="rounded-lg border border-line bg-panel p-5 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Application Pipeline</h3>
          <p className="text-sm text-ink/62">Kanban preview for Phase 7.</p>
        </div>
        <CalendarClock size={21} className="text-moss" />
      </div>
      <div className="mt-4 space-y-3">
        {applications.map((app) => (
          <div key={app.company} className="rounded-lg border border-line p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{app.company}</p>
                <p className="text-sm text-ink/62">{app.role}</p>
              </div>
              <span className="shrink-0 rounded-lg bg-shell px-2 py-1 text-xs text-moss">{app.date}</span>
            </div>
            <p className="mt-3 inline-flex rounded-lg bg-sky px-2 py-1 text-xs font-semibold text-ink">{app.status}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
