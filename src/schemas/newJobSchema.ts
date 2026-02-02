import { z } from "zod";

export const newJobSchema = z.object({
  company_name: z.string().min(1, "Company is required"),
  position: z.string().min(1, "Position is required"),
  location: z.string().optional(),
  salary: z.string().optional(),
  tags: z.string().optional(),      
  notes: z.string().optional(),
});
