import { z } from 'zod';

export const budgetFormSchema = z
  .object({
    month_key: z.string().regex(/^\d{4}-\d{2}$/),
    mode: z.enum(['overall', 'category']),
    category_id: z.string().trim().optional(),
    limit: z.coerce.number().int().positive(),
  })
  .superRefine((values, context) => {
    if (values.mode === 'category' && !values.category_id) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Category is required.',
        path: ['category_id'],
      });
    }
  });

export type BudgetFormInput = z.input<typeof budgetFormSchema>;
export type BudgetFormValues = z.output<typeof budgetFormSchema>;
