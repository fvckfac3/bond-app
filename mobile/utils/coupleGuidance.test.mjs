// The couple feedback rules from supabase/couple_assessment_scoring_spec.md ("Feedback rules",
// "Assessment-specific tuning").
import test from 'node:test';
import assert from 'node:assert/strict';
import { assessmentQuestionBanks } from './allAssessments.js';
import { getAssessmentScoringConfig } from './assessmentEngine.js';
import { calculateCoupleAssessmentResult, getCoupleRuleConfig } from './coupleAssessment.js';

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

const healthy = (id) => answersFor(id, true);
const struggling = (id) => answersFor(id, false);
const couple = (id, a, b) => calculateCoupleAssessmentResult(id, a(id), b(id));

test('values, shared meaning and money weight alignment above the default', () => {
  const standard = getCoupleRuleConfig('communication-style').alignmentWeight;
  for (const id of ['values-alignment', 'shared-meaning', 'financial-values', 'love-languages']) {
    const cfg = getCoupleRuleConfig(id);
    assert.ok(cfg.alignmentWeight > standard, id);
    assert.ok(cfg.alignmentWeight >= cfg.averageWeight && cfg.alignmentWeight >= cfg.floorWeight, id);
    assert.equal(Math.round((cfg.averageWeight + cfg.alignmentWeight + cfg.floorWeight) * 100), 100, id);
  }
});

test('love languages surface each partner’s top two languages', () => {
  const result = couple('love-languages', healthy, struggling);
  assert.equal(result.topPreferences.partner1.length, 2);
  assert.equal(result.topPreferences.partner2.length, 2);
  assert.ok(result.actionPlan.some((a) => a.includes('your partner’s language')));
});

test('four horsemen: elevated contempt or stonewalling raises a warning; always a repair step', () => {
  const struggle = couple('gottman-four-horsemen', healthy, struggling);
  assert.equal(struggle.warnings.length, 1);
  assert.match(struggle.warnings[0], /Contempt and Stonewalling/);
  assert.doesNotMatch(struggle.warnings[0], /partner 1|partner 2/i); // never names who
  const calm = couple('gottman-four-horsemen', healthy, healthy);
  assert.deepEqual(calm.warnings, []);
  for (const id of ['gottman-four-horsemen', 'conflict-resolution']) {
    for (const r of [couple(id, healthy, healthy), couple(id, healthy, struggling)]) {
      assert.ok(r.actionPlan.some((a) => /repair phrase/.test(a)), id);
    }
  }
});

test('trust, intimacy and sexual compatibility: safety work comes first when either partner is low', () => {
  for (const id of ['trust-vulnerability', 'intimacy-closeness', 'sexual-compatibility']) {
    assert.match(couple(id, healthy, struggling).actionPlan[0], /^Start with safety/, id);
    assert.ok(!couple(id, healthy, healthy).actionPlan.some((a) => a.startsWith('Start with safety')), id);
  }
});

test('attachment: a big mismatch gets a reassurance-and-space plan', () => {
  assert.ok(couple('attachment-style', healthy, struggling).actionPlan.some((a) => /reassurance-and-space/.test(a)));
  assert.ok(!couple('attachment-style', healthy, healthy).actionPlan.some((a) => /reassurance-and-space/.test(a)));
});

test('values and shared meaning always offer a shared operating plan', () => {
  for (const id of ['values-alignment', 'shared-meaning', 'financial-values']) {
    assert.ok(couple(id, healthy, healthy).actionPlan.some((a) => /shared plan/.test(a)), id);
  }
});

test('action plans stay short and free of duplicates', () => {
  for (const id of Object.keys(assessmentQuestionBanks)) {
    const plan = couple(id, healthy, struggling).actionPlan;
    assert.ok(plan.length >= 2 && plan.length <= 6, id);
    assert.equal(new Set(plan).size, plan.length, id);
  }
});
