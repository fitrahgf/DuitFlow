import { z } from 'zod';

const optionalUuid = z.string().uuid().or(z.literal(''));
const optionalUrl = z.union([z.string().url(), z.literal('')]);

export const wishlistFormSchema = z.object({
  item_name: z.string().trim().min(1).max(160),
  target_price: z.preprocess(
    (value) => (value === '' || value === null || typeof value === 'undefined' || Number.isNaN(value) ? undefined : value),
    z.coerce.number().int().positive().optional()
  ),
  url: optionalUrl.default(''),
  note: z.string().trim().max(500).optional().default(''),
  priority: z.enum(['low', 'medium', 'high']),
  reason: z.string().trim().max(300).optional().default(''),
  cooling_days: z.enum(['3', '5', '7']),
  selected_wallet_id: optionalUuid.optional().default(''),
});

export const wishlistReviewSchema = z
  .object({
    next_status: z.enum(['approved_to_buy', 'cancelled', 'postponed']),
    postpone_days: z.enum(['3', '5', '7']).optional(),
  })
  .superRefine((values, context) => {
    if (values.next_status === 'postponed' && !values.postpone_days) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Choose how many days to postpone.',
        path: ['postpone_days'],
      });
    }
  });

export type WishlistFormInput = z.input<typeof wishlistFormSchema>;
export type WishlistFormValues = z.output<typeof wishlistFormSchema>;
export type WishlistReviewInput = z.input<typeof wishlistReviewSchema>;
export type WishlistReviewValues = z.output<typeof wishlistReviewSchema>;
