import { allAssessments } from './allAssessments';
import { calculateAssessmentProfile, calculateCompatibilityScore } from './assessmentEngine';
import { calculateCoupleAssessmentResult } from './coupleAssessment';
import { learningSeriesCatalog } from '../content/series';

export const onboardingQuestions = [
  {
    id: 'relationship_stage',
    text: 'Where are you in your relationship right now?',
    type: 'choice',
    options: [
      { text: 'Dating / just getting started' },
      { text: 'Committed and building', },
      { text: 'Engaged / preparing for the next step' },
      { text: 'Married or long-term partnered' },
      { text: 'Rebuilding after strain' },
    ],
  },
  {
    id: 'relationship_length',
    text: 'How long have you been together?',
    type: 'choice',
    options: [
      { text: 'Less than 6 months' },
      { text: '6–12 months' },
      { text: '1–3 years' },
      { text: '3–7 years' },
      { text: '7+ years' },
    ],
  },
  {
    id: 'biggest_challenge',
    text: 'What needs the most support right now?',
    type: 'choice',
    options: [
      { text: 'Communication' },
      { text: 'Trust' },
      { text: 'Conflict / repair' },
      { text: 'Intimacy / closeness' },
      { text: 'Values / direction' },
      { text: 'Stress / life pressure' },
    ],
  },
  {
    id: 'relationship_goal',
    text: 'What would make BOND most useful for you right now?',
    type: 'choice',
    options: [
      { text: 'Better communication' },
      { text: 'More trust and safety' },
      { text: 'Faster repair after conflict' },
      { text: 'More intimacy and connection' },
      { text: 'Clearer shared goals' },
    ],
  },
];

const onboardingRuleMap = [
  {
    key: 'stabilize',
    title: 'Stabilize first',
    min: 0,
    max: 39,
    assessments: ['attachment-style', 'communication-style', 'conflict-resolution', 'trust-vulnerability'],
    series: ['communication-series', 'conflict-repair-series', 'trust-vulnerability-series'],
    feedback: 'Start with the basics: emotional safety, clear communication, and conflict repair before trying to go deeper.',
  },
  {
    key: 'foundations',
    title: 'Build the basics',
    min: 40,
    max: 59,
    assessments: ['communication-style', 'love-languages', 'conflict-resolution'],
    series: ['connection-series', 'communication-series', 'conflict-repair-series'],
    feedback: 'You have a base. Focus on consistency, shared language, and one repeatable repair habit.',
  },
  {
    key: 'deepening',
    title: 'Deepen the bond',
    min: 60,
    max: 79,
    assessments: ['values-alignment', 'shared-meaning', 'intimacy-closeness'],
    series: ['shared-meaning-series', 'intimacy-series', 'life-growth-series'],
    feedback: 'You are ready to strengthen meaning, intimacy, and shared direction while protecting what already works.',
  },
  {
    key: 'maintenance',
    title: 'Protect the strength',
    min: 80,
    max: 100,
    assessments: ['appreciation-gratitude', 'fun-personality', 'relationship-satisfaction'],
    series: ['connection-series', 'health-wellness-series', 'key-concepts-series'],
    feedback: 'You have a strong relationship base. Keep reinforcing your healthy patterns and use them as models for everything else.',
  },
];

function getRule(score) {
  return onboardingRuleMap.find((rule) => score >= rule.min && score <= rule.max) || onboardingRuleMap[1];
}

function getTopSeries(seriesKeys) {
  const seriesByKey = new Map(learningSeriesCatalog.map((series) => [series.key, series]));
  return seriesKeys.map((key) => seriesByKey.get(key)).filter(Boolean).slice(0, 3);
}

export function calculateOnboardingAssessmentProfile(answers = {}) {
  const selectedChallenge = answers.biggest_challenge || 'Communication';
  const selectedGoal = answers.relationship_goal || 'Better communication';
  const selectedStage = answers.relationship_stage || 'Committed and building';

  const scoringInput = {
    stage: selectedStage,
    length: answers.relationship_length || '1–3 years',
    challenge: selectedChallenge,
    goal: selectedGoal,
  };

  const challengeBias = {
    Communication: 58,
    'Trust': 42,
    'Conflict / repair': 38,
    'Intimacy / closeness': 60,
    'Values / direction': 62,
    'Stress / life pressure': 45,
  }[selectedChallenge] || 50;

  const goalBias = {
    'Better communication': 62,
    'More trust and safety': 55,
    'Faster repair after conflict': 48,
    'More intimacy and connection': 60,
    'Clearer shared goals': 66,
  }[selectedGoal] || 55;

  const stageBias = {
    'Dating / just getting started': 48,
    'Committed and building': 58,
    'Engaged / preparing for the next step': 62,
    'Married or long-term partnered': 66,
    'Rebuilding after strain': 40,
  }[selectedStage] || 55;

  const overallScore = Math.round((challengeBias + goalBias + stageBias) / 3);
  const rule = getRule(overallScore);
  const recommendedAssessments = rule.assessments;
  const recommendedSeries = getTopSeries(rule.series).map((series) => series.key);

  const stageSummary = `You described your relationship as ${selectedStage.toLowerCase()}, with the main need being ${selectedChallenge.toLowerCase()}.`;
  const recommendationSummary = rule.feedback;

  const feedback = {
    headline: rule.title,
    summary: recommendationSummary,
    stageSummary,
    nextSteps: [
      `Start with ${recommendedAssessments[0].replace('-', ' ')}.`,
      `Then move into ${recommendedSeries[0]?.replace('-', ' ') || 'the recommended learning series'}.`,
      'Use the feedback summary to choose one concrete habit to practice this week.',
    ],
  };

  return {
    answers,
    onboardingScore: overallScore,
    coupleScore: Math.min(100, overallScore + 8),
    ruleKey: rule.key,
    title: rule.title,
    feedback,
    recommendedAssessments,
    recommendedSeries,
    individualProfile: {
      stage: selectedStage,
      length: answers.relationship_length || '1–3 years',
      challenge: selectedChallenge,
      goal: selectedGoal,
      score: overallScore,
      summary: stageSummary,
      rawScore: overallScore,
      scoringInput,
    },
    coupleProfile: {
      recommendationSummary,
      recommendedNextAssessments: recommendedAssessments,
      recommendedNextSeries: recommendedSeries,
      score: Math.min(100, overallScore + 8),
    },
  };
}

export function getOnboardingRecommendations(answers = {}) {
  return calculateOnboardingAssessmentProfile(answers);
}
