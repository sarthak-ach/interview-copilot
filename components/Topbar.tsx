import { LockKeyhole, Moon, Play, Sun } from "lucide-react";

type TopbarProps = {
  theme: "light" | "dark";
  onThemeToggle: () => void;
};

export function Topbar({ theme, onThemeToggle }: TopbarProps) {
  return (
    <header className="sticky top-0 z-20 -mx-4 border-b border-line bg-shell/90 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-moss">Portfolio MVP Mockup</p>
          <h1 className="text-2xl font-semibold sm:text-3xl">AI interview preparation command center</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="grid size-10 place-items-center rounded-lg border border-line bg-panel text-ink transition hover:bg-shell"
            type="button"
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            onClick={onThemeToggle}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            className="grid size-10 place-items-center rounded-lg border border-line bg-panel text-ink"
            type="button"
            aria-label="Open auth preview"
          >
            <LockKeyhole size={18} />
          </button>
          <button className="flex h-10 items-center gap-2 rounded-lg bg-coral px-4 text-sm font-semibold text-white" type="button">
            <Play size={17} />
            Demo Flow
          </button>
        </div>
      </div>
    </header>
  );
}
