import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PaperProvider, Button } from 'react-native-paper';
import { View, Text } from 'react-native';
import { colors } from '../constants/theme';
import { useEffect } from 'react';
import { pushNotificationService } from '../services/pushNotifications';
import Sentry from '../services/sentry';
import Analytics from '../services/analytics';
import { supabase } from '../services/supabase';

// Initialize Sentry
Sentry.init();

const queryClient = new QueryClient();

const theme = {
  colors: {
    primary: colors.primary,
    accent: colors.accent,
    background: colors.background,
    surface: colors.white,
    error: colors.error,
    text: colors.black,
    onSurface: colors.black,
    disabled: colors.gray,
    placeholder: colors.gray,
    backdrop: 'rgba(0, 0, 0, 0.5)',
    notification: colors.teal,
  },
};

export default function RootLayout() {
  useEffect(() => {
    // Initialize services
    async function initializeApp() {
      // Initialize push notifications
      pushNotificationService.registerForPushNotifications();
      pushNotificationService.scheduleDailyCheckInReminder();
      
      // Initialize analytics
      await Analytics.init();
      Analytics.track(Analytics.events.APP_OPENED);
    }
    
    initializeApp();

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') pushNotificationService.registerForPushNotifications();
    });
    return () => authListener.subscription.unsubscribe();
  }, []);

  return (
    <Sentry.ErrorBoundary
      fallback={({ error, resetError }) => (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
            Oops! Something went wrong
          </Text>
          <Text style={{ marginBottom: 20, textAlign: 'center' }}>
            {error?.message || 'An unexpected error occurred'}
          </Text>
          <Button mode="contained" onPress={resetError}>
            Try Again
          </Button>
        </View>
      )}
    >
      <QueryClientProvider client={queryClient}>
        <PaperProvider theme={theme}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)/login" />
            <Stack.Screen name="(auth)/signup" />
            <Stack.Screen name="(tabs)" />
          </Stack>
        </PaperProvider>
      </QueryClientProvider>
    </Sentry.ErrorBoundary>
  );
}