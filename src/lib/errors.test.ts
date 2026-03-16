import { describe, expect, it } from 'vitest';
import { getAuthErrorKind, getErrorMessage } from '@/lib/errors';

describe('getErrorMessage', () => {
  it('uses the fallback for Supabase unexpected_failure errors', () => {
    expect(
      getErrorMessage(
        {
          code: 'unexpected_failure',
          message: 'Database error saving new user',
          status: 500,
        },
        'Failed to create your account.'
      )
    ).toBe('Failed to create your account.');
  });

  it('keeps regular error messages intact', () => {
    expect(getErrorMessage(new Error('Invalid login credentials'), 'Fallback')).toBe(
      'Invalid login credentials'
    );
  });

  it('detects unconfirmed email auth errors', () => {
    expect(
      getAuthErrorKind({
        message: 'Email not confirmed',
        status: 400,
      })
    ).toBe('email_not_confirmed');
  });
});
