import { useAuth } from '@clerk/clerk-expo';
import { Home01Icon, Settings01Icon } from '@hugeicons/core-free-icons';
import { useMutation } from 'convex/react';
import { Redirect, Tabs } from 'expo-router';
import { useEffect } from 'react';

import { Icon } from '@/components/ui/icon';
import { api } from '@/convex/_generated/api';
import { usePushNotifications } from '@/hooks/use-push-notifications';

export default function TabLayout() {
  const { isSignedIn } = useAuth();
  const upsertUser = useMutation(api.users.upsert);

  // Register for push notifications — hooks must run unconditionally
  usePushNotifications();

  // Sync Clerk user → Convex on mount
  useEffect(() => {
    if (isSignedIn) {
      upsertUser().catch((err) => console.error('Failed to sync user:', err));
    }
  }, [isSignedIn, upsertUser]);

  if (!isSignedIn) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
        },
        tabBarLabelStyle: {
          fontFamily: 'Inter_500Medium',
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Icon icon={Home01Icon} size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <Icon icon={Settings01Icon} size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
