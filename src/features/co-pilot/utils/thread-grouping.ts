import type { CoPilotThreadStub } from "../types";

export type ThreadTimeGroup = "today" | "previous7Days" | "lastMonth" | "older";

export type GroupedCoPilotThreads = {
  group: ThreadTimeGroup;
  label: string;
  threads: CoPilotThreadStub[];
};

const GROUP_LABELS: Record<ThreadTimeGroup, string> = {
  today: "Today",
  previous7Days: "Previous 7 days",
  lastMonth: "Last month",
  older: "Older",
};

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function resolveThreadTimeGroup(iso: string): ThreadTimeGroup {
  const date = new Date(iso);
  const now = new Date();
  const todayStart = startOfDay(now).getTime();
  const messageDay = startOfDay(date).getTime();
  const diffDays = Math.floor((todayStart - messageDay) / 86_400_000);

  if (diffDays <= 0) return "today";
  if (diffDays <= 7) return "previous7Days";
  if (diffDays <= 30) return "lastMonth";
  return "older";
}

export function groupCoPilotThreads(
  threads: CoPilotThreadStub[],
  lastMessageAtById: Record<string, string>,
): GroupedCoPilotThreads[] {
  const buckets: Record<ThreadTimeGroup, CoPilotThreadStub[]> = {
    today: [],
    previous7Days: [],
    lastMonth: [],
    older: [],
  };

  for (const thread of threads) {
    const iso = lastMessageAtById[thread.threadId] ?? new Date().toISOString();
    buckets[resolveThreadTimeGroup(iso)].push(thread);
  }

  return (Object.keys(buckets) as ThreadTimeGroup[])
    .map((group) => ({
      group,
      label: GROUP_LABELS[group],
      threads: buckets[group],
    }))
    .filter((entry) => entry.threads.length > 0);
}
