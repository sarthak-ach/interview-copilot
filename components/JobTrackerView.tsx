import React, { useState } from "react";
import {
  Briefcase,
  Plus,
  Trash2,
  Calendar,
  CheckCircle,
  FileText,
  Clock,
  ArrowRight,
  TrendingUp,
  X
} from "lucide-react";

type JobApplication = {
  id: string;
  company: string;
  role: string;
  status: "Saved" | "Applied" | "Phone Screen" | "Technical Round" | "Offer" | "Rejected";
  date: string;
  notes: string;
};

const defaultApplications: JobApplication[] = [
  { id: "1", company: "Stripe", role: "Full Stack Engineer", status: "Technical Round", date: "2026-06-06", notes: "Focus on React component optimization questions." },
  { id: "2", company: "Atlassian", role: "Senior Java Developer", status: "Phone Screen", date: "2026-06-10", notes: "Review transaction management and bean scopes in Spring Boot." },
  { id: "3", company: "Shopify", role: "Backend Engineer", status: "Applied", date: "2026-06-14", notes: "Resume submitted via referral. Waiting for HR response." },
  { id: "4", company: "Google", role: "Systems Engineer", status: "Saved", date: "2026-06-01", notes: "Need to refresh networking protocols and capacity calculations." }
];

const columns: { id: JobApplication["status"]; label: string; bg: string; text: string }[] = [
  { id: "Saved", label: "Saved", bg: "bg-shell/70", text: "text-ink/70" },
  { id: "Applied", label: "Applied", bg: "bg-sky/20", text: "text-sky-800" },
  { id: "Phone Screen", label: "Phone Screen", bg: "bg-gold/20", text: "text-amber-800" },
  { id: "Technical Round", label: "Technical Round", bg: "bg-coral/10", text: "text-coral" },
  { id: "Offer", label: "Offer", bg: "bg-mint", text: "text-moss" },
  { id: "Rejected", label: "Rejected", bg: "bg-ink/10", text: "text-ink/60" }
];

