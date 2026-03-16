import { z } from 'zod';

export const transferFormSchema = z
  .object({
    from_wallet_id: z.string().uuid(),
    to_wallet_id: z.string().uuid(),
    amount: z.number().int().positive(),
    fee_amount: z.number().int().min(0).default(0),
    transfer_date: z.string().min(1),
    note: z.string().trim().max(500).optional().default(''),
  })
  .refine((values) => values.from_wallet_id !== values.to_wallet_id, {
    message: 'Transfer wallets must be different.',
    path: ['to_wallet_id'],
  });

export type TransferFormInput = z.input<typeof transferFormSchema>;
export type TransferFormValues = z.output<typeof transferFormSchema>;
