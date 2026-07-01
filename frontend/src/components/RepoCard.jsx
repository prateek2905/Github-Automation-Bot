import Button from "./Button";

export default function RepoCard({ repo, onToggle, loading }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900">
      <div className="min-w-0">
        <p className="text-sm font-medium text-stone-900 dark:text-stone-100 truncate">{repo.fullName}</p>
        <p className="text-xs text-stone-500 dark:text-stone-500 mt-0.5">
          via {repo.installedAccount}
        </p>
      </div>
      <div className="flex items-center gap-3 ml-4 shrink-0">
        <span className={`text-xs font-medium ${repo.active ? "text-emerald-600 dark:text-emerald-400" : "text-stone-400 dark:text-stone-600"}`}>
          {repo.active ? "active" : "paused"}
        </span>
        <Button variant="secondary" onClick={() => onToggle(repo.id)} disabled={loading}>
          {repo.active ? "Pause" : "Activate"}
        </Button>
      </div>
    </div>
  );
}
