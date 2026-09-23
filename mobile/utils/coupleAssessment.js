import { calculateCompatibilityScore, calculateAssessmentProfile } from './assessmentEngine';

const defaultRuleConfig = {
  averageWeight: 0.4,
  alignmentWeight: 0.35,
  floorWeight: 0.25,
  highGapThreshold: 25,
  sharedStrengthThreshold: 72,
  sharedGrowthThreshold: 55,
  lowFloorThreshold: 45,
};

const coupleRuleConfigByAssessment = {
  'love-languages': {
    averageWeight: 0.35,
    alignmentWeight: 0.45,
    floorWeight: 0.2,
    highGapThreshold: 30,
    sharedStrengthThreshold: 72,
    sharedGrowthThreshold: 55,
    lowFloorThreshold: 45,
  },
  'attachment-style': {
    averageWeight: 0.25,
    alignmentWeight: 0.35,
    floorWeight: 0.4,
    highGapThreshold: 20,
    sharedStrengthThreshold: 70,
    sharedGrowthThreshold: 52,
    lowFloorThreshold: 40,
  },
  'communication-style': {
    averageWeight: 0.3,
    alignmentWeight: 0.35,
    floorWeight: 0.35,
    highGapThreshold: 22,
    sharedStrengthThreshold: 72,
    sharedGrowthThreshold: 55,
    lowFloorThreshold: 45,
  },
  'gottman-four-horsemen': {
    averageWeight: 0.2,
    alignmentWeight: 0.35,
    floorWeight: 0.45,
    highGapThreshold: 18,
    sharedStrengthThreshold: 75,
    sharedGrowthThreshold: 58,
    lowFloorThreshold: 45,
  },
  'conflict-resolution': {
    averageWeight: 0.3,
    alignmentWeight: 0.3,
    floorWeight: 0.4,
    highGapThreshold: 22,
    sharedStrengthThreshold: 70,
    sharedGrowthThreshold: 55,
    lowFloorThreshold: 45,
  },
  'values-alignment': {
    averageWeight: 0.35,
    alignmentWeight: 0.3,
    floorWeight: 0.35,
    highGapThreshold: 25,
    sharedStrengthThreshold: 72,
    sharedGrowthThreshold: 55,
    lowFloorThreshold: 50,
  },
  'trust-vulnerability': {
    averageWeight: 0.25,
    alignmentWeight: 0.35,
    floorWeight: 0.4,
    highGapThreshold: 20,
    sharedStrengthThreshold: 72,
    sharedGrowthThreshold: 55,
    lowFloorThreshold: 45,
  },
  'intimacy-closeness': {
    averageWeight: 0.3,
    alignmentWeight: 0.35,
    floorWeight: 0.35,
    highGapThreshold: 22,
    sharedStrengthThreshold: 72,
    sharedGrowthThreshold: 55,
    lowFloorThreshold: 45,
  },
  'financial-values': {
    averageWeight: 0.3,
    alignmentWeight: 0.35,
    floorWeight: 0.35,
    highGapThreshold: 24,
    sharedStrengthThreshold: 72,
    sharedGrowthThreshold: 55,
    lowFloorThreshold: 45,
  },
  'shared-meaning': {
    averageWeight: 0.35,
    alignmentWeight: 0.3,
    floorWeight: 0.35,
    highGapThreshold: 24,
    sharedStrengthThreshold: 72,
    sharedGrowthThreshold: 55,
    lowFloorThreshold: 48,
  },
  'stress-coping': {
    averageWeight: 0.3,
    alignmentWeight: 0.3,
    floorWeight: 0.4,
    highGapThreshold: 22,
    sharedStrengthThreshold: 70,
    sharedGrowthThreshold: 55,
    lowFloorThreshold: 45,
  },
  'fun-personality': {
    averageWeight: 0.35,
    alignmentWeight: 0.3,
    floorWeight: 0.35,
    highGapThreshold: 22,
    sharedStrengthThreshold: 70,
    sharedGrowthThreshold: 54,
    lowFloorThreshold: 45,
  },
  // Ported from the former supabase/couple_assessment_seed.sql (that DB copy was never read; dropped in 011).
  'emotional-intelligence': {
    averageWeight: 0.33,
    alignmentWeight: 0.33,
    floorWeight: 0.34,
    highGapThreshold: 22,
    sharedStrengthThreshold: 72,
    sharedGrowthThreshold: 56,
    lowFloorThreshold: 45,
  },
  'sexual-compatibility': {
    // The lower score carries more weight: desire and safety both need to hold for each partner.
    averageWeight: 0.25,
    alignmentWeight: 0.35,
    floorWeight: 0.4,
    highGapThreshold: 20,
    sharedStrengthThreshold: 72,
    sharedGrowthThreshold: 55,
    lowFloorThreshold: 45,
  },
  'relationship-satisfaction': {
    averageWeight: 0.35,
    alignmentWeight: 0.3,
    floorWeight: 0.35,
    highGapThreshold: 22,
    sharedStrengthThreshold: 72,
    sharedGrowthThreshold: 55,
    lowFloorThreshold: 50,
  },
  'appreciation-gratitude': {
    averageWeight: 0.35,
    alignmentWeight: 0.3,
    floorWeight: 0.35,
    highGapThreshold: 20,
    sharedStrengthThreshold: 72,
    sharedGrowthThreshold: 55,
    lowFloorThreshold: 48,
  },
};

