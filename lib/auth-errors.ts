import { isClerkAPIResponseError } from '@clerk/clerk-expo';

const ERROR_MESSAGES: Record<string, string> = {
  form_identifier_not_found: 'No account found with that email address.',
  form_password_incorrect: 'Incorrect password. Please try again.',
  form_password_pwned:
    'This password has been found in a data breach. Please choose a different password.',
  form_password_length_too_short: 'Password must be at least 8 characters.',
  form_password_not_strong_enough:
    'Password is too simple. Include uppercase, lowercase, and numbers.',
  form_identifier_exists: 'An account with this email already exists.',
  form_code_incorrect: 'Invalid verification code. Please try again.',
  form_code_expired: 'Verification code has expired. Please request a new one.',
  session_exists: 'You are already signed in. Please sign out first.',
  too_many_requests: 'Too many attempts. Please wait a moment and try again.',
  passkey_not_supported: 'Passkeys are not supported on this device.',
  passkey_registration_cancelled: 'Passkey registration was cancelled.',
  passkey_authentication_cancelled: 'Passkey sign-in was cancelled.',
  strategy_for_user_invalid: 'This sign-in method is not available for your account.',
  verification_expired: 'Verification has expired. Please start over.',
  not_allowed_access: 'Access denied. Please contact support.',
  form_param_nil: 'Please fill in all required fields.',
  form_password_size_in_bytes_exceeded: 'Password is too long.',
};

/**
 * Extracts a user-friendly message from a Clerk error.
 * Falls back to Clerk's longMessage, then message, then a generic string.
 */
export function getAuthErrorMessage(error: unknown): string {
  if (isClerkAPIResponseError(error)) {
    const firstError = error.errors[0];
    if (firstError?.code && ERROR_MESSAGES[firstError.code]) {
      return ERROR_MESSAGES[firstError.code];
    }
    return firstError?.longMessage ?? firstError?.message ?? 'An unexpected error occurred.';
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred.';
}
