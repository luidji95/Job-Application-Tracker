import type { JobType } from "../../features/components/StageColumn";

export type NextStepState = "overdue" | "today" | "upcoming" | "undated";

export type NextStepInfo = {
  // what to do; a generic label when only a date was entered
  label: string;
  state: NextStepState;
  // text for the date: "Today", "Tomorrow", "Tue, 13 Oct", "3 days overdue"; null when undated
  dateLabel: string | null;
};

const DAY_MS = 24 * 60 * 60 * 1000;

// Calendar date of a moment in the user's own time zone, as YYYY-MM-DD.
export const toDateKey = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const isDateKey = (value: unknown): value is string =>
  typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);

// Whole days from one calendar date to another; negative when `to` is earlier.
export const daysBetween = (fromKey: string, toKey: string): number => {
  const [fy, fm, fd] = fromKey.split("-").map(Number);
  const [ty, tm, td] = toKey.split("-").map(Number);
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / DAY_MS);
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Written out by hand so the text is the same in every browser: "Tue, 13 Oct".
const formatDate = (key: string): string => {
  const [y, m, d] = key.split("-").map(Number);
  const weekday = WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return `${weekday}, ${d} ${MONTHS[m - 1]}`;
};

/**
  What the card shows about the next step, or null when there is nothing to show.
  A rejected application has no next step, whatever was typed before it was rejected.
 */
export const getNextStep = (
  job: Pick<JobType, "stage" | "next_step" | "next_step_date">,
  today: Date
): NextStepInfo | null => {
  if (job.stage === "rejected") return null;

  const text = (job.next_step ?? "").trim();
  const dateKey = isDateKey(job.next_step_date) ? job.next_step_date : null;

  if (!text && !dateKey) return null;

  const label = text || "Next step";

  if (!dateKey) return { label, state: "undated", dateLabel: null };

  const days = daysBetween(toDateKey(today), dateKey);

  if (days < 0) {
    const late = -days;
    return { label, state: "overdue", dateLabel: `${late} ${late === 1 ? "day" : "days"} overdue` };
  }
  if (days === 0) return { label, state: "today", dateLabel: "Today" };
  if (days === 1) return { label, state: "upcoming", dateLabel: "Tomorrow" };

  return { label, state: "upcoming", dateLabel: formatDate(dateKey) };
};

/**
  Counts for the line under the board title: steps that are late, and steps due
  from today through the next six days.
 */
export const summarizeNextSteps = (
  jobs: Pick<JobType, "stage" | "next_step" | "next_step_date">[],
  today: Date
): { overdue: number; dueThisWeek: number } => {
  const todayKey = toDateKey(today);
  let overdue = 0;
  let dueThisWeek = 0;

  for (const job of jobs) {
    if (job.stage === "rejected" || !isDateKey(job.next_step_date)) continue;

    const days = daysBetween(todayKey, job.next_step_date);
    if (days < 0) overdue += 1;
    else if (days <= 6) dueThisWeek += 1;
  }

  return { overdue, dueThisWeek };
};
