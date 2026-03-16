import { z } from 'zod';

export const profileSettingsSchema = z.object({
  full_name: z.string().trim().max(120).optional().default(''),
  timezone: z.string().trim().min(1).default('Asia/Jakarta'),
  currency_code: z.string().trim().length(3).default('IDR'),
  theme_preference: z.enum(['light', 'dark', 'system']).default('system'),
  preferred_language: z.enum(['id', 'en']).default('id'),
  notification_preferences: z
    .object({
      wishlist_due: z.boolean().default(true),
      budget_warning: z.boolean().default(true),
      budget_exceeded: z.boolean().default(true),
    })
    .default({
      wishlist_due: true,
      budget_warning: true,
      budget_exceeded: true,
    }),
});

export type ProfileSettingsInput = z.input<typeof profileSettingsSchema>;
export type ProfileSettingsValues = z.output<typeof profileSettingsSchema>;
