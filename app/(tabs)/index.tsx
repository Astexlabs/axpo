import { useUser } from '@clerk/clerk-expo';
import { Notification03Icon } from '@hugeicons/core-free-icons';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/ui/icon';

export default function HomeScreen() {
  const { user } = useUser();

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-neutral-950">
      <View className="flex-1 px-6 pt-8">
        <View className="mb-8 flex-row items-center justify-between">
          <View>
            <Text className="font-sans text-sm text-neutral-500 dark:text-neutral-400">
              Welcome back
            </Text>
            <Text className="font-bold text-2xl text-neutral-900 dark:text-white">
              {user?.firstName ?? user?.username ?? user?.emailAddresses[0]?.emailAddress ?? 'User'}
            </Text>
          </View>
          <Icon icon={Notification03Icon} className="text-neutral-700 dark:text-neutral-300" />
        </View>
      </View>
    </SafeAreaView>
  );
}
