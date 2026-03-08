import { useAuth, useUser } from '@clerk/clerk-expo';
import { Logout01Icon, Mail01Icon, UserIcon } from '@hugeicons/core-free-icons';
import { useAction } from 'convex/react';
import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/ui/icon';
import { api } from '@/convex/_generated/api';

export default function SettingsScreen() {
  const { signOut } = useAuth();
  const { user } = useUser();
  const sendEmail = useAction(api.emails.send);
  const [sending, setSending] = useState(false);

  const onTestEmail = async () => {
    const email = user?.emailAddresses[0]?.emailAddress;
    if (!email) {
      Alert.alert('Error', 'No email address found');
      return;
    }

    setSending(true);
    try {
      await sendEmail({
        to: email,
        subject: 'Test from Axpo',
        html: '<p>Hello from your Convex + Resend action!</p>',
      });
      Alert.alert('Success', 'Test email sent');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send';
      Alert.alert('Error', message);
    } finally {
      setSending(false);
    }
  };

  const onSignOut = () => {
    Alert.alert('Sign out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-neutral-950">
      <View className="flex-1 px-6 pt-8">
        <Text className="mb-8 font-bold text-3xl text-neutral-900 dark:text-white">Settings</Text>

        <View className="mb-6 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
          <View className="flex-row items-center gap-3">
            <Icon icon={UserIcon} className="text-neutral-600 dark:text-neutral-400" />
            <View>
              <Text className="font-semibold text-neutral-900 dark:text-white">
                {user?.fullName ?? 'No name'}
              </Text>
              <Text className="font-sans text-sm text-neutral-500 dark:text-neutral-400">
                {user?.emailAddresses[0]?.emailAddress}
              </Text>
            </View>
          </View>
        </View>

        <Pressable
          className="mb-3 flex-row items-center gap-3 rounded-xl border border-neutral-200 p-4 active:bg-neutral-50 disabled:opacity-50 dark:border-neutral-800 dark:active:bg-neutral-900"
          onPress={onTestEmail}
          disabled={sending}
        >
          <Icon icon={Mail01Icon} className="text-blue-600" />
          <Text className="font-medium text-neutral-900 dark:text-white">
            {sending ? 'Sending...' : 'Send test email'}
          </Text>
        </Pressable>

        <Pressable
          className="flex-row items-center gap-3 rounded-xl border border-red-200 p-4 active:bg-red-50 dark:border-red-900/50 dark:active:bg-red-950/30"
          onPress={onSignOut}
        >
          <Icon icon={Logout01Icon} className="text-red-600" />
          <Text className="font-medium text-red-600">Sign out</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
