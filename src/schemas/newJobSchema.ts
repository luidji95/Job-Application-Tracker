import { z } from "zod";

export const newJobSchema = z.object({
  company_name: z.string().min(1, "Company is required"),
  position: z.string().min(1, "Position is required"),
  location: z.string().optional(),
  salary: z.string().optional(),
  tags: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return [];
      return val
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
    }),
  notes: z.string().optional(),
});

export type NewJobFormData = z.infer<typeof newJobSchema>;
