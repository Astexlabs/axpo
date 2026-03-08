import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { mockUseSignIn, createClerkAPIResponseError } from '../../helpers/mock-clerk';

const mockReplace = jest.fn();
const mockBack = jest.fn();

jest.mock('@clerk/clerk-expo', () => ({
  useSignIn: jest.fn(),
  isClerkAPIResponseError: (err: unknown) =>
    err !== null &&
    typeof err === 'object' &&
    'clerkError' in err &&
    (err as { clerkError: boolean }).clerkError === true,
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace, back: mockBack }),
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

import { useSignIn } from '@clerk/clerk-expo';
import ForgotPasswordScreen from '@/app/(auth)/forgot-password';

const mockUseSignInFn = useSignIn as jest.MockedFunction<typeof useSignIn>;

describe('app/(auth)/forgot-password.tsx', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sends reset code for valid email', async () => {
    const mock = mockUseSignIn({
      signIn: {
        create: jest.fn().mockResolvedValue(undefined),
      },
    });
    mockUseSignInFn.mockReturnValue(mock as ReturnType<typeof useSignIn>);

    const { getByAccessibilityLabel, getByText } = render(<ForgotPasswordScreen />);

    fireEvent.changeText(getByAccessibilityLabel('Email address'), 'test@example.com');
    fireEvent.press(getByAccessibilityLabel('Send reset code'));

    await waitFor(() => {
      expect(mock.signIn.create).toHaveBeenCalledWith({
        strategy: 'reset_password_email_code',
        identifier: 'test@example.com',
      });
      expect(getByText('Enter code')).toBeTruthy();
    });
  });

  it('verifies code and shows new password form', async () => {
    const mock = mockUseSignIn({
      signIn: {
        create: jest.fn().mockResolvedValue(undefined),
        attemptFirstFactor: jest.fn().mockResolvedValue({
          status: 'needs_new_password',
        }),
      },
    });
    mockUseSignInFn.mockReturnValue(mock as ReturnType<typeof useSignIn>);

    const { getByAccessibilityLabel, getByText } = render(<ForgotPasswordScreen />);

    // Step 1: Request
    fireEvent.changeText(getByAccessibilityLabel('Email address'), 'test@example.com');
    fireEvent.press(getByAccessibilityLabel('Send reset code'));

    await waitFor(() => {
      expect(getByText('Enter code')).toBeTruthy();
    });

    // Step 2: Code
    fireEvent.changeText(getByAccessibilityLabel('Reset code'), '123456');
    fireEvent.press(getByAccessibilityLabel('Verify code'));

    await waitFor(() => {
      expect(mock.signIn.attemptFirstFactor).toHaveBeenCalledWith({
        strategy: 'reset_password_email_code',
        code: '123456',
      });
      expect(getByText('New password')).toBeTruthy();
    });
  });

  it('resets password and navigates to tabs', async () => {
    const mock = mockUseSignIn({
      signIn: {
        create: jest.fn().mockResolvedValue(undefined),
        attemptFirstFactor: jest.fn().mockResolvedValue({
          status: 'needs_new_password',
        }),
        resetPassword: jest.fn().mockResolvedValue({
          status: 'complete',
          createdSessionId: 'sess_reset',
        }),
      },
    });
    mockUseSignInFn.mockReturnValue(mock as ReturnType<typeof useSignIn>);

    const { getByAccessibilityLabel, getByText } = render(<ForgotPasswordScreen />);

    // Step 1
    fireEvent.changeText(getByAccessibilityLabel('Email address'), 'test@example.com');
    fireEvent.press(getByAccessibilityLabel('Send reset code'));
    await waitFor(() => expect(getByText('Enter code')).toBeTruthy());

    // Step 2
    fireEvent.changeText(getByAccessibilityLabel('Reset code'), '123456');
    fireEvent.press(getByAccessibilityLabel('Verify code'));
    await waitFor(() => expect(getByText('New password')).toBeTruthy());

    // Step 3
    fireEvent.changeText(getByAccessibilityLabel('New password'), 'newpass123');
    fireEvent.changeText(getByAccessibilityLabel('Confirm new password'), 'newpass123');
    fireEvent.press(getByAccessibilityLabel('Reset password'));

    await waitFor(() => {
      expect(mock.signIn.resetPassword).toHaveBeenCalledWith({
        password: 'newpass123',
        signOutOfOtherSessions: true,
      });
      expect(mock.setActive).toHaveBeenCalledWith({ session: 'sess_reset' });
      expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
    });
  });

  it('shows error when passwords do not match', async () => {
    const mock = mockUseSignIn({
      signIn: {
        create: jest.fn().mockResolvedValue(undefined),
        attemptFirstFactor: jest.fn().mockResolvedValue({
          status: 'needs_new_password',
        }),
      },
    });
    mockUseSignInFn.mockReturnValue(mock as ReturnType<typeof useSignIn>);

    const { getByAccessibilityLabel, getByText } = render(<ForgotPasswordScreen />);

    // Navigate to new password step
    fireEvent.changeText(getByAccessibilityLabel('Email address'), 'test@example.com');
    fireEvent.press(getByAccessibilityLabel('Send reset code'));
    await waitFor(() => expect(getByText('Enter code')).toBeTruthy());

    fireEvent.changeText(getByAccessibilityLabel('Reset code'), '123456');
    fireEvent.press(getByAccessibilityLabel('Verify code'));
    await waitFor(() => expect(getByText('New password')).toBeTruthy());

    // Mismatched passwords
    fireEvent.changeText(getByAccessibilityLabel('New password'), 'newpass123');
    fireEvent.changeText(getByAccessibilityLabel('Confirm new password'), 'different');
    fireEvent.press(getByAccessibilityLabel('Reset password'));

    await waitFor(() => {
      expect(getByText('Passwords do not match.')).toBeTruthy();
    });
  });

  it('shows error on request failure', async () => {
    const mock = mockUseSignIn({
      signIn: {
        create: jest.fn().mockRejectedValue(
          createClerkAPIResponseError('form_identifier_not_found', 'not found'),
        ),
      },
    });
    mockUseSignInFn.mockReturnValue(mock as ReturnType<typeof useSignIn>);

    const { getByAccessibilityLabel, getByText } = render(<ForgotPasswordScreen />);

    fireEvent.changeText(getByAccessibilityLabel('Email address'), 'no@example.com');
    fireEvent.press(getByAccessibilityLabel('Send reset code'));

    await waitFor(() => {
      expect(getByText('No account found with that email address.')).toBeTruthy();
    });
  });

  it('has a back to sign in button', () => {
    const mock = mockUseSignIn();
    mockUseSignInFn.mockReturnValue(mock as ReturnType<typeof useSignIn>);

    const { getByAccessibilityLabel } = render(<ForgotPasswordScreen />);
    fireEvent.press(getByAccessibilityLabel('Back to sign in'));
    expect(mockBack).toHaveBeenCalled();
  });
});
