// Tabs Layout - Refined with polish
// Built following: mobile-design, ui-ux-patterns
// Clean tab bar with proper touch targets

import { useMemo, useRef } from 'react';
import { PanResponder, View } from 'react-native';
import { Tabs, useRouter, useSegments } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, touchTargets, typography } from '../../constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { isHorizontalDrag, isTabSwipeLocked, swipeTarget } from '../../utils/tabSwipe';

export default function TabsLayout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const segments = useSegments();
  const currentTab = useRef<string | undefined>(undefined);
  currentTab.current = segments[segments.length - 1];

  // Swipe left/right anywhere on a tab screen to move to the neighbouring tab.
  const swipe = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponderCapture: (_e, g) => !isTabSwipeLocked() && isHorizontalDrag(g.dx, g.dy),
        onPanResponderRelease: (_e, g) => {
          const target = swipeTarget(currentTab.current, g.dx, g.dy, g.vx);
          if (target) router.navigate(`/(tabs)/${target}` as any);
        },
        onPanResponderTerminationRequest: () => true,
      }),
    [router]
  );

  return (
    <View style={{ flex: 1 }} {...swipe.panHandlers}>
    <Tabs
      screenOptions={{
        animation: 'shift',
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.gray,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.lightGray,
          borderTopWidth: 1,
          // Android draws edge to edge, so the system navigation buttons sit on top of the
          // bar unless it is raised by the bottom inset.
          height: 60 + insets.bottom,
          paddingBottom: spacing.xs + insets.bottom,
          paddingTop: spacing.xs,
        },
        tabBarLabelStyle: {
          fontSize: typography.caption.fontSize - 1,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: colors.white,
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: typography.h4.fontSize,
        },
        tabBarIconStyle: {
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="assessments"
        options={{
          title: 'Assess',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="clipboard-check-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="activities"
        options={{
          title: 'Activities',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="heart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="partner"
        options={{
          title: 'Partner',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-heart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="message-text-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="chart-line-variant" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-circle-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
    </View>
  );
}