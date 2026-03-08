import '../../helpers/mock-clerk';
import '../../helpers/mock-convex';
import '../../helpers/mock-router';
import '../../helpers/mock-misc';

import { render, screen } from '@testing-library/react-native';
import React from 'react';

import { mockUseUser } from '../../helpers/mock-clerk';

import SettingsScreen from '@/app/(tabs)/settings';

describe('SettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseUser.mockReturnValue({
      user: {
        firstName: 'Test',
        lastName: 'User',
        fullName: 'Test User',
        username: 'testuser',
        emailAddresses: [{ emailAddress: 'test@example.com' }],
        update: jest.fn(),
        createPasskey: jest.fn(),
      },
    });
  });

  it('displays user profile information', () => {
    render(<SettingsScreen />);

    expect(screen.getByText('Test User')).toBeTruthy();
    expect(screen.getByText('test@example.com')).toBeTruthy();
    expect(screen.getByText('@testuser')).toBeTruthy();
  });

  it('renders sign out button', () => {
    render(<SettingsScreen />);

    expect(screen.getByText('Sign out')).toBeTruthy();
  });

  it('renders send test email button', () => {
    render(<SettingsScreen />);

    expect(screen.getByText('Send test email')).toBeTruthy();
  });

  it('displays "No name" when fullName is not set', () => {
    mockUseUser.mockReturnValue({
      user: {
        firstName: null,
        lastName: null,
        fullName: null,
        username: null,
        emailAddresses: [{ emailAddress: 'test@example.com' }],
        update: jest.fn(),
        createPasskey: jest.fn(),
      },
    });

    render(<SettingsScreen />);

    expect(screen.getByText('No name')).toBeTruthy();
  });
});
