import "@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { jobDescription, companyName, position } = await req.json();

    if (!jobDescription) {
      return new Response(
        JSON.stringify({ error: "Missing jobDescription" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Missing OPENAI_API_KEY secret" }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const openAiResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `
You are a strict JSON generator.

You analyze job descriptions for frontend/software roles.

Rules:
- Return ONLY valid JSON
- Do not wrap JSON in markdown
- Do not add explanation before or after JSON
- Do not include comments
- All values must be arrays of strings
- Keep each item concise and practical
- Return at most 4 items per array

JSON format:
{
  "focusAreas": string[],
  "mustHaveSkills": string[],
  "niceToHaveSkills": string[],
  "tips": string[]
}
              `.trim(),
            },
            {
              role: "user",
              content: `
Company: ${companyName ?? "Unknown company"}
Position: ${position ?? "Unknown position"}

Analyze the following job description and return ONLY valid JSON in the required format.

Job description:
${jobDescription}
              `.trim(),
            },
          ],
        }),
      }
    );

    const openAiData = await openAiResponse.json();

    if (!openAiResponse.ok) {
      const message =
        openAiData?.error?.message || "OpenAI request failed.";

      return new Response(
        JSON.stringify({
          error: message,
          details: openAiData,
        }),
        {
          status: openAiResponse.status,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const content = openAiData?.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(
        JSON.stringify({
          error: "OpenAI returned no content",
          details: openAiData,
        }),
        {
          status: 502,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    return new Response(
      JSON.stringify({ content }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Something went wrong";

    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});