const couplePatterns = {
  'secure-foundation': {
    title: 'Secure Foundation',
    summary: 'You have a steady enough base that growth can happen without everything feeling fragile.',
    defaultAction: 'Keep doing what works and protect the habits that create safety.',
    defaultScript: 'We already have a solid base. Can we name what is working and make sure we keep doing it?',
    severity: 'low',
  },
  'pursue-withdraw': {
    title: 'Pursue / Withdraw',
    summary: 'One of you tends to move toward connection while the other protects with distance.',
    defaultAction: 'Slow the conversation down and make reassurance and space explicit.',
    defaultScript: 'When I get scared, I move toward you. When you get overwhelmed, you pull back. Can we talk about what helps each of us feel safe?',
    severity: 'high',
  },
  'repair-deficit': {
    title: 'Repair Deficit',
    summary: 'You may not be resolving conflict fully, even when the issues are small.',
    defaultAction: 'Add one repair step before the day ends.',
    defaultScript: 'Can we pause and repair this before we go to bed?',
    severity: 'high',
  },
  'values-drift': {
    title: 'Values Drift',
    summary: 'You may care about each other but be operating with different maps for the future.',
    defaultAction: 'Name the differences and build a shared operating plan.',
    defaultScript: 'We do not need to be identical, but we do need to understand what we are each building.',
    severity: 'moderate',
  },
  'trust-fragile': {
    title: 'Trust is Fragile',
    summary: 'One or both partners do not yet feel fully safe relying on the relationship.',
    defaultAction: 'Prioritize consistency, transparency, and follow-through.',
    defaultScript: 'Let’s make trust concrete by keeping small promises and checking in honestly.',
    severity: 'critical',
  },
  'reconnection-opportunity': {
    title: 'Reconnection Opportunity',
    summary: 'There is enough goodwill here to make meaningful progress quickly.',
    defaultAction: 'Use your strongest area to support the weakest one.',
    defaultScript: 'What is one thing we already do well that could help us with the thing that is hardest?',
    severity: 'moderate',
  },
};

