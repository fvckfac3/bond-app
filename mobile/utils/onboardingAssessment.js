import { allAssessments } from './allAssessments';

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

// Choice answers are saved as the selected option object ({ text }).
const optionText = (answer) => (answer && typeof answer === 'object' ? answer.text : answer) || null;

// What each stated need points to first. Assessment ids must exist in allAssessments and
// series keys in the learning library (both checked by utils/onboarding.test.mjs).
const needRecommendations = {
  Communication: { assessments: ['communication-style', 'conflict-resolution'], series: ['communication-series'] },
  Trust: { assessments: ['trust-vulnerability', 'attachment-style'], series: ['trust-vulnerability-series'] },
  'Conflict / repair': { assessments: ['gottman-four-horsemen', 'conflict-resolution'], series: ['conflict-repair-series'] },
  'Intimacy / closeness': { assessments: ['intimacy-closeness', 'love-languages'], series: ['intimacy-series'] },
  'Values / direction': { assessments: ['values-alignment', 'shared-meaning'], series: ['life-growth-series'] },
  'Stress / life pressure': { assessments: ['stress-coping', 'emotional-intelligence'], series: ['health-wellness-series'] },
};

const goalRecommendations = {
  'Better communication': needRecommendations.Communication,
  'More trust and safety': needRecommendations.Trust,
  'Faster repair after conflict': needRecommendations['Conflict / repair'],
  'More intimacy and connection': { assessments: ['love-languages', 'intimacy-closeness'], series: ['connection-series'] },
  'Clearer shared goals': needRecommendations['Values / direction'],
};

// The starting plan comes from where the couple is, checked in order; the last one always matches.
export const onboardingPlans = [
  {
    key: 'stabilize',
    title: 'Stabilize first',
    matches: ({ stage }) => stage === 'Rebuilding after strain',
    series: ['conflict-repair-series'],
    feedback: 'Start with the basics: emotional safety, clear communication, and a reliable way to repair after hard moments, before trying to go deeper.',
  },
  {
    key: 'foundations',
    title: 'Build the basics',
    matches: ({ stage, length }) =>
      stage === 'Dating / just getting started' || length === 'Less than 6 months' || length === '6–12 months',
    series: ['connection-series'],
    feedback: 'You are early in building your shared language. Focus on understanding how each of you gives and receives care, and on one habit you repeat together.',
  },
  {
    key: 'maintenance',
    title: 'Protect what you have built',
    matches: ({ stage, length }) => stage === 'Married or long-term partnered' && (length === '3–7 years' || length === '7+ years'),
    series: ['key-concepts-series'],
    feedback: 'You have history to build on. Keep the patterns that work visible, and give the area you named some focused, shared attention.',
  },
  {
    key: 'deepening',
    title: 'Deepen the bond',
    matches: () => true,
    series: ['connection-series'],
    feedback: 'You have a base to build on. Now is a good time to strengthen meaning, closeness, and shared direction while protecting what already works.',
  },
];

const unique = (items) => [...new Set(items.filter(Boolean))];
const assessmentName = (id) => allAssessments.find((a) => a.id === id)?.name || id;

export function calculateOnboardingAssessmentProfile(answers = {}) {
  const stage = optionText(answers.relationship_stage);
  const length = optionText(answers.relationship_length);
  const challenge = optionText(answers.biggest_challenge);
  const goal = optionText(answers.relationship_goal);

  const plan = onboardingPlans.find((candidate) => candidate.matches({ stage, length, challenge, goal }));
  const need = needRecommendations[challenge] || needRecommendations.Communication;
  const wanted = goalRecommendations[goal] || need;

  const recommendedAssessments = unique([...need.assessments, ...wanted.assessments]).slice(0, 3);
  const recommendedSeries = unique([...need.series, ...wanted.series, ...plan.series]).slice(0, 3);

  const stageSummary = stage && challenge
    ? `You described your relationship as ${stage.toLowerCase()}, with ${challenge.toLowerCase()} as the area that needs the most support.`
    : 'Here is where we suggest the two of you begin.';

  const feedback = {
    headline: plan.title,
    summary: plan.feedback,
    stageSummary,
    nextSteps: [
      `Start with the ${assessmentName(recommendedAssessments[0])} assessment, and invite your partner to take it too.`,
      'Open the first recommended learning series together.',
      'Choose one small, concrete habit from what you learn and practice it this week.',
    ],
  };

  return {
    answers,
    ruleKey: plan.key,
    title: plan.title,
    feedback,
    recommendedAssessments,
    recommendedSeries,
    individualProfile: { stage, length, challenge, goal, summary: stageSummary },
    coupleProfile: {
      recommendationSummary: plan.feedback,
      recommendedNextAssessments: recommendedAssessments,
      recommendedNextSeries: recommendedSeries,
    },
  };
}
