import test from 'node:test';
import assert from 'node:assert/strict';
import { allAssessments } from './allAssessments.js';
import { learningSeriesCatalog } from '../content/series/learningLibrary.ts';
import { onboardingQuestions, onboardingPlans, calculateOnboardingAssessmentProfile } from './onboardingAssessment.js';

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
  const seriesKeys = new Set(learningSeriesCatalog.map((s) => s.key));
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
