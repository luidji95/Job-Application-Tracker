import type { StageId } from "../../features/components/StageColumn";
import { daysBetween, toDateKey } from "./nextStep";

// One row of public.job_events. The database writes these; the app only reads them.
export type JobEventType =
  | "created"
  | "moved"
  | "rejected"
  | "restored"
  | "step_set"
  | "step_cleared";

export type JobEvent = {
  id: number;
  job_id: string;
  type: JobEventType;
  from_stage: StageId | null;
  to_stage: StageId | null;
  detail: string | null;
  step_date: string | null;
  // true when the row was reconstructed for a job that existed before history started
  inferred: boolean;
  created_at: string;
};

export type TimelineItem = {
  id: number;
  // "22 Sep 2026"
  date: string;
  title: string;
  detail: string | null;
  // "stage" items mark a change of stage, "step" items a next step
  kind: "stage" | "step";
  inferred: boolean;
};

const STAGE_NAMES: Record<StageId, string> = {
  applied: "Applied",
  "hr-interview": "HR interview",
  technical: "Technical",
  final: "Final",
  offer: "Offer",
  rejected: "Rejected",
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const STAGE_EVENTS: JobEventType[] = ["created", "moved", "rejected", "restored"];

export const isStageEvent = (event: Pick<JobEvent, "type">): boolean =>
  STAGE_EVENTS.includes(event.type);

const stageName = (stage: StageId | null): string => (stage ? STAGE_NAMES[stage] : "");

// Written out by hand so the text is the same in every browser.
export const formatDay = (date: Date): string =>
  `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;

const formatStepDate = (key: string): string => {
  const [y, m, d] = key.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
};

const days = (n: number) => `${n} ${n === 1 ? "day" : "days"}`;

const byTime = (a: JobEvent, b: JobEvent) =>
  a.created_at === b.created_at ? a.id - b.id : a.created_at < b.created_at ? -1 : 1;

const describe = (event: JobEvent): { title: string; detail: string | null } => {
  switch (event.type) {
    case "created":
      return {
        title: "Application added",
        detail: event.to_stage && event.to_stage !== "applied" ? `in ${stageName(event.to_stage)}` : null,
      };
    case "moved":
      return event.inferred
        ? { title: `In ${stageName(event.to_stage)}`, detail: "when history started" }
        : {
            title: `Moved to ${stageName(event.to_stage)}`,
            detail: event.from_stage ? `from ${stageName(event.from_stage)}` : null,
          };
    case "rejected":
      return {
        title: "Rejected",
        detail: event.from_stage ? `after ${stageName(event.from_stage)}` : null,
      };
    case "restored":
      return { title: `Restored to ${stageName(event.to_stage)}`, detail: null };
    case "step_set":
      return {
        title: `Next step: ${event.detail?.trim() || "set"}`,
        detail: event.step_date ? `due ${formatStepDate(event.step_date)}` : null,
      };
    case "step_cleared":
      return { title: `Step closed: ${event.detail?.trim() || "next step"}`, detail: null };
  }
};

/**
  The history of one application, oldest first, ready to show.
  A stage that was followed by another stage also says how long it lasted.
 */
export const buildTimeline = (events: JobEvent[]): TimelineItem[] => {
  const sorted = [...events].sort(byTime);

  return sorted.map((event, index) => {
    const { title, detail } = describe(event);
    let fullDetail = detail;

    if (isStageEvent(event) && !event.inferred) {
      const next = sorted.slice(index + 1).find(isStageEvent);
      if (next) {
        const lasted = daysBetween(
          toDateKey(new Date(event.created_at)),
          toDateKey(new Date(next.created_at))
        );
        if (lasted >= 1) fullDetail = [detail, `stayed ${days(lasted)}`].filter(Boolean).join(" · ");
      }
    }

    return {
      id: event.id,
      date: formatDay(new Date(event.created_at)),
      title,
      detail: fullDetail,
      kind: isStageEvent(event) ? "stage" : "step",
      inferred: event.inferred,
    };
  });
};

/**
  For every job, the moment it entered the stage it is in now:
  the time of its latest stage event.
 */
export const stageSinceByJob = (
  events: Pick<JobEvent, "job_id" | "type" | "created_at">[]
): Record<string, string> => {
  const since: Record<string, string> = {};

  for (const event of events) {
    if (!isStageEvent(event)) continue;
    const current = since[event.job_id];
    if (!current || event.created_at > current) since[event.job_id] = event.created_at;
  }

  return since;
};

export type StageAge = {
  days: number;
  // "Since today", "1 day in this stage", "12 days in this stage"
  label: string;
  // waiting long enough that a follow-up is reasonable
  isLong: boolean;
};

export const LONG_WAIT_DAYS = 14;

// How long a job has been in its current stage, or null when that is not known.
export const getStageAge = (since: string | undefined, today: Date): StageAge | null => {
  if (!since) return null;

  const start = new Date(since);
  if (Number.isNaN(start.getTime())) return null;

  const n = Math.max(0, daysBetween(toDateKey(start), toDateKey(today)));

  return {
    days: n,
    label: n === 0 ? "Since today" : `${days(n)} in this stage`,
    isLong: n >= LONG_WAIT_DAYS,
  };
};
