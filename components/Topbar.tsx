import { LogOut, Moon, Sun } from "lucide-react";
import { useAuth } from "./AuthContext";

type TopbarProps = {
  theme: "light" | "dark";
  onThemeToggle: () => void;
};

export function Topbar({ theme, onThemeToggle }: TopbarProps) {
  const { user, logout } = useAuth();
  const initials = user?.fullName
    ? user.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2)
    : "U";

  return (
    <header className="sticky top-0 z-20 -mx-4 border-b border-line bg-shell/90 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-moss">Portfolio MVP Workspace</p>
          <h1 className="text-2xl font-semibold sm:text-3xl">AI interview preparation command center</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="grid size-10 place-items-center rounded-lg border border-line bg-panel text-ink transition hover:bg-shell cursor-pointer"
            type="button"
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            onClick={onThemeToggle}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          
          {user && (
            <div className="flex items-center gap-2 animate-fade-in">
              <div className="flex h-10 items-center gap-2 rounded-lg border border-line bg-panel px-3 text-sm font-semibold select-none">
                <div className="flex size-6 items-center justify-center rounded-full bg-moss text-shell text-[10px] font-bold">
                  {initials}
                </div>
                <span className="hidden sm:inline text-xs text-ink/80">{user.fullName}</span>
              </div>
              <button
                onClick={logout}
                className="grid size-10 place-items-center rounded-lg border border-line bg-panel text-ink transition hover:bg-coral/10 hover:text-coral cursor-pointer"
                type="button"
                aria-label="Log out"
                title="Log out"
              >
                <LogOut size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
