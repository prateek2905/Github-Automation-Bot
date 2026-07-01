import Button from "./Button";

export default function RuleCard({ rule, onToggle, onEdit, onDelete }) {
  const actions = [
    rule.addLabel && rule.labelName && `label: ${rule.labelName}`,
    rule.comment && "comment",
    rule.slackNotify && "slack",
  ].filter(Boolean);

  return (
    <div className={`px-4 py-3 rounded-lg border bg-white dark:bg-stone-900 ${rule.enabled ? "border-stone-200 dark:border-stone-800" : "border-stone-100 dark:border-stone-900 opacity-60"}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium text-stone-900 dark:text-stone-100">{rule.name}</p>
            <span className="text-xs text-stone-400 dark:text-stone-600 font-mono">
              {rule.eventType} · {rule.matchField} {rule.matchType} "{rule.matchValue}"
            </span>
          </div>
          {actions.length > 0 && (
            <p className="text-xs text-stone-500 dark:text-stone-500 mt-1">
              → {actions.join(", ")}
            </p>
          )}
          {rule.repoId && (
            <p className="text-xs text-stone-400 dark:text-stone-600 mt-0.5">repo-scoped</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onToggle(rule.id)}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${rule.enabled ? "bg-emerald-500" : "bg-stone-300 dark:bg-stone-700"}`}
          >
            <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${rule.enabled ? "translate-x-4" : "translate-x-0"}`} />
          </button>
          <Button variant="ghost" onClick={() => onEdit(rule)}>Edit</Button>
          <Button variant="ghost" onClick={() => onDelete(rule.id)}>Delete</Button>
        </div>
      </div>
    </div>
  );
}
