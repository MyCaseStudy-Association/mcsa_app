import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { useAuth } from '@/features/auth/providers/auth-provider';
import { useColors } from '@/theme/theme-provider';

export default function TabsLayout() {
  const { status } = useAuth();
  const colors = useColors();

  if (status === 'checking') {
    return (
      <View style={[styles.loading, { backgroundColor: colors.screenBg }]}>
        <ActivityIndicator color={colors.loader} />
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
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.fieldBorder,
          overflow: 'visible',
        },
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
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="compass-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="sources"
        options={{
          title: 'Add',
          tabBarLabel: () => null,
          tabBarButton: (props) => (
            <Pressable
              accessibilityLabel="Add chat source"
              accessibilityRole="button"
              accessibilityState={props.accessibilityState}
              onLongPress={props.onLongPress}
              onPress={props.onPress}
              style={({ pressed }) => [
                styles.addButton,
                { borderColor: colors.tabBar },
                pressed && styles.addButtonPressed,
              ]}>
              <Ionicons name="add" color="#ffffff" size={29} />
            </Pressable>
          ),
        }}
      />
      <Tabs.Screen
        name="money"
        options={{
          title: 'Money',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="wallet-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          href: null,
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
  addButton: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#0F766E',
    borderCurve: 'continuous',
    borderRadius: 999,
    borderWidth: 5,
    boxShadow: '0 6px 16px rgba(15, 118, 110, 0.28)',
    height: 58,
    justifyContent: 'center',
    top: -15,
    width: 58,
  },
  addButtonPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.95 }],
  },
});
