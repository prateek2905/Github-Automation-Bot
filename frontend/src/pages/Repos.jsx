import { useEffect, useState } from "react";
import { api } from "../api";
import Appbar from "../components/Appbar";
import RepoCard from "../components/RepoCard";
import Button from "../components/Button";

export default function Repos({ user }) {
  const [repos, setRepos] = useState([]);
  const [installUrl, setInstallUrl] = useState("");
  const [toggling, setToggling] = useState(null);

  useEffect(() => {
    api.get("/repos").then((r) => setRepos(r.data));
    api.get("/repos/install-url").then((r) => setInstallUrl(r.data.url));
  }, []);

  async function handleToggle(id) {
    setToggling(id);
    try {
      const { data } = await api.post(`/repos/${id}/toggle`);
      setRepos((rs) => rs.map((r) => (r.id === id ? { ...r, active: data.active } : r)));
    } finally {
      setToggling(null);
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950">
      <Appbar user={user} />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-base font-semibold text-stone-900 dark:text-stone-100">Repositories</h1>
            <p className="text-sm text-stone-500 dark:text-stone-500 mt-0.5">
              Manage which repos the bot watches.
            </p>
          </div>
          {installUrl && (
            <a href={installUrl} target="_blank" rel="noreferrer">
              <Button>Add repositories</Button>
            </a>
          )}
        </div>

        {repos.length === 0 ? (
          <div className="text-center py-16 text-stone-400 dark:text-stone-600">
            <p className="text-sm">No repositories connected.</p>
            {installUrl && (
              <a href={installUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm text-emerald-600 hover:underline">
                Install the GitHub App to connect repos →
              </a>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {repos.map((repo) => (
              <RepoCard
                key={repo.id}
                repo={repo}
                onToggle={handleToggle}
                loading={toggling === repo.id}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
