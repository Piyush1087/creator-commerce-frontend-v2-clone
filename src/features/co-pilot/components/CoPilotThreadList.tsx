import { Trash2 } from "lucide-react";

import type { GroupedCoPilotThreads } from "../utils/thread-grouping";

type Props = {
  groups: GroupedCoPilotThreads[];
  activeThreadId: string;
  deletingThreadId?: string | null;
  onSelect: (threadId: string) => void;
  onDelete: (threadId: string) => void;
};

export function CoPilotThreadList({
  groups,
  activeThreadId,
  deletingThreadId,
  onSelect,
  onDelete,
}: Props) {
  return (
    <>
      {groups.map((group) => (
        <div key={group.group} className="co-pilot-thread-rail__group">
          <span className="co-pilot-thread-rail__group-label">{group.label}</span>
          <ul className="co-pilot-thread-rail__list co-pilot-thread-rail__list--nested">
            {group.threads.map((thread) => {
              const isActive = thread.threadId === activeThreadId;
              const isDeleting = deletingThreadId === thread.threadId;
              return (
                <li key={thread.threadId} className="co-pilot-thread-rail__item-row">
                  <button
                    type="button"
                    className={`co-pilot-thread-rail__item${isActive ? " co-pilot-thread-rail__item--active" : ""}`}
                    disabled={isDeleting}
                    onClick={() => onSelect(thread.threadId)}
                  >
                    <span className="co-pilot-thread-rail__item-title">{thread.title}</span>
                    <span className="co-pilot-thread-rail__item-meta">
                      {thread.lastActiveLabel}
                    </span>
                  </button>
                  <button
                    type="button"
                    className="co-pilot-thread-rail__delete"
                    aria-label={`Delete ${thread.title}`}
                    disabled={isDeleting}
                    onClick={(event) => {
                      event.stopPropagation();
                      onDelete(thread.threadId);
                    }}
                  >
                    <Trash2 size={15} aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </>
  );
}
