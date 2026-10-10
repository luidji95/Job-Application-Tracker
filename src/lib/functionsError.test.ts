import { describe, expect, it } from "vitest";
import { getFunctionErrorMessage } from "./functionsError";

// supabase-js hands back an error whose `context` is the raw response
const functionError = (body: string, status = 429) => ({
  message: "Edge Function returned a non-2xx status code",
  context: new Response(body, { status }),
});

describe("getFunctionErrorMessage", () => {
  it("returns the message the function sent", async () => {
    const error = functionError(JSON.stringify({ error: "You have used all 10 AI analyses for today." }));

    expect(await getFunctionErrorMessage(error, "fallback")).toBe(
      "You have used all 10 AI analyses for today."
    );
  });

  it("uses the fallback when the body is not JSON", async () => {
    expect(await getFunctionErrorMessage(functionError("<html>502</html>", 502), "fallback")).toBe("fallback");
  });

  it("uses the fallback when the JSON has no usable message", async () => {
    expect(await getFunctionErrorMessage(functionError(JSON.stringify({ error: "" })), "fallback")).toBe("fallback");
    expect(await getFunctionErrorMessage(functionError(JSON.stringify({ code: 1 })), "fallback")).toBe("fallback");
  });

  it("uses the fallback for errors without a response, such as no network", async () => {
    expect(await getFunctionErrorMessage(new Error("Failed to fetch"), "fallback")).toBe("fallback");
    expect(await getFunctionErrorMessage(null, "fallback")).toBe("fallback");
  });
});
