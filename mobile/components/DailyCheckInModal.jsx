import { useState } from 'react';
import { View, StyleSheet, Text, Alert, Modal } from 'react-native';
import { Card, Button, TextInput, Portal } from 'react-native-paper';
import { Slider } from '@react-native-community/slider';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { supabase } from '../services/supabase';
import { colors, spacing } from '../constants/theme';
import ScaleButton from './animated/ScaleButton';

export default function DailyCheckInModal({ visible, onDismiss, coupleUnitId }) {
  const [connectionScore, setConnectionScore] = useState(5);
  const [mood, setMood] = useState('');
  const [appreciation, setAppreciation] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!mood.trim()) {
      Alert.alert('Required', 'Please enter your mood');
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase
        .from('daily_checkins')
        .insert([{
          user_id: user.id,
          couple_unit_id: coupleUnitId,
          connection_score: connectionScore,
          mood: mood.trim(),
          appreciation: appreciation.trim() || null,
          date: new Date().toISOString().split('T')[0],
        }]);

      Alert.alert('Success! ✨', 'Daily check-in completed');
      resetForm();
      onDismiss();
    } catch (error) {
      console.error('Error submitting check-in:', error);
      Alert.alert('Error', 'Failed to submit check-in');
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setConnectionScore(5);
    setMood('');
    setAppreciation('');
  }

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <MotiView
            from={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 15 }}
            style={styles.modalContent}
          >
            <LinearGradient
              colors={[colors.white, colors.blush]}
              style={styles.gradientCard}
            >
              <Card style={styles.card}>
                <Card.Content>
                  <Text style={styles.title}>Daily Check-In ❤️</Text>
                  <Text style={styles.subtitle}>Take a moment to reflect on your day</Text>

                  {/* Connection Score Slider */}
                  <View style={styles.section}>
                    <Text style={styles.label}>How connected do you feel today?</Text>
                    <View style={styles.sliderContainer}>
                      <MotiView
                        animate={{ scale: connectionScore / 10 + 0.5 }}
                        transition={{ type: 'spring' }}
                      >
                        <Text style={styles.sliderValue}>{connectionScore}/10</Text>
                      </MotiView>
                      <Slider
                        style={styles.slider}
                        minimumValue={1}
                        maximumValue={10}
                        step={1}
                        value={connectionScore}
                        onValueChange={setConnectionScore}
                        minimumTrackTintColor={colors.accent}
                        maximumTrackTintColor={colors.lightGray}
                        thumbTintColor={colors.accent}
                      />
                      <View style={styles.sliderLabels}>
                        <Text style={styles.sliderLabelText}>Disconnected</Text>
                        <Text style={styles.sliderLabelText}>Very Connected</Text>
                      </View>
                    </View>
                  </View>

                  {/* Mood Input */}
                  <View style={styles.section}>
                    <Text style={styles.label}>How are you feeling? *</Text>
                    <TextInput
                      value={mood}
                      onChangeText={setMood}
                      placeholder="e.g., happy, stressed, grateful"
                      mode="outlined"
                      style={styles.input}
                      outlineColor={colors.lightGray}
                      activeOutlineColor={colors.accent}
                      data-testid="checkin-mood-input"
                    />
                  </View>

                  {/* Appreciation (Optional) */}
                  <View style={styles.section}>
                    <Text style={styles.label}>Appreciation (optional)</Text>
                    <TextInput
                      value={appreciation}
                      onChangeText={setAppreciation}
                      placeholder="Something you appreciate about your partner today"
                      mode="outlined"
                      multiline
                      numberOfLines={3}
                      style={styles.input}
                      outlineColor={colors.lightGray}
                      activeOutlineColor={colors.accent}
                      data-testid="checkin-appreciation-input"
                    />
                  </View>

                  {/* Buttons */}
                  <View style={styles.buttons}>
                    <ScaleButton
                      onPress={onDismiss}
                      style={styles.button}
                    >
                      <View style={styles.cancelButton}>
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      </View>
                    </ScaleButton>
                    <ScaleButton
                      onPress={handleSubmit}
                      disabled={submitting}
                      testID="checkin-submit-btn"
                      style={styles.button}
                    >
                      <View style={styles.submitButton}>
                        <Text style={styles.submitButtonText}>
                          {submitting ? 'Submitting...' : 'Submit'}
                        </Text>
                      </View>
                    </ScaleButton>
                  </View>
                </Card.Content>
              </Card>
            </LinearGradient>
          </MotiView>
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
  },
  gradientCard: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  card: {
    maxHeight: '90%',
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: colors.gray,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  sliderContainer: {
    marginTop: spacing.sm,
  },
  sliderValue: {
    fontSize: 40,
    fontWeight: 'bold',
    color: colors.accent,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  sliderLabelText: {
    fontSize: 12,
    color: colors.gray,
  },
  input: {
    backgroundColor: colors.white,
  },
  buttons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  button: {
    flex: 1,
  },
  cancelButton: {
    borderWidth: 2,
    borderColor: colors.gray,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: colors.gray,
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});