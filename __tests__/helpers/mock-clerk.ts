export function mockUseAuth(overrides: Record<string, unknown> = {}) {
  return {
    isLoaded: true,
    isSignedIn: false,
    signOut: jest.fn().mockResolvedValue(undefined),
    getToken: jest.fn().mockResolvedValue('mock-token'),
    ...overrides,
  };
}

export function mockUseSignIn(overrides: Record<string, unknown> = {}) {
  const { signIn: signInOverrides, ...rest } = overrides as { signIn?: Record<string, unknown> };
  return {
    isLoaded: true,
    signIn: {
      create: jest.fn(),
      prepareFirstFactor: jest.fn(),
      attemptFirstFactor: jest.fn(),
      prepareSecondFactor: jest.fn(),
      attemptSecondFactor: jest.fn(),
      authenticateWithPasskey: jest.fn(),
      resetPassword: jest.fn(),
      supportedFirstFactors: [],
      supportedSecondFactors: [],
      createdSessionId: null,
      status: null,
      ...signInOverrides,
    },
    setActive: jest.fn().mockResolvedValue(undefined),
    ...rest,
  };
}

export function mockUseSignUp(overrides: Record<string, unknown> = {}) {
  const { signUp: signUpOverrides, ...rest } = overrides as { signUp?: Record<string, unknown> };
  return {
    isLoaded: true,
    signUp: {
      create: jest.fn(),
      update: jest.fn(),
      prepareEmailAddressVerification: jest.fn(),
      attemptEmailAddressVerification: jest.fn(),
      status: null,
      missingFields: [],
      requiredFields: [],
      unverifiedFields: [],
      createdSessionId: null,
      ...signUpOverrides,
    },
    setActive: jest.fn().mockResolvedValue(undefined),
    ...rest,
  };
}

export function mockUseUser(overrides: Record<string, unknown> = {}) {
  return {
    isLoaded: true,
    isSignedIn: true,
    user: {
      firstName: 'Test',
      lastName: 'User',
      fullName: 'Test User',
      username: 'testuser',
      emailAddresses: [{ emailAddress: 'test@example.com' }],
      createPasskey: jest.fn().mockResolvedValue(undefined),
      ...overrides,
    },
  };
}

export function createClerkAPIResponseError(code: string, message: string) {
  const error = new Error(message) as Error & {
    errors: Array<{ code: string; message: string; longMessage: string; meta: object }>;
    clerkError: boolean;
  };
  error.errors = [{ code, message, longMessage: message, meta: {} }];
  error.clerkError = true;
  return error;
}
