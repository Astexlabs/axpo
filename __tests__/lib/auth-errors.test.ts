// Mock isClerkAPIResponseError before importing
jest.mock('@clerk/clerk-expo', () => ({
  isClerkAPIResponseError: (err: unknown) =>
    typeof err === 'object' &&
    err !== null &&
    'errors' in err &&
    Array.isArray((err as Record<string, unknown>).errors),
}));

import { getAuthErrorCode, getAuthErrorMessage } from '@/lib/auth-errors';

describe('getAuthErrorMessage', () => {
  it('maps form_password_incorrect to friendly message', () => {
    const error = {
      errors: [
        {
          code: 'form_password_incorrect',
          message: 'raw',
          longMessage: 'raw long',
        },
      ],
    };
    expect(getAuthErrorMessage(error)).toBe(
      'Incorrect password. Please try again.',
    );
  });

  it('maps form_identifier_not_found to friendly message', () => {
    const error = {
      errors: [
        {
          code: 'form_identifier_not_found',
          message: 'raw',
          longMessage: 'raw long',
        },
      ],
    };
    expect(getAuthErrorMessage(error)).toBe(
      'No account found with that email address.',
    );
  });

  it('maps form_identifier_exists to friendly message', () => {
    const error = {
      errors: [
        {
          code: 'form_identifier_exists',
          message: 'raw',
          longMessage: 'raw long',
        },
      ],
    };
    expect(getAuthErrorMessage(error)).toBe(
      'An account with this email already exists.',
    );
  });

  it('maps form_code_incorrect to friendly message', () => {
    const error = {
      errors: [
        {
          code: 'form_code_incorrect',
          message: 'raw',
          longMessage: 'raw long',
        },
      ],
    };
    expect(getAuthErrorMessage(error)).toBe(
      'Invalid verification code. Please try again.',
    );
  });

  it('maps too_many_requests to friendly message', () => {
    const error = {
      errors: [
        {
          code: 'too_many_requests',
          message: 'raw',
          longMessage: 'raw long',
        },
      ],
    };
    expect(getAuthErrorMessage(error)).toBe(
      'Too many attempts. Please wait a moment and try again.',
    );
  });

  it('falls back to longMessage for unknown Clerk error codes', () => {
    const error = {
      errors: [
        {
          code: 'unknown_code_xyz',
          message: 'raw message',
          longMessage: 'A detailed long message',
        },
      ],
    };
    expect(getAuthErrorMessage(error)).toBe('A detailed long message');
  });

  it('falls back to message when longMessage is missing', () => {
    const error = {
      errors: [{ code: 'unknown_code_xyz', message: 'raw message' }],
    };
    expect(getAuthErrorMessage(error)).toBe('raw message');
  });

  it('handles plain Error objects', () => {
    expect(getAuthErrorMessage(new Error('boom'))).toBe('boom');
  });

  it('handles non-Error values', () => {
    expect(getAuthErrorMessage('string error')).toBe(
      'An unexpected error occurred.',
    );
    expect(getAuthErrorMessage(42)).toBe('An unexpected error occurred.');
    expect(getAuthErrorMessage(null)).toBe('An unexpected error occurred.');
    expect(getAuthErrorMessage(undefined)).toBe(
      'An unexpected error occurred.',
    );
  });

  it('returns generic message for empty errors array', () => {
    const error = { errors: [] };
    // No firstError, so falls through
    expect(getAuthErrorMessage(error)).toBe('An error occurred.');
  });
});

describe('getAuthErrorCode', () => {
  it('returns code for Clerk errors', () => {
    const error = {
      errors: [
        {
          code: 'form_password_incorrect',
          message: 'raw',
        },
      ],
    };
    expect(getAuthErrorCode(error)).toBe('form_password_incorrect');
  });

  it('returns null for non-Clerk errors', () => {
    expect(getAuthErrorCode(new Error('boom'))).toBeNull();
    expect(getAuthErrorCode('string')).toBeNull();
    expect(getAuthErrorCode(null)).toBeNull();
  });

  it('returns null for empty errors array', () => {
    expect(getAuthErrorCode({ errors: [] })).toBeNull();
  });
});
