// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mockRN = require('react-native');
  return {
    SafeAreaView: mockRN.View,
    SafeAreaProvider: mockRN.View,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

// Mock @hugeicons
jest.mock('@hugeicons/core-free-icons', () => ({
  Home01Icon: 'Home01Icon',
  Settings01Icon: 'Settings01Icon',
  Notification03Icon: 'Notification03Icon',
  Logout01Icon: 'Logout01Icon',
  Mail01Icon: 'Mail01Icon',
  UserIcon: 'UserIcon',
  Edit01Icon: 'Edit01Icon',
}));

jest.mock('@/components/ui/icon', () => ({
  Icon: () => null,
}));

// Mock push notifications hook
jest.mock('@/hooks/use-push-notifications', () => ({
  usePushNotifications: jest.fn().mockReturnValue({
    expoPushToken: null,
    notification: null,
  }),
}));

// Mock passkeys - default to not supported in tests
jest.mock('@/lib/passkeys', () => ({
  isPasskeySupported: jest.fn().mockReturnValue(false),
}));
