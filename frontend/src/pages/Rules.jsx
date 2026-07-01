import { useEffect, useState } from "react";
import { api } from "../api";
import Appbar from "../components/Appbar";
import RuleCard from "../components/RuleCard";
import RuleForm from "../components/RuleForm";
import Button from "../components/Button";

export default function Rules({ user }) {
  const [rules, setRules] = useState([]);
  const [repos, setRepos] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/rules").then((r) => setRules(r.data));
    api.get("/repos").then((r) => setRepos(r.data));
  }, []);

  async function handleSave(data) {
    setSaving(true);
    try {
      if (editing) {
        const { data: updated } = await api.put(`/rules/${editing.id}`, data);
        setRules((rs) => rs.map((r) => (r.id === editing.id ? updated : r)));
      } else {
        const { data: created } = await api.post("/rules", data);
        setRules((rs) => [created, ...rs]);
      }
      setShowForm(false);
      setEditing(null);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(id) {
    const { data } = await api.patch(`/rules/${id}/toggle`);
    setRules((rs) => rs.map((r) => (r.id === id ? { ...r, enabled: data.enabled } : r)));
  }

  async function handleDelete(id) {
    await api.delete(`/rules/${id}`);
    setRules((rs) => rs.filter((r) => r.id !== id));
  }

  function openEdit(rule) {
    setEditing(rule);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
      <Appbar user={user} />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-base font-semibold text-stone-900 dark:text-stone-100">Rules</h1>
            <p className="text-sm text-stone-500 dark:text-stone-500 mt-0.5">
              Configure what the bot does when events arrive.
            </p>
          </div>
          <Button onClick={() => setShowForm(true)}>New rule</Button>
        </div>

        {showForm && (
          <div className="mb-6 p-4 rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900">
            <h2 className="text-sm font-medium text-stone-900 dark:text-stone-100 mb-4">
              {editing ? "Edit rule" : "New rule"}
            </h2>
            <RuleForm
              initial={editing}
              repos={repos}
              onSave={handleSave}
              onCancel={closeForm}
              loading={saving}
            />
          </div>
        )}

        {rules.length === 0 && !showForm ? (
          <div className="text-center py-16 text-stone-400 dark:text-stone-600">
            <p className="text-sm">No rules yet. Create one to get started.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {rules.map((rule) => (
              <RuleCard
                key={rule.id}
                rule={rule}
                onToggle={handleToggle}
                onEdit={openEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
