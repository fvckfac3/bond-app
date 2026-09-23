import test from 'node:test';
import assert from 'node:assert/strict';
import { allAssessments, assessmentQuestionBanks } from './allAssessments.js';
import { calculateAssessmentProfile, getAssessmentScoringConfig } from './assessmentEngine.js';

// Answer every item the way a person with the healthiest (or least healthy) pattern
// would. Reverse-keyed items and 'risk' dimensions (higher raw = more of a problem)
// flip which end of the 1-5 scale is healthy.
function answersFor(assessmentId, healthiest) {
  const config = getAssessmentScoringConfig(assessmentId);
  const riskKeys = new Set(config.dimensions.filter((d) => d.direction === 'risk').map((d) => d.key));
  const answers = {};
  for (const q of assessmentQuestionBanks[assessmentId]) {
    let agree = healthiest;
    if (q.reverse) agree = !agree;
    if (riskKeys.has(q.category)) agree = !agree;
    answers[q.id] = agree ? 5 : 1;
  }
  return answers;
}

for (const assessment of allAssessments) {
  test(`${assessment.id}: healthiest answers score 100 on every dimension`, () => {
    const profile = calculateAssessmentProfile(assessment.id, answersFor(assessment.id, true));
    for (const d of profile.dimensionScores) assert.equal(d.score, 100, `${d.key}`);
    assert.equal(profile.overallScore, 100);
  });

  test(`${assessment.id}: least healthy answers score 0 on every dimension`, () => {
    const profile = calculateAssessmentProfile(assessment.id, answersFor(assessment.id, false));
    for (const d of profile.dimensionScores) assert.equal(d.score, 0, `${d.key}`);
  });
}

test('Four Horsemen: a partner who never criticizes scores high on Gentle Start-Up', () => {
  const answers = {};
  for (const q of assessmentQuestionBanks['gottman-four-horsemen']) {
    // "I criticize..." (reverse) -> strongly disagree; "I focus on the issue..." -> strongly agree
    answers[q.id] = q.reverse ? 1 : 5;
  }
  const profile = calculateAssessmentProfile('gottman-four-horsemen', answers);
  const criticism = profile.dimensionScores.find((d) => d.key === 'criticism');
  assert.equal(criticism.label, 'Gentle Start-Up');
  assert.equal(criticism.score, 100);
  assert.equal(profile.band.minScore, 80); // top band, not "needs attention"
});

test('Attachment: high anxiety answers produce an anxious profile and a low anxiety score', () => {
  const answers = {};
  for (const q of assessmentQuestionBanks['attachment-style']) {
    const agree = q.category === 'anxiety' ? !q.reverse : q.reverse;
    answers[q.id] = agree ? 5 : 1;
  }
  const profile = calculateAssessmentProfile('attachment-style', answers);
  assert.equal(profile.profileType.key, 'anxious');
  assert.equal(profile.dimensionScores.find((d) => d.key === 'anxiety').score, 0);
});

test('conflict-resolution avoidance gets conflict advice, not attachment advice', () => {
  const answers = answersFor('conflict-resolution', true);
  for (const q of assessmentQuestionBanks['conflict-resolution']) {
    if (q.category === 'avoidance') answers[q.id] = q.reverse ? 5 : 1;
  }
  const profile = calculateAssessmentProfile('conflict-resolution', answers);
  assert.ok(profile.recommendations.some((r) => r.includes('Raise one small issue')));
  assert.ok(!profile.recommendations.some((r) => r.includes('feeling you usually keep private')));
});

test('no question text contains stray non-English characters', () => {
  for (const [id, questions] of Object.entries(assessmentQuestionBanks)) {
    for (const q of questions) assert.ok(!/[㐀-鿿]/.test(q.text), `${id}/${q.id}`);
  }
});
