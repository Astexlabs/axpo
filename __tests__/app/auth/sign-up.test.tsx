import '../../helpers/mock-clerk';
import '../../helpers/mock-convex';
import '../../helpers/mock-router';
import '../../helpers/mock-misc';

import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import React from 'react';

import {
  mockAttemptEmailAddressVerification,
  mockPrepareEmailAddressVerification,
  mockSetActiveSignUp,
  mockSignUpCreate,
  mockSignUpUpdate,
  mockUseSignUp,
} from '../../helpers/mock-clerk';
import { mockRouter } from '../../helpers/mock-router';

import SignUpScreen from '@/app/(auth)/sign-up';

describe('SignUpScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSignUp.mockReturnValue({
      signUp: {
        create: mockSignUpCreate,
        update: mockSignUpUpdate,
        prepareEmailAddressVerification: mockPrepareEmailAddressVerification,
        attemptEmailAddressVerification: mockAttemptEmailAddressVerification,
        status: null,
        missingFields: [],
        requiredFields: [],
      },
      setActive: mockSetActiveSignUp,
      isLoaded: true,
    });
  });

  it('renders registration form initially', () => {
    render(<SignUpScreen />);

    expect(screen.getByText('Create account')).toBeTruthy();
    expect(screen.getByPlaceholderText('Email')).toBeTruthy();
    expect(screen.getByPlaceholderText('Password')).toBeTruthy();
    expect(screen.getByText('Sign up')).toBeTruthy();
  });

  it('calls signUp.create on sign up press', async () => {
    mockSignUpCreate.mockResolvedValue({ status: 'missing_requirements' });

    render(<SignUpScreen />);

    fireEvent.changeText(screen.getByPlaceholderText('Email'), 'new@example.com');
    fireEvent.changeText(screen.getByPlaceholderText('Password'), 'password123');
    fireEvent.press(screen.getByText('Sign up'));

    await waitFor(() => {
      expect(mockSignUpCreate).toHaveBeenCalledWith({
        emailAddress: 'new@example.com',
        password: 'password123',
      });
    });
  });

  it('transitions to verification phase after successful create', async () => {
    mockSignUpCreate.mockResolvedValue({ status: 'missing_requirements' });
    // missingFields is empty or only verification fields
    mockUseSignUp.mockReturnValue({
      signUp: {
        create: mockSignUpCreate,
        update: mockSignUpUpdate,
        prepareEmailAddressVerification: mockPrepareEmailAddressVerification,
        attemptEmailAddressVerification: mockAttemptEmailAddressVerification,
        status: 'missing_requirements',
        missingFields: [],
        requiredFields: [],
      },
      setActive: mockSetActiveSignUp,
      isLoaded: true,
    });

    render(<SignUpScreen />);

    fireEvent.changeText(screen.getByPlaceholderText('Email'), 'new@example.com');
    fireEvent.changeText(screen.getByPlaceholderText('Password'), 'password123');
    fireEvent.press(screen.getByText('Sign up'));

    await waitFor(() => {
      expect(mockPrepareEmailAddressVerification).toHaveBeenCalledWith({
        strategy: 'email_code',
      });
      expect(screen.getByText('Verify email')).toBeTruthy();
    });
  });

  it('shows custom fields form when username is missing', async () => {
    mockSignUpCreate.mockResolvedValue({ status: 'missing_requirements' });
    mockUseSignUp.mockReturnValue({
      signUp: {
        create: mockSignUpCreate,
        update: mockSignUpUpdate,
        prepareEmailAddressVerification: mockPrepareEmailAddressVerification,
        attemptEmailAddressVerification: mockAttemptEmailAddressVerification,
        status: 'missing_requirements',
        missingFields: ['username'],
        requiredFields: ['username'],
      },
      setActive: mockSetActiveSignUp,
      isLoaded: true,
    });

    render(<SignUpScreen />);

    fireEvent.changeText(screen.getByPlaceholderText('Email'), 'new@example.com');
    fireEvent.changeText(screen.getByPlaceholderText('Password'), 'password123');
    fireEvent.press(screen.getByText('Sign up'));

    await waitFor(() => {
      expect(screen.getByText('Complete your profile')).toBeTruthy();
      expect(screen.getByPlaceholderText('Username')).toBeTruthy();
    });
  });

  it('calls signUp.update with username in custom fields phase', async () => {
    mockSignUpCreate.mockResolvedValue({ status: 'missing_requirements' });
    mockSignUpUpdate.mockResolvedValue(undefined);
    mockUseSignUp.mockReturnValue({
      signUp: {
        create: mockSignUpCreate,
        update: mockSignUpUpdate,
        prepareEmailAddressVerification: mockPrepareEmailAddressVerification,
        attemptEmailAddressVerification: mockAttemptEmailAddressVerification,
        status: 'missing_requirements',
        missingFields: ['username'],
        requiredFields: ['username'],
      },
      setActive: mockSetActiveSignUp,
      isLoaded: true,
    });

    render(<SignUpScreen />);

    fireEvent.changeText(screen.getByPlaceholderText('Email'), 'new@example.com');
    fireEvent.changeText(screen.getByPlaceholderText('Password'), 'password123');
    fireEvent.press(screen.getByText('Sign up'));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Username')).toBeTruthy();
    });

    fireEvent.changeText(screen.getByPlaceholderText('Username'), 'myuser');
    fireEvent.press(screen.getByText('Continue'));

    await waitFor(() => {
      expect(mockSignUpUpdate).toHaveBeenCalledWith({ username: 'myuser' });
      expect(mockPrepareEmailAddressVerification).toHaveBeenCalled();
    });
  });

  it('completes verification and navigates to tabs', async () => {
    mockSignUpCreate.mockResolvedValue({ status: 'missing_requirements' });
    mockUseSignUp.mockReturnValue({
      signUp: {
        create: mockSignUpCreate,
        update: mockSignUpUpdate,
        prepareEmailAddressVerification: mockPrepareEmailAddressVerification,
        attemptEmailAddressVerification: mockAttemptEmailAddressVerification,
        status: 'missing_requirements',
        missingFields: [],
        requiredFields: [],
      },
      setActive: mockSetActiveSignUp,
      isLoaded: true,
    });
    mockAttemptEmailAddressVerification.mockResolvedValue({
      status: 'complete',
      createdSessionId: 'session-789',
    });

    render(<SignUpScreen />);

    fireEvent.changeText(screen.getByPlaceholderText('Email'), 'new@example.com');
    fireEvent.changeText(screen.getByPlaceholderText('Password'), 'password123');
    fireEvent.press(screen.getByText('Sign up'));

    await waitFor(() => {
      expect(screen.getByText('Verify email')).toBeTruthy();
    });

    fireEvent.changeText(screen.getByPlaceholderText('000000'), '123456');
    fireEvent.press(screen.getByText('Verify'));

    await waitFor(() => {
      expect(mockAttemptEmailAddressVerification).toHaveBeenCalledWith({
        code: '123456',
      });
      expect(mockSetActiveSignUp).toHaveBeenCalledWith({
        session: 'session-789',
      });
      expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)');
    });
  });

  it('shows resend code button in verification phase', async () => {
    mockSignUpCreate.mockResolvedValue({ status: 'missing_requirements' });
    mockUseSignUp.mockReturnValue({
      signUp: {
        create: mockSignUpCreate,
        update: mockSignUpUpdate,
        prepareEmailAddressVerification: mockPrepareEmailAddressVerification,
        attemptEmailAddressVerification: mockAttemptEmailAddressVerification,
        status: 'missing_requirements',
        missingFields: [],
        requiredFields: [],
      },
      setActive: mockSetActiveSignUp,
      isLoaded: true,
    });

    render(<SignUpScreen />);

    fireEvent.changeText(screen.getByPlaceholderText('Email'), 'new@example.com');
    fireEvent.changeText(screen.getByPlaceholderText('Password'), 'password123');
    fireEvent.press(screen.getByText('Sign up'));

    await waitFor(() => {
      expect(screen.getByText('Resend code')).toBeTruthy();
    });
  });

  it('starts cooldown after resending code', async () => {
    jest.useFakeTimers();
    mockSignUpCreate.mockResolvedValue({ status: 'missing_requirements' });
    mockUseSignUp.mockReturnValue({
      signUp: {
        create: mockSignUpCreate,
        update: mockSignUpUpdate,
        prepareEmailAddressVerification: mockPrepareEmailAddressVerification,
        attemptEmailAddressVerification: mockAttemptEmailAddressVerification,
        status: 'missing_requirements',
        missingFields: [],
        requiredFields: [],
      },
      setActive: mockSetActiveSignUp,
      isLoaded: true,
    });

    render(<SignUpScreen />);

    fireEvent.changeText(screen.getByPlaceholderText('Email'), 'new@example.com');
    fireEvent.changeText(screen.getByPlaceholderText('Password'), 'password123');
    fireEvent.press(screen.getByText('Sign up'));

    await waitFor(() => {
      expect(screen.getByText('Resend code')).toBeTruthy();
    });

    // Clear the call from sign-up flow
    mockPrepareEmailAddressVerification.mockClear();

    await act(async () => {
      fireEvent.press(screen.getByText('Resend code'));
    });

    await waitFor(() => {
      expect(mockPrepareEmailAddressVerification).toHaveBeenCalled();
      expect(screen.getByText(/Resend code in/)).toBeTruthy();
    });

    jest.useRealTimers();
  });

  it('shows error on sign-up failure', async () => {
    mockSignUpCreate.mockRejectedValue({
      errors: [
        {
          code: 'form_identifier_exists',
          message: 'raw',
          longMessage: 'raw long',
        },
      ],
    });

    render(<SignUpScreen />);

    fireEvent.changeText(screen.getByPlaceholderText('Email'), 'existing@example.com');
    fireEvent.changeText(screen.getByPlaceholderText('Password'), 'password123');
    fireEvent.press(screen.getByText('Sign up'));

    await waitFor(() => {
      expect(
        screen.getByText('An account with this email already exists.'),
      ).toBeTruthy();
    });
  });
});
