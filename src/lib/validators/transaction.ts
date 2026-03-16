import { z } from 'zod';

const optionalUuid = z.string().uuid().or(z.literal(''));

export const transactionFormSchema = z.object({
  title: z.string().trim().min(1).max(120),
  amount: z.number().int().positive(),
  type: z.enum(['income', 'expense']),
  category_id: optionalUuid.optional().default(''),
  wallet_id: z.string().uuid(),
  note: z.string().trim().max(500).optional().default(''),
  date: z.string().min(1),
});

export type TransactionFormInput = z.input<typeof transactionFormSchema>;
export type TransactionFormValues = z.output<typeof transactionFormSchema>;
