const styles = {
  label: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400",
  comment: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  slack: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
};

export default function ActionBadge({ type }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${styles[type] || ""}`}>
      {type}
    </span>
  );
}
