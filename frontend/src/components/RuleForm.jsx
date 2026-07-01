import { useState } from "react";
import Button from "./Button";

const empty = {
  name: "",
  eventType: "issues",
  matchField: "title",
  matchType: "contains",
  matchValue: "",
  addLabel: false,
  labelName: "",
  comment: false,
  commentBody: "",
  slackNotify: true,
  enabled: true,
  repoId: "",
};

export default function RuleForm({ initial, repos, onSave, onCancel, loading }) {
  const [form, setForm] = useState(initial ? { ...empty, ...initial, repoId: initial.repoId || "" } : { ...empty });

  function set(key, val) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const data = {
      ...form,
      repoId: form.repoId || null,
      labelName: form.labelName || null,
      commentBody: form.commentBody || null,
    };
    onSave(data);
  }

  const field = (label, key, children) => (
    <div>
      <label className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1">{label}</label>
      {children}
    </div>
  );

  const input = (key, props = {}) => (
    <input
      value={form[key]}
      onChange={(e) => set(key, e.target.value)}
      className="w-full px-2.5 py-1.5 text-sm rounded-md border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
      {...props}
    />
  );

  const select = (key, options) => (
    <select
      value={form[key]}
      onChange={(e) => set(key, e.target.value)}
      className="w-full px-2.5 py-1.5 text-sm rounded-md border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
    >
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  );

  const checkbox = (key, label) => (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={form[key]}
        onChange={(e) => set(key, e.target.checked)}
        className="rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
      />
      <span className="text-sm text-stone-700 dark:text-stone-300">{label}</span>
    </label>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {field("Rule name", "name", input("name", { placeholder: "e.g. Bug label", required: true }))}

      <div className="grid grid-cols-3 gap-3">
        {field("Event type", "eventType", select("eventType", [["issues", "Issues"], ["pull_request", "Pull request"], ["push", "Push"]]))}
        {field("Match field", "matchField", select("matchField", [["title", "Title"], ["body", "Body"], ["author", "Author"], ["label", "Label"]]))}
        {field("Match type", "matchType", select("matchType", [["contains", "Contains"], ["equals", "Equals"], ["regex", "Regex"]]))}
      </div>

      {field("Match value", "matchValue", input("matchValue", { placeholder: "e.g. bug" }))}

      {repos.length > 0 && field("Scope to repo (optional)", "repoId",
        <select
          value={form.repoId}
          onChange={(e) => set("repoId", e.target.value)}
          className="w-full px-2.5 py-1.5 text-sm rounded-md border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">All repos</option>
          {repos.map((r) => <option key={r.id} value={r.id}>{r.fullName}</option>)}
        </select>
      )}

      <div className="border-t border-stone-100 dark:border-stone-800 pt-4 space-y-3">
        <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">Actions</p>
        <div className="space-y-2">
          {checkbox("slackNotify", "Send Slack notification")}
          {checkbox("addLabel", "Add label")}
          {form.addLabel && (
            <div className="ml-5">
              {input("labelName", { placeholder: "Label name, e.g. bug" })}
            </div>
          )}
          {checkbox("comment", "Post comment")}
          {form.comment && (
            <div className="ml-5">
              <textarea
                value={form.commentBody}
                onChange={(e) => set("commentBody", e.target.value)}
                rows={2}
                placeholder="Comment body"
                className="w-full px-2.5 py-1.5 text-sm rounded-md border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={loading}>{loading ? "Saving…" : initial ? "Update rule" : "Create rule"}</Button>
      </div>
    </form>
  );
}
