import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { mockUseSignIn, createClerkAPIResponseError } from '../../helpers/mock-clerk';

const mockReplace = jest.fn();

jest.mock('@clerk/clerk-expo', () => ({
  useSignIn: jest.fn(),
  isClerkAPIResponseError: (err: unknown) =>
    err !== null &&
    typeof err === 'object' &&
    'clerkError' in err &&
    (err as { clerkError: boolean }).clerkError === true,
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace, back: jest.fn() }),
  Link: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

import { useSignIn } from '@clerk/clerk-expo';
import SignInScreen from '@/app/(auth)/sign-in';

const mockUseSignInFn = useSignIn as jest.MockedFunction<typeof useSignIn>;

describe('app/(auth)/sign-in.tsx', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('completes sign-in successfully', async () => {
    const mock = mockUseSignIn({
      signIn: {
        create: jest.fn().mockResolvedValue({
          status: 'complete',
          createdSessionId: 'sess_123',
        }),
      },
    });
    mockUseSignInFn.mockReturnValue(mock as ReturnType<typeof useSignIn>);

    const { getByAccessibilityLabel } = render(<SignInScreen />);

    fireEvent.changeText(getByAccessibilityLabel('Email address'), 'test@example.com');
    fireEvent.changeText(getByAccessibilityLabel('Password'), 'password123');
    fireEvent.press(getByAccessibilityLabel('Sign in'));

    await waitFor(() => {
      expect(mock.signIn.create).toHaveBeenCalledWith({
        identifier: 'test@example.com',
        password: 'password123',
      });
      expect(mock.setActive).toHaveBeenCalledWith({ session: 'sess_123' });
      expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
    });
  });

  it('handles needs_first_factor then complete', async () => {
    const mock = mockUseSignIn({
      signIn: {
        create: jest.fn().mockResolvedValue({
          status: 'needs_first_factor',
        }),
        attemptFirstFactor: jest.fn().mockResolvedValue({
          status: 'complete',
          createdSessionId: 'sess_456',
        }),
      },
    });
    mockUseSignInFn.mockReturnValue(mock as ReturnType<typeof useSignIn>);

    const { getByAccessibilityLabel } = render(<SignInScreen />);

    fireEvent.changeText(getByAccessibilityLabel('Email address'), 'test@example.com');
    fireEvent.changeText(getByAccessibilityLabel('Password'), 'password123');
    fireEvent.press(getByAccessibilityLabel('Sign in'));

    await waitFor(() => {
      expect(mock.signIn.attemptFirstFactor).toHaveBeenCalledWith({
        strategy: 'password',
        password: 'password123',
      });
      expect(mock.setActive).toHaveBeenCalledWith({ session: 'sess_456' });
    });
  });

  it('shows MFA step when needs_second_factor', async () => {
    const mock = mockUseSignIn({
      signIn: {
        create: jest.fn().mockResolvedValue({
          status: 'needs_second_factor',
        }),
        attemptSecondFactor: jest.fn().mockResolvedValue({
          status: 'complete',
          createdSessionId: 'sess_789',
        }),
      },
    });
    mockUseSignInFn.mockReturnValue(mock as ReturnType<typeof useSignIn>);

    const { getByAccessibilityLabel, getByText } = render(<SignInScreen />);

    fireEvent.changeText(getByAccessibilityLabel('Email address'), 'test@example.com');
    fireEvent.changeText(getByAccessibilityLabel('Password'), 'password123');
    fireEvent.press(getByAccessibilityLabel('Sign in'));

    await waitFor(() => {
      expect(getByText('Two-factor authentication')).toBeTruthy();
    });

    fireEvent.changeText(getByAccessibilityLabel('Authenticator code'), '123456');
    fireEvent.press(getByAccessibilityLabel('Verify code'));

    await waitFor(() => {
      expect(mock.signIn.attemptSecondFactor).toHaveBeenCalledWith({
        strategy: 'totp',
        code: '123456',
      });
      expect(mock.setActive).toHaveBeenCalledWith({ session: 'sess_789' });
    });
  });

  it('shows error message on Clerk API error', async () => {
    const mock = mockUseSignIn({
      signIn: {
        create: jest.fn().mockRejectedValue(
          createClerkAPIResponseError('form_password_incorrect', 'wrong password'),
        ),
      },
    });
    mockUseSignInFn.mockReturnValue(mock as ReturnType<typeof useSignIn>);

    const { getByAccessibilityLabel, getByText } = render(<SignInScreen />);

    fireEvent.changeText(getByAccessibilityLabel('Email address'), 'test@example.com');
    fireEvent.changeText(getByAccessibilityLabel('Password'), 'wrong');
    fireEvent.press(getByAccessibilityLabel('Sign in'));

    await waitFor(() => {
      expect(getByText('Incorrect password. Please try again.')).toBeTruthy();
    });
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('handles passkey sign-in success', async () => {
    const mock = mockUseSignIn({
      signIn: {
        authenticateWithPasskey: jest.fn().mockResolvedValue({
          status: 'complete',
          createdSessionId: 'sess_pk',
        }),
      },
    });
    mockUseSignInFn.mockReturnValue(mock as ReturnType<typeof useSignIn>);

    const { getByAccessibilityLabel } = render(<SignInScreen />);
    fireEvent.press(getByAccessibilityLabel('Sign in with passkey'));

    await waitFor(() => {
      expect(mock.signIn.authenticateWithPasskey).toHaveBeenCalled();
      expect(mock.setActive).toHaveBeenCalledWith({ session: 'sess_pk' });
      expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
    });
  });

  it('shows error when passkey sign-in fails', async () => {
    const mock = mockUseSignIn({
      signIn: {
        authenticateWithPasskey: jest.fn().mockRejectedValue(
          createClerkAPIResponseError(
            'passkey_authentication_cancelled',
            'cancelled',
          ),
        ),
      },
    });
    mockUseSignInFn.mockReturnValue(mock as ReturnType<typeof useSignIn>);

    const { getByAccessibilityLabel, getByText } = render(<SignInScreen />);
    fireEvent.press(getByAccessibilityLabel('Sign in with passkey'));

    await waitFor(() => {
      expect(getByText('Passkey sign-in was cancelled.')).toBeTruthy();
    });
  });

  it('has a forgot password link', () => {
    const mock = mockUseSignIn();
    mockUseSignInFn.mockReturnValue(mock as ReturnType<typeof useSignIn>);

    const { getByText } = render(<SignInScreen />);
    expect(getByText('Forgot password?')).toBeTruthy();
  });
});
