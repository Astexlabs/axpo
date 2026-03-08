import { useSignIn } from '@clerk/clerk-expo';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSignInPress = async () => {
    if (!isLoaded || loading) return;
    setLoading(true);

    try {
      const attempt = await signIn.create({
        identifier: email,
        password,
      });

      if (attempt.status === 'complete') {
        await setActive({ session: attempt.createdSessionId });
        router.replace('/(tabs)');
      } else {
        Alert.alert('Sign in incomplete', JSON.stringify(attempt.status));
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sign in failed';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-neutral-950">
      <View className="flex-1 justify-center px-6">
        <Text className="mb-8 font-bold text-3xl text-neutral-900 dark:text-white">
          Welcome back
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
          autoComplete="current-password"
        />

        <Pressable
          className="rounded-lg bg-blue-600 py-4 active:bg-blue-700 disabled:opacity-50"
          onPress={onSignInPress}
          disabled={loading || !isLoaded}
        >
          <Text className="text-center font-semibold text-base text-white">
            {loading ? 'Signing in...' : 'Sign in'}
          </Text>
        </Pressable>

        <View className="mt-6 flex-row justify-center">
          <Text className="font-sans text-neutral-600 dark:text-neutral-400">
            Don&apos;t have an account?{' '}
          </Text>
          <Link href="/(auth)/sign-up" asChild>
            <Pressable>
              <Text className="font-semibold text-blue-600">Sign up</Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}
