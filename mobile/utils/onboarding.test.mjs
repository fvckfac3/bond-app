import test from 'node:test';
import assert from 'node:assert/strict';
import { allAssessments } from './allAssessments.js';
import { readFileSync } from 'node:fs';
import {
  onboardingQuestions,
  onboardingRoutingQuestions,
  onboardingBaselineDomains,
  onboardingBaselineQuestions,
  onboardingPlans,
  calculateOnboardingAssessmentProfile,
  calculateOnboardingBaselineScores,
} from './onboardingAssessment.js';

// The learning library lives in Supabase, seeded by migration 012; read its series keys from there.
const librarySql = readFileSync(new URL('../../supabase/migrations/012_content_learning_library.sql', import.meta.url), 'utf8');
const librarySeriesKeys = new Set(
  [...librarySql.matchAll(/^INSERT INTO learning_series \([^)]*\) VALUES \('([^']+)'/gm)].map((m) => m[1])
);

// Answers exactly as the assessment screen saves them: the chosen option object.
const pick = (id, text) => {
  const option = onboardingQuestions.find((q) => q.id === id).options.find((o) => o.text === text);
  assert.ok(option, `${id}: ${text}`);
  return option;
};
const answers = (stage, length, challenge, goal) => ({
  relationship_stage: pick('relationship_stage', stage),
  relationship_length: pick('relationship_length', length),
  biggest_challenge: pick('biggest_challenge', challenge),
  relationship_goal: pick('relationship_goal', goal),
});

test('every plan is reachable from real answers', () => {
  const cases = {
    stabilize: answers('Rebuilding after strain', '3–7 years', 'Trust', 'More trust and safety'),
    foundations: answers('Dating / just getting started', 'Less than 6 months', 'Communication', 'Better communication'),
    maintenance: answers('Married or long-term partnered', '7+ years', 'Stress / life pressure', 'Clearer shared goals'),
    deepening: answers('Engaged / preparing for the next step', '1–3 years', 'Intimacy / closeness', 'More intimacy and connection'),
  };
  for (const plan of onboardingPlans) {
    assert.equal(calculateOnboardingAssessmentProfile(cases[plan.key]).ruleKey, plan.key);
  }
});

test('recommendations follow the stated need, not a default', () => {
  const profile = calculateOnboardingAssessmentProfile(
    answers('Committed and building', '1–3 years', 'Conflict / repair', 'Faster repair after conflict')
  );
  assert.equal(profile.recommendedAssessments[0], 'gottman-four-horsemen');
  assert.equal(profile.recommendedSeries[0], 'conflict-repair-series');
});

test('every possible answer combination recommends real assessments and series', () => {
  const assessmentIds = new Set(allAssessments.map((a) => a.id));
  const seriesKeys = librarySeriesKeys;
  assert.equal(seriesKeys.size, 10);
  const [stages, lengths, challenges, goals] = onboardingQuestions.map((q) => q.options);
  for (const stage of stages) for (const length of lengths) for (const challenge of challenges) for (const goal of goals) {
    const profile = calculateOnboardingAssessmentProfile({
      relationship_stage: stage, relationship_length: length, biggest_challenge: challenge, relationship_goal: goal,
    });
    assert.ok(profile.recommendedAssessments.length > 0);
    for (const id of profile.recommendedAssessments) assert.ok(assessmentIds.has(id), id);
    for (const key of profile.recommendedSeries) assert.ok(seriesKeys.has(key), key);
    assert.ok(!('onboardingScore' in profile), 'no invented score');
  }
});

// The 4 routing questions must stay first, in order: this file and calculateOnboardingAssessmentProfile
// both depend on that positionally.
test('routing questions are first, followed by the baseline sweep', () => {
  assert.equal(onboardingQuestions.length, onboardingRoutingQuestions.length + onboardingBaselineQuestions.length);
  for (let i = 0; i < onboardingRoutingQuestions.length; i += 1) {
    assert.equal(onboardingQuestions[i].id, onboardingRoutingQuestions[i].id);
  }
  for (const q of onboardingBaselineQuestions) {
    assert.equal(q.type, 'likert');
    assert.ok(q.text && q.text.length > 0, q.id);
  }
});

test('every baseline domain has a unique key, label, and 2 real questions', () => {
  const keys = new Set();
  const allBaselineIds = new Set(onboardingBaselineQuestions.map((q) => q.id));
  for (const domain of onboardingBaselineDomains) {
    assert.ok(!keys.has(domain.key), `duplicate domain key ${domain.key}`);
    keys.add(domain.key);
    assert.ok(domain.label);
    assert.equal(domain.questionIds.length, 2);
    for (const id of domain.questionIds) assert.ok(allBaselineIds.has(id), id);
  }
});

function likertAnswers(value) {
  return Object.fromEntries(onboardingBaselineQuestions.map((q) => [q.id, String(value)]));
}

test('baseline scoring produces a dimension per domain, 0-100, from a regular Likert 1-5 answer', () => {
  const scores = calculateOnboardingBaselineScores(likertAnswers(4));
  assert.equal(scores.dimensionScores.length, onboardingBaselineDomains.length);
  for (const dim of scores.dimensionScores) {
    assert.ok(dim.score >= 0 && dim.score <= 100, `${dim.key}: ${dim.score}`);
    assert.equal(dim.direction, 'positive');
  }
  assert.ok(scores.overallScore > 0 && scores.overallScore <= 100);
  assert.ok(scores.band?.title);
});

test('baseline scoring: all-agree scores near 100, all-disagree scores near 0', () => {
  const strong = calculateOnboardingBaselineScores(likertAnswers(5));
  const weak = calculateOnboardingBaselineScores(likertAnswers(1));
  assert.equal(strong.overallScore, 100);
  assert.equal(weak.overallScore, 0);
  assert.ok(strong.overallScore > weak.overallScore);
});

test('baseline scoring surfaces real strengths and growth areas, worst domain first in growthAreas', () => {
  const answers = likertAnswers(4);
  // Make conflict the clear weak spot.
  answers.baseline_conflict_1 = '1';
  answers.baseline_conflict_2 = '2';
  const scores = calculateOnboardingBaselineScores(answers);
  assert.equal(scores.growthAreas[0].key, 'conflict');
  assert.ok(scores.strengths.every((s) => s.key !== 'conflict'));
  assert.ok(scores.summary.toLowerCase().includes('conflict'));
});

test('calculateOnboardingAssessmentProfile includes the baseline scores', () => {
  const answers = {
    relationship_stage: onboardingRoutingQuestions[0].options[1],
    relationship_length: onboardingRoutingQuestions[1].options[1],
    biggest_challenge: onboardingRoutingQuestions[2].options[0],
    relationship_goal: onboardingRoutingQuestions[3].options[0],
    ...likertAnswers(3),
  };
  const profile = calculateOnboardingAssessmentProfile(answers);
  assert.equal(profile.baselineScores.dimensionScores.length, onboardingBaselineDomains.length);
});
