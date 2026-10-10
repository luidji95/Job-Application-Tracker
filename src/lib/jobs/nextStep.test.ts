import { describe, expect, it } from "vitest";
import { daysBetween, getNextStep, summarizeNextSteps, toDateKey } from "./nextStep";
import { makeJob, rejectedFrom } from "./testJob";

// Saturday 10 October 2026, mid-afternoon local time
const TODAY = new Date(2026, 9, 10, 15, 30);

describe("toDateKey", () => {
  it("uses the local calendar date, also late in the evening", () => {
    expect(toDateKey(new Date(2026, 9, 10, 23, 59))).toBe("2026-10-10");
    expect(toDateKey(new Date(2026, 0, 5, 0, 1))).toBe("2026-01-05");
  });
});

describe("daysBetween", () => {
  it("counts whole days forwards and backwards", () => {
    expect(daysBetween("2026-10-10", "2026-10-13")).toBe(3);
    expect(daysBetween("2026-10-10", "2026-10-07")).toBe(-3);
    expect(daysBetween("2026-10-10", "2026-10-10")).toBe(0);
  });

  it("is not thrown off by month ends or a clock change", () => {
    expect(daysBetween("2026-10-24", "2026-10-26")).toBe(2); // clocks go back on the 25th
    expect(daysBetween("2026-12-31", "2027-01-01")).toBe(1);
  });
});

describe("getNextStep", () => {
  it("returns null when nothing was entered", () => {
    expect(getNextStep(makeJob(), TODAY)).toBeNull();
    expect(getNextStep(makeJob({ next_step: "   " }), TODAY)).toBeNull();
  });

  it("shows a step without a date as undated", () => {
    expect(getNextStep(makeJob({ next_step: "Send follow-up" }), TODAY)).toEqual({
      label: "Send follow-up",
      state: "undated",
      dateLabel: null,
    });
  });

  it("uses a generic label when only a date was entered", () => {
    expect(getNextStep(makeJob({ next_step_date: "2026-10-13" }), TODAY)?.label).toBe("Next step");
  });

  it("names today and tomorrow", () => {
    expect(getNextStep(makeJob({ next_step: "HR call", next_step_date: "2026-10-10" }), TODAY)).toMatchObject({
      state: "today",
      dateLabel: "Today",
    });
    expect(getNextStep(makeJob({ next_step: "HR call", next_step_date: "2026-10-11" }), TODAY)).toMatchObject({
      state: "upcoming",
      dateLabel: "Tomorrow",
    });
  });

  it("shows the weekday and date for later steps", () => {
    const info = getNextStep(makeJob({ next_step: "HR call", next_step_date: "2026-10-13" }), TODAY);

    expect(info?.state).toBe("upcoming");
    expect(info?.dateLabel).toBe("Tue, 13 Oct");
  });

  it("says how late an overdue step is", () => {
    expect(getNextStep(makeJob({ next_step: "Task", next_step_date: "2026-10-09" }), TODAY)).toMatchObject({
      state: "overdue",
      dateLabel: "1 day overdue",
    });
    expect(getNextStep(makeJob({ next_step: "Task", next_step_date: "2026-10-07" }), TODAY)).toMatchObject({
      state: "overdue",
      dateLabel: "3 days overdue",
    });
  });

  it("is still 'today' one minute before midnight", () => {
    const lateEvening = new Date(2026, 9, 10, 23, 59);

    expect(getNextStep(makeJob({ next_step_date: "2026-10-10" }), lateEvening)?.state).toBe("today");
  });

  it("shows nothing for a rejected application", () => {
    const job = { ...rejectedFrom("technical"), next_step: "Task", next_step_date: "2026-10-07" };

    expect(getNextStep(job, TODAY)).toBeNull();
  });

  it("ignores a date that is not a calendar date", () => {
    expect(getNextStep(makeJob({ next_step: "Task", next_step_date: "soon" }), TODAY)?.state).toBe("undated");
  });
});

describe("summarizeNextSteps", () => {
  it("counts late steps and steps due within the next seven days", () => {
    const jobs = [
      makeJob({ next_step_date: "2026-10-05" }), // overdue
      makeJob({ next_step_date: "2026-10-09" }), // overdue
      makeJob({ next_step_date: "2026-10-10" }), // today
      makeJob({ next_step_date: "2026-10-16" }), // in 6 days
      makeJob({ next_step_date: "2026-10-17" }), // in 7 days: not this week
      makeJob({ next_step: "No date" }),
      makeJob(),
    ];

    expect(summarizeNextSteps(jobs, TODAY)).toEqual({ overdue: 2, dueThisWeek: 2 });
  });

  it("leaves rejected applications out", () => {
    const rejected = { ...rejectedFrom("applied"), next_step_date: "2026-10-01" };

    expect(summarizeNextSteps([rejected], TODAY)).toEqual({ overdue: 0, dueThisWeek: 0 });
  });
});
