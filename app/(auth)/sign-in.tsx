import { useSignIn } from '@clerk/clerk-expo';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getAuthErrorMessage } from '@/lib/auth-errors';
import { isPasskeySupported } from '@/lib/passkeys';

type SignInPhase =
  | 'credentials'
  | 'first-factor'
  | 'second-factor'
  | 'forgot-password'
  | 'reset-code';

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<SignInPhase>('credentials');
  const [error, setError] = useState('');

  const handleSignInResult = async (attempt: {
    status: string | null;
    createdSessionId: string | null;
    supportedFirstFactors?: Array<{ strategy: string }> | null;
    supportedSecondFactors?: Array<{ strategy: string }> | null;
  }) => {
    switch (attempt.status) {
      case 'complete':
        await setActive({ session: attempt.createdSessionId });
        router.replace('/(tabs)');
        break;
      case 'needs_first_factor':
        setMfaCode('');
        setPhase('first-factor');
        break;
      case 'needs_second_factor':
        setMfaCode('');
        setPhase('second-factor');
        break;
      default:
        setError(`Sign in incomplete: ${attempt.status}`);
    }
  };

  const onSignInPress = async () => {
    if (!isLoaded || loading) return;
    setLoading(true);
    setError('');
    try {
      const attempt = await signIn.create({ identifier: email, password });
      await handleSignInResult(attempt);
    } catch (err: unknown) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const onFirstFactorPress = async () => {
    if (!isLoaded || loading) return;
    setLoading(true);
    setError('');
    try {
      const attempt = await signIn.attemptFirstFactor({
        strategy: 'email_code',
        code: mfaCode,
      });
      await handleSignInResult(attempt);
    } catch (err: unknown) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const onSecondFactorPress = async () => {
    if (!isLoaded || loading) return;
    setLoading(true);
    setError('');
    try {
      const attempt = await signIn.attemptSecondFactor({
        strategy: 'totp',
        code: mfaCode,
      });
      await handleSignInResult(attempt);
    } catch (err: unknown) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const onForgotPassword = async () => {
    if (!isLoaded || !email) {
      setError('Please enter your email address first.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: email,
      });
      setPhase('reset-code');
    } catch (err: unknown) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const onResetPassword = async () => {
    if (!isLoaded || loading) return;
    setLoading(true);
    setError('');
    try {
      const attempt = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code: mfaCode,
        password: newPassword,
      });
      await handleSignInResult(attempt);
    } catch (err: unknown) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const onPasskeySignIn = async () => {
    if (!isLoaded || loading) return;
    setLoading(true);
    setError('');
    try {
      const attempt = await signIn.authenticateWithPasskey();
      await handleSignInResult(attempt);
    } catch (err: unknown) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-neutral-950">
      <View className="flex-1 justify-center px-6">
        {phase === 'credentials' && (
          <>
            <Text className="mb-8 font-bold text-3xl text-neutral-900 dark:text-white">
              Welcome back
            </Text>

            {error ? (
              <View className="mb-4 rounded-lg bg-red-50 p-3 dark:bg-red-950/30">
                <Text className="font-sans text-sm text-red-600 dark:text-red-400">
                  {error}
                </Text>
              </View>
            ) : null}

            <TextInput
              className="mb-4 rounded-lg border border-neutral-300 px-4 py-3 font-sans text-base text-neutral-900 dark:border-neutral-700 dark:text-white"
              placeholder="Email"
              placeholderTextColor="#9ca3af"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              accessibilityLabel="Email address"
            />

            <TextInput
              className="mb-4 rounded-lg border border-neutral-300 px-4 py-3 font-sans text-base text-neutral-900 dark:border-neutral-700 dark:text-white"
              placeholder="Password"
              placeholderTextColor="#9ca3af"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="current-password"
              accessibilityLabel="Password"
            />

            <Pressable
              onPress={onForgotPassword}
              accessibilityRole="link"
              accessibilityLabel="Forgot password"
            >
              <Text className="mb-6 font-sans text-sm text-blue-600">Forgot password?</Text>
            </Pressable>

            <Pressable
              className="rounded-lg bg-blue-600 py-4 active:bg-blue-700 disabled:opacity-50"
              onPress={onSignInPress}
              disabled={loading || !isLoaded}
              accessibilityRole="button"
              accessibilityLabel="Sign in"
              accessibilityState={{ disabled: loading || !isLoaded }}
            >
              <Text className="text-center font-semibold text-base text-white">
                {loading ? 'Signing in...' : 'Sign in'}
              </Text>
            </Pressable>

            {isPasskeySupported() && (
              <Pressable
                className="mt-3 rounded-lg border border-neutral-300 py-4 active:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:active:bg-neutral-900"
                onPress={onPasskeySignIn}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel="Sign in with passkey"
                accessibilityState={{ disabled: loading }}
              >
                <Text className="text-center font-semibold text-base text-neutral-900 dark:text-white">
                  Sign in with passkey
                </Text>
              </Pressable>
            )}

            <View className="mt-6 flex-row justify-center">
              <Text className="font-sans text-neutral-600 dark:text-neutral-400">
                Don&apos;t have an account?{' '}
              </Text>
              <Link href="/(auth)/sign-up" asChild>
                <Pressable
                  accessibilityRole="link"
                  accessibilityLabel="Go to sign up"
                >
                  <Text className="font-semibold text-blue-600">Sign up</Text>
                </Pressable>
              </Link>
            </View>
          </>
        )}

        {phase === 'first-factor' && (
          <>
            <Text className="mb-2 font-bold text-3xl text-neutral-900 dark:text-white">
              Verify your identity
            </Text>
            <Text className="mb-8 font-sans text-neutral-600 dark:text-neutral-400">
              Enter the verification code sent to your email.
            </Text>

            {error ? (
              <View className="mb-4 rounded-lg bg-red-50 p-3 dark:bg-red-950/30">
                <Text className="font-sans text-sm text-red-600 dark:text-red-400">
                  {error}
                </Text>
              </View>
            ) : null}

            <TextInput
              className="mb-6 rounded-lg border border-neutral-300 px-4 py-3 text-center font-sans text-2xl tracking-widest text-neutral-900 dark:border-neutral-700 dark:text-white"
              placeholder="000000"
              placeholderTextColor="#9ca3af"
              value={mfaCode}
              onChangeText={setMfaCode}
              keyboardType="number-pad"
              autoComplete="one-time-code"
              accessibilityLabel="Verification code"
            />

            <Pressable
              className="rounded-lg bg-blue-600 py-4 active:bg-blue-700 disabled:opacity-50"
              onPress={onFirstFactorPress}
              disabled={loading || !isLoaded}
              accessibilityRole="button"
              accessibilityLabel="Verify"
              accessibilityState={{ disabled: loading || !isLoaded }}
            >
              <Text className="text-center font-semibold text-base text-white">
                {loading ? 'Verifying...' : 'Verify'}
              </Text>
            </Pressable>

            <Pressable
              className="mt-4"
              onPress={() => {
                setPhase('credentials');
                setError('');
                setMfaCode('');
              }}
              accessibilityRole="button"
              accessibilityLabel="Back to sign in"
            >
              <Text className="text-center font-sans text-sm text-blue-600">
                Back to sign in
              </Text>
            </Pressable>
          </>
        )}

        {phase === 'second-factor' && (
          <>
            <Text className="mb-2 font-bold text-3xl text-neutral-900 dark:text-white">
              Two-factor authentication
            </Text>
            <Text className="mb-8 font-sans text-neutral-600 dark:text-neutral-400">
              Enter the code from your authenticator app.
            </Text>

            {error ? (
              <View className="mb-4 rounded-lg bg-red-50 p-3 dark:bg-red-950/30">
                <Text className="font-sans text-sm text-red-600 dark:text-red-400">
                  {error}
                </Text>
              </View>
            ) : null}

            <TextInput
              className="mb-6 rounded-lg border border-neutral-300 px-4 py-3 text-center font-sans text-2xl tracking-widest text-neutral-900 dark:border-neutral-700 dark:text-white"
              placeholder="000000"
              placeholderTextColor="#9ca3af"
              value={mfaCode}
              onChangeText={setMfaCode}
              keyboardType="number-pad"
              autoComplete="one-time-code"
              accessibilityLabel="Authenticator code"
            />

            <Pressable
              className="rounded-lg bg-blue-600 py-4 active:bg-blue-700 disabled:opacity-50"
              onPress={onSecondFactorPress}
              disabled={loading || !isLoaded}
              accessibilityRole="button"
              accessibilityLabel="Verify"
              accessibilityState={{ disabled: loading || !isLoaded }}
            >
              <Text className="text-center font-semibold text-base text-white">
                {loading ? 'Verifying...' : 'Verify'}
              </Text>
            </Pressable>

            <Pressable
              className="mt-4"
              onPress={() => {
                setPhase('credentials');
                setError('');
                setMfaCode('');
              }}
              accessibilityRole="button"
              accessibilityLabel="Back to sign in"
            >
              <Text className="text-center font-sans text-sm text-blue-600">
                Back to sign in
              </Text>
            </Pressable>
          </>
        )}

        {phase === 'forgot-password' && (
          <>
            <Text className="mb-2 font-bold text-3xl text-neutral-900 dark:text-white">
              Reset password
            </Text>
            <Text className="mb-8 font-sans text-neutral-600 dark:text-neutral-400">
              Enter your email to receive a reset code.
            </Text>

            {error ? (
              <View className="mb-4 rounded-lg bg-red-50 p-3 dark:bg-red-950/30">
                <Text className="font-sans text-sm text-red-600 dark:text-red-400">
                  {error}
                </Text>
              </View>
            ) : null}

            <TextInput
              className="mb-6 rounded-lg border border-neutral-300 px-4 py-3 font-sans text-base text-neutral-900 dark:border-neutral-700 dark:text-white"
              placeholder="Email"
              placeholderTextColor="#9ca3af"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              accessibilityLabel="Email address"
            />

            <Pressable
              className="rounded-lg bg-blue-600 py-4 active:bg-blue-700 disabled:opacity-50"
              onPress={onForgotPassword}
              disabled={loading || !isLoaded}
              accessibilityRole="button"
              accessibilityLabel="Send reset code"
              accessibilityState={{ disabled: loading || !isLoaded }}
            >
              <Text className="text-center font-semibold text-base text-white">
                {loading ? 'Sending...' : 'Send reset code'}
              </Text>
            </Pressable>

            <Pressable
              className="mt-4"
              onPress={() => {
                setPhase('credentials');
                setError('');
              }}
              accessibilityRole="button"
              accessibilityLabel="Back to sign in"
            >
              <Text className="text-center font-sans text-sm text-blue-600">
                Back to sign in
              </Text>
            </Pressable>
          </>
        )}

        {phase === 'reset-code' && (
          <>
            <Text className="mb-2 font-bold text-3xl text-neutral-900 dark:text-white">
              Reset password
            </Text>
            <Text className="mb-8 font-sans text-neutral-600 dark:text-neutral-400">
              Enter the code sent to {email} and your new password.
            </Text>

            {error ? (
              <View className="mb-4 rounded-lg bg-red-50 p-3 dark:bg-red-950/30">
                <Text className="font-sans text-sm text-red-600 dark:text-red-400">
                  {error}
                </Text>
              </View>
            ) : null}

            <TextInput
              className="mb-4 rounded-lg border border-neutral-300 px-4 py-3 text-center font-sans text-2xl tracking-widest text-neutral-900 dark:border-neutral-700 dark:text-white"
              placeholder="000000"
              placeholderTextColor="#9ca3af"
              value={mfaCode}
              onChangeText={setMfaCode}
              keyboardType="number-pad"
              autoComplete="one-time-code"
              accessibilityLabel="Reset code"
            />

            <TextInput
              className="mb-6 rounded-lg border border-neutral-300 px-4 py-3 font-sans text-base text-neutral-900 dark:border-neutral-700 dark:text-white"
              placeholder="New password"
              placeholderTextColor="#9ca3af"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              autoComplete="new-password"
              accessibilityLabel="New password"
            />

            <Pressable
              className="rounded-lg bg-blue-600 py-4 active:bg-blue-700 disabled:opacity-50"
              onPress={onResetPassword}
              disabled={loading || !isLoaded}
              accessibilityRole="button"
              accessibilityLabel="Reset password"
              accessibilityState={{ disabled: loading || !isLoaded }}
            >
              <Text className="text-center font-semibold text-base text-white">
                {loading ? 'Resetting...' : 'Reset password'}
              </Text>
            </Pressable>

            <Pressable
              className="mt-4"
              onPress={() => {
                setPhase('credentials');
                setError('');
                setMfaCode('');
                setNewPassword('');
              }}
              accessibilityRole="button"
              accessibilityLabel="Back to sign in"
            >
              <Text className="text-center font-sans text-sm text-blue-600">
                Back to sign in
              </Text>
            </Pressable>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}
