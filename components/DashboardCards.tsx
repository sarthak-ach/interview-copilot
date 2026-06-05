import { Briefcase, Mic, Search, type LucideIcon } from "lucide-react";

type DashboardStats = {
  latestJobMatchScore: number | null;
  latestJobMatchTitle: string | null;
  latestMockInterviewScore: number | null;
  latestMockInterviewCategory: string | null;
  totalJobsTracked: number;
  activeInterviews: number;
};

function StatCard({
  label,
  value,
  detail,
  icon: Icon
}: {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-lg border border-line bg-panel/85 p-4 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-moss">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-ink">{value}</p>
        </div>
        <div className="grid size-11 place-items-center rounded-lg bg-mint text-moss">
          <Icon size={22} />
        </div>
      </div>
      <p className="mt-3 text-sm text-ink/65 line-clamp-1" title={detail}>{detail}</p>
    </div>
  );
}

export function DashboardCards({ stats }: { stats: DashboardStats | null }) {
  const cards = [
    {
      label: "Job Match",
      value: stats?.latestJobMatchScore != null ? `${stats.latestJobMatchScore}%` : "N/A",
      detail: stats?.latestJobMatchTitle ? `Against ${stats.latestJobMatchTitle}` : "No matches run yet",
      icon: Search
    },
    {
      label: "Mock Score",
      value: stats?.latestMockInterviewScore != null ? stats.latestMockInterviewScore.toFixed(1) : "N/A",
      detail: stats?.latestMockInterviewCategory ? `${stats.latestMockInterviewCategory} practice` : "No sessions yet",
      icon: Mic
    },
    {
      label: "Jobs Tracked",
      value: stats?.totalJobsTracked != null ? stats.totalJobsTracked.toString() : "0",
      detail: stats?.activeInterviews != null
        ? `${stats.activeInterviews} active interviews in pipeline`
        : "No active interviews in pipeline",
      icon: Briefcase
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map((card) => (
        <StatCard key={card.label} {...card} />
      ))}
    </div>
  );
}
