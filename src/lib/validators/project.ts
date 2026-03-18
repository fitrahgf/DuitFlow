import { z } from 'zod';

export const projectFormSchema = z.object({
  name: z.string().trim().min(1).max(120),
  budgetTarget: z.coerce.number().int().positive(),
  categoryNames: z
    .array(z.string().trim().min(1).max(80))
    .max(12)
    .default([]),
});

export type ProjectFormInput = z.input<typeof projectFormSchema>;
export type ProjectFormValues = z.output<typeof projectFormSchema>;
