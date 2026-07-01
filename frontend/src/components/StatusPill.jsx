const styles = {
  received: "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400",
  processing: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  done: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
  failed: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
  success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
};

export default function StatusPill({ status }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${styles[status] || styles.received}`}>
      {status}
    </span>
  );
}
