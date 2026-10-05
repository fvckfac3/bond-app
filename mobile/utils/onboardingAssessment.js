import { allAssessments } from './allAssessments';
import { defaultAssessmentBands } from './assessmentEngine';

// The 4 routing questions must stay first and in this order: onboarding.test.mjs destructures
// them positionally, and calculateOnboardingAssessmentProfile's plan-matching keys off their ids.
export const onboardingRoutingQuestions = [
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

// A short baseline sweep across the core areas of a relationship (2 statements each), scored like
// a regular assessment (utils/assessmentEngine.js) so results, insights and history all read the
// same shape. This is deliberately broad, not deep — each domain also has its own full assessment
// (mobile/utils/allAssessments.js) for anyone who wants to go further.
export const onboardingBaselineDomains = [
  {
    key: 'communication',
    label: 'Communication',
    questionIds: ['baseline_communication_1', 'baseline_communication_2'],
  },
  {
    key: 'trust',
    label: 'Trust & Security',
    questionIds: ['baseline_trust_1', 'baseline_trust_2'],
  },
  {
    key: 'conflict',
    label: 'Conflict & Repair',
    questionIds: ['baseline_conflict_1', 'baseline_conflict_2'],
  },
  {
    key: 'intimacy',
    label: 'Intimacy & Closeness',
    questionIds: ['baseline_intimacy_1', 'baseline_intimacy_2'],
  },
  {
    key: 'values',
    label: 'Values & Direction',
    questionIds: ['baseline_values_1', 'baseline_values_2'],
  },
  {
    key: 'stress',
    label: 'Stress & Support',
    questionIds: ['baseline_stress_1', 'baseline_stress_2'],
  },
  {
    key: 'appreciation',
    label: 'Appreciation',
    questionIds: ['baseline_appreciation_1', 'baseline_appreciation_2'],
  },
  {
    key: 'fun',
    label: 'Fun & Play',
    questionIds: ['baseline_fun_1', 'baseline_fun_2'],
  },
];

const baselineQuestionText = {
  baseline_communication_1: 'I feel understood when I share what’s on my mind with my partner.',
  baseline_communication_2: 'We can talk through difficult topics without either of us shutting down.',
  baseline_trust_1: 'I trust my partner to follow through on what they say.',
  baseline_trust_2: 'I feel emotionally secure in this relationship, even during rough patches.',
  baseline_conflict_1: 'We recover well after an argument or disagreement.',
  baseline_conflict_2: 'Working through conflict tends to bring us closer instead of pulling us apart.',
  baseline_intimacy_1: 'I feel emotionally close to my partner in day-to-day life.',
  baseline_intimacy_2: 'I feel comfortable being physically affectionate with my partner.',
  baseline_values_1: 'My partner and I want similar things for our future.',
  baseline_values_2: 'We make big decisions, like money or life plans, as a team.',
  baseline_stress_1: 'My partner and I support each other well when life gets stressful.',
  baseline_stress_2: 'Stress from outside the relationship rarely spills over into how we treat each other.',
  baseline_appreciation_1: 'I feel appreciated for what I bring to this relationship.',
  baseline_appreciation_2: 'I make a habit of noticing and naming what my partner does well.',
  baseline_fun_1: 'We still make time to have fun and laugh together.',
  baseline_fun_2: 'I look forward to relaxed, unstructured time with my partner.',
};

export const onboardingBaselineQuestions = onboardingBaselineDomains.flatMap((domain) =>
  domain.questionIds.map((id) => ({ id, text: baselineQuestionText[id], type: 'likert' }))
);

export const onboardingQuestions = [...onboardingRoutingQuestions, ...onboardingBaselineQuestions];

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

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function round(value, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function average(values) {
  const filtered = values.filter((value) => Number.isFinite(value));
  return filtered.length ? filtered.reduce((sum, value) => sum + value, 0) / filtered.length : 0;
}

function likertScore(answer) {
  const n = Number(answer);
  return Number.isFinite(n) && n > 0 ? n : null;
}

const strengthTier = (score) => (score >= 80 ? 'Exceptional' : score >= 60 ? 'Strong' : 'Emerging');
const growthTier = (score) => (score >= 80 ? 'Keep it up' : score >= 60 ? 'Solid but worth reinforcing' : 'Needs attention');

// A baseline score across every domain the onboarding sweep covers, shaped exactly like a regular
// assessment's `scores` (dimensionScores/overallScore/band/strengths/growthAreas/summary) so the
// backend's insight context (backend/services/insight_context.py::summarize_scores) can read it
// without a special case.
export function calculateOnboardingBaselineScores(answers = {}) {
  const dimensionScores = onboardingBaselineDomains.map((domain) => {
    const raw = domain.questionIds.map((id) => likertScore(answers[id])).filter((v) => v !== null);
    const score = round(clamp(((average(raw) - 1) / 4) * 100, 0, 100), 1);
    return { key: domain.key, label: domain.label, direction: 'positive', score };
  });

  const overallScore = round(average(dimensionScores.map((d) => d.score)), 1);
  const band =
    defaultAssessmentBands.find((b) => overallScore >= b.minScore && overallScore <= b.maxScore) ||
    defaultAssessmentBands[defaultAssessmentBands.length - 1];

  const ranked = dimensionScores.slice().sort((a, b) => b.score - a.score);
  const strengths = ranked
    .slice(0, 3)
    .map((d) => ({ key: d.key, label: d.label, score: d.score, summary: strengthTier(d.score) }));
  const growthAreas = ranked
    .slice(-3)
    .reverse()
    .map((d) => ({ key: d.key, label: d.label, score: d.score, summary: growthTier(d.score) }));

  const summary = strengths[0] && growthAreas[0]
    ? `Your starting baseline is strongest in ${strengths[0].label.toLowerCase()}, with the most room to grow in ${growthAreas[0].label.toLowerCase()}.`
    : 'Here is your starting baseline across the areas we asked about.';

  return {
    mode: 'baseline',
    questionCount: onboardingBaselineQuestions.length,
    dimensionScores,
    overallScore,
    band,
    strengths,
    growthAreas,
    summary,
  };
}

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

  const baselineScores = calculateOnboardingBaselineScores(answers);

  return {
    answers,
    ruleKey: plan.key,
    title: plan.title,
    feedback,
    recommendedAssessments,
    recommendedSeries,
    baselineScores,
    individualProfile: { stage, length, challenge, goal, summary: stageSummary },
    coupleProfile: {
      recommendationSummary: plan.feedback,
      recommendedNextAssessments: recommendedAssessments,
      recommendedNextSeries: recommendedSeries,
    },
  };
}
