import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { mockUseSignUp, mockUseUser, createClerkAPIResponseError } from '../../helpers/mock-clerk';

const mockReplace = jest.fn();

jest.mock('@clerk/clerk-expo', () => ({
  useSignUp: jest.fn(),
  useUser: jest.fn(),
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

import { useSignUp, useUser } from '@clerk/clerk-expo';
import SignUpScreen from '@/app/(auth)/sign-up';

const mockUseSignUpFn = useSignUp as jest.MockedFunction<typeof useSignUp>;
const mockUseUserFn = useUser as jest.MockedFunction<typeof useUser>;

describe('app/(auth)/sign-up.tsx', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseUserFn.mockReturnValue(mockUseUser() as ReturnType<typeof useUser>);
  });

  it('creates sign-up and moves to verification when email needs verification', async () => {
    const mock = mockUseSignUp({
      signUp: {
        create: jest.fn().mockImplementation(function (this: { status: string; missingFields: string[] }) {
          this.status = 'missing_requirements';
          this.missingFields = ['email_address'];
          return Promise.resolve();
        }),
        prepareEmailAddressVerification: jest.fn().mockResolvedValue(undefined),
        status: null,
        missingFields: [],
      },
    });

    // After create, the signUp object should reflect the new state
    let callCount = 0;
    (mock.signUp.create as jest.Mock).mockImplementation(async () => {
      callCount++;
      mock.signUp.status = 'missing_requirements';
      mock.signUp.missingFields = ['email_address'];
    });

    mockUseSignUpFn.mockReturnValue(mock as unknown as ReturnType<typeof useSignUp>);

    const { getByLabelText, getByText } = render(<SignUpScreen />);

    fireEvent.changeText(getByLabelText('Email address'), 'test@example.com');
    fireEvent.changeText(getByLabelText('Password'), 'password123');
    fireEvent.press(getByLabelText('Sign up'));

    await waitFor(() => {
      expect(mock.signUp.create).toHaveBeenCalledWith({
        emailAddress: 'test@example.com',
        password: 'password123',
      });
      expect(mock.signUp.prepareEmailAddressVerification).toHaveBeenCalledWith({
        strategy: 'email_code',
      });
      expect(getByText('Verify email')).toBeTruthy();
    });
  });

  it('shows missing fields step when custom fields are required', async () => {
    const mock = mockUseSignUp({
      signUp: {
        create: jest.fn(),
        update: jest.fn(),
        prepareEmailAddressVerification: jest.fn().mockResolvedValue(undefined),
        status: null,
        missingFields: [],
      },
    });

    (mock.signUp.create as jest.Mock).mockImplementation(async () => {
      mock.signUp.status = 'missing_requirements';
      mock.signUp.missingFields = ['username', 'email_address'];
    });

    (mock.signUp.update as jest.Mock).mockImplementation(async () => {
      mock.signUp.status = 'missing_requirements';
      mock.signUp.missingFields = ['email_address'];
    });

    mockUseSignUpFn.mockReturnValue(mock as unknown as ReturnType<typeof useSignUp>);

    const { getByLabelText, getByText } = render(<SignUpScreen />);

    fireEvent.changeText(getByLabelText('Email address'), 'test@example.com');
    fireEvent.changeText(getByLabelText('Password'), 'password123');
    fireEvent.press(getByLabelText('Sign up'));

    await waitFor(() => {
      expect(getByText('Complete your profile')).toBeTruthy();
      expect(getByLabelText('Username')).toBeTruthy();
    });

    fireEvent.changeText(getByLabelText('Username'), 'myuser');
    fireEvent.press(getByLabelText('Continue'));

    await waitFor(() => {
      expect(mock.signUp.update).toHaveBeenCalledWith({ username: 'myuser' });
      expect(mock.signUp.prepareEmailAddressVerification).toHaveBeenCalled();
    });
  });

  it('completes verification and shows passkey offer', async () => {
    const mock = mockUseSignUp({
      signUp: {
        create: jest.fn(),
        prepareEmailAddressVerification: jest.fn().mockResolvedValue(undefined),
        attemptEmailAddressVerification: jest.fn().mockResolvedValue({
          status: 'complete',
          createdSessionId: 'sess_new',
        }),
        status: null,
        missingFields: [],
      },
    });

    (mock.signUp.create as jest.Mock).mockImplementation(async () => {
      mock.signUp.status = 'missing_requirements';
      mock.signUp.missingFields = ['email_address'];
    });

    mockUseSignUpFn.mockReturnValue(mock as unknown as ReturnType<typeof useSignUp>);

    const { getByLabelText, getByText } = render(<SignUpScreen />);

    // Initial sign-up
    fireEvent.changeText(getByLabelText('Email address'), 'test@example.com');
    fireEvent.changeText(getByLabelText('Password'), 'password123');
    fireEvent.press(getByLabelText('Sign up'));

    await waitFor(() => {
      expect(getByText('Verify email')).toBeTruthy();
    });

    // Verification
    fireEvent.changeText(getByLabelText('Verification code'), '123456');
    fireEvent.press(getByLabelText('Verify email'));

    await waitFor(() => {
      expect(mock.signUp.attemptEmailAddressVerification).toHaveBeenCalledWith({
        code: '123456',
      });
      expect(mock.setActive).toHaveBeenCalledWith({ session: 'sess_new' });
      expect(getByText('Create a passkey')).toBeTruthy();
    });
  });

  it('shows resend code button and starts cooldown', async () => {
    jest.useFakeTimers();

    const mock = mockUseSignUp({
      signUp: {
        create: jest.fn(),
        prepareEmailAddressVerification: jest.fn().mockResolvedValue(undefined),
        status: null,
        missingFields: [],
      },
    });

    (mock.signUp.create as jest.Mock).mockImplementation(async () => {
      mock.signUp.status = 'missing_requirements';
      mock.signUp.missingFields = ['email_address'];
    });

    mockUseSignUpFn.mockReturnValue(mock as unknown as ReturnType<typeof useSignUp>);

    const { getByLabelText, getByText } = render(<SignUpScreen />);

    fireEvent.changeText(getByLabelText('Email address'), 'test@example.com');
    fireEvent.changeText(getByLabelText('Password'), 'password123');
    fireEvent.press(getByLabelText('Sign up'));

    await waitFor(() => {
      expect(getByText('Resend code')).toBeTruthy();
    });

    // Resend the code
    fireEvent.press(getByLabelText('Resend verification code'));

    await waitFor(() => {
      expect(mock.signUp.prepareEmailAddressVerification).toHaveBeenCalledTimes(2);
    });

    // Check cooldown is active
    expect(getByText(/Resend code in/)).toBeTruthy();

    jest.useRealTimers();
  });

  it('shows error on sign-up failure', async () => {
    const mock = mockUseSignUp({
      signUp: {
        create: jest.fn().mockRejectedValue(
          createClerkAPIResponseError('form_identifier_exists', 'already exists'),
        ),
        status: null,
        missingFields: [],
      },
    });
    mockUseSignUpFn.mockReturnValue(mock as unknown as ReturnType<typeof useSignUp>);

    const { getByLabelText, getByText } = render(<SignUpScreen />);

    fireEvent.changeText(getByLabelText('Email address'), 'test@example.com');
    fireEvent.changeText(getByLabelText('Password'), 'password123');
    fireEvent.press(getByLabelText('Sign up'));

    await waitFor(() => {
      expect(getByText('An account with this email already exists.')).toBeTruthy();
    });
  });

  it('allows skipping passkey creation', async () => {
    const mock = mockUseSignUp({
      signUp: {
        create: jest.fn(),
        prepareEmailAddressVerification: jest.fn().mockResolvedValue(undefined),
        attemptEmailAddressVerification: jest.fn().mockResolvedValue({
          status: 'complete',
          createdSessionId: 'sess_new',
        }),
        status: null,
        missingFields: [],
      },
    });

    (mock.signUp.create as jest.Mock).mockImplementation(async () => {
      mock.signUp.status = 'missing_requirements';
      mock.signUp.missingFields = ['email_address'];
    });

    mockUseSignUpFn.mockReturnValue(mock as unknown as ReturnType<typeof useSignUp>);

    const { getByLabelText, getByText } = render(<SignUpScreen />);

    // Complete sign-up and verification
    fireEvent.changeText(getByLabelText('Email address'), 'test@example.com');
    fireEvent.changeText(getByLabelText('Password'), 'password123');
    fireEvent.press(getByLabelText('Sign up'));

    await waitFor(() => {
      expect(getByText('Verify email')).toBeTruthy();
    });

    fireEvent.changeText(getByLabelText('Verification code'), '123456');
    fireEvent.press(getByLabelText('Verify email'));

    await waitFor(() => {
      expect(getByText('Create a passkey')).toBeTruthy();
    });

    fireEvent.press(getByLabelText('Skip passkey creation'));
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
  });
});
