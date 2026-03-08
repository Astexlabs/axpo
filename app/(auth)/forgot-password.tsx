import { useSignIn } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getAuthErrorMessage } from '@/lib/auth-errors';

type Step = 'request' | 'code' | 'new-password';

export default function ForgotPasswordScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();

  const [step, setStep] = useState<Step>('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onRequestReset = async () => {
    if (!isLoaded || !signIn || loading) return;
    setLoading(true);
    setError(null);

    try {
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: email,
      });
      setStep('code');
    } catch (err: unknown) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const onVerifyCode = async () => {
    if (!isLoaded || !signIn || loading) return;
    setLoading(true);
    setError(null);

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code,
      });

      if (result.status === 'needs_new_password') {
        setStep('new-password');
      }
    } catch (err: unknown) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const onSetNewPassword = async () => {
    if (!isLoaded || !signIn || loading) return;

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await signIn.resetPassword({
        password: newPassword,
        signOutOfOtherSessions: true,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.replace('/(tabs)');
      }
    } catch (err: unknown) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-neutral-950">
      <View className="flex-1 justify-center px-6">
        {step === 'request' && (
          <>
            <Text className="mb-2 font-bold text-3xl text-neutral-900 dark:text-white">
              Forgot password
            </Text>
            <Text className="mb-8 font-sans text-neutral-600 dark:text-neutral-400">
              Enter your email and we&apos;ll send you a code to reset your password.
            </Text>

            {error && (
              <View className="mb-4 rounded-lg bg-red-50 px-4 py-3 dark:bg-red-950/30">
                <Text className="font-sans text-sm text-red-600 dark:text-red-400">{error}</Text>
              </View>
            )}

            <TextInput
              accessibilityLabel="Email address"
              className="mb-6 rounded-lg border border-neutral-300 px-4 py-3 font-sans text-base text-neutral-900 dark:border-neutral-700 dark:text-white"
              placeholder="Email"
              placeholderTextColor="#9ca3af"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setError(null);
              }}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Send reset code"
              className="rounded-lg bg-blue-600 py-4 active:bg-blue-700 disabled:opacity-50"
              onPress={onRequestReset}
              disabled={loading || !isLoaded}
            >
              <Text className="text-center font-semibold text-base text-white">
                {loading ? 'Sending...' : 'Send reset code'}
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back to sign in"
              className="mt-4"
              onPress={() => router.back()}
            >
              <Text className="text-center font-sans text-blue-600">Back to sign in</Text>
            </Pressable>
          </>
        )}

        {step === 'code' && (
          <>
            <Text className="mb-2 font-bold text-3xl text-neutral-900 dark:text-white">
              Enter code
            </Text>
            <Text className="mb-8 font-sans text-neutral-600 dark:text-neutral-400">
              Enter the code sent to {email}
            </Text>

            {error && (
              <View className="mb-4 rounded-lg bg-red-50 px-4 py-3 dark:bg-red-950/30">
                <Text className="font-sans text-sm text-red-600 dark:text-red-400">{error}</Text>
              </View>
            )}

            <TextInput
              accessibilityLabel="Reset code"
              className="mb-6 rounded-lg border border-neutral-300 px-4 py-3 text-center font-sans text-2xl tracking-widest text-neutral-900 dark:border-neutral-700 dark:text-white"
              placeholder="000000"
              placeholderTextColor="#9ca3af"
              value={code}
              onChangeText={(text) => {
                setCode(text);
                setError(null);
              }}
              keyboardType="number-pad"
              autoComplete="one-time-code"
            />

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Verify code"
              className="rounded-lg bg-blue-600 py-4 active:bg-blue-700 disabled:opacity-50"
              onPress={onVerifyCode}
              disabled={loading || !isLoaded}
            >
              <Text className="text-center font-semibold text-base text-white">
                {loading ? 'Verifying...' : 'Verify code'}
              </Text>
            </Pressable>
          </>
        )}

        {step === 'new-password' && (
          <>
            <Text className="mb-2 font-bold text-3xl text-neutral-900 dark:text-white">
              New password
            </Text>
            <Text className="mb-8 font-sans text-neutral-600 dark:text-neutral-400">
              Enter your new password below.
            </Text>

            {error && (
              <View className="mb-4 rounded-lg bg-red-50 px-4 py-3 dark:bg-red-950/30">
                <Text className="font-sans text-sm text-red-600 dark:text-red-400">{error}</Text>
              </View>
            )}

            <TextInput
              accessibilityLabel="New password"
              className="mb-4 rounded-lg border border-neutral-300 px-4 py-3 font-sans text-base text-neutral-900 dark:border-neutral-700 dark:text-white"
              placeholder="New password"
              placeholderTextColor="#9ca3af"
              value={newPassword}
              onChangeText={(text) => {
                setNewPassword(text);
                setError(null);
              }}
              secureTextEntry
              autoComplete="new-password"
            />

            <TextInput
              accessibilityLabel="Confirm new password"
              className="mb-6 rounded-lg border border-neutral-300 px-4 py-3 font-sans text-base text-neutral-900 dark:border-neutral-700 dark:text-white"
              placeholder="Confirm password"
              placeholderTextColor="#9ca3af"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                setError(null);
              }}
              secureTextEntry
              autoComplete="new-password"
            />

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Reset password"
              className="rounded-lg bg-blue-600 py-4 active:bg-blue-700 disabled:opacity-50"
              onPress={onSetNewPassword}
              disabled={loading || !isLoaded}
            >
              <Text className="text-center font-semibold text-base text-white">
                {loading ? 'Resetting...' : 'Reset password'}
              </Text>
            </Pressable>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}
