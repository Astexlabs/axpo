export const mockSignOut = jest.fn().mockResolvedValue(undefined);

export const mockUseAuth = jest.fn().mockReturnValue({
  isLoaded: true,
  isSignedIn: false,
  signOut: mockSignOut,
});

export const mockSignInCreate = jest.fn();
export const mockAttemptFirstFactor = jest.fn();
export const mockAttemptSecondFactor = jest.fn();
export const mockAuthenticateWithPasskey = jest.fn();
export const mockSetActiveSignIn = jest.fn().mockResolvedValue(undefined);

export const mockUseSignIn = jest.fn().mockReturnValue({
  signIn: {
    create: mockSignInCreate,
    attemptFirstFactor: mockAttemptFirstFactor,
    attemptSecondFactor: mockAttemptSecondFactor,
    authenticateWithPasskey: mockAuthenticateWithPasskey,
  },
  setActive: mockSetActiveSignIn,
  isLoaded: true,
});

export const mockSignUpCreate = jest.fn();
export const mockSignUpUpdate = jest.fn();
export const mockPrepareEmailAddressVerification = jest.fn().mockResolvedValue(undefined);
export const mockAttemptEmailAddressVerification = jest.fn();
export const mockSetActiveSignUp = jest.fn().mockResolvedValue(undefined);

export const mockUseSignUp = jest.fn().mockReturnValue({
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

export const mockUserUpdate = jest.fn().mockResolvedValue(undefined);
export const mockCreatePasskey = jest.fn().mockResolvedValue(undefined);

export const mockUseUser = jest.fn().mockReturnValue({
  user: {
    firstName: 'Test',
    lastName: 'User',
    fullName: 'Test User',
    username: 'testuser',
    emailAddresses: [{ emailAddress: 'test@example.com' }],
    update: mockUserUpdate,
    createPasskey: mockCreatePasskey,
  },
});

jest.mock('@clerk/clerk-expo', () => ({
  useAuth: (...args: unknown[]) => mockUseAuth(...args),
  useSignIn: (...args: unknown[]) => mockUseSignIn(...args),
  useSignUp: (...args: unknown[]) => mockUseSignUp(...args),
  useUser: (...args: unknown[]) => mockUseUser(...args),
  isClerkAPIResponseError: (err: unknown) =>
    typeof err === 'object' &&
    err !== null &&
    'errors' in err &&
    Array.isArray((err as Record<string, unknown>).errors),
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
  ClerkLoaded: ({ children }: { children: React.ReactNode }) => children,
}));
