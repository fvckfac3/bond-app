import { useState } from 'react';
import { View, StyleSheet, Text, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../services/supabase';
import { generatePairCode } from '../../utils/pairCode';
import { colors, spacing } from '../../constants/theme';

export default function SignupScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  async function handleSignup() {
    if (!email || !password || !name) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      // Sign up with Supabase Auth
      // The profile row (users) is created by the database from this metadata — see
      // handle_new_user() in supabase/bond_schema.sql — so it works even before the
      // email is confirmed and the client has a session.
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name, pair_code: generatePairCode() } },
      });

      if (authError) throw authError;

      Alert.alert('Success', 'Account created! Please check your email to verify your account.');
      router.replace('/(auth)/login');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join BOND and start your relationship wellness journey</Text>
          </View>

          <View style={styles.form}>
            <TextInput
              label="Name"
              value={name}
              onChangeText={setName}
              mode="outlined"
              style={styles.input}
              autoCapitalize="words"
              data-testid="signup-name-input"
            />
            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              style={styles.input}
              autoCapitalize="none"
              keyboardType="email-address"
              data-testid="signup-email-input"
            />
            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              style={styles.input}
              secureTextEntry
              data-testid="signup-password-input"
            />
            <Text style={styles.hint}>Password must be at least 6 characters</Text>

            <Button
              mode="contained"
              onPress={handleSignup}
              loading={loading}
              disabled={loading}
              style={styles.button}
              labelStyle={styles.buttonLabel}
              data-testid="signup-submit-btn"
            >
              Sign Up
            </Button>

            <Button
              mode="text"
              onPress={() => router.back()}
              labelStyle={styles.backButton}
            >
              Already have an account? Log In
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.lg,
  },
  header: {
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: colors.gray,
    lineHeight: 24,
  },
  form: {
    flex: 1,
  },
  input: {
    marginBottom: spacing.md,
    backgroundColor: colors.white,
  },
  hint: {
    fontSize: 12,
    color: colors.gray,
    marginBottom: spacing.lg,
    marginTop: -spacing.sm,
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    color: colors.primary,
    fontSize: 14,
    marginTop: spacing.md,
  },
});