import { z } from 'zod';

export const walletFormSchema = z.object({
  name: z.string().trim().min(1).max(80),
  type: z.enum(['cash', 'bank', 'e-wallet', 'other']),
  initialBalance: z.coerce.number().int().min(0),
  color: z.string().trim().min(1),
  icon: z.string().trim().min(1),
});

export type WalletFormValues = z.infer<typeof walletFormSchema>;
