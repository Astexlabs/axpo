import { useSignUp, useUser } from '@clerk/clerk-expo';
import { Link, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getAuthErrorMessage } from '@/lib/auth-errors';
import { isPasskeySupported } from '@/lib/passkeys';

type SignUpPhase = 'register' | 'custom-fields' | 'verify' | 'passkey-prompt';

export default function SignUpScreen() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const { user } = useUser();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [code, setCode] = useState('');
  const [phase, setPhase] = useState<SignUpPhase>('register');
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const onSignUpPress = async () => {
    if (!isLoaded || loading) return;
    setLoading(true);
    setError('');

    try {
      const result = await signUp.create({ emailAddress: email, password });

      if (result.status === 'missing_requirements') {
        const missing = signUp.missingFields ?? [];
        // If the only missing requirement is email verification, proceed to verify
        const nonVerificationFields = missing.filter(
          (f) => f !== 'email_address' && !f.includes('verification'),
        );
        if (nonVerificationFields.length > 0) {
          setMissingFields(nonVerificationFields);
          setPhase('custom-fields');
        } else {
          await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
          setPhase('verify');
        }
      } else if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.replace('/(tabs)');
      } else {
        // Attempt to proceed to verification
        await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
        setPhase('verify');
      }
    } catch (err: unknown) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const onSubmitCustomFields = async () => {
    if (!isLoaded || loading) return;
    setLoading(true);
    setError('');

    try {
      await signUp.update({ username: username || undefined });
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPhase('verify');
    } catch (err: unknown) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const onVerifyPress = async () => {
    if (!isLoaded || loading) return;
    setLoading(true);
    setError('');

    try {
      const attempt = await signUp.attemptEmailAddressVerification({ code });

      if (attempt.status === 'complete') {
        await setActive({ session: attempt.createdSessionId });
        if (isPasskeySupported()) {
          setPhase('passkey-prompt');
        } else {
          router.replace('/(tabs)');
        }
      } else {
        setError(`Verification incomplete: ${attempt.status}`);
      }
    } catch (err: unknown) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const onResendCode = async () => {
    if (!isLoaded || resendCooldown > 0) return;
    try {
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setResendCooldown(60);
    } catch (err: unknown) {
      setError(getAuthErrorMessage(err));
    }
  };

  const onCreatePasskey = async () => {
    try {
      await user?.createPasskey();
    } catch (err: unknown) {
      // Passkey creation is optional -- don't block the flow
      console.warn('Passkey creation failed:', err);
    }
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-neutral-950">
      <View className="flex-1 justify-center px-6">
        {phase === 'register' && (
          <>
            <Text className="mb-8 font-bold text-3xl text-neutral-900 dark:text-white">
              Create account
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
              className="mb-6 rounded-lg border border-neutral-300 px-4 py-3 font-sans text-base text-neutral-900 dark:border-neutral-700 dark:text-white"
              placeholder="Password"
              placeholderTextColor="#9ca3af"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="new-password"
              accessibilityLabel="Password"
            />

            <Pressable
              className="rounded-lg bg-blue-600 py-4 active:bg-blue-700 disabled:opacity-50"
              onPress={onSignUpPress}
              disabled={loading || !isLoaded}
              accessibilityRole="button"
              accessibilityLabel="Sign up"
              accessibilityState={{ disabled: loading || !isLoaded }}
            >
              <Text className="text-center font-semibold text-base text-white">
                {loading ? 'Creating account...' : 'Sign up'}
              </Text>
            </Pressable>

            <View className="mt-6 flex-row justify-center">
              <Text className="font-sans text-neutral-600 dark:text-neutral-400">
                Already have an account?{' '}
              </Text>
              <Link href="/(auth)/sign-in" asChild>
                <Pressable
                  accessibilityRole="link"
                  accessibilityLabel="Go to sign in"
                >
                  <Text className="font-semibold text-blue-600">Sign in</Text>
                </Pressable>
              </Link>
            </View>
          </>
        )}

        {phase === 'custom-fields' && (
          <>
            <Text className="mb-2 font-bold text-3xl text-neutral-900 dark:text-white">
              Complete your profile
            </Text>
            <Text className="mb-8 font-sans text-neutral-600 dark:text-neutral-400">
              Please fill in the required fields to continue.
            </Text>

            {error ? (
              <View className="mb-4 rounded-lg bg-red-50 p-3 dark:bg-red-950/30">
                <Text className="font-sans text-sm text-red-600 dark:text-red-400">
                  {error}
                </Text>
              </View>
            ) : null}

            {missingFields.includes('username') && (
              <TextInput
                className="mb-4 rounded-lg border border-neutral-300 px-4 py-3 font-sans text-base text-neutral-900 dark:border-neutral-700 dark:text-white"
                placeholder="Username"
                placeholderTextColor="#9ca3af"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                accessibilityLabel="Username"
              />
            )}

            <Pressable
              className="rounded-lg bg-blue-600 py-4 active:bg-blue-700 disabled:opacity-50"
              onPress={onSubmitCustomFields}
              disabled={loading || !isLoaded}
              accessibilityRole="button"
              accessibilityLabel="Continue"
              accessibilityState={{ disabled: loading || !isLoaded }}
            >
              <Text className="text-center font-semibold text-base text-white">
                {loading ? 'Saving...' : 'Continue'}
              </Text>
            </Pressable>
          </>
        )}

        {phase === 'verify' && (
          <>
            <Text className="mb-2 font-bold text-3xl text-neutral-900 dark:text-white">
              Verify email
            </Text>
            <Text className="mb-8 font-sans text-neutral-600 dark:text-neutral-400">
              Enter the code sent to {email}
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
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              autoComplete="one-time-code"
              accessibilityLabel="Verification code"
            />

            <Pressable
              className="rounded-lg bg-blue-600 py-4 active:bg-blue-700 disabled:opacity-50"
              onPress={onVerifyPress}
              disabled={loading || !isLoaded}
              accessibilityRole="button"
              accessibilityLabel="Verify email"
              accessibilityState={{ disabled: loading || !isLoaded }}
            >
              <Text className="text-center font-semibold text-base text-white">
                {loading ? 'Verifying...' : 'Verify'}
              </Text>
            </Pressable>

            <Pressable
              className="mt-4"
              onPress={onResendCode}
              disabled={resendCooldown > 0}
              accessibilityRole="button"
              accessibilityLabel={
                resendCooldown > 0
                  ? `Resend code available in ${resendCooldown} seconds`
                  : 'Resend verification code'
              }
              accessibilityState={{ disabled: resendCooldown > 0 }}
            >
              <Text className="text-center font-sans text-sm text-blue-600">
                {resendCooldown > 0
                  ? `Resend code in ${resendCooldown}s`
                  : 'Resend code'}
              </Text>
            </Pressable>
          </>
        )}

        {phase === 'passkey-prompt' && (
          <>
            <Text className="mb-2 font-bold text-3xl text-neutral-900 dark:text-white">
              Create a passkey
            </Text>
            <Text className="mb-8 font-sans text-neutral-600 dark:text-neutral-400">
              Sign in faster next time with your fingerprint or device lock.
            </Text>

            <Pressable
              className="rounded-lg bg-blue-600 py-4 active:bg-blue-700 disabled:opacity-50"
              onPress={onCreatePasskey}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Create passkey"
              accessibilityState={{ disabled: loading }}
            >
              <Text className="text-center font-semibold text-base text-white">
                Create passkey
              </Text>
            </Pressable>

            <Pressable
              className="mt-4"
              onPress={() => router.replace('/(tabs)')}
              accessibilityRole="button"
              accessibilityLabel="Skip passkey creation"
            >
              <Text className="text-center font-sans text-sm text-neutral-500 dark:text-neutral-400">
                Skip for now
              </Text>
            </Pressable>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}
