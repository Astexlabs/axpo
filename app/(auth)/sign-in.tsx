import { useSignIn } from '@clerk/clerk-expo';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getAuthErrorMessage } from '@/lib/auth-errors';

type Step = 'credentials' | 'mfa';

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [step, setStep] = useState<Step>('credentials');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleComplete = async () => {
    if (!signIn?.createdSessionId) return;
    await setActive({ session: signIn.createdSessionId });
    router.replace('/(tabs)');
  };

  const onSignInPress = async () => {
    if (!isLoaded || !signIn || loading) return;
    setLoading(true);
    setError(null);

    try {
      const attempt = await signIn.create({
        identifier: email,
        password,
      });

      if (attempt.status === 'complete') {
        await setActive({ session: attempt.createdSessionId });
        router.replace('/(tabs)');
      } else if (attempt.status === 'needs_first_factor') {
        // Password was provided, attempt it as first factor
        const result = await signIn.attemptFirstFactor({
          strategy: 'password',
          password,
        });

        if (result.status === 'complete') {
          await setActive({ session: result.createdSessionId });
          router.replace('/(tabs)');
        } else if (result.status === 'needs_second_factor') {
          setStep('mfa');
        }
      } else if (attempt.status === 'needs_second_factor') {
        setStep('mfa');
      }
    } catch (err: unknown) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const onMfaSubmit = async () => {
    if (!isLoaded || !signIn || loading) return;
    setLoading(true);
    setError(null);

    try {
      const result = await signIn.attemptSecondFactor({
        strategy: 'totp',
        code: mfaCode,
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

  const onPasskeySignIn = async () => {
    if (!isLoaded || !signIn || loading) return;
    setLoading(true);
    setError(null);

    try {
      const result = await signIn.authenticateWithPasskey();

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

  if (step === 'mfa') {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-neutral-950">
        <View className="flex-1 justify-center px-6">
          <Text className="mb-2 font-bold text-3xl text-neutral-900 dark:text-white">
            Two-factor authentication
          </Text>
          <Text className="mb-8 font-sans text-neutral-600 dark:text-neutral-400">
            Enter the code from your authenticator app
          </Text>

          {error && (
            <View className="mb-4 rounded-lg bg-red-50 px-4 py-3 dark:bg-red-950/30">
              <Text className="font-sans text-sm text-red-600 dark:text-red-400">{error}</Text>
            </View>
          )}

          <TextInput
            accessibilityLabel="Authenticator code"
            className="mb-6 rounded-lg border border-neutral-300 px-4 py-3 text-center font-sans text-2xl tracking-widest text-neutral-900 dark:border-neutral-700 dark:text-white"
            placeholder="000000"
            placeholderTextColor="#9ca3af"
            value={mfaCode}
            onChangeText={setMfaCode}
            keyboardType="number-pad"
            autoComplete="one-time-code"
          />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Verify code"
            className="rounded-lg bg-blue-600 py-4 active:bg-blue-700 disabled:opacity-50"
            onPress={onMfaSubmit}
            disabled={loading || !isLoaded}
          >
            <Text className="text-center font-semibold text-base text-white">
              {loading ? 'Verifying...' : 'Verify'}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to sign in"
            className="mt-4"
            onPress={() => {
              setStep('credentials');
              setMfaCode('');
              setError(null);
            }}
          >
            <Text className="text-center font-sans text-blue-600">Back to sign in</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-neutral-950">
      <View className="flex-1 justify-center px-6">
        <Text className="mb-8 font-bold text-3xl text-neutral-900 dark:text-white">
          Welcome back
        </Text>

        {error && (
          <View className="mb-4 rounded-lg bg-red-50 px-4 py-3 dark:bg-red-950/30">
            <Text className="font-sans text-sm text-red-600 dark:text-red-400">{error}</Text>
          </View>
        )}

        <TextInput
          accessibilityLabel="Email address"
          className="mb-4 rounded-lg border border-neutral-300 px-4 py-3 font-sans text-base text-neutral-900 dark:border-neutral-700 dark:text-white"
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

        <TextInput
          accessibilityLabel="Password"
          className="mb-4 rounded-lg border border-neutral-300 px-4 py-3 font-sans text-base text-neutral-900 dark:border-neutral-700 dark:text-white"
          placeholder="Password"
          placeholderTextColor="#9ca3af"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            setError(null);
          }}
          secureTextEntry
          autoComplete="current-password"
        />

        <View className="mb-6 flex-row justify-end">
          <Link href="/(auth)/forgot-password" asChild>
            <Pressable accessibilityRole="button" accessibilityLabel="Forgot password">
              <Text className="font-sans text-sm text-blue-600">Forgot password?</Text>
            </Pressable>
          </Link>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sign in"
          className="rounded-lg bg-blue-600 py-4 active:bg-blue-700 disabled:opacity-50"
          onPress={onSignInPress}
          disabled={loading || !isLoaded}
        >
          <Text className="text-center font-semibold text-base text-white">
            {loading ? 'Signing in...' : 'Sign in'}
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sign in with passkey"
          className="mt-3 rounded-lg border border-neutral-300 py-4 active:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:active:bg-neutral-900"
          onPress={onPasskeySignIn}
          disabled={loading || !isLoaded}
        >
          <Text className="text-center font-semibold text-base text-neutral-900 dark:text-white">
            Sign in with passkey
          </Text>
        </Pressable>

        <View className="mt-6 flex-row justify-center">
          <Text className="font-sans text-neutral-600 dark:text-neutral-400">
            Don&apos;t have an account?{' '}
          </Text>
          <Link href="/(auth)/sign-up" asChild>
            <Pressable accessibilityRole="button" accessibilityLabel="Sign up">
              <Text className="font-semibold text-blue-600">Sign up</Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}
