export const mockRouter = {
  replace: jest.fn(),
  push: jest.fn(),
  back: jest.fn(),
};

jest.mock('expo-router', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mockReact = require('react');
  return {
    useRouter: () => mockRouter,
    Redirect: ({ href }: { href: string }) =>
      mockReact.createElement('Text', { testID: 'redirect', children: href }),
    Link: ({
      children,
      href,
    }: {
      children: React.ReactNode;
      href: string;
      asChild?: boolean;
    }) => mockReact.createElement('View', { testID: `link-${href}` }, children),
    Stack: Object.assign(
      ({ children }: { children?: React.ReactNode }) =>
        mockReact.createElement('View', null, children),
      {
        Screen: () => null,
      },
    ),
    Tabs: Object.assign(
      ({ children }: { children?: React.ReactNode }) =>
        mockReact.createElement('View', null, children),
      {
        Screen: () => null,
      },
    ),
    Slot: () => null,
  };
});
