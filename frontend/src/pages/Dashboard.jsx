import { useEffect, useState } from "react";
import { api } from "../api";
import Appbar from "../components/Appbar";
import EventRow from "../components/EventRow";
import ActionBadge from "../components/ActionBadge";
import StatusPill from "../components/StatusPill";

function StatCard({ label, value, sub }) {
  return (
    <div className="px-4 py-4 rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900">
      <p className="text-xs text-stone-500 dark:text-stone-500">{label}</p>
      <p className="text-2xl font-semibold text-stone-900 dark:text-stone-100 mt-1">{value ?? "—"}</p>
      {sub && <p className="text-xs text-stone-400 dark:text-stone-600 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function Dashboard({ user }) {
  const [stats, setStats] = useState(null);
  const [events, setEvents] = useState([]);
  const [actions, setActions] = useState([]);
  const [tab, setTab] = useState("events");
  const [statusFilter, setStatusFilter] = useState("");

  async function fetchData() {
    const [s, e, a] = await Promise.all([
      api.get("/events/stats").then((r) => r.data),
      api.get("/events", { params: { limit: 50, ...(statusFilter && { status: statusFilter }) } }).then((r) => r.data),
      api.get("/events/actions", { params: { limit: 50, ...(statusFilter && { status: statusFilter }) } }).then((r) => r.data),
    ]);
    setStats(s);
    setEvents(e.events);
    setActions(a.actions);
  }

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 4000);
    return () => clearInterval(id);
  }, [statusFilter]);

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
      <Appbar user={user} />
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-base font-semibold text-stone-900 dark:text-stone-100">Dashboard</h1>
          <p className="text-sm text-stone-500 dark:text-stone-500 mt-0.5">Live activity log. Refreshes every 4s.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <StatCard label="Total events" value={stats?.totalEvents} />
          <StatCard label="Failed events" value={stats?.failedEvents} sub={stats?.failedEvents > 0 ? "needs attention" : undefined} />
          <StatCard label="Total actions" value={stats?.totalActions} />
          <StatCard label="Failed actions" value={stats?.failedActions} />
          <StatCard label="Active rules" value={stats?.activeRules} />
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex gap-1">
              {["events", "actions"].map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${tab === t ? "bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-900 dark:text-stone-100 font-medium" : "text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100"}`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm px-2.5 py-1.5 rounded-md border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300"
            >
              <option value="">All statuses</option>
              {tab === "events"
                ? ["received", "processing", "done", "failed"].map((s) => <option key={s} value={s}>{s}</option>)
                : ["success", "failed"].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden">
            {tab === "events" ? (
              events.length === 0 ? (
                <p className="text-sm text-stone-400 dark:text-stone-600 text-center py-12">No events yet.</p>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-stone-100 dark:border-stone-800">
                      {["Type", "Title", "Repo", "Status", "Received"].map((h) => (
                        <th key={h} className="px-4 py-2.5 text-xs font-medium text-stone-400 dark:text-stone-600">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((e) => (
                      <EventRow key={e.id} event={e} actions={actions} />
                    ))}
                  </tbody>
                </table>
              )
            ) : (
              actions.length === 0 ? (
                <p className="text-sm text-stone-400 dark:text-stone-600 text-center py-12">No actions yet.</p>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-stone-100 dark:border-stone-800">
                      {["Action", "Repo", "Event", "Status", "Detail", "Time"].map((h) => (
                        <th key={h} className="px-4 py-2.5 text-xs font-medium text-stone-400 dark:text-stone-600">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {actions.map((a) => (
                      <tr key={a.id} className="border-b border-stone-100 dark:border-stone-800">
                        <td className="px-4 py-2.5"><ActionBadge type={a.actionType} /></td>
                        <td className="px-4 py-2.5 text-xs text-stone-500 dark:text-stone-500">{a.repoFullName}</td>
                        <td className="px-4 py-2.5 text-xs text-stone-500 dark:text-stone-500">
                          {a.event?.eventType} — {a.event?.title || a.event?.senderLogin || "—"}
                        </td>
                        <td className="px-4 py-2.5"><StatusPill status={a.status} /></td>
                        <td className="px-4 py-2.5 text-xs text-red-500 dark:text-red-400 max-w-xs truncate">{a.detail || ""}</td>
                        <td className="px-4 py-2.5 text-xs text-stone-400 dark:text-stone-600 whitespace-nowrap">
                          {new Date(a.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
