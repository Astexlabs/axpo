import '../helpers/mock-clerk';
import '../helpers/mock-convex';
import '../helpers/mock-router';
import '../helpers/mock-misc';

import { render, screen } from '@testing-library/react-native';
import React from 'react';

import { mockUseAuth } from '../helpers/mock-clerk';

import Index from '@/app/index';

describe('app/index', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading indicator when isLoaded is false', () => {
    mockUseAuth.mockReturnValue({
      isLoaded: false,
      isSignedIn: undefined,
    });

    render(<Index />);

    expect(screen.queryByTestId('redirect')).toBeNull();
  });

  it('redirects to tabs when signed in', () => {
    mockUseAuth.mockReturnValue({
      isLoaded: true,
      isSignedIn: true,
    });

    render(<Index />);

    const redirect = screen.getByTestId('redirect');
    expect(redirect.props.children).toBe('/(tabs)');
  });

  it('redirects to sign-in when not signed in', () => {
    mockUseAuth.mockReturnValue({
      isLoaded: true,
      isSignedIn: false,
    });

    render(<Index />);

    const redirect = screen.getByTestId('redirect');
    expect(redirect.props.children).toBe('/(auth)/sign-in');
  });
});
