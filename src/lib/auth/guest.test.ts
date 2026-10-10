import { describe, expect, it } from "vitest";
import { isGuestEmail } from "./guest";

describe("isGuestEmail", () => {
  it("recognises the address the guest function creates", () => {
    expect(isGuestEmail("guest_1a2b3c4d@demo.local")).toBe(true);
  });

  it("ignores case and surrounding spaces", () => {
    expect(isGuestEmail("  Guest_1A2B@DEMO.LOCAL ")).toBe(true);
  });

  it("is false for a real account", () => {
    expect(isGuestEmail("milos@example.com")).toBe(false);
  });

  it("is false when the domain only appears in the middle of the address", () => {
    expect(isGuestEmail("guest@demo.local.example.com")).toBe(false);
  });

  it("is false when there is no address", () => {
    expect(isGuestEmail(null)).toBe(false);
    expect(isGuestEmail(undefined)).toBe(false);
    expect(isGuestEmail("")).toBe(false);
  });
});
