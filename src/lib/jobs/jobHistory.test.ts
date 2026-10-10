import { describe, expect, it } from "vitest";
import { buildTimeline, getStageAge, stageSinceByJob, type JobEvent } from "./jobHistory";

let nextId = 1;
// local noon, so the calendar day is the same in every time zone the tests run in
const at = (day: number, month = 9) => new Date(2026, month - 1, day, 12, 0).toISOString();

const event = (overrides: Partial<JobEvent>): JobEvent => ({
  id: nextId++,
  job_id: "job-1",
  type: "created",
  from_stage: null,
  to_stage: null,
  detail: null,
  step_date: null,
  inferred: false,
  created_at: at(1),
  ...overrides,
});

describe("buildTimeline", () => {
  const events = [
    event({ type: "created", to_stage: "applied", created_at: at(14) }),
    event({ type: "moved", from_stage: "applied", to_stage: "hr-interview", created_at: at(22) }),
    event({ type: "step_set", detail: "HR call", step_date: "2026-09-25", created_at: at(22) }),
    event({ type: "step_cleared", detail: "HR call", created_at: at(25) }),
    event({ type: "moved", from_stage: "hr-interview", to_stage: "technical", created_at: at(29) }),
    event({ type: "rejected", from_stage: "technical", to_stage: "rejected", created_at: at(6, 10) }),
  ];
  const timeline = buildTimeline(events);

  it("describes every event in plain words", () => {
    expect(timeline.map((i) => i.title)).toEqual([
      "Application added",
      "Moved to HR interview",
      "Next step: HR call",
      "Step closed: HR call",
      "Moved to Technical",
      "Rejected",
    ]);
  });

  it("shows the date of each event", () => {
    expect(timeline[0].date).toBe("14 Sep 2026");
    expect(timeline[5].date).toBe("6 Oct 2026");
  });

  it("says how long a stage lasted when another stage followed", () => {
    expect(timeline[0].detail).toBe("stayed 8 days");
    expect(timeline[1].detail).toBe("from Applied · stayed 7 days");
    expect(timeline[4].detail).toBe("from HR interview · stayed 7 days");
  });

  it("gives the last stage no duration, because it has not ended", () => {
    expect(timeline[5].detail).toBe("after Technical");
  });

  it("shows when a step is due", () => {
    expect(timeline[2].detail).toBe("due 25 Sep 2026");
  });

  it("tells stage changes from steps", () => {
    expect(timeline.map((i) => i.kind)).toEqual(["stage", "stage", "step", "step", "stage", "stage"]);
  });

  it("puts events in order even when they arrive shuffled", () => {
    const shuffled = [events[4], events[0], events[5], events[2], events[1], events[3]];

    expect(buildTimeline(shuffled).map((i) => i.id)).toEqual(events.map((e) => e.id));
  });

  it("does not claim a move for a job that was already in a stage when history started", () => {
    const old = buildTimeline([
      event({ type: "created", inferred: true, created_at: at(2) }),
      event({ type: "moved", to_stage: "technical", inferred: true, created_at: at(20) }),
    ]);

    expect(old[1].title).toBe("In Technical");
    expect(old[1].detail).toBe("when history started");
    expect(old[0].detail).toBeNull(); // no invented duration
    expect(old.every((i) => i.inferred)).toBe(true);
  });

  it("copes with a rejection whose earlier stage is not known", () => {
    const [item] = buildTimeline([event({ type: "rejected", to_stage: "rejected" })]);

    expect(item.title).toBe("Rejected");
    expect(item.detail).toBeNull();
  });

  it("names a job that was added straight into a later stage", () => {
    const [item] = buildTimeline([event({ type: "created", to_stage: "hr-interview" })]);

    expect(item.detail).toBe("in HR interview");
  });

  it("returns an empty list when there is no history", () => {
    expect(buildTimeline([])).toEqual([]);
  });
});

describe("stageSinceByJob", () => {
  it("takes the latest stage change of each job and ignores steps", () => {
    const since = stageSinceByJob([
      event({ job_id: "a", type: "created", created_at: at(1) }),
      event({ job_id: "a", type: "moved", created_at: at(10) }),
      event({ job_id: "a", type: "step_set", created_at: at(20) }),
      event({ job_id: "b", type: "created", created_at: at(5) }),
    ]);

    expect(since).toEqual({ a: at(10), b: at(5) });
  });
});

describe("getStageAge", () => {
  const today = new Date(2026, 9, 10, 15, 30); // 10 Oct 2026

  it("is null when the start is not known", () => {
    expect(getStageAge(undefined, today)).toBeNull();
    expect(getStageAge("not a date", today)).toBeNull();
  });

  it("says 'Since today' on the day of the move", () => {
    expect(getStageAge(new Date(2026, 9, 10, 8, 0).toISOString(), today)).toMatchObject({
      days: 0,
      label: "Since today",
      isLong: false,
    });
  });

  it("counts calendar days, not 24-hour periods", () => {
    // moved late yesterday evening: that is one day ago, although fewer than 24 hours passed
    expect(getStageAge(new Date(2026, 9, 9, 23, 0).toISOString(), today)?.label).toBe("1 day in this stage");
  });

  it("flags a long wait from fourteen days on", () => {
    expect(getStageAge(at(27), today)).toMatchObject({ days: 13, isLong: false });
    expect(getStageAge(at(26), today)).toMatchObject({ days: 14, label: "14 days in this stage", isLong: true });
  });

  it("never goes negative when the clock is slightly off", () => {
    expect(getStageAge(new Date(2026, 9, 11, 1, 0).toISOString(), today)?.days).toBe(0);
  });
});