const assessmentActions = {
  'love-languages': {
    stronger: 'Use each other’s preferred love language on purpose, not by accident.',
    weaker: 'The gap is usually fixed by small, repeated expressions of care in the language the other person actually feels.',
  },
  'attachment-style': {
    stronger: 'Use your secure moments to stabilize the relationship when anxiety or distance shows up.',
    weaker: 'The work here is reassurance, predictability, and saying what is happening instead of acting it out.',
  },
  'communication-style': {
    stronger: 'Lean on your best communication habits before hard topics get messy.',
    weaker: 'A small increase in clarity, listening, and validation will go a long way.',
  },
  'gottman-four-horsemen': {
    stronger: 'Protect your low-risk patterns and use them as the standard for conflict.',
    weaker: 'Any high-risk pattern should be met with immediate repair and lower intensity.',
  },
  'conflict-resolution': {
    stronger: 'Use calm, compromise, empathy, and repair as the default conflict rhythm.',
    weaker: 'If one of you shuts down or escalates, slow down and return to the point together.',
  },
  'values-alignment': {
    stronger: 'Turn your shared values into shared decisions.',
    weaker: 'Where you differ, name the difference without treating it like a threat.',
  },
  'trust-vulnerability': {
    stronger: 'Use the safer partner’s consistency to make honest disclosure easier.',
    weaker: 'Trust is built by tiny promises kept on time, over and over.',
  },
  'intimacy-closeness': {
    stronger: 'Build on the area that already feels safe and connected.',
    weaker: 'Close the gap by making closeness predictable and low-pressure.',
  },
  'financial-values': {
    stronger: 'Use your strong money habits to create a plan that both of you can trust.',
    weaker: 'Name the story behind the spending or saving habit before trying to fix it.',
  },
  'shared-meaning': {
    stronger: 'Use rituals and shared goals to keep the relationship feeling intentional.',
    weaker: 'Create one repeatable habit so the future feels built, not imagined.',
  },
  'stress-coping': {
    stronger: 'Let the stronger regulator lead the pause-and-reset rhythm.',
    weaker: 'Ask for help early instead of waiting until you are already flooded.',
  },
  'fun-personality': {
    stronger: 'Protect the places where laughter and play come naturally.',
    weaker: 'Schedule lightness instead of waiting for it to happen by chance.',
  },
  'emotional-intelligence': {
    stronger: 'Use the partner who regulates more easily to set the pace when feelings run high.',
    weaker: 'Practice naming one feeling out loud, and reflecting what you heard, before you respond.',
  },
  'sexual-compatibility': {
    stronger: 'Keep talking openly about what feels good and what feels safe, so closeness stays mutual.',
    weaker: 'Talk about desire and boundaries in a calm, neutral moment, without trying to fix anything yet.',
  },
  'relationship-satisfaction': {
    stronger: 'Name what the relationship does well so the good parts stay visible.',
    weaker: 'Pick one recurring decision to make together and one shared activity to put on the calendar.',
  },
  'appreciation-gratitude': {
    stronger: 'Use appreciation as a daily stabilizer, not just a response to special moments.',
    weaker: 'Make the gratitude concrete: name the act, the impact, and the feeling.',
  },
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function round(value, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function average(values) {
  const filtered = values.filter((value) => Number.isFinite(value));
  if (!filtered.length) return 0;
  return filtered.reduce((sum, value) => sum + value, 0) / filtered.length;
}

function getRuleConfig(assessmentId) {
  return {
    ...defaultRuleConfig,
    ...(coupleRuleConfigByAssessment[assessmentId] || {}),
  };
}

function getPattern(key) {
  return couplePatterns[key] || couplePatterns['reconnection-opportunity'];
}

function buildComparison(assessmentId, comparison, ruleConfig, leftProfile, rightProfile) {
  const averageScore = (comparison.leftScore + comparison.rightScore) / 2;
  const floorScore = Math.min(comparison.leftScore, comparison.rightScore);
  const alignmentScore = comparison.compatibility;
  const weightedScore = round(
    (averageScore * ruleConfig.averageWeight) +
      (alignmentScore * ruleConfig.alignmentWeight) +
      (floorScore * ruleConfig.floorWeight),
    1
  );
  const sharedStrength =
    floorScore >= ruleConfig.sharedStrengthThreshold && comparison.gap <= ruleConfig.highGapThreshold / 2;
  const sharedGrowth =
    floorScore <= ruleConfig.sharedGrowthThreshold || comparison.gap >= ruleConfig.highGapThreshold;
  const asymmetry =
    comparison.gap >= ruleConfig.highGapThreshold ||
    (comparison.leftScore >= 70 && comparison.rightScore <= 50) ||
    (comparison.rightScore >= 70 && comparison.leftScore <= 50);

  return {
    ...comparison,
    averageScore: round(averageScore, 1),
    floorScore: round(floorScore, 1),
    alignmentScore: round(alignmentScore, 1),
    weightedScore,
    sharedStrength,
    sharedGrowth,
    asymmetry,
    context: buildComparisonContext(assessmentId, comparison, leftProfile, rightProfile, sharedStrength, sharedGrowth),
  };
}

function buildComparisonContext(assessmentId, comparison, leftProfile, rightProfile, sharedStrength, sharedGrowth) {
  if (assessmentId === 'love-languages') {
    if (sharedStrength) return `You both score strongly on ${comparison.label}, so this is a reliable place to show care.`;
    if (sharedGrowth) return `You may be speaking different emotional dialects around ${comparison.label}.`;
    return `Use ${comparison.label} more intentionally so care lands the way it is meant to.`;
  }

  if (assessmentId === 'attachment-style') {
    const leftType = leftProfile.profileType?.key;
    const rightType = rightProfile.profileType?.key;
    return `Attachment patterns: ${leftType || 'unknown'} / ${rightType || 'unknown'}.`;
  }

  if (assessmentId === 'gottman-four-horsemen') {
    return comparison.floorScore < 55
      ? `The lower ${comparison.label} score suggests this area needs immediate repair.`
      : `This looks relatively healthy compared with the other conflict markers.`;
  }

  return sharedGrowth
    ? `${comparison.label} is a likely pressure point for the two of you.`
    : `${comparison.label} can be used as a strength if you keep practicing it.`;
}

function detectPattern(assessmentId, leftProfile, rightProfile, comparisons, ruleConfig) {
  const leftType = leftProfile.profileType?.key;
  const rightType = rightProfile.profileType?.key;
  const biggestGap = comparisons.slice().sort((a, b) => b.gap - a.gap)[0] || null;
  const lowestFloor = comparisons.slice().sort((a, b) => a.floorScore - b.floorScore)[0] || null;
  const averageScore = average(comparisons.map((item) => item.weightedScore || item.compatibility));

  if (assessmentId === 'attachment-style') {
    if ((leftType === 'anxious' && rightType === 'avoidant') || (leftType === 'avoidant' && rightType === 'anxious')) {
      return 'pursue-withdraw';
    }
    if (leftType === 'secure' && rightType === 'secure' && averageScore >= 70) {
      return 'secure-foundation';
    }
    if (leftType === 'fearful' || rightType === 'fearful' || (biggestGap && biggestGap.gap >= ruleConfig.highGapThreshold)) {
      return 'trust-fragile';
    }
  }

  if (assessmentId === 'gottman-four-horsemen' || assessmentId === 'conflict-resolution') {
    if (lowestFloor && lowestFloor.floorScore <= ruleConfig.lowFloorThreshold) {
      return 'repair-deficit';
    }
  }

  if (assessmentId === 'values-alignment' || assessmentId === 'shared-meaning' || assessmentId === 'financial-values') {
    if (biggestGap && biggestGap.gap >= ruleConfig.highGapThreshold) {
      return 'values-drift';
    }
  }

  if (assessmentId === 'trust-vulnerability' || assessmentId === 'intimacy-closeness' || assessmentId === 'sexual-compatibility') {
    if (lowestFloor && lowestFloor.floorScore <= ruleConfig.lowFloorThreshold) {
      return 'trust-fragile';
    }
  }

  if (averageScore >= 78 && !biggestGap) {
    return 'secure-foundation';
  }

  if (averageScore >= 65 && biggestGap && biggestGap.gap < ruleConfig.highGapThreshold) {
    return 'reconnection-opportunity';
  }

  return averageScore >= 60 ? 'reconnection-opportunity' : 'repair-deficit';
}

function buildSharedStrengths(comparisons, ruleConfig) {
  return comparisons
    .filter((item) => item.sharedStrength)
    .sort((a, b) => b.weightedScore - a.weightedScore)
    .map((item) => ({
      key: item.key,
      label: item.label,
      score: item.weightedScore,
      summary: `Both of you are strong in ${item.label}.`,
    }))
    .slice(0, 3);
}

function buildSharedGrowthAreas(comparisons, ruleConfig) {
  return comparisons
    .filter((item) => item.sharedGrowth || item.asymmetry)
    .sort((a, b) => b.gap - a.gap || a.floorScore - b.floorScore)
    .map((item) => ({
      key: item.key,
      label: item.label,
      gap: item.gap,
      floorScore: item.floorScore,
      summary: item.floorScore <= ruleConfig.lowFloorThreshold ? `This area needs active repair: ${item.label}.` : `You may need a better bridge in ${item.label}.`,
    }))
    .slice(0, 3);
}

function buildAsymmetryFlags(comparisons, ruleConfig) {
  return comparisons
    .filter((item) => item.asymmetry)
    .sort((a, b) => b.gap - a.gap)
    .map((item) => ({
      key: item.key,
      label: item.label,
      gap: item.gap,
      summary: `There is a big difference in ${item.label}.`,
    }))
    .slice(0, 3);
}

function buildActionPlan(assessmentId, patternKey, comparisons, ruleConfig) {
  const pattern = getPattern(patternKey);
  const topGap = comparisons.slice().sort((a, b) => b.gap - a.gap)[0] || null;
  const topStrength = comparisons.slice().sort((a, b) => b.weightedScore - a.weightedScore)[0] || null;
  const focusAction = assessmentActions[assessmentId] || null;

  const actions = [
    pattern.defaultAction,
    topGap
      ? `Focus first on ${topGap.label}: close the gap with one small habit or conversation.`
      : 'Choose one area to practice consistently this week.',
    topStrength
      ? `Use ${topStrength.label} as your leverage point while you work on the harder areas.`
      : null,
    focusAction?.weaker || null,
    focusAction?.stronger || null,
  ].filter(Boolean);

  return actions.slice(0, 4);
}

function buildConversationScripts(assessmentId, patternKey, comparisons, leftProfile, rightProfile) {
  const pattern = getPattern(patternKey);
  const biggestGap = comparisons.slice().sort((a, b) => b.gap - a.gap)[0] || null;
  const strongest = comparisons.slice().sort((a, b) => b.weightedScore - a.weightedScore)[0] || null;

  const scripts = {
    opening: pattern.defaultScript,
    repair: biggestGap
      ? `Can we talk about ${biggestGap.label} in a way that helps both of us feel heard?`
      : 'Can we talk about what would help us feel more connected this week?',
    appreciation: strongest
      ? `I really appreciate how you show up in ${strongest.label}. It helps me feel closer to you.`
      : 'One thing I appreciate about you is how you try, even when it is hard.',
  };

  if (assessmentId === 'love-languages') {
    scripts.repair = biggestGap
      ? `I think we may be showing care differently around ${biggestGap.label}. Can we each name what feels loving to us?`
      : scripts.repair;
    scripts.appreciation = `One way I feel loved by you is when you use my preferred love language. I want to do that for you too.`;
  }

  if (assessmentId === 'attachment-style') {
    scripts.repair = 'When one of us gets activated, can we name whether we need reassurance or space before we react?';
  }

  if (assessmentId === 'gottman-four-horsemen' || assessmentId === 'conflict-resolution') {
    scripts.repair = 'Can we pause, lower the intensity, and try again with one specific repair step?';
  }

  return scripts;
}

function buildCoupleSummary(assessmentId, patternKey, comparisons, leftProfile, rightProfile, ruleConfig) {
  const pattern = getPattern(patternKey);
  const strongest = comparisons.slice().sort((a, b) => b.weightedScore - a.weightedScore)[0] || null;
  const biggestGap = comparisons.slice().sort((a, b) => b.gap - a.gap)[0] || null;

  const base =
    assessmentId === 'attachment-style'
      ? `Your attachment dynamic looks like ${pattern.title.toLowerCase()}.`
      : `Your relationship pattern looks like ${pattern.title.toLowerCase()}.`;

  const strengthLine = strongest
    ? `Your clearest strength is ${strongest.label}.`
    : 'You have at least one area of shared strength to lean on.';

  const gapLine = biggestGap
    ? `Your biggest mismatch is ${biggestGap.label}, so that is the first place to build a bridge.`
    : 'Your scores are relatively even, so you can focus on consistent habits rather than a major mismatch.';

  return `${base} ${strengthLine} ${gapLine}`;
}

export function calculateCoupleAssessmentResult(assessmentId, leftInput, rightInput) {
  const base = calculateCompatibilityScore(assessmentId, leftInput, rightInput);
  const ruleConfig = getRuleConfig(assessmentId);
  const comparisons = base.comparisons.map((comparison) =>
    buildComparison(assessmentId, comparison, ruleConfig, base.leftProfile, base.rightProfile)
  );
  const weightedCompatibility = comparisons.length
    ? round(average(comparisons.map((item) => item.weightedScore)), 1)
    : round(base.compatibilityScore, 1);
  const patternKey = detectPattern(assessmentId, base.leftProfile, base.rightProfile, comparisons, ruleConfig);
  const pattern = getPattern(patternKey);
  const sharedStrengths = buildSharedStrengths(comparisons, ruleConfig);
  const sharedGrowthAreas = buildSharedGrowthAreas(comparisons, ruleConfig);
  const asymmetryFlags = buildAsymmetryFlags(comparisons, ruleConfig);
  const actionPlan = buildActionPlan(assessmentId, patternKey, comparisons, ruleConfig);
  const conversationScripts = buildConversationScripts(assessmentId, patternKey, comparisons, base.leftProfile, base.rightProfile);
  const coupleSummary = buildCoupleSummary(assessmentId, patternKey, comparisons, base.leftProfile, base.rightProfile, ruleConfig);

  return {
    scoringVersion: 'couple-v1',
    compatibilityScore: weightedCompatibility,
    rawCompatibilityScore: base.compatibilityScore,
    strongestMatch: base.strongestMatch,
    biggestGap: base.biggestGap,
    comparisons,
    dimensionComparisons: comparisons,
    partner1Profile: base.leftProfile,
    partner2Profile: base.rightProfile,
    sharedStrengths,
    sharedGrowthAreas,
    asymmetryFlags,
    relationshipPatternKey: patternKey,
    relationshipPatternTitle: pattern.title,
    relationshipPatternSummary: pattern.summary,
    relationshipPatternSeverity: pattern.severity,
    actionPlan,
    conversationScripts,
    coupleSummary,
    coupleScoreLabel: `${Math.round(weightedCompatibility)}%`,
  };
}

export function getCoupleRuleConfig(assessmentId) {
  return getRuleConfig(assessmentId);
}

// True when an assessment has its own couple weighting and action copy (not just the defaults).
export function hasCoupleRules(assessmentId) {
  return Boolean(coupleRuleConfigByAssessment[assessmentId] && assessmentActions[assessmentId]);
}

export function calculateCompatibilityScoreWithFeedback(assessmentId, leftInput, rightInput) {
  return calculateCoupleAssessmentResult(assessmentId, leftInput, rightInput);
}
