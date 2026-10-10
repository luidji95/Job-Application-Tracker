import { describe, expect, it } from "vitest";
import type { JobType, StageId } from "../../features/components/StageColumn";
import { buildMovePatch, buildRestorePatch } from "./jobTransitions";

const OPEN_STAGES: StageId[] = ["applied", "hr-interview", "technical", "final", "offer"];
const ALL_STAGES: StageId[] = [...OPEN_STAGES, "rejected"];

// The same rules the database enforces (migration tighten_jobs_schema).
// A patch is applied to a job and the result must still satisfy them.
const violatesDatabaseRules = (job: Pick<JobType, "stage" | "status" | "rejected_from_stage">) => {
  if ((job.stage === "rejected") !== (job.status === "rejected")) return "stage/status mismatch";
  if (job.rejected_from_stage === "rejected") return "rejected_from_stage is 'rejected'";
  if (job.rejected_from_stage && job.stage !== "rejected") return "rejected_from_stage on an open job";
  return null;
};

describe("buildMovePatch", () => {
  it("changes only the stage when moving between open stages", () => {
    expect(buildMovePatch("applied", "technical")).toEqual({ stage: "technical" });
  });

  it("marks the job rejected and remembers where it came from", () => {
    expect(buildMovePatch("technical", "rejected")).toEqual({
      stage: "rejected",
      status: "rejected",
      rejected_from_stage: "technical",
    });
  });

  it("reactivates a rejected job and clears the memory when it moves out", () => {
    expect(buildMovePatch("rejected", "final")).toEqual({
      stage: "final",
      status: "active",
      rejected_from_stage: null,
    });
  });

  it("never records 'rejected' as the stage a job was rejected from", () => {
    expect(buildMovePatch("rejected", "rejected").rejected_from_stage).toBeNull();
  });

  it("keeps every possible move inside the database rules", () => {
    for (const from of ALL_STAGES) {
      for (const to of ALL_STAGES) {
        const before = {
          stage: from,
          status: (from === "rejected" ? "rejected" : "active") as JobType["status"],
          rejected_from_stage: null,
        };
        const after = { ...before, ...buildMovePatch(from, to) };

        expect(violatesDatabaseRules(after), `${from} -> ${to}`).toBeNull();
      }
    }
  });

  it("leaves an accepted offer accepted when it moves between open stages", () => {
    // status is not part of the patch, so the stored value stays
    expect(buildMovePatch("offer", "final")).not.toHaveProperty("status");
  });
});

describe("buildRestorePatch", () => {
  it.each(OPEN_STAGES)("returns a job rejected from %s to that stage", (stage) => {
    expect(buildRestorePatch({ rejected_from_stage: stage })).toEqual({
      stage,
      status: "active",
      rejected_from_stage: null,
    });
  });

  it("falls back to applied when the stage is not known", () => {
    expect(buildRestorePatch({ rejected_from_stage: null }).stage).toBe("applied");
    expect(buildRestorePatch({}).stage).toBe("applied");
  });

  it("always produces a job the database accepts", () => {
    for (const stage of [...OPEN_STAGES, null]) {
      expect(violatesDatabaseRules(buildRestorePatch({ rejected_from_stage: stage }))).toBeNull();
    }
  });
});

describe("reject then restore", () => {
  it.each(OPEN_STAGES)("brings a job rejected in %s back to where it was", (stage) => {
    const rejected = buildMovePatch(stage, "rejected");
    const restored = buildRestorePatch({ rejected_from_stage: rejected.rejected_from_stage });

    expect(restored.stage).toBe(stage);
    expect(restored.status).toBe("active");
  });
});
