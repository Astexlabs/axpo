import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { mockUseAuth, mockUseUser } from '../../helpers/mock-clerk';

const mockReplace = jest.fn();

jest.mock('@clerk/clerk-expo', () => ({
  useAuth: jest.fn(),
  useUser: jest.fn(),
  isClerkAPIResponseError: (err: unknown) =>
    err !== null &&
    typeof err === 'object' &&
    'clerkError' in err &&
    (err as { clerkError: boolean }).clerkError === true,
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

jest.mock('convex/react', () => ({
  useAction: () => jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/convex/_generated/api', () => ({
  api: {
    emails: { send: 'emails:send' },
  },
}));

jest.mock('@hugeicons/core-free-icons', () => ({
  Key01Icon: 'Key01Icon',
  Logout01Icon: 'Logout01Icon',
  Mail01Icon: 'Mail01Icon',
  UserIcon: 'UserIcon',
}));

jest.mock('@/components/ui/icon', () => ({
  Icon: () => null,
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

import { useAuth, useUser } from '@clerk/clerk-expo';
import SettingsScreen from '@/app/(tabs)/settings';

const mockUseAuthFn = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseUserFn = useUser as jest.MockedFunction<typeof useUser>;

describe('app/(tabs)/settings.tsx', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls signOut and redirects on confirmation', async () => {
    const authMock = mockUseAuth({ isSignedIn: true });
    const userMock = mockUseUser();
    mockUseAuthFn.mockReturnValue(authMock as ReturnType<typeof useAuth>);
    mockUseUserFn.mockReturnValue(userMock as ReturnType<typeof useUser>);

    jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons) => {
      // Simulate pressing the "Sign out" destructive button
      const signOutBtn = buttons?.find((b) => b.style === 'destructive');
      if (signOutBtn?.onPress) signOutBtn.onPress();
    });

    const { getByAccessibilityLabel } = render(<SettingsScreen />);
    fireEvent.press(getByAccessibilityLabel('Sign out'));

    await waitFor(() => {
      expect(authMock.signOut).toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith('/(auth)/sign-in');
    });
  });

  it('renders create passkey button', () => {
    const authMock = mockUseAuth({ isSignedIn: true });
    const userMock = mockUseUser();
    mockUseAuthFn.mockReturnValue(authMock as ReturnType<typeof useAuth>);
    mockUseUserFn.mockReturnValue(userMock as ReturnType<typeof useUser>);

    const { getByAccessibilityLabel } = render(<SettingsScreen />);
    expect(getByAccessibilityLabel('Create passkey')).toBeTruthy();
  });

  it('calls createPasskey on button press', async () => {
    const authMock = mockUseAuth({ isSignedIn: true });
    const userMock = mockUseUser();
    mockUseAuthFn.mockReturnValue(authMock as ReturnType<typeof useAuth>);
    mockUseUserFn.mockReturnValue(userMock as ReturnType<typeof useUser>);

    jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    const { getByAccessibilityLabel } = render(<SettingsScreen />);
    fireEvent.press(getByAccessibilityLabel('Create passkey'));

    await waitFor(() => {
      expect(userMock.user.createPasskey).toHaveBeenCalled();
    });
  });

  it('displays user info', () => {
    const authMock = mockUseAuth({ isSignedIn: true });
    const userMock = mockUseUser();
    mockUseAuthFn.mockReturnValue(authMock as ReturnType<typeof useAuth>);
    mockUseUserFn.mockReturnValue(userMock as ReturnType<typeof useUser>);

    const { getByText } = render(<SettingsScreen />);
    expect(getByText('Test User')).toBeTruthy();
    expect(getByText('test@example.com')).toBeTruthy();
  });
});
