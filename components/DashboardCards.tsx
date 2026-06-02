import { Database, Gauge, Mic, Search, type LucideIcon } from "lucide-react";

const cards = [
  { label: "Job Match", value: "76%", detail: "Against Senior Full Stack JD", icon: Search },
  { label: "Mock Score", value: "8.1", detail: "Spring Boot interview session", icon: Mic },
  { label: "Cache Hits", value: "94%", detail: "Redis-backed AI result reuse", icon: Database }
];

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
      <p className="mt-3 text-sm text-ink/65">{detail}</p>
    </div>
  );
}

export function DashboardCards() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map((card) => (
        <StatCard key={card.label} {...card} />
      ))}
    </div>
  );
}
