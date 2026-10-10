import { describe, expect, it } from "vitest";
import type { JobType, StageId } from "../../features/components/StageColumn";
import { applyMove, buildMovePatch, buildRestorePatch } from "./jobTransitions";
import { makeJob, rejectedFrom } from "./testJob";

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

describe("applyMove", () => {
  it("moves only the chosen job", () => {
    const a = makeJob({ stage: "applied" });
    const b = makeJob({ stage: "applied" });

    const result = applyMove([a, b], a.id, "technical");

    expect(result[0].stage).toBe("technical");
    expect(result[1]).toBe(b);
  });

  it("does not change the original list", () => {
    const job = makeJob({ stage: "applied" });
    const jobs = [job];

    applyMove(jobs, job.id, "final");

    expect(jobs[0].stage).toBe("applied");
  });

  it("shows a job dropped on rejected the same way the server will store it", () => {
    const job = makeJob({ stage: "technical" });

    const [moved] = applyMove([job], job.id, "rejected");

    expect(moved).toMatchObject({ stage: "rejected", status: "rejected", rejected_from_stage: "technical" });
    expect(violatesDatabaseRules(moved)).toBeNull();
  });

  it("reactivates a rejected job dragged back to an open stage", () => {
    const job = rejectedFrom("technical");

    const [moved] = applyMove([job], job.id, "final");

    expect(moved).toMatchObject({ stage: "final", status: "active", rejected_from_stage: null });
  });

  it("keeps an accepted offer accepted when it is moved", () => {
    const job = makeJob({ stage: "offer", status: "accepted" });

    const [moved] = applyMove([job], job.id, "final");

    expect(moved.status).toBe("accepted");
  });

  it("returns the list unchanged when the job is not in it", () => {
    const jobs = [makeJob()];

    expect(applyMove(jobs, "missing", "final")).toEqual(jobs);
  });
});
