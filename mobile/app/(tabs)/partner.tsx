// Partner Screen - Refined
// Built following: animation-patterns, polish, mobile-design, shadows, ui-ux-patterns
// Clean partner connection flow

import { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView, Alert, TouchableOpacity, Platform, AccessibilityInfo } from 'react-native';
import { Card, Button, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../services/supabase';
import { colors, spacing, borderRadius, shadows, motion, typography, touchTargets } from '../../constants/theme';
import { formatPairCode, cleanPairCode } from '../../utils/pairCode';
import FadeInView from '../../components/animated/FadeInView';
import ScaleButton from '../../components/animated/ScaleButton';

export default function PartnerScreen() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [coupleUnit, setCoupleUnit] = useState(null);
  const [partner, setPartner] = useState(null);
  const [pairCodeInput, setPairCodeInput] = useState('');
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    fetchPartnerData();
  }, []);

  async function fetchPartnerData() {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      // Get user profile
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      setUser(userData);

      // Get couple unit
      const { data: coupleData } = await supabase
        .from('couple_units')
        .select('*')
        .or(`user1_id.eq.${authUser.id},user2_id.eq.${authUser.id}`)
        .eq('status', 'active')
        .single();

      if (coupleData) {
        setCoupleUnit(coupleData);

        // Get partner info
        const partnerId = coupleData.user1_id === authUser.id
          ? coupleData.user2_id
          : coupleData.user1_id;

        const { data: partnerData } = await supabase
          .from('users')
          .select('*')
          .eq('id', partnerId)
          .single();

        setPartner(partnerData);
      }
    } catch (error) {
      console.error('Error fetching partner data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleConnectPartner() {
    if (!pairCodeInput.trim()) {
      Alert.alert('Enter Pair Code', 'Please enter your partner\'s pair code');
      return;
    }

    const cleanCode = cleanPairCode(pairCodeInput);
    if (cleanCode.length !== 6) {
      Alert.alert('Invalid Code', 'Pair code must be 6 characters');
      return;
    }

    if (cleanCode === user?.pair_code) {
      Alert.alert('Error', 'You cannot connect with yourself');
      return;
    }

    setConnecting(true);
    try {
      const { error: pairError } = await supabase.rpc('pair_with_partner', {
        partner_code: cleanCode,
      });

      if (pairError) {
        const reasons: Record<string, [string, string]> = {
          invalid_code: ['Not Found', 'No account found with that pair code. Please check and try again.'],
          self_pairing: ['Error', 'You cannot connect with yourself'],
          already_paired: ['Already Connected', 'You are already connected with a partner'],
          partner_already_paired: ['Unavailable', 'That person is already connected with a partner.'],
        };
        const reason = Object.keys(reasons).find((key) => pairError.message?.includes(key));
        if (reason) {
          const [title, message] = reasons[reason];
          Alert.alert(title, message);
          return;
        }
        throw pairError;
      }

      Alert.alert(
        'Connected!',
        'You are now connected with your partner!',
        [{ text: 'OK', onPress: () => fetchPartnerData() }]
      );
      setPairCodeInput('');
    } catch (error) {
      console.error('Error connecting:', error);
      Alert.alert('Error', 'Failed to connect. Please try again.');
    } finally {
      setConnecting(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {partner ? (
          // Connected State
          <FadeInView>
            <View style={styles.connectedSection}>
              <View style={styles.heartContainer}>
                <Text style={styles.heartIcon}>❤️</Text>
              </View>
              <Text style={styles.connectedTitle}>Connected</Text>

              <Card style={styles.partnerCard}>
                <Card.Content style={styles.partnerContent}>
                  <Text style={styles.partnerName}>{partner.name}</Text>
                  <Text style={styles.partnerEmail}>{partner.email}</Text>
                </Card.Content>
              </Card>

              <Card style={styles.infoCard}>
                <Card.Content>
                  <Text style={styles.infoLabel}>Your Shared Journey</Text>
                  <Text style={styles.infoDescription}>
                    Complete assessments and activities together to strengthen your bond
                  </Text>
                </Card.Content>
              </Card>
            </View>
          </FadeInView>
        ) : (
          // Not Connected State
          <View>
            {/* Your Pair Code Card */}
            <FadeInView delay={0}>
              <Card style={styles.card}>
                <Card.Content>
                  <Text style={styles.cardTitle}>Your Pair Code</Text>
                  <Text style={styles.cardSubtitle}>
                    Share this code with your partner to connect
                  </Text>
                  <View style={styles.pairCodeContainer}>
                    <Text style={styles.pairCode}>
                      {user ? formatPairCode(user.pair_code) : '------'}
                    </Text>
                  </View>
                </Card.Content>
              </Card>
            </FadeInView>

            {/* Connect Card */}
            <FadeInView delay={100}>
              <Card style={styles.card}>
                <Card.Content>
                  <Text style={styles.cardTitle}>Connect with Partner</Text>
                  <Text style={styles.cardSubtitle}>
                    Enter your partner’s pair code to connect
                  </Text>
                  <TextInput
                    label="Partner's Pair Code"
                    value={pairCodeInput}
                    onChangeText={setPairCodeInput}
                    mode="outlined"
                    style={styles.input}
                    placeholder="ABC-DEF"
                    autoCapitalize="characters"
                    maxLength={7}
                    accessibilityLabel="Enter partner pair code"
                  />
                  <ScaleButton
                    onPress={handleConnectPartner}
                    loading={connecting}
                    disabled={connecting}
                    style={styles.connectButton}
                  >
                    <Text style={styles.connectButtonText}>Connect</Text>
                  </ScaleButton>
                </Card.Content>
              </Card>
            </FadeInView>

            {/* How It Works */}
            <FadeInView delay={200}>
              <Card style={styles.card}>
                <Card.Content>
                  <Text style={styles.cardTitle}>How It Works</Text>
                  <View style={styles.step}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>1</Text>
                    </View>
                    <Text style={styles.stepText}>
                      Share your pair code with your partner
                    </Text>
                  </View>
                  <View style={styles.step}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>2</Text>
                    </View>
                    <Text style={styles.stepText}>
                      They create an account and enter your code
                    </Text>
                  </View>
                  <View style={styles.step}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>3</Text>
                    </View>
                    <Text style={styles.stepText}>
                      Start your journey together
                    </Text>
                  </View>
                </Card.Content>
              </Card>
            </FadeInView>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: typography.body.fontSize,
    color: colors.gray,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  connectedSection: {
    alignItems: 'center',
  },
  heartContainer: {
    marginBottom: spacing.md,
  },
  heartIcon: {
    fontSize: 56,
  },
  connectedTitle: {
    fontSize: typography.h2.fontSize,
    fontWeight: '600',
    color: colors.teal,
    marginBottom: spacing.lg,
  },
  partnerCard: {
    width: '100%',
    borderRadius: borderRadius.md,
    ...shadows.sm,
    backgroundColor: colors.white,
    marginBottom: spacing.md,
  },
  partnerContent: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  partnerName: {
    fontSize: typography.h2.fontSize,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  partnerEmail: {
    fontSize: typography.body.fontSize,
    color: colors.gray,
    textAlign: 'center',
  },
  infoCard: {
    width: '100%',
    borderRadius: borderRadius.md,
    ...shadows.sm,
    backgroundColor: colors.white,
    marginBottom: spacing.md,
  },
  infoLabel: {
    fontSize: typography.caption.fontSize,
    fontWeight: '600',
    color: colors.gray,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: typography.body.fontSize,
    color: colors.primary,
  },
  infoDescription: {
    fontSize: typography.body.fontSize,
    color: colors.gray,
    lineHeight: typography.body.lineHeight,
  },
  card: {
    borderRadius: borderRadius.md,
    ...shadows.sm,
    backgroundColor: colors.white,
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: typography.h4.fontSize,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  cardSubtitle: {
    fontSize: typography.body.fontSize,
    color: colors.gray,
    marginBottom: spacing.md,
    lineHeight: typography.body.lineHeight,
  },
  pairCodeContainer: {
    backgroundColor: colors.blush,
    padding: spacing.xl,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  pairCode: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 4,
  },
  input: {
    marginBottom: spacing.md,
    backgroundColor: colors.white,
  },
  connectButton: {
    backgroundColor: colors.accent,
  },
  connectButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: typography.body.fontSize,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.blush,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  stepNumberText: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    color: colors.accent,
  },
  stepText: {
    flex: 1,
    fontSize: typography.body.fontSize,
    color: colors.gray,
    lineHeight: typography.body.lineHeight,
  },
});