export function JobTrackerView() {
  const [apps, setApps] = useState<JobApplication[]>(defaultApplications);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCompany, setNewCompany] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newStatus, setNewStatus] = useState<JobApplication["status"]>("Saved");
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newNotes, setNewNotes] = useState("");

  const handleAddApplication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompany.trim() || !newRole.trim()) return;

    const newApp: JobApplication = {
      id: Math.random().toString(),
      company: newCompany.trim(),
      role: newRole.trim(),
      status: newStatus,
      date: newDate,
      notes: newNotes.trim()
    };

    setApps(prev => [...prev, newApp]);
    setNewCompany("");
    setNewRole("");
    setNewStatus("Saved");
    setNewNotes("");
    setShowAddForm(false);
  };

  const handleDelete = (id: string) => {
    setApps(prev => prev.filter(app => app.id !== id));
  };

  const handleMoveStatus = (id: string, targetStatus: JobApplication["status"]) => {
    setApps(prev => prev.map(app => app.id === id ? { ...app, status: targetStatus } : app));
  };

  const handleUpdateNotes = (id: string, notesText: string) => {
    setApps(prev => prev.map(app => app.id === id ? { ...app, notes: notesText } : app));
  };

  return (
    <div className="space-y-6">
      {/* Top Controls & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-line bg-panel p-4 shadow-soft">
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-moss">Application Tracker</label>
          <h4 className="text-lg font-bold text-ink mt-0.5">Job Pipeline Board</h4>
          <p className="text-xs text-ink/60 mt-1">Manage and track interview stages for active companies.</p>
        </div>

        <button
          onClick={() => setShowAddForm(true)}
          className="flex h-10 items-center justify-center gap-1.5 rounded-lg bg-ink px-4 text-xs font-semibold text-shell hover:bg-moss transition"
          type="button"
        >
          <Plus size={16} />
          Track New Position
        </button>
      </div>

      {/* Add New Job Dialog Popup */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-line bg-panel p-6 shadow-soft animate-scaleUp">
            <div className="flex items-center justify-between border-b border-line pb-3 mb-4">
              <h5 className="font-bold text-ink text-sm flex items-center gap-2">
                <Briefcase size={16} /> Track New Application
              </h5>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-ink/50 hover:text-ink"
                type="button"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddApplication} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-ink/70">Company Name</label>
                  <input
                    required
                    className="w-full h-10 rounded-lg border border-line bg-shell/45 px-3 text-xs outline-none focus:border-moss"
                    placeholder="e.g. Amazon"
                    value={newCompany}
                    onChange={e => setNewCompany(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-ink/70">Role / Title</label>
                  <input
                    required
                    className="w-full h-10 rounded-lg border border-line bg-shell/45 px-3 text-xs outline-none focus:border-moss"
                    placeholder="e.g. Backend Dev"
                    value={newRole}
                    onChange={e => setNewRole(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-ink/70">Current Stage</label>
                  <select
                    className="w-full h-10 rounded-lg border border-line bg-shell/45 px-2 text-xs font-semibold outline-none"
                    value={newStatus}
                    onChange={e => setNewStatus(e.target.value as any)}
                  >
                    {columns.map(col => (
                      <option key={col.id} value={col.id}>{col.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-ink/70">Date Applied</label>
                  <input
                    type="date"
                    className="w-full h-10 rounded-lg border border-line bg-shell/45 px-3 text-xs outline-none"
                    value={newDate}
                    onChange={e => setNewDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-ink/70">Notes / Details</label>
                <textarea
                  className="w-full h-20 rounded-lg border border-line bg-shell/25 p-3 text-xs outline-none focus:border-moss"
                  placeholder="Review material, networking connections, target deadlines..."
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="w-full h-10 items-center justify-center rounded-lg bg-ink text-shell text-xs font-semibold hover:bg-moss transition"
              >
                Create Application Entry
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Board Columns Grid */}
      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6 overflow-x-auto pb-4">
        {columns.map(col => {
          const colApps = apps.filter(app => app.status === col.id);
          return (
            <div key={col.id} className="rounded-xl border border-line bg-panel p-3 shadow-soft flex flex-col min-w-[200px] min-h-[400px]">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-line pb-2 mb-3">
                <span className="text-xs font-bold text-ink/80">{col.label}</span>
                <span className="rounded-full bg-shell border border-line/60 px-2 py-0.5 text-[10px] font-bold text-ink/70">
                  {colApps.length}
                </span>
              </div>

              {/* Cards wrapper */}
              <div className="flex-1 space-y-3 overflow-y-auto max-h-[500px]">
                {colApps.length === 0 ? (
                  <div className="text-center py-8 text-[10px] text-ink/30 italic">No apps</div>
                ) : (
                  colApps.map(app => (
                    <div key={app.id} className={`rounded-lg border border-line/75 p-3 ${col.bg} transition-shadow hover:shadow-sm space-y-2.5 relative group`}>
                      <button
                        onClick={() => handleDelete(app.id)}
                        className="absolute right-2 top-2 size-6 place-items-center rounded bg-panel border border-line/45 text-coral/80 hover:text-coral hover:bg-shell hidden group-hover:grid"
                        type="button"
                        title="Delete Card"
                      >
                        <Trash2 size={11} />
                      </button>

                      <div>
                        <p className="font-bold text-ink text-xs truncate max-w-[85%]">{app.company}</p>
                        <p className="text-[10px] text-ink/65 font-medium truncate mt-0.5">{app.role}</p>
                      </div>

                      {/* Notes Input Editable */}
                      <textarea
                        className="w-full text-[10px] bg-white/40 border border-transparent rounded p-1.5 focus:bg-white focus:border-moss outline-none resize-none leading-4 font-mono text-ink/75"
                        rows={2}
                        value={app.notes}
                        onChange={(e) => handleUpdateNotes(app.id, e.target.value)}
                        placeholder="Write notes here..."
                      />

                      {/* Footer Actions */}
                      <div className="flex items-center justify-between gap-1.5 pt-1.5 border-t border-line/35">
                        <div className="flex items-center gap-1 text-[9px] text-ink/50">
                          <Calendar size={10} />
                          <span>{app.date.split("-").slice(1).join("/")}</span>
                        </div>

                        {/* Quick Shift selector */}
                        <select
                          className="h-5 rounded bg-panel border border-line text-[9px] outline-none font-semibold px-1 text-ink/70"
                          value={app.status}
                          onChange={(e) => handleMoveStatus(app.id, e.target.value as any)}
                        >
                          {columns.map(c => (
                            <option key={c.id} value={c.id}>Move To...</option>
                          ))}
                          {columns.map(c => (
                            <option key={c.id} value={c.id}>{c.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
