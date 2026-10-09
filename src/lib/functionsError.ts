// Edge functions answer errors as { "error": "..." }. supabase-js wraps the response,
// so the readable message has to be taken out of it.
export async function getFunctionErrorMessage(error: unknown, fallback: string): Promise<string> {
  if (typeof error === "object" && error !== null && "context" in error) {
    const context = (error as { context: unknown }).context;

    if (context instanceof Response) {
      const text = await context.text().catch(() => "");

      try {
        const parsed: unknown = JSON.parse(text);
        if (typeof parsed === "object" && parsed !== null && "error" in parsed) {
          const message = (parsed as { error: unknown }).error;
          if (typeof message === "string" && message) return message;
        }
      } catch {
        // not JSON: fall through to the fallback
      }

      return fallback;
    }
  }

  return fallback;
}
