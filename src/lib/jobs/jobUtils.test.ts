import { describe, expect, it } from "vitest";
import {
  isValidStageId,
  isValidStatus,
  normalizeStage,
  normalizeStatus,
  normalizeTags,
  pickStringOrNull,
} from "./jobUtils";

describe("normalizeStage", () => {
  it("keeps a known stage", () => {
    expect(normalizeStage("hr-interview")).toBe("hr-interview");
  });

  it("accepts different casing and spaces", () => {
    expect(normalizeStage("  Technical ")).toBe("technical");
  });

  it("turns anything unknown into applied", () => {
    expect(normalizeStage("interview")).toBe("applied");
    expect(normalizeStage(null)).toBe("applied");
    expect(normalizeStage(42)).toBe("applied");
  });
});

describe("normalizeStatus", () => {
  it("keeps a known status", () => {
    expect(normalizeStatus("accepted")).toBe("accepted");
  });

  it("turns anything unknown into active", () => {
    expect(normalizeStatus("done")).toBe("active");
    expect(normalizeStatus(undefined)).toBe("active");
  });
});

describe("normalizeTags", () => {
  it("splits a comma separated string", () => {
    expect(normalizeTags("react, remote ,referral")).toEqual(["react", "remote", "referral"]);
  });

  it("drops empty entries", () => {
    expect(normalizeTags("react,, ,")).toEqual(["react"]);
  });

  it("cleans an array and drops values that are not text", () => {
    expect(normalizeTags([" React ", "", 7, null, "CSS"])).toEqual(["React", "CSS"]);
  });

  it("returns an empty list for anything else", () => {
    expect(normalizeTags(undefined)).toEqual([]);
    expect(normalizeTags({})).toEqual([]);
  });
});

describe("pickStringOrNull", () => {
  it("trims text", () => {
    expect(pickStringOrNull("  Belgrade ")).toBe("Belgrade");
  });

  it("returns null for blank text and for values that are not text", () => {
    expect(pickStringOrNull("   ")).toBeNull();
    expect(pickStringOrNull(undefined)).toBeNull();
    expect(pickStringOrNull(0)).toBeNull();
  });
});

describe("type guards", () => {
  it("recognise the stages and statuses the database allows", () => {
    expect(isValidStageId("final")).toBe(true);
    expect(isValidStageId("interview")).toBe(false);
    expect(isValidStatus("rejected")).toBe(true);
    expect(isValidStatus("archived")).toBe(false);
  });
});
