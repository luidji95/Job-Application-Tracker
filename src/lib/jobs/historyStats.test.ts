import { describe, expect, it } from "vitest";
import { computeHistoryStats, stagesReached, weekStart } from "./historyStats";
import type { JobEvent } from "./jobHistory";
import { makeJob, rejectedFrom } from "./testJob";

// Saturday 10 October 2026
const TODAY = new Date(2026, 9, 10, 15, 30);
// local noon on a day in 2026, so the calendar day is the same in every time zone
const at = (month: number, day: number) => new Date(2026, month - 1, day, 12, 0).toISOString();

let nextId = 1;
const ev = (job_id: string, overrides: Partial<JobEvent>): JobEvent => ({
  id: nextId++,
  job_id,
  type: "created",
  from_stage: null,
  to_stage: null,
  detail: null,
  step_date: null,
  inferred: false,
  created_at: at(9, 1),
  ...overrides,
});

describe("weekStart", () => {
  it("is the Monday of that week", () => {
    expect(weekStart("2026-10-10")).toBe("2026-10-05"); // Saturday
    expect(weekStart("2026-10-05")).toBe("2026-10-05"); // Monday itself
    expect(weekStart("2026-10-11")).toBe("2026-10-05"); // Sunday belongs to the week before it ends
  });

  it("crosses a month boundary", () => {
    expect(weekStart("2026-10-01")).toBe("2026-09-28");
  });
});

describe("stagesReached", () => {
  it("uses exactly the recorded path, so a skipped stage is not counted", () => {
    const job = makeJob({ stage: "technical" });
    const events = [
      ev(job.id, { type: "created", to_stage: "applied" }),
      ev(job.id, { type: "moved", from_stage: "applied", to_stage: "technical", created_at: at(9, 5) }),
    ];

    expect([...stagesReached(job, events)].sort()).toEqual(["applied", "technical"]);
  });

  it("remembers stages a rejected job went through", () => {
    const job = rejectedFrom("technical");
    const events = [
      ev(job.id, { type: "created", to_stage: "applied" }),
      ev(job.id, { type: "moved", from_stage: "applied", to_stage: "hr-interview", created_at: at(9, 3) }),
      ev(job.id, { type: "moved", from_stage: "hr-interview", to_stage: "technical", created_at: at(9, 8) }),
      ev(job.id, { type: "rejected", from_stage: "technical", to_stage: "rejected", created_at: at(9, 12) }),
    ];

    expect([...stagesReached(job, events)].sort()).toEqual(["applied", "hr-interview", "technical"]);
  });

  it("assumes the earlier stages for a job whose path was not recorded", () => {
    const job = makeJob({ stage: "technical" });
    const inferred = [
      ev(job.id, { type: "created", inferred: true }),
      ev(job.id, { type: "moved", to_stage: "technical", inferred: true, created_at: at(9, 20) }),
    ];

    expect([...stagesReached(job, inferred)].sort()).toEqual(["applied", "hr-interview", "technical"]);
    expect([...stagesReached(job, [])].sort()).toEqual(["applied", "hr-interview", "technical"]);
  });
});

