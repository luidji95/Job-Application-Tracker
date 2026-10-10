import { z } from "zod";

export const newJobSchema = z.object({
  company_name: z.string().min(1, "Company is required"),
  position: z.string().min(1, "Position is required"),
  location: z.string().optional(),
  salary: z.string().optional(),
  tags: z.string().optional(),
  notes: z.string().optional(),

  next_step: z.string().max(120, "Keep it under 120 characters").optional(),
  // the browser's date field gives YYYY-MM-DD, or an empty string when cleared
  next_step_date: z
    .string()
    .refine((v) => v === "" || /^\d{4}-\d{2}-\d{2}$/.test(v), "Choose a date")
    .optional(),
  job_url: z
    .string()
    .max(2000, "This link is too long")
    .refine(
      (v) => v.trim() === "" || /^https?:\/\/\S+$/i.test(v.trim()),
      "Enter the full link, starting with https://"
    )
    .optional(),
});
