import { z } from 'zod';

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

export const registerSchema = z
  .object({
    full_name: z.string().trim().min(2).max(120),
    email: z.email(),
    password: z.string().min(8),
    confirm_password: z.string().min(8),
  })
  .refine((value) => value.password === value.confirm_password, {
    message: 'Passwords do not match.',
    path: ['confirm_password'],
  });

export const forgotPasswordSchema = z.object({
  email: z.email(),
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8),
    confirm_password: z.string().min(8),
  })
  .refine((value) => value.password === value.confirm_password, {
    message: 'Passwords do not match.',
    path: ['confirm_password'],
  });

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
