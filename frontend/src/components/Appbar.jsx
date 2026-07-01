import { Link, useLocation, useNavigate } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";

const navLinks = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/repos", label: "Repos" },
  { to: "/rules", label: "Rules" },
];

export default function Appbar({ user }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  function logout() {
    localStorage.removeItem("token");
    navigate("/login");
  }

  return (
    <header className="border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-6">
        <Link to="/dashboard" className="font-semibold text-stone-900 dark:text-stone-100 text-sm">
          GH Bot
        </Link>
        <nav className="flex gap-1 flex-1">
          {navLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                pathname.startsWith(to)
                  ? "bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-medium"
                  : "text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {user && (
            <div className="flex items-center gap-2">
              {user.avatarUrl && (
                <img src={user.avatarUrl} alt={user.login} className="w-6 h-6 rounded-full" />
              )}
              <span className="text-sm text-stone-600 dark:text-stone-400">{user.login}</span>
            </div>
          )}
          <button
            onClick={logout}
            className="text-sm text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