describe("computeHistoryStats", () => {
  it("returns empty numbers for no data instead of dividing by zero", () => {
    const stats = computeHistoryStats([], [], TODAY);

    expect(stats.funnel.total).toBe(0);
    expect(stats.funnel.screeningPassRate).toBe(0);
    expect(stats.firstResponse).toEqual({ averageDays: null, sample: 0 });
    expect(stats.stageDurations).toEqual([]);
    expect(stats.waiting.count).toBe(0);
    expect(stats.recordedSince).toBeNull();
    expect(stats.weeks).toHaveLength(8);
  });

  // a: applied -> hr (after 4 days) -> technical (after 6) -> rejected (after 10)
  // b: applied -> technical directly (after 2 days), still there
  // c: applied 20 days ago, no answer
  // d: old job, already in final when history started
  const a = { ...rejectedFrom("technical"), id: "a" };
  const b = makeJob({ id: "b", stage: "technical" });
  const c = makeJob({ id: "c", company_name: "Slow Co", stage: "applied" });
  const d = makeJob({ id: "d", stage: "final" });
  const events = [
    ev("a", { type: "created", to_stage: "applied", created_at: at(9, 14) }),
    ev("a", { type: "moved", from_stage: "applied", to_stage: "hr-interview", created_at: at(9, 18) }),
    ev("a", { type: "moved", from_stage: "hr-interview", to_stage: "technical", created_at: at(9, 24) }),
    ev("a", { type: "rejected", from_stage: "technical", to_stage: "rejected", created_at: at(10, 4) }),
    ev("b", { type: "created", to_stage: "applied", created_at: at(10, 5) }),
    ev("b", { type: "moved", from_stage: "applied", to_stage: "technical", created_at: at(10, 7) }),
    ev("c", { type: "created", to_stage: "applied", created_at: at(9, 20) }),
    ev("d", { type: "created", inferred: true, created_at: at(8, 1) }),
    ev("d", { type: "moved", to_stage: "final", inferred: true, created_at: at(9, 30) }),
  ];
  const stats = computeHistoryStats([a, b, c, d], events, TODAY);

  it("counts a stage only for applications that were really in it", () => {
    // HR: a (recorded) and d (assumed). b skipped HR and must not be counted.
    expect(stats.funnel.visits).toEqual({
      applied: 4,
      "hr-interview": 2,
      technical: 3,
      final: 1,
      offer: 0,
    });
  });

  it("computes pass rates from those stages", () => {
    expect(stats.funnel.pastScreening).toBe(3); // a, b, d
    expect(stats.funnel.screeningPassRate).toBe(75);
    expect(stats.funnel.pastHR).toBe(2); // a and d went on from HR
    expect(stats.funnel.hrPassRate).toBe(100);
    expect(stats.funnel.pastTechnical).toBe(1); // only d went on from technical
    expect(Math.round(stats.funnel.technicalPassRate)).toBe(33);
    expect(stats.funnel.offerConversion).toBe(0);
  });

  it("says how many paths were recorded and how many were assumed", () => {
    expect(stats.funnel.recordedJobs).toBe(3);
    expect(stats.funnel.assumedJobs).toBe(1);
  });

  it("averages the time to the first response over recorded applications", () => {
    // a: 4 days, b: 2 days. c has no response yet, d is not recorded.
    expect(stats.firstResponse).toEqual({ averageDays: 3, sample: 2 });
  });

  it("averages how long each stage lasted, from stages that have ended", () => {
    expect(stats.stageDurations).toEqual([
      { stage: "applied", averageDays: 3, sample: 2 }, // a: 4, b: 2
      { stage: "hr-interview", averageDays: 6, sample: 1 },
      { stage: "technical", averageDays: 10, sample: 1 }, // b is still in technical: not counted
    ]);
  });

  it("does not turn assumed moves into durations", () => {
    expect(stats.stageDurations.some((s) => s.stage === "final")).toBe(false);
  });

  it("lists applications waiting in Applied for two weeks or more", () => {
    expect(stats.waiting.count).toBe(1);
    expect(stats.waiting.longest[0]).toMatchObject({ company_name: "Slow Co", days: 20 });
  });

  it("falls back to the applied date when a waiting job has no events", () => {
    const old = makeJob({ id: "old", stage: "applied", applied_date: at(9, 10) });

    expect(computeHistoryStats([old], [], TODAY).waiting.longest[0].days).toBe(30);
  });

  it("knows since when history has been recorded", () => {
    expect(stats.recordedSince).toBe("2026-09-14");
  });

  it("shows the last eight weeks, oldest first, ending with the current one", () => {
    expect(stats.weeks[0].start).toBe("2026-08-17");
    expect(stats.weeks[7].start).toBe("2026-10-05");
    expect(stats.weeks[7].label).toBe("5 Oct");
  });

  it("counts applications added and responses per week", () => {
    const byWeek = Object.fromEntries(stats.weeks.map((w) => [w.start, [w.added, w.responses]]));

    expect(byWeek["2026-09-14"]).toEqual([2, 1]); // a and c added; a moved on the 18th
    expect(byWeek["2026-09-21"]).toEqual([0, 1]); // a moved on the 24th
    expect(byWeek["2026-09-28"]).toEqual([0, 1]); // a rejected on 4 Oct; d's assumed move is ignored
    expect(byWeek["2026-10-05"]).toEqual([1, 1]); // b added and moved
  });

  it("leaves out events older than the weeks shown", () => {
    const totalAdded = stats.weeks.reduce((sum, w) => sum + w.added, 0);

    expect(totalAdded).toBe(3); // d was added on 1 Aug, before the first week shown
  });
});
