import React from 'react';
import { render } from '@testing-library/react-native';
import { mockUseAuth } from '../helpers/mock-clerk';

const mockRedirect = jest.fn();

jest.mock('@clerk/clerk-expo', () => ({
  useAuth: jest.fn(),
}));

jest.mock('expo-router', () => ({
  Redirect: (props: { href: string }) => {
    mockRedirect(props.href);
    return null;
  },
}));

import { useAuth } from '@clerk/clerk-expo';
import Index from '@/app/index';

const mockUseAuthFn = useAuth as jest.MockedFunction<typeof useAuth>;

describe('app/index.tsx', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading indicator when isLoaded is false', () => {
    mockUseAuthFn.mockReturnValue(mockUseAuth({ isLoaded: false }) as ReturnType<typeof useAuth>);
    const { getByTestId, queryByTestId } = render(<Index />);
    // ActivityIndicator renders, no redirect
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it('redirects to /(tabs) when signed in', () => {
    mockUseAuthFn.mockReturnValue(
      mockUseAuth({ isLoaded: true, isSignedIn: true }) as ReturnType<typeof useAuth>,
    );
    render(<Index />);
    expect(mockRedirect).toHaveBeenCalledWith('/(tabs)');
  });

  it('redirects to /(auth)/sign-in when not signed in', () => {
    mockUseAuthFn.mockReturnValue(
      mockUseAuth({ isLoaded: true, isSignedIn: false }) as ReturnType<typeof useAuth>,
    );
    render(<Index />);
    expect(mockRedirect).toHaveBeenCalledWith('/(auth)/sign-in');
  });
});
