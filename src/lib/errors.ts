export type AuthErrorKind = 'email_not_confirmed' | 'unexpected_failure' | 'unknown';

function extractErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string' &&
    error.message.trim()
  ) {
    return error.message;
  }

  return null;
}

export function getAuthErrorKind(error: unknown): AuthErrorKind {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'unexpected_failure'
  ) {
    return 'unexpected_failure';
  }

  const message = extractErrorMessage(error)?.toLowerCase() ?? '';

  if (message.includes('email not confirmed')) {
    return 'email_not_confirmed';
  }

  return 'unknown';
}

export function getErrorMessage(error: unknown, fallback = 'Something went wrong.') {
  if (getAuthErrorKind(error) === 'unexpected_failure') {
    return fallback;
  }

  return extractErrorMessage(error) ?? fallback;
}
