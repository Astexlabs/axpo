import { useAuth, useUser } from '@clerk/clerk-expo';
import {
  Edit01Icon,
  Logout01Icon,
  Mail01Icon,
  UserIcon,
} from '@hugeicons/core-free-icons';
import { useAction } from 'convex/react';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/ui/icon';
import { api } from '@/convex/_generated/api';
import { getAuthErrorMessage } from '@/lib/auth-errors';

export default function SettingsScreen() {
  const { signOut } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const sendEmail = useAction(api.emails.send);
  const [sending, setSending] = useState(false);
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [username, setUsername] = useState(user?.username ?? '');
  const [saving, setSaving] = useState(false);

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
      Alert.alert('Error', getAuthErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  const onSignOut = () => {
    Alert.alert('Sign out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/sign-in');
        },
      },
    ]);
  };

  const onSaveProfile = async () => {
    if (!user || saving) return;
    setSaving(true);
    try {
      await user.update({
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        username: username || undefined,
      });
      setEditing(false);
      Alert.alert('Success', 'Profile updated');
    } catch (err: unknown) {
      Alert.alert('Error', getAuthErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-neutral-950">
      <View className="flex-1 px-6 pt-8">
        <Text className="mb-8 font-bold text-3xl text-neutral-900 dark:text-white">
          Settings
        </Text>

        <View className="mb-6 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <Icon icon={UserIcon} className="text-neutral-600 dark:text-neutral-400" />
              <View>
                <Text className="font-semibold text-neutral-900 dark:text-white">
                  {user?.fullName ?? 'No name'}
                </Text>
                <Text className="font-sans text-sm text-neutral-500 dark:text-neutral-400">
                  {user?.emailAddresses[0]?.emailAddress}
                </Text>
                {user?.username ? (
                  <Text className="font-sans text-sm text-neutral-500 dark:text-neutral-400">
                    @{user.username}
                  </Text>
                ) : null}
              </View>
            </View>
            <Pressable
              onPress={() => setEditing(!editing)}
              accessibilityRole="button"
              accessibilityLabel={editing ? 'Cancel editing profile' : 'Edit profile'}
            >
              <Icon
                icon={Edit01Icon}
                className="text-blue-600"
                size={20}
              />
            </Pressable>
          </View>

          {editing && (
            <View className="mt-4 gap-3">
              <TextInput
                className="rounded-lg border border-neutral-300 px-4 py-3 font-sans text-base text-neutral-900 dark:border-neutral-700 dark:text-white"
                placeholder="First name"
                placeholderTextColor="#9ca3af"
                value={firstName}
                onChangeText={setFirstName}
                accessibilityLabel="First name"
              />
              <TextInput
                className="rounded-lg border border-neutral-300 px-4 py-3 font-sans text-base text-neutral-900 dark:border-neutral-700 dark:text-white"
                placeholder="Last name"
                placeholderTextColor="#9ca3af"
                value={lastName}
                onChangeText={setLastName}
                accessibilityLabel="Last name"
              />
              <TextInput
                className="rounded-lg border border-neutral-300 px-4 py-3 font-sans text-base text-neutral-900 dark:border-neutral-700 dark:text-white"
                placeholder="Username"
                placeholderTextColor="#9ca3af"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                accessibilityLabel="Username"
              />
              <Pressable
                className="rounded-lg bg-blue-600 py-3 active:bg-blue-700 disabled:opacity-50"
                onPress={onSaveProfile}
                disabled={saving}
                accessibilityRole="button"
                accessibilityLabel="Save profile"
                accessibilityState={{ disabled: saving }}
              >
                <Text className="text-center font-semibold text-base text-white">
                  {saving ? 'Saving...' : 'Save'}
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        <Pressable
          className="mb-3 flex-row items-center gap-3 rounded-xl border border-neutral-200 p-4 active:bg-neutral-50 disabled:opacity-50 dark:border-neutral-800 dark:active:bg-neutral-900"
          onPress={onTestEmail}
          disabled={sending}
          accessibilityRole="button"
          accessibilityLabel={sending ? 'Sending test email' : 'Send test email'}
          accessibilityState={{ disabled: sending }}
        >
          <Icon icon={Mail01Icon} className="text-blue-600" />
          <Text className="font-medium text-neutral-900 dark:text-white">
            {sending ? 'Sending...' : 'Send test email'}
          </Text>
        </Pressable>

        <Pressable
          className="flex-row items-center gap-3 rounded-xl border border-red-200 p-4 active:bg-red-50 dark:border-red-900/50 dark:active:bg-red-950/30"
          onPress={onSignOut}
          accessibilityRole="button"
          accessibilityLabel="Sign out"
        >
          <Icon icon={Logout01Icon} className="text-red-600" />
          <Text className="font-medium text-red-600">Sign out</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
