import type { JobType, StageId } from "../../features/components/StageColumn";
import { isStageEvent, LONG_WAIT_DAYS, type JobEvent } from "./jobHistory";
import { getPipelineStage } from "./jobStats";
import { daysBetween, toDateKey } from "./nextStep";

type OpenStage = Exclude<StageId, "rejected">;

const OPEN_STAGES: OpenStage[] = ["applied", "hr-interview", "technical", "final", "offer"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// An average over fewer cases than this says little, so the page shows "not enough yet" instead.
export const MIN_SAMPLE = 3;
export const WEEKS_SHOWN = 8;

export type HistoryStats = {
  funnel: {
    total: number;
    // how many applications were in each stage at some point
    visits: Record<OpenStage, number>;
    pastScreening: number;
    pastHR: number;
    pastTechnical: number;
    offers: number;
    screeningPassRate: number;
    hrPassRate: number;
    technicalPassRate: number;
    offerConversion: number;
    // applications whose whole path was recorded, and those where it had to be assumed
    recordedJobs: number;
    assumedJobs: number;
  };
  firstResponse: { averageDays: number | null; sample: number };
  stageDurations: { stage: OpenStage; averageDays: number; sample: number }[];
  waiting: {
    count: number;
    longest: { id: string; company_name: string; position: string; days: number }[];
  };
  weeks: { start: string; label: string; added: number; responses: number }[];
  // day of the first event that was really recorded, as YYYY-MM-DD
  recordedSince: string | null;
};

const byTime = (a: JobEvent, b: JobEvent) =>
  a.created_at === b.created_at ? a.id - b.id : a.created_at < b.created_at ? -1 : 1;

const dayOf = (iso: string) => toDateKey(new Date(iso));
const rate = (part: number, whole: number) => (whole > 0 ? (part / whole) * 100 : 0);
const average = (values: number[]) => values.reduce((sum, v) => sum + v, 0) / values.length;
const isOpenStage = (stage: StageId | null): stage is OpenStage => stage !== null && stage !== "rejected";

// Monday of the week a calendar day belongs to.
export const weekStart = (dateKey: string): string => {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return toDateKey(date);
};

const addDays = (dateKey: string, n: number): string => {
  const [y, m, d] = dateKey.split("-").map(Number);
  return toDateKey(new Date(y, m - 1, d + n));
};

const shortDay = (dateKey: string): string => {
  const [, m, d] = dateKey.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]}`;
};

// The whole path of a job is known only when its first event was really recorded.
const isRecorded = (events: JobEvent[]) =>
  events.length > 0 && events[0].type === "created" && !events[0].inferred;

/**
  Every stage an application was in.
  With a recorded history that is exactly what the events say, so a job dragged
  from Applied straight to Technical does not count as having had an HR interview.
  Without one, the old assumption is used: it passed every stage before its furthest.
 */
export const stagesReached = (job: JobType, events: JobEvent[]): Set<OpenStage> => {
  const reached = new Set<OpenStage>();

  if (isRecorded(events)) {
    for (const event of events) {
      if (!isStageEvent(event)) continue;
      if (isOpenStage(event.to_stage)) reached.add(event.to_stage);
      if (isOpenStage(event.from_stage)) reached.add(event.from_stage);
    }
    return reached;
  }

  const furthest = getPipelineStage(job);
  const index = furthest === "rejected" ? 0 : OPEN_STAGES.indexOf(furthest);
  for (const stage of OPEN_STAGES.slice(0, index + 1)) reached.add(stage);
  return reached;
};

export const computeHistoryStats = (
  jobs: JobType[],
  events: JobEvent[],
  today: Date
): HistoryStats => {
  const todayKey = toDateKey(today);

  const eventsByJob = new Map<string, JobEvent[]>();
  for (const event of [...events].sort(byTime)) {
    const list = eventsByJob.get(event.job_id);
    if (list) list.push(event);
    else eventsByJob.set(event.job_id, [event]);
  }

  // ---- funnel ----
  const visits: Record<OpenStage, number> = {
    applied: 0,
    "hr-interview": 0,
    technical: 0,
    final: 0,
    offer: 0,
  };
  let pastScreening = 0;
  let inHR = 0;
  let pastHR = 0;
  let inTechnical = 0;
  let pastTechnical = 0;
  let recordedJobs = 0;

  for (const job of jobs) {
    const jobEvents = eventsByJob.get(job.id) ?? [];
    if (isRecorded(jobEvents)) recordedJobs += 1;

    const reached = stagesReached(job, jobEvents);
    for (const stage of reached) visits[stage] += 1;

    const beyond = (stages: OpenStage[]) => stages.some((s) => reached.has(s));

    if (beyond(["hr-interview", "technical", "final", "offer"])) pastScreening += 1;
    if (reached.has("hr-interview")) {
      inHR += 1;
      if (beyond(["technical", "final", "offer"])) pastHR += 1;
    }
    if (reached.has("technical")) {
      inTechnical += 1;
      if (beyond(["final", "offer"])) pastTechnical += 1;
    }
  }

  // every application starts as an application, whatever stage it was typed into
  visits.applied = jobs.length;

  // ---- timing: only from events that were really recorded ----
  const firstResponses: number[] = [];
  const durations: Record<OpenStage, number[]> = {
    applied: [],
    "hr-interview": [],
    technical: [],
    final: [],
    offer: [],
  };
  let recordedSince: string | null = null;

  for (const jobEvents of eventsByJob.values()) {
    const stageEvents = jobEvents.filter(isStageEvent);

    for (const event of jobEvents) {
      if (event.inferred) continue;
      const day = dayOf(event.created_at);
      if (!recordedSince || day < recordedSince) recordedSince = day;
    }

    if (isRecorded(jobEvents)) {
      const response = stageEvents.find(
        (e, i) => i > 0 && (e.type === "moved" || e.type === "rejected")
      );
      if (response) {
        firstResponses.push(daysBetween(dayOf(jobEvents[0].created_at), dayOf(response.created_at)));
      }
    }

    for (let i = 0; i < stageEvents.length - 1; i++) {
      const current = stageEvents[i];
      const next = stageEvents[i + 1];
      if (current.inferred || next.inferred) continue;
      // "created" may have no stage on very old rows; a rejection is not a stage to wait in
      const stage = current.type === "rejected" ? null : current.to_stage;
      if (!isOpenStage(stage)) continue;

      durations[stage].push(daysBetween(dayOf(current.created_at), dayOf(next.created_at)));
    }
  }

  const stageDurations = OPEN_STAGES.filter((stage) => durations[stage].length > 0).map((stage) => ({
    stage,
    averageDays: average(durations[stage]),
    sample: durations[stage].length,
  }));

  // ---- waiting without an answer ----
  const waitingJobs = jobs
    .filter((job) => job.stage === "applied" && job.status === "active")
    .map((job) => {
      const stageEvents = (eventsByJob.get(job.id) ?? []).filter(isStageEvent);
      const since = stageEvents.length > 0 ? stageEvents[stageEvents.length - 1].created_at : job.applied_date;
      const start = new Date(since);
      const waited = Number.isNaN(start.getTime()) ? 0 : daysBetween(toDateKey(start), todayKey);
      return { id: job.id, company_name: job.company_name, position: job.position, days: waited };
    })
    .filter((job) => job.days >= LONG_WAIT_DAYS)
    .sort((a, b) => b.days - a.days);

  // ---- last weeks ----
  const thisWeek = weekStart(todayKey);
  const weeks = Array.from({ length: WEEKS_SHOWN }, (_, i) => {
    const start = addDays(thisWeek, -7 * (WEEKS_SHOWN - 1 - i));
    return { start, label: shortDay(start), added: 0, responses: 0 };
  });
  const weekIndex = new Map(weeks.map((week, i) => [week.start, i]));

  for (const event of events) {
    const index = weekIndex.get(weekStart(dayOf(event.created_at)));
    if (index === undefined) continue;

    // the day an old application was added is known, so it counts; its later moves are not
    if (event.type === "created") weeks[index].added += 1;
    else if (!event.inferred && (event.type === "moved" || event.type === "rejected")) {
      weeks[index].responses += 1;
    }
  }

  return {
    funnel: {
      total: jobs.length,
      visits,
      pastScreening,
      pastHR,
      pastTechnical,
      offers: visits.offer,
      screeningPassRate: rate(pastScreening, jobs.length),
      hrPassRate: rate(pastHR, inHR),
      technicalPassRate: rate(pastTechnical, inTechnical),
      offerConversion: rate(visits.offer, jobs.length),
      recordedJobs,
      assumedJobs: jobs.length - recordedJobs,
    },
    firstResponse: {
      averageDays: firstResponses.length > 0 ? average(firstResponses) : null,
      sample: firstResponses.length,
    },
    stageDurations,
    waiting: { count: waitingJobs.length, longest: waitingJobs.slice(0, 5) },
    weeks,
    recordedSince,
  };
};
