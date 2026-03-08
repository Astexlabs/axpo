import { useSignUp, useUser } from '@clerk/clerk-expo';
import { Link, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getAuthErrorMessage } from '@/lib/auth-errors';

type Step = 'initial' | 'missingFields' | 'verification' | 'passkeyOffer';

// Fields that are verification-related, not user-profile fields
const VERIFICATION_FIELDS = new Set([
  'email_address',
  'phone_number',
  'web3_wallet',
  'external_account',
]);

// Human-readable labels for Clerk field names
const FIELD_LABELS: Record<string, string> = {
  username: 'Username',
  first_name: 'First name',
  last_name: 'Last name',
};

export default function SignUpScreen() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const { user } = useUser();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<Step>('initial');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dynamic custom fields from Clerk
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});

  // Resend code cooldown
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const proceedToVerification = useCallback(async () => {
    if (!signUp) return;
    await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
    setStep('verification');
  }, [signUp]);

  const checkMissingFields = useCallback(async () => {
    if (!signUp) return;

    const missing = signUp.missingFields ?? [];
    const profileFields = missing.filter((f) => !VERIFICATION_FIELDS.has(f));
    const needsVerification = missing.some((f) => VERIFICATION_FIELDS.has(f));

    if (profileFields.length > 0) {
      setMissingFields(profileFields);
      setStep('missingFields');
    } else if (needsVerification) {
      await proceedToVerification();
    }
  }, [signUp, proceedToVerification]);

  const onSignUpPress = async () => {
    if (!isLoaded || !signUp || loading) return;
    setLoading(true);
    setError(null);

    try {
      await signUp.create({ emailAddress: email, password });

      if (signUp.status === 'complete') {
        await setActive({ session: signUp.createdSessionId });
        router.replace('/(tabs)');
        return;
      }

      if (signUp.status === 'missing_requirements') {
        await checkMissingFields();
      }
    } catch (err: unknown) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const onFieldsSubmit = async () => {
    if (!isLoaded || !signUp || loading) return;
    setLoading(true);
    setError(null);

    try {
      await signUp.update(fieldValues);

      if (signUp.status === 'complete') {
        await setActive({ session: signUp.createdSessionId });
        router.replace('/(tabs)');
        return;
      }

      if (signUp.status === 'missing_requirements') {
        const remaining = signUp.missingFields ?? [];
        const profileFields = remaining.filter((f) => !VERIFICATION_FIELDS.has(f));
        const needsVerification = remaining.some((f) => VERIFICATION_FIELDS.has(f));

        if (profileFields.length > 0) {
          setMissingFields(profileFields);
        } else if (needsVerification) {
          await proceedToVerification();
        }
      }
    } catch (err: unknown) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const onVerifyPress = async () => {
    if (!isLoaded || !signUp || loading) return;
    setLoading(true);
    setError(null);

    try {
      const attempt = await signUp.attemptEmailAddressVerification({ code });

      if (attempt.status === 'complete') {
        await setActive({ session: attempt.createdSessionId });
        setStep('passkeyOffer');
      }
    } catch (err: unknown) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const onResendCode = async () => {
    if (!isLoaded || !signUp || resendCooldown > 0) return;
    setError(null);

    try {
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setResendCooldown(60);
    } catch (err: unknown) {
      setError(getAuthErrorMessage(err));
    }
  };

  const onCreatePasskey = async () => {
    setError(null);
    try {
      await user?.createPasskey();
      router.replace('/(tabs)');
    } catch (err: unknown) {
      setError(getAuthErrorMessage(err));
    }
  };

  const onSkipPasskey = () => {
    router.replace('/(tabs)');
  };

  // Step: Passkey offer after sign-up
  if (step === 'passkeyOffer') {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-neutral-950">
        <View className="flex-1 justify-center px-6">
          <Text className="mb-2 font-bold text-3xl text-neutral-900 dark:text-white">
            Create a passkey
          </Text>
          <Text className="mb-8 font-sans text-neutral-600 dark:text-neutral-400">
            Create a passkey for faster, more secure sign-in next time.
          </Text>

          {error && (
            <View className="mb-4 rounded-lg bg-red-50 px-4 py-3 dark:bg-red-950/30">
              <Text className="font-sans text-sm text-red-600 dark:text-red-400">{error}</Text>
            </View>
          )}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Create passkey"
            className="rounded-lg bg-blue-600 py-4 active:bg-blue-700"
            onPress={onCreatePasskey}
          >
            <Text className="text-center font-semibold text-base text-white">Create passkey</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Skip passkey creation"
            className="mt-3 py-4"
            onPress={onSkipPasskey}
          >
            <Text className="text-center font-sans text-neutral-600 dark:text-neutral-400">
              Skip for now
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // Step: Verification
  if (step === 'verification') {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-neutral-950">
        <View className="flex-1 justify-center px-6">
          <Text className="mb-2 font-bold text-3xl text-neutral-900 dark:text-white">
            Verify email
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
            accessibilityLabel="Verification code"
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
            accessibilityLabel="Verify email"
            className="rounded-lg bg-blue-600 py-4 active:bg-blue-700 disabled:opacity-50"
            onPress={onVerifyPress}
            disabled={loading || !isLoaded}
          >
            <Text className="text-center font-semibold text-base text-white">
              {loading ? 'Verifying...' : 'Verify'}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Resend verification code"
            className="mt-4"
            onPress={onResendCode}
            disabled={resendCooldown > 0}
          >
            <Text
              className={`text-center font-sans ${resendCooldown > 0 ? 'text-neutral-400' : 'text-blue-600'}`}
            >
              {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // Step: Missing fields (custom Clerk fields like username)
  if (step === 'missingFields') {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-neutral-950">
        <View className="flex-1 justify-center px-6">
          <Text className="mb-2 font-bold text-3xl text-neutral-900 dark:text-white">
            Complete your profile
          </Text>
          <Text className="mb-8 font-sans text-neutral-600 dark:text-neutral-400">
            Please fill in the following required fields.
          </Text>

          {error && (
            <View className="mb-4 rounded-lg bg-red-50 px-4 py-3 dark:bg-red-950/30">
              <Text className="font-sans text-sm text-red-600 dark:text-red-400">{error}</Text>
            </View>
          )}

          {missingFields.map((field) => (
            <TextInput
              key={field}
              accessibilityLabel={FIELD_LABELS[field] ?? field}
              className="mb-4 rounded-lg border border-neutral-300 px-4 py-3 font-sans text-base text-neutral-900 dark:border-neutral-700 dark:text-white"
              placeholder={FIELD_LABELS[field] ?? field}
              placeholderTextColor="#9ca3af"
              value={fieldValues[field] ?? ''}
              onChangeText={(text) => {
                setFieldValues((prev) => ({ ...prev, [field]: text }));
                setError(null);
              }}
              autoCapitalize={field === 'username' ? 'none' : 'words'}
            />
          ))}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Continue"
            className="mt-2 rounded-lg bg-blue-600 py-4 active:bg-blue-700 disabled:opacity-50"
            onPress={onFieldsSubmit}
            disabled={loading || !isLoaded}
          >
            <Text className="text-center font-semibold text-base text-white">
              {loading ? 'Saving...' : 'Continue'}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // Step: Initial sign-up form
  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-neutral-950">
      <View className="flex-1 justify-center px-6">
        <Text className="mb-8 font-bold text-3xl text-neutral-900 dark:text-white">
          Create account
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
          className="mb-6 rounded-lg border border-neutral-300 px-4 py-3 font-sans text-base text-neutral-900 dark:border-neutral-700 dark:text-white"
          placeholder="Password"
          placeholderTextColor="#9ca3af"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            setError(null);
          }}
          secureTextEntry
          autoComplete="new-password"
        />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sign up"
          className="rounded-lg bg-blue-600 py-4 active:bg-blue-700 disabled:opacity-50"
          onPress={onSignUpPress}
          disabled={loading || !isLoaded}
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
            <Pressable accessibilityRole="button" accessibilityLabel="Sign in">
              <Text className="font-semibold text-blue-600">Sign in</Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}
