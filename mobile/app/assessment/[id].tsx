import { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView, Alert } from 'react-native';
import { Button, RadioButton, Card, ProgressBar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../services/supabase';
import { colors, spacing } from '../../constants/theme';
import {
  allAssessments,
  assessmentQuestionBanks,
} from '../../utils/allAssessments';
import {
  calculateAssessmentProfile,
  generateGenericQuestions,
} from '../../utils/assessmentEngine';
import { calculateCoupleAssessmentResult } from '../../utils/coupleAssessment';
import { calculateOnboardingAssessmentProfile, onboardingQuestions } from '../../utils/onboardingAssessment';

export default function AssessmentTakeScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [assessment, setAssessment] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [userId, setUserId] = useState(null);
  const [sessionId, setSessionId] = useState(null);

  useEffect(() => {
    loadAssessment();
  }, [id]);

  async function loadAssessment() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      // Onboarding has its own short question set and is saved to onboarding_assessments,
      // so it doesn't create an assessment session (and doesn't count toward free-tier usage).
      if (id === 'onboarding-assessment') {
        setAssessment({ id, name: 'Couple Onboarding' });
        setQuestions(onboardingQuestions);
        return;
      }

      // Find assessment
      const foundAssessment = allAssessments.find((a) => a.id === id);
      setAssessment(foundAssessment);

      // Load questions based on assessment - use specific bank or generate generic
      let assessmentQuestions = assessmentQuestionBanks[id] || generateGenericQuestions(foundAssessment?.questionsCount || 15);
      setQuestions(assessmentQuestions);

      // Create or load session
      const { data: existingSession } = await supabase
        .from('assessment_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('assessment_id', id)
        .eq('completed', false)
        .single();

      if (existingSession) {
        setSessionId(existingSession.id);
        setAnswers(existingSession.answers || {});
      } else {
        // Create new session
        const { data: newSession } = await supabase
          .from('assessment_sessions')
          .insert([{
            user_id: user.id,
            assessment_id: id,
            answers: {},
            completed: false,
          }])
          .select()
          .single();
        setSessionId(newSession.id);
      }
    } catch (error) {
      console.error('Error loading assessment:', error);
      Alert.alert('Error', 'Failed to load assessment');
    } finally {
      setLoading(false);
    }
  }

  async function saveAnswer(questionId, answer) {
    const newAnswers = { ...answers, [questionId]: answer };
    setAnswers(newAnswers);

    // Auto-save to database
    if (sessionId) {
      await supabase
        .from('assessment_sessions')
        .update({ answers: newAnswers })
        .eq('id', sessionId);
    }
  }

  function handleNext() {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  }

  function handlePrevious() {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  }

  async function handleSubmit() {
    if (id === 'onboarding-assessment') {
      return handleOnboardingSubmit();
    }
    // Check if all questions answered
    const unanswered = questions.filter((q) => !answers[q.id]);
    if (unanswered.length > 0) {
      Alert.alert(
        'Incomplete',
        `Please answer all questions. ${unanswered.length} remaining.`
      );
      return;
    }

    Alert.alert(
      'Submit Assessment',
      'Once submitted, you cannot change your answers. Your partner will be notified when both of you complete this assessment.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: async () => {
            setSubmitting(true);
            try {
              const profile = calculateAssessmentProfile(id, answers);

              await supabase
                .from('assessment_sessions')
                .update({
                  completed: true,
                  submitted_at: new Date().toISOString(),
                  scores: {
                    ...profile.rawCategoryScores,
                    overallScore: profile.overallScore,
                    rawAverage: profile.rawAverage,
                    band: profile.band,
                    profileType: profile.profileType,
                    dimensionScores: profile.dimensionScores,
                    topDimensions: profile.topDimensions,
                    strengths: profile.strengths,
                    growthAreas: profile.growthAreas,
                    recommendations: profile.recommendations,
                    summary: profile.summary,
                  },
                })
                .eq('id', sessionId);

              const { data: { user } } = await supabase.auth.getUser();
              const { data: coupleUnit } = await supabase
                .from('couple_units')
                .select('*')
                .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
                .eq('status', 'active')
                .single();

              if (coupleUnit) {
                const partnerId = coupleUnit.user1_id === user.id
                  ? coupleUnit.user2_id
                  : coupleUnit.user1_id;

                const { data: partnerSession } = await supabase
                  .from('assessment_sessions')
                  .select('*')
                  .eq('user_id', partnerId)
                  .eq('assessment_id', id)
                  .eq('completed', true)
                  .single();

                if (partnerSession) {
                  const coupleResult = await createCoupleResult(
                    coupleUnit.id,
                    user.id,
                    partnerId,
                    sessionId,
                    partnerSession.id,
                    profile,
                    partnerSession.scores || {}
                  );
                  Alert.alert(
                    'Success! 🎉',
                    'Both you and your partner have completed this assessment. View your results now!',
                    [{ 
                      text: 'View Results', 
                      onPress: () => router.push({
                        pathname: '/results/[assessmentId]',
                        params: { 
                          assessmentId: id,
                          coupleResultId: coupleResult.id 
                        }
                      })
                    }]
                  );
                } else {
                  Alert.alert(
                    'Submitted! ✅',
                    'Your answers are saved. You\'ll see results once your partner completes the assessment.',
                    [{ text: 'OK', onPress: () => router.back() }]
                  );
                }
              }
            } catch (error) {
              console.error('Error submitting:', error);
              Alert.alert('Error', 'Failed to submit assessment');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  }

  async function handleOnboardingSubmit() {
    const unanswered = questions.filter((q) => !answers[q.id]);
    if (unanswered.length > 0) {
      Alert.alert('Incomplete', `Please answer all questions. ${unanswered.length} remaining.`);
      return;
    }

    Alert.alert('Submit Assessment', 'Once submitted, we will generate your onboarding recommendations.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Submit',
        onPress: async () => {
          setSubmitting(true);
          try {
            const profile = calculateOnboardingAssessmentProfile(answers);
            const { data: couple } = await supabase
              .from('couple_units')
              .select('id')
              .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
              .eq('status', 'active')
              .maybeSingle();
            const { error } = await supabase.from('onboarding_assessments').upsert([{
              user_id: userId,
              couple_unit_id: couple?.id || null,
              assessment_id: id,
              assessment_kind: 'onboarding',
              answers,
              individual_profile: profile.individualProfile,
              couple_profile: profile.coupleProfile,
              recommendations: {
                headline: profile.title,
                feedback: profile.feedback,
              },
              recommended_assessments: profile.recommendedAssessments,
              recommended_series: profile.recommendedSeries,
              feedback: profile.feedback,
              completed: true,
              submitted_at: new Date().toISOString(),
            }], { onConflict: 'user_id,assessment_id' });
            if (error) throw error;
            router.push({ pathname: '/results/[assessmentId]', params: { assessmentId: id } });
          } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to submit onboarding assessment');
          } finally {
            setSubmitting(false);
          }
        },
      },
    ]);
  }

  async function createCoupleResult(coupleUnitId, userId, partnerId, session1Id, session2Id, session1Profile, session2Scores) {
    const coupleResult = calculateCoupleAssessmentResult(id, session1Profile, session2Scores);

    const payload = {
      couple_unit_id: coupleUnitId,
      assessment_id: id,
      partner1_id: userId,
      partner2_id: partnerId,
      user1_session_id: session1Id,
      user2_session_id: session2Id,
      scoring_version: coupleResult.scoringVersion,
      compatibility_score: coupleResult.compatibilityScore,
      combined_scores: coupleResult,
      partner1_profile: coupleResult.partner1Profile,
      partner2_profile: coupleResult.partner2Profile,
      dimension_comparisons: coupleResult.dimensionComparisons,
      shared_strengths: coupleResult.sharedStrengths,
      shared_growth_areas: coupleResult.sharedGrowthAreas,
      asymmetry_flags: coupleResult.asymmetryFlags,
      relationship_pattern_key: coupleResult.relationshipPatternKey,
      relationship_pattern_title: coupleResult.relationshipPatternTitle,
      relationship_pattern_summary: coupleResult.relationshipPatternSummary,
      action_plan: coupleResult.actionPlan,
      conversation_scripts: coupleResult.conversationScripts,
      couple_summary: coupleResult.coupleSummary,
    };

    const { data, error } = await supabase
      .from('couple_results')
      .upsert([payload], { onConflict: 'couple_unit_id,assessment_id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading assessment...</Text>
      </View>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = (currentQuestionIndex + 1) / questions.length;
  const currentAnswer = answers[currentQuestion?.id];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.assessmentTitle}>{assessment?.name}</Text>
        <Text style={styles.questionCounter}>
          Question {currentQuestionIndex + 1} of {questions.length}
        </Text>
        <ProgressBar progress={progress} color={colors.teal} style={styles.progressBar} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Card style={styles.questionCard}>
          <Card.Content>
            <Text style={styles.questionText}>{currentQuestion?.text}</Text>

            {currentQuestion?.type === 'likert' && (
              <View style={styles.likertContainer}>
                <RadioButton.Group
                  onValueChange={(value) => saveAnswer(currentQuestion.id, value)}
                  value={currentAnswer || ''}
                >
                  {[1, 2, 3, 4, 5].map((value) => (
                    <View key={value} style={styles.radioItem}>
                      <RadioButton value={String(value)} color={colors.accent} />
                      <Text style={styles.radioLabel}>
                        {value === 1 && 'Strongly Disagree'}
                        {value === 2 && 'Disagree'}
                        {value === 3 && 'Neutral'}
                        {value === 4 && 'Agree'}
                        {value === 5 && 'Strongly Agree'}
                      </Text>
                    </View>
                  ))}
                </RadioButton.Group>
              </View>
            )}

            {currentQuestion?.type === 'choice' && (
              <View style={styles.choiceContainer}>
                <RadioButton.Group
                  onValueChange={(value) => {
                    const selectedOption = currentQuestion.options[parseInt(value)];
                    saveAnswer(currentQuestion.id, selectedOption);
                  }}
                  value={currentAnswer ? String(currentQuestion.options.indexOf(currentAnswer)) : ''}
                >
                  {currentQuestion.options?.map((option, index) => (
                    <View key={index} style={styles.choiceItem}>
                      <RadioButton value={String(index)} color={colors.accent} />
                      <Text style={styles.choiceText}>{option.text}</Text>
                    </View>
                  ))}
                </RadioButton.Group>
              </View>
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          mode="outlined"
          onPress={handlePrevious}
          disabled={currentQuestionIndex === 0}
          style={styles.navButton}
        >
          Previous
        </Button>

        {currentQuestionIndex === questions.length - 1 ? (
          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={submitting}
            disabled={submitting || !currentAnswer}
            style={[styles.navButton, styles.submitButton]}
            data-testid="submit-assessment-btn"
          >
            Submit
          </Button>
        ) : (
          <Button
            mode="contained"
            onPress={handleNext}
            disabled={!currentAnswer}
            style={[styles.navButton, styles.nextButton]}
          >
            Next
          </Button>
        )}
      </View>
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
  header: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  assessmentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  questionCounter: {
    fontSize: 14,
    color: colors.gray,
    marginBottom: spacing.sm,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
  },
  questionCard: {
    borderRadius: 16,
    elevation: 2,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: spacing.lg,
    lineHeight: 26,
  },
  likertContainer: {
    marginTop: spacing.md,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  radioLabel: {
    fontSize: 16,
    color: colors.gray,
    marginLeft: spacing.sm,
  },
  choiceContainer: {
    marginTop: spacing.md,
  },
  choiceItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  choiceText: {
    flex: 1,
    fontSize: 16,
    color: colors.black,
    marginLeft: spacing.sm,
    lineHeight: 22,
  },
  footer: {
    flexDirection: 'row',
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    gap: spacing.md,
  },
  navButton: {
    flex: 1,
    borderRadius: 8,
  },
  submitButton: {
    backgroundColor: colors.teal,
  },
  nextButton: {
    backgroundColor: colors.accent,
  },
});
