import { Bot, type LucideIcon } from "lucide-react";

type SidebarProps = {
  activeTab: string;
  modules: Array<{
    label: string;
    icon: LucideIcon;
  }>;
  onTabChange: (tab: string) => void;
};

export function Sidebar({ activeTab, modules, onTabChange }: SidebarProps) {
  return (
    <aside className="hidden w-72 shrink-0 border-r border-line bg-shell/92 px-5 py-6 lg:block">
      <div className="flex items-center gap-3">
        <div className="grid size-11 place-items-center rounded-lg bg-ink text-shell">
          <Bot size={24} />
        </div>
        <div>
          <p className="text-lg font-semibold">Interview Copilot</p>
          <p className="text-sm text-moss">AI prep workspace</p>
        </div>
      </div>

      <nav className="mt-8 space-y-1">
        {modules.map((item) => (
          <button
            key={item.label}
            className={`flex h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm transition ${
              activeTab === item.label ? "bg-ink text-shell" : "text-ink/70 hover:bg-panel/70"
            }`}
            onClick={() => onTabChange(item.label)}
            type="button"
          >
            <item.icon size={18} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
