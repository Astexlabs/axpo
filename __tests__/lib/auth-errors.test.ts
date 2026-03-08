import { getAuthErrorMessage } from '@/lib/auth-errors';
import { createClerkAPIResponseError } from '../helpers/mock-clerk';

// Mock isClerkAPIResponseError to check our custom error shape
jest.mock('@clerk/clerk-expo', () => ({
  isClerkAPIResponseError: (err: unknown) =>
    err !== null &&
    typeof err === 'object' &&
    'clerkError' in err &&
    (err as { clerkError: boolean }).clerkError === true,
}));

describe('getAuthErrorMessage', () => {
  it('maps known Clerk error codes to user-friendly messages', () => {
    const error = createClerkAPIResponseError(
      'form_password_incorrect',
      'Password is incorrect',
    );
    expect(getAuthErrorMessage(error)).toBe('Incorrect password. Please try again.');
  });

  it('maps form_identifier_not_found', () => {
    const error = createClerkAPIResponseError(
      'form_identifier_not_found',
      'identifier not found',
    );
    expect(getAuthErrorMessage(error)).toBe('No account found with that email address.');
  });

  it('maps form_identifier_exists', () => {
    const error = createClerkAPIResponseError(
      'form_identifier_exists',
      'already exists',
    );
    expect(getAuthErrorMessage(error)).toBe('An account with this email already exists.');
  });

  it('maps form_code_incorrect', () => {
    const error = createClerkAPIResponseError('form_code_incorrect', 'bad code');
    expect(getAuthErrorMessage(error)).toBe('Invalid verification code. Please try again.');
  });

  it('maps too_many_requests', () => {
    const error = createClerkAPIResponseError('too_many_requests', 'rate limited');
    expect(getAuthErrorMessage(error)).toBe(
      'Too many attempts. Please wait a moment and try again.',
    );
  });

  it('falls back to longMessage for unmapped Clerk codes', () => {
    const error = createClerkAPIResponseError('some_unknown_code', 'Some unknown error');
    expect(getAuthErrorMessage(error)).toBe('Some unknown error');
  });

  it('returns Error.message for plain errors', () => {
    const error = new Error('Something went wrong');
    expect(getAuthErrorMessage(error)).toBe('Something went wrong');
  });

  it('returns default message for non-Error values', () => {
    expect(getAuthErrorMessage('string error')).toBe('An unexpected error occurred.');
    expect(getAuthErrorMessage(null)).toBe('An unexpected error occurred.');
    expect(getAuthErrorMessage(42)).toBe('An unexpected error occurred.');
  });
});
