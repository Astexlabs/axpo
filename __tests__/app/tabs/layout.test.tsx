import '../../helpers/mock-clerk';
import '../../helpers/mock-convex';
import '../../helpers/mock-router';
import '../../helpers/mock-misc';

import { render, screen } from '@testing-library/react-native';
import React from 'react';

import { mockUseAuth } from '../../helpers/mock-clerk';

import TabLayout from '@/app/(tabs)/_layout';

describe('TabLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading indicator when isLoaded is false', () => {
    mockUseAuth.mockReturnValue({
      isLoaded: false,
      isSignedIn: undefined,
    });

    render(<TabLayout />);

    expect(screen.queryByTestId('redirect')).toBeNull();
  });

  it('redirects to sign-in when not signed in', () => {
    mockUseAuth.mockReturnValue({
      isLoaded: true,
      isSignedIn: false,
    });

    render(<TabLayout />);

    const redirect = screen.getByTestId('redirect');
    expect(redirect.props.children).toBe('/(auth)/sign-in');
  });

  it('does not call users.upsert (manual sync removed)', () => {
    mockUseAuth.mockReturnValue({
      isLoaded: true,
      isSignedIn: true,
    });

    render(<TabLayout />);

    // Verify no mutation was called for upsert
    const { mockUseMutation } = require('../../helpers/mock-convex');
    const calls = mockUseMutation.mock.calls;
    const upsertCalls = calls.filter(
      (call: unknown[]) => call[0] === 'users:upsert',
    );
    expect(upsertCalls).toHaveLength(0);
  });
});
