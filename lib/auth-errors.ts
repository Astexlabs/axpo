import { isClerkAPIResponseError } from '@clerk/clerk-expo';

const ERROR_MESSAGES: Record<string, string> = {
  // Sign-in
  form_identifier_not_found: 'No account found with that email address.',
  form_password_incorrect: 'Incorrect password. Please try again.',
  form_password_pwned:
    'This password has been compromised. Please choose a different one.',

  // Sign-up
  form_identifier_exists: 'An account with this email already exists.',
  form_password_length_too_short: 'Password must be at least 8 characters.',
  form_param_format_invalid: 'Please check your input and try again.',
  form_code_incorrect: 'Invalid verification code. Please try again.',
  form_param_nil: 'This field is required.',
  form_param_value_invalid: 'The value provided is not valid.',

  // Rate limiting
  too_many_requests: 'Too many attempts. Please wait a moment and try again.',
  rate_limit_exceeded: 'Too many requests. Please slow down.',

  // Session
  session_exists: 'You are already signed in.',

  // Verification
  verification_failed: 'Verification failed. Please request a new code.',
  verification_expired:
    'The verification code has expired. Please request a new one.',

  // Passkeys
  passkey_registration_failure: 'Passkey registration failed. Please try again.',
  passkey_authentication_failure:
    'Passkey sign-in failed. Please try another method.',
  passkey_not_supported: 'Passkeys are not supported on this device.',

  // Generic
  internal_error: 'Something went wrong. Please try again later.',
};

/**
 * Extract a user-friendly message from a Clerk error.
 * Falls back to the raw error message if the code is unrecognized.
 */
export function getAuthErrorMessage(error: unknown): string {
  if (isClerkAPIResponseError(error)) {
    const firstError = error.errors[0];
    if (firstError?.code && ERROR_MESSAGES[firstError.code]) {
      return ERROR_MESSAGES[firstError.code];
    }
    return firstError?.longMessage ?? firstError?.message ?? 'An error occurred.';
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred.';
}

/**
 * Extract the Clerk error code from an error, if available.
 */
export function getAuthErrorCode(error: unknown): string | null {
  if (isClerkAPIResponseError(error)) {
    return error.errors[0]?.code ?? null;
  }
  return null;
}
