import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useAuth } from '@/providers/auth-provider';
import { useColors } from '@/providers/theme-provider';

export default function TabsLayout() {
  const { status } = useAuth();
  const colors = useColors();

  if (status === 'checking') {
    return (
      <View style={[styles.loading, { backgroundColor: colors.screenBg }]}>
        <ActivityIndicator color={colors.primaryTeal} />
      </View>
    );
  }

  if (status === 'unauthenticated') {
    return <Redirect href="/" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primaryTeal,
        tabBarInactiveTintColor: colors.glassMuted,
        tabBarStyle: { backgroundColor: colors.tabBar, borderTopColor: colors.fieldBorder },
        tabBarLabelStyle: styles.tabLabel,
        sceneStyle: { backgroundColor: colors.screenBg },
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="sources"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, size }) => <Ionicons name="compass-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loading: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
});
