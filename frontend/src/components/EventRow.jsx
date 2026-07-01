import { useState } from "react";
import StatusPill from "./StatusPill";
import ActionBadge from "./ActionBadge";

export default function EventRow({ event, actions }) {
  const [expanded, setExpanded] = useState(false);
  const relatedActions = actions?.filter((a) => a.eventId === event.id) || [];

  return (
    <>
      <tr
        className="border-b border-stone-100 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/50 cursor-pointer"
        onClick={() => setExpanded((e) => !e)}
      >
        <td className="px-4 py-2.5 text-xs font-mono text-stone-500 dark:text-stone-500 whitespace-nowrap">
          {event.eventType}{event.action ? `·${event.action}` : ""}
        </td>
        <td className="px-4 py-2.5 text-sm text-stone-700 dark:text-stone-300 max-w-xs truncate">
          {event.title || event.repoFullName || "—"}
        </td>
        <td className="px-4 py-2.5 text-xs text-stone-500 dark:text-stone-500">{event.repoFullName}</td>
        <td className="px-4 py-2.5"><StatusPill status={event.status} /></td>
        <td className="px-4 py-2.5 text-xs text-stone-400 dark:text-stone-600 whitespace-nowrap">
          {new Date(event.receivedAt).toLocaleString()}
        </td>
      </tr>
      {expanded && (
        <tr className="bg-stone-50 dark:bg-stone-900/50">
          <td colSpan={5} className="px-4 py-3">
            <div className="space-y-2">
              {event.lastError && (
                <p className="text-xs text-red-600 dark:text-red-400 font-mono">
                  Error: {event.lastError} (attempts: {event.attempts})
                </p>
              )}
              {relatedActions.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {relatedActions.map((a) => (
                    <div key={a.id} className="flex items-center gap-1.5">
                      <ActionBadge type={a.actionType} />
                      <StatusPill status={a.status} />
                      {a.detail && <span className="text-xs text-red-500 dark:text-red-400">{a.detail}</span>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-stone-400 dark:text-stone-600">No actions recorded.</p>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
