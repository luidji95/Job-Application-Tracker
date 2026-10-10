import { describe, expect, it } from "vitest";
import { filterJobs } from "./jobSearch";
import { makeJob } from "./testJob";

const jobs = [
  makeJob({ company_name: "Northwind Labs", position: "Frontend Developer", location: "Remote", tags: ["React", "TypeScript"] }),
  makeJob({ company_name: "Kite Systems", position: "Junior Frontend", location: "Belgrade", tags: ["Next.js"] }),
  makeJob({ company_name: "Halden", position: "QA Engineer", location: undefined, tags: undefined }),
];

const companies = (query: string) => filterJobs(jobs, query).map((j) => j.company_name);

describe("filterJobs", () => {
  it("returns every job for an empty or blank query", () => {
    expect(filterJobs(jobs, "")).toBe(jobs);
    expect(filterJobs(jobs, "   ")).toBe(jobs);
  });

  it("matches the company name", () => {
    expect(companies("kite")).toEqual(["Kite Systems"]);
  });

  it("matches the position", () => {
    expect(companies("frontend")).toEqual(["Northwind Labs", "Kite Systems"]);
  });

  it("matches the location", () => {
    expect(companies("belgrade")).toEqual(["Kite Systems"]);
  });

  it("matches a tag", () => {
    expect(companies("typescript")).toEqual(["Northwind Labs"]);
  });

  it("ignores case and surrounding spaces", () => {
    expect(companies("  HALDEN ")).toEqual(["Halden"]);
  });

  it("copes with jobs that have no location or tags", () => {
    expect(companies("qa")).toEqual(["Halden"]);
  });

  it("returns nothing when nothing matches", () => {
    expect(companies("backend")).toEqual([]);
  });
});
