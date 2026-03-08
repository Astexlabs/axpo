import { useSignUp } from '@clerk/clerk-expo';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SignUpScreen() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSignUpPress = async () => {
    if (!isLoaded || loading) return;
    setLoading(true);

    try {
      await signUp.create({ emailAddress: email, password });
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sign up failed';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const onVerifyPress = async () => {
    if (!isLoaded || loading) return;
    setLoading(true);

    try {
      const attempt = await signUp.attemptEmailAddressVerification({ code });

      if (attempt.status === 'complete') {
        await setActive({ session: attempt.createdSessionId });
        router.replace('/(tabs)');
      } else {
        Alert.alert('Verification incomplete', JSON.stringify(attempt.status));
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Verification failed';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-neutral-950">
      <View className="flex-1 justify-center px-6">
        {!pendingVerification ? (
          <>
            <Text className="mb-8 font-bold text-3xl text-neutral-900 dark:text-white">
              Create account
            </Text>

            <TextInput
              className="mb-4 rounded-lg border border-neutral-300 px-4 py-3 font-sans text-base text-neutral-900 dark:border-neutral-700 dark:text-white"
              placeholder="Email"
              placeholderTextColor="#9ca3af"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />

            <TextInput
              className="mb-6 rounded-lg border border-neutral-300 px-4 py-3 font-sans text-base text-neutral-900 dark:border-neutral-700 dark:text-white"
              placeholder="Password"
              placeholderTextColor="#9ca3af"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="new-password"
            />

            <Pressable
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
                <Pressable>
                  <Text className="font-semibold text-blue-600">Sign in</Text>
                </Pressable>
              </Link>
            </View>
          </>
        ) : (
          <>
            <Text className="mb-2 font-bold text-3xl text-neutral-900 dark:text-white">
              Verify email
            </Text>
            <Text className="mb-8 font-sans text-neutral-600 dark:text-neutral-400">
              Enter the code sent to {email}
            </Text>

            <TextInput
              className="mb-6 rounded-lg border border-neutral-300 px-4 py-3 text-center font-sans text-2xl tracking-widest text-neutral-900 dark:border-neutral-700 dark:text-white"
              placeholder="000000"
              placeholderTextColor="#9ca3af"
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              autoComplete="one-time-code"
            />

            <Pressable
              className="rounded-lg bg-blue-600 py-4 active:bg-blue-700 disabled:opacity-50"
              onPress={onVerifyPress}
              disabled={loading || !isLoaded}
            >
              <Text className="text-center font-semibold text-base text-white">
                {loading ? 'Verifying...' : 'Verify'}
              </Text>
            </Pressable>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}
