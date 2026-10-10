import { describe, expect, it } from "vitest";
import { computeJobStats, getPipelineStage } from "./jobStats";
import { makeJob, rejectedFrom } from "./testJob";

describe("getPipelineStage", () => {
  it("is the current stage for an open job", () => {
    expect(getPipelineStage(makeJob({ stage: "final" }))).toBe("final");
  });

  it("is the stage a rejected job was rejected from", () => {
    expect(getPipelineStage(rejectedFrom("technical"))).toBe("technical");
  });

  it("stays 'rejected' when the stage it was rejected from is not known", () => {
    expect(getPipelineStage(rejectedFrom(null))).toBe("rejected");
  });
});

describe("computeJobStats", () => {
  it("returns zeros for an empty list instead of dividing by zero", () => {
    const stats = computeJobStats([]);

    expect(stats.totalApplications).toBe(0);
    expect(stats.screeningPassRate).toBe(0);
    expect(stats.hrPassRate).toBe(0);
    expect(stats.technicalPassRate).toBe(0);
    expect(stats.offerConversion).toBe(0);
    expect(stats.mostCommonRejectionStage).toBeNull();
  });

  // 10 applications:
  //   4 still in applied
  //   1 rejected right after applying
  //   1 in HR interview
  //   2 rejected in technical
  //   1 in final
  //   1 with an offer (accepted)
  const jobs = [
    makeJob(),
    makeJob(),
    makeJob(),
    makeJob(),
    rejectedFrom("applied"),
    makeJob({ stage: "hr-interview" }),
    rejectedFrom("technical"),
    rejectedFrom("technical"),
    makeJob({ stage: "final" }),
    makeJob({ stage: "offer", status: "accepted" }),
  ];
  const stats = computeJobStats(jobs);

  it("counts how far applications got, including the rejected ones", () => {
    expect(stats.totalApplications).toBe(10);
    expect(stats.reachedHR).toBe(5); // hr + 2 technical + final + offer
    expect(stats.reachedTechnical).toBe(4);
    expect(stats.reachedFinal).toBe(2);
    expect(stats.reachedOffer).toBe(1);
  });

  it("computes each pass rate against the previous step", () => {
    expect(stats.screeningPassRate).toBe(50); // 5 of 10
    expect(stats.hrPassRate).toBe(80); // 4 of 5
    expect(stats.technicalPassRate).toBe(50); // 2 of 4
    expect(stats.offerConversion).toBe(10); // 1 of 10
  });

  it("counts the current state separately from the funnel", () => {
    expect(stats.rejectedCount).toBe(3);
    expect(stats.currentlyInApplied).toBe(4);
  });

  it("places rejected jobs at the stage they were rejected from", () => {
    expect(stats.stageBreakdown).toEqual({
      applied: 5,
      "hr-interview": 1,
      technical: 2,
      final: 1,
      offer: 1,
      rejected: 0,
    });
  });

  it("finds the stage where most rejections happen", () => {
    expect(stats.mostCommonRejectionStage).toBe("technical");
    expect(stats.highestRejectCount).toBe(2);
  });

  it("ignores rejections with an unknown stage when looking for the most common one", () => {
    const result = computeJobStats([rejectedFrom(null), rejectedFrom(null), rejectedFrom("final")]);

    expect(result.rejectedCount).toBe(3);
    expect(result.mostCommonRejectionStage).toBe("final");
    expect(result.highestRejectCount).toBe(1);
  });

  it("keeps the breakdown total equal to the number of applications", () => {
    const total = Object.values(stats.stageBreakdown).reduce((sum, n) => sum + n, 0);
    expect(total).toBe(stats.totalApplications);
  });
});
