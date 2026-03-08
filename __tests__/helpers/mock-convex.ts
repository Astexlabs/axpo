export const mockUseQuery = jest.fn();
export const mockUseMutation = jest.fn().mockReturnValue(jest.fn());
export const mockUseAction = jest.fn().mockReturnValue(jest.fn());

jest.mock('convex/react', () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  useMutation: (...args: unknown[]) => mockUseMutation(...args),
  useAction: (...args: unknown[]) => mockUseAction(...args),
}));

jest.mock('convex/react-clerk', () => ({
  ConvexProviderWithClerk: ({ children }: { children: React.ReactNode }) =>
    children,
}));

jest.mock('@/convex/_generated/api', () => ({
  api: {
    users: {
      currentIdentity: 'users:currentIdentity',
      savePushToken: 'users:savePushToken',
    },
    emails: {
      send: 'emails:send',
    },
  },
}));
