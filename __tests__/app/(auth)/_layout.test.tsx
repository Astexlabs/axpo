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
  Stack: Object.assign(
    ({ children }: { children: React.ReactNode }) => children,
    {
      Screen: () => null,
    },
  ),
}));

import { useAuth } from '@clerk/clerk-expo';
import AuthLayout from '@/app/(auth)/_layout';

const mockUseAuthFn = useAuth as jest.MockedFunction<typeof useAuth>;

describe('app/(auth)/_layout.tsx', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading indicator when isLoaded is false', () => {
    mockUseAuthFn.mockReturnValue(mockUseAuth({ isLoaded: false }) as ReturnType<typeof useAuth>);
    render(<AuthLayout />);
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it('redirects to /(tabs) when signed in', () => {
    mockUseAuthFn.mockReturnValue(
      mockUseAuth({ isLoaded: true, isSignedIn: true }) as ReturnType<typeof useAuth>,
    );
    render(<AuthLayout />);
    expect(mockRedirect).toHaveBeenCalledWith('/(tabs)');
  });

  it('renders Stack when not signed in', () => {
    mockUseAuthFn.mockReturnValue(
      mockUseAuth({ isLoaded: true, isSignedIn: false }) as ReturnType<typeof useAuth>,
    );
    render(<AuthLayout />);
    expect(mockRedirect).not.toHaveBeenCalled();
  });
});
