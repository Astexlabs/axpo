import React from 'react';
import { render } from '@testing-library/react-native';
import { mockUseAuth } from '../../helpers/mock-clerk';

const mockRedirect = jest.fn();

jest.mock('@clerk/clerk-expo', () => ({
  useAuth: jest.fn(),
}));

jest.mock('expo-router', () => ({
  Redirect: (props: { href: string }) => {
    mockRedirect(props.href);
    return null;
  },
  Tabs: Object.assign(
    ({ children }: { children: React.ReactNode }) => children,
    {
      Screen: () => null,
    },
  ),
}));

jest.mock('@hugeicons/core-free-icons', () => ({
  Home01Icon: 'Home01Icon',
  Settings01Icon: 'Settings01Icon',
}));

jest.mock('@/components/ui/icon', () => ({
  Icon: () => null,
}));

jest.mock('@/hooks/use-push-notifications', () => ({
  usePushNotifications: jest.fn(),
}));

// Ensure no Convex user sync is imported
jest.mock('convex/react', () => ({
  useMutation: jest.fn(() => jest.fn()),
  useQuery: jest.fn(),
}));

import { useAuth } from '@clerk/clerk-expo';
import { useMutation } from 'convex/react';
import TabLayout from '@/app/(tabs)/_layout';

const mockUseAuthFn = useAuth as jest.MockedFunction<typeof useAuth>;

describe('app/(tabs)/_layout.tsx', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading indicator when isLoaded is false', () => {
    mockUseAuthFn.mockReturnValue(mockUseAuth({ isLoaded: false }) as ReturnType<typeof useAuth>);
    render(<TabLayout />);
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it('redirects to /(auth)/sign-in when not signed in', () => {
    mockUseAuthFn.mockReturnValue(
      mockUseAuth({ isLoaded: true, isSignedIn: false }) as ReturnType<typeof useAuth>,
    );
    render(<TabLayout />);
    expect(mockRedirect).toHaveBeenCalledWith('/(auth)/sign-in');
  });

  it('renders Tabs when signed in', () => {
    mockUseAuthFn.mockReturnValue(
      mockUseAuth({ isLoaded: true, isSignedIn: true }) as ReturnType<typeof useAuth>,
    );
    render(<TabLayout />);
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it('does NOT call useMutation for user upsert', () => {
    mockUseAuthFn.mockReturnValue(
      mockUseAuth({ isLoaded: true, isSignedIn: true }) as ReturnType<typeof useAuth>,
    );
    render(<TabLayout />);
    // useMutation should NOT have been called with any users.upsert reference
    // Since we removed the import entirely, useMutation should not be called at all
    // from this component (push notifications hook is mocked)
    expect(useMutation).not.toHaveBeenCalled();
  });
});
