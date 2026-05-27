import { useEffect } from 'react';
import { View, StyleSheet, Image, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../services/supabase';
import { colors, spacing } from '../constants/theme';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    
    // Wait a bit for splash effect
    setTimeout(() => {
      if (session) {
        router.replace('/(tabs)/dashboard');
      } else {
        router.replace('/(auth)/welcome');
      }
    }, 1500);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>❤️</Text>
      <Text style={styles.title}>BOND</Text>
      <Text style={styles.subtitle}>Relationship Wellness</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  logo: {
    fontSize: 80,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 18,
    color: colors.blush,
  },
});