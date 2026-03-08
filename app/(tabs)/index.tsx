import { useUser } from '@clerk/clerk-expo';
import { Notification03Icon } from '@hugeicons/core-free-icons';
import { useQuery } from 'convex/react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/ui/icon';
import { api } from '@/convex/_generated/api';

export default function HomeScreen() {
  const { user } = useUser();
  const identity = useQuery(api.users.currentIdentity);

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-neutral-950">
      <View className="flex-1 px-6 pt-8">
        <View className="mb-8 flex-row items-center justify-between">
          <View>
            <Text className="font-sans text-sm text-neutral-500 dark:text-neutral-400">
              Welcome back
            </Text>
            <Text className="font-bold text-2xl text-neutral-900 dark:text-white">
              {user?.firstName ?? user?.emailAddresses[0]?.emailAddress ?? 'User'}
            </Text>
          </View>
          <Icon icon={Notification03Icon} className="text-neutral-700 dark:text-neutral-300" />
        </View>

        <View className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <Text className="mb-2 font-semibold text-neutral-900 dark:text-white">
            Connection Status
          </Text>
          {identity === undefined ? (
            <Text className="font-sans text-sm text-neutral-500">Loading...</Text>
          ) : identity === null ? (
            <Text className="font-sans text-sm text-amber-600">Not authenticated</Text>
          ) : (
            <Text className="font-sans text-sm text-green-600">Connected</Text>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
