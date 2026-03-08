import { Platform } from 'react-native';

/**
 * Check if the device supports passkeys.
 * Android 9+ (API level 28+) is required.
 * Must be a dev build (not Expo Go).
 */
export function isPasskeySupported(): boolean {
  if (Platform.OS !== 'android') return false;
  const apiLevel = Platform.Version;
  if (typeof apiLevel === 'number' && apiLevel < 28) return false;
  return true;
}
