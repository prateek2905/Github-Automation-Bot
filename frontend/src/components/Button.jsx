const variants = {
  primary: "bg-emerald-600 hover:bg-emerald-700 text-white",
  secondary: "bg-stone-100 hover:bg-stone-200 text-stone-800 dark:bg-stone-700 dark:hover:bg-stone-600 dark:text-stone-100",
  danger: "bg-red-600 hover:bg-red-700 text-white",
  ghost: "hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400",
};

export default function Button({ children, variant = "primary", className = "", ...props }) {
  return (
    <button
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
