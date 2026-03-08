import '../../helpers/mock-clerk';
import '../../helpers/mock-convex';
import '../../helpers/mock-router';
import '../../helpers/mock-misc';

import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';

import {
  mockAttemptFirstFactor,
  mockAttemptSecondFactor,
  mockSetActiveSignIn,
  mockSignInCreate,
  mockUseSignIn,
} from '../../helpers/mock-clerk';
import { mockRouter } from '../../helpers/mock-router';

import SignInScreen from '@/app/(auth)/sign-in';

describe('SignInScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSignIn.mockReturnValue({
      signIn: {
        create: mockSignInCreate,
        attemptFirstFactor: mockAttemptFirstFactor,
        attemptSecondFactor: mockAttemptSecondFactor,
        authenticateWithPasskey: jest.fn(),
      },
      setActive: mockSetActiveSignIn,
      isLoaded: true,
    });
  });

  it('renders email and password inputs', () => {
    render(<SignInScreen />);

    expect(screen.getByPlaceholderText('Email')).toBeTruthy();
    expect(screen.getByPlaceholderText('Password')).toBeTruthy();
  });

  it('renders sign in button', () => {
    render(<SignInScreen />);

    expect(screen.getByText('Sign in')).toBeTruthy();
  });

  it('renders forgot password link', () => {
    render(<SignInScreen />);

    expect(screen.getByText('Forgot password?')).toBeTruthy();
  });

  it('calls signIn.create on sign in press', async () => {
    mockSignInCreate.mockResolvedValue({
      status: 'complete',
      createdSessionId: 'session-123',
    });

    render(<SignInScreen />);

    fireEvent.changeText(screen.getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.changeText(screen.getByPlaceholderText('Password'), 'password123');
    fireEvent.press(screen.getByText('Sign in'));

    await waitFor(() => {
      expect(mockSignInCreate).toHaveBeenCalledWith({
        identifier: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('calls setActive and navigates on complete status', async () => {
    mockSignInCreate.mockResolvedValue({
      status: 'complete',
      createdSessionId: 'session-123',
    });

    render(<SignInScreen />);

    fireEvent.changeText(screen.getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.changeText(screen.getByPlaceholderText('Password'), 'password123');
    fireEvent.press(screen.getByText('Sign in'));

    await waitFor(() => {
      expect(mockSetActiveSignIn).toHaveBeenCalledWith({
        session: 'session-123',
      });
      expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)');
    });
  });

  it('shows error on invalid credentials', async () => {
    mockSignInCreate.mockRejectedValue({
      errors: [
        {
          code: 'form_password_incorrect',
          message: 'raw',
          longMessage: 'raw long',
        },
      ],
    });

    render(<SignInScreen />);

    fireEvent.changeText(screen.getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.changeText(screen.getByPlaceholderText('Password'), 'wrong');
    fireEvent.press(screen.getByText('Sign in'));

    await waitFor(() => {
      expect(screen.getByText('Incorrect password. Please try again.')).toBeTruthy();
    });

    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it('transitions to first-factor phase on needs_first_factor', async () => {
    mockSignInCreate.mockResolvedValue({
      status: 'needs_first_factor',
      supportedFirstFactors: [{ strategy: 'email_code' }],
    });

    render(<SignInScreen />);

    fireEvent.changeText(screen.getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.changeText(screen.getByPlaceholderText('Password'), 'password123');
    fireEvent.press(screen.getByText('Sign in'));

    await waitFor(() => {
      expect(screen.getByText('Verify your identity')).toBeTruthy();
    });
  });

  it('transitions to second-factor phase on needs_second_factor', async () => {
    mockSignInCreate.mockResolvedValue({
      status: 'needs_second_factor',
      supportedSecondFactors: [{ strategy: 'totp' }],
    });

    render(<SignInScreen />);

    fireEvent.changeText(screen.getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.changeText(screen.getByPlaceholderText('Password'), 'password123');
    fireEvent.press(screen.getByText('Sign in'));

    await waitFor(() => {
      expect(screen.getByText('Two-factor authentication')).toBeTruthy();
    });
  });

  it('calls attemptFirstFactor in first-factor phase', async () => {
    mockSignInCreate.mockResolvedValue({
      status: 'needs_first_factor',
      supportedFirstFactors: [{ strategy: 'email_code' }],
    });
    mockAttemptFirstFactor.mockResolvedValue({
      status: 'complete',
      createdSessionId: 'session-456',
    });

    render(<SignInScreen />);

    fireEvent.changeText(screen.getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.changeText(screen.getByPlaceholderText('Password'), 'password123');
    fireEvent.press(screen.getByText('Sign in'));

    await waitFor(() => {
      expect(screen.getByText('Verify your identity')).toBeTruthy();
    });

    fireEvent.changeText(screen.getByPlaceholderText('000000'), '123456');
    fireEvent.press(screen.getByText('Verify'));

    await waitFor(() => {
      expect(mockAttemptFirstFactor).toHaveBeenCalledWith({
        strategy: 'email_code',
        code: '123456',
      });
      expect(mockSetActiveSignIn).toHaveBeenCalledWith({
        session: 'session-456',
      });
    });
  });

  it('does not render passkey button when not supported', () => {
    render(<SignInScreen />);

    expect(screen.queryByText('Sign in with passkey')).toBeNull();
  });

  it('renders passkey button when supported', () => {
    const { isPasskeySupported } = require('@/lib/passkeys');
    (isPasskeySupported as jest.Mock).mockReturnValue(true);

    render(<SignInScreen />);

    expect(screen.getByText('Sign in with passkey')).toBeTruthy();

    // Reset
    (isPasskeySupported as jest.Mock).mockReturnValue(false);
  });

  it('does not navigate when isLoaded is false', () => {
    mockUseSignIn.mockReturnValue({
      signIn: {
        create: mockSignInCreate,
        attemptFirstFactor: mockAttemptFirstFactor,
        attemptSecondFactor: mockAttemptSecondFactor,
        authenticateWithPasskey: jest.fn(),
      },
      setActive: mockSetActiveSignIn,
      isLoaded: false,
    });

    render(<SignInScreen />);

    fireEvent.press(screen.getByText('Sign in'));

    expect(mockSignInCreate).not.toHaveBeenCalled();
  });
});
