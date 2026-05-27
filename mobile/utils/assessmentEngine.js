import { allAssessments, assessmentQuestionBanks, calculateCategoryScores } from './allAssessments';

const genericQuestionPool = [
  'I feel understood by my partner.',
  'We can talk through hard things without shutting down.',
  'I trust my partner to be there for me.',
  'I feel appreciated in my relationship.',
  'We make time for each other.',
  'I can be myself with my partner.',
  'We recover well after disagreement.',
  'I feel emotionally safe with my partner.',
  'My partner listens when I speak.',
  'We work as a team when life is stressful.',
  'I feel warmth and affection in this relationship.',
  'We share a vision for our future.',
  'I can ask for what I need clearly.',
  'My partner responds with care when I am upset.',
  'We have rituals that make us feel connected.',
  'We laugh together often.',
  'We respect each other’s boundaries.',
  'We feel like a team.',
];

export const defaultAssessmentBands = [
  {
    key: 'needs-attention',
    minScore: 0,
    maxScore: 39,
    title: 'Needs attention',
    summary: 'This area needs more care, consistency, and conversation.',
    recommendation: 'Pick one small habit and repeat it daily for the next week.',
  },
  {
    key: 'developing',
    minScore: 40,
    maxScore: 59,
    title: 'Developing',
    summary: 'You have some good foundations, but the pattern is still uneven.',
    recommendation: 'Focus on one recurring moment where you can do a little better.',
  },
  {
    key: 'strong',
    minScore: 60,
    maxScore: 79,
    title: 'Strong',
    summary: 'This looks solid and generally healthy.',
    recommendation: 'Protect what is working and keep practicing the habits that got you here.',
  },
  {
    key: 'exceptional',
    minScore: 80,
    maxScore: 100,
    title: 'Exceptional',
    summary: 'This is a genuine strength in your relationship.',
    recommendation: 'Keep reinforcing it and use it as a model for the rest of your relationship.',
  },
];

export const assessmentScoringConfigs = {
  'love-languages': {
    mode: 'preference',
    dimensions: [
      { key: 'words', label: 'Words of Affirmation', direction: 'positive' },
      { key: 'time', label: 'Quality Time', direction: 'positive' },
      { key: 'gifts', label: 'Receiving Gifts', direction: 'positive' },
      { key: 'acts', label: 'Acts of Service', direction: 'positive' },
      { key: 'touch', label: 'Physical Touch', direction: 'positive' },
    ],
    bands: defaultAssessmentBands,
  },
  'attachment-style': {
    mode: 'quadrant',
    dimensions: [
      { key: 'anxiety', label: 'Attachment Anxiety', direction: 'risk' },
      { key: 'avoidance', label: 'Attachment Avoidance', direction: 'risk' },
    ],
    bands: defaultAssessmentBands,
  },
  'communication-style': {
    mode: 'profile',
    dimensions: [
      { key: 'expression', label: 'Expression', direction: 'positive' },
      { key: 'listening', label: 'Listening', direction: 'positive' },
      { key: 'validation', label: 'Validation', direction: 'positive' },
      { key: 'accountability', label: 'Accountability', direction: 'positive' },
    ],
    bands: defaultAssessmentBands,
  },
  'gottman-four-horsemen': {
    mode: 'risk-profile',
    dimensions: [
      { key: 'criticism', label: 'Criticism', direction: 'risk' },
      { key: 'contempt', label: 'Contempt', direction: 'risk' },
      { key: 'defensiveness', label: 'Defensiveness', direction: 'risk' },
      { key: 'stonewalling', label: 'Stonewalling', direction: 'risk' },
    ],
    bands: defaultAssessmentBands,
  },
  'conflict-resolution': {
    mode: 'mixed-profile',
    dimensions: [
      { key: 'avoidance', label: 'Avoidance', direction: 'risk' },
      { key: 'composure', label: 'Composure', direction: 'positive' },
      { key: 'compromise', label: 'Compromise', direction: 'positive' },
      { key: 'empathy', label: 'Empathy', direction: 'positive' },
      { key: 'repair', label: 'Repair', direction: 'positive' },
    ],
    bands: defaultAssessmentBands,
  },
  'values-alignment': {
    mode: 'profile',
    dimensions: [
      { key: 'family', label: 'Family', direction: 'positive' },
      { key: 'finance', label: 'Finance', direction: 'positive' },
      { key: 'spirituality', label: 'Spirituality', direction: 'positive' },
      { key: 'lifestyle', label: 'Lifestyle', direction: 'positive' },
      { key: 'relationships', label: 'Relationships', direction: 'positive' },
      { key: 'goals', label: 'Goals', direction: 'positive' },
    ],
    bands: defaultAssessmentBands,
  },
  'emotional-intelligence': {
    mode: 'profile',
    dimensions: [
      { key: 'selfAwareness', label: 'Self-awareness', direction: 'positive' },
      { key: 'selfRegulation', label: 'Self-regulation', direction: 'positive' },
      { key: 'empathy', label: 'Empathy', direction: 'positive' },
      { key: 'socialSkills', label: 'Social Skills', direction: 'positive' },
    ],
    bands: defaultAssessmentBands,
  },
  'intimacy-closeness': {
    mode: 'profile',
    dimensions: [
      { key: 'emotional', label: 'Emotional Intimacy', direction: 'positive' },
      { key: 'physical', label: 'Physical Intimacy', direction: 'positive' },
      { key: 'intellectual', label: 'Intellectual Intimacy', direction: 'positive' },
    ],
    bands: defaultAssessmentBands,
  },
  'trust-vulnerability': {
    mode: 'profile',
    dimensions: [
      { key: 'trust', label: 'Trust', direction: 'positive' },
      { key: 'vulnerability', label: 'Vulnerability', direction: 'positive' },
      { key: 'safety', label: 'Safety', direction: 'positive' },
    ],
    bands: defaultAssessmentBands,
  },
  'financial-values': {
    mode: 'profile',
    dimensions: [
      { key: 'attitudes', label: 'Money Attitudes', direction: 'positive' },
      { key: 'communication', label: 'Money Communication', direction: 'positive' },
      { key: 'goals', label: 'Financial Goals', direction: 'positive' },
      { key: 'habits', label: 'Money Habits', direction: 'positive' },
    ],
    bands: defaultAssessmentBands,
  },
  'sexual-compatibility': {
    mode: 'profile',
    dimensions: [
      { key: 'desire', label: 'Desire', direction: 'positive' },
      { key: 'communication', label: 'Sexual Communication', direction: 'positive' },
      { key: 'boundaries', label: 'Boundaries', direction: 'positive' },
      { key: 'satisfaction', label: 'Satisfaction', direction: 'positive' },
    ],
    bands: defaultAssessmentBands,
  },
  'shared-meaning': {
    mode: 'profile',
    dimensions: [
      { key: 'rituals', label: 'Rituals', direction: 'positive' },
      { key: 'goals', label: 'Goals', direction: 'positive' },
      { key: 'roles', label: 'Roles', direction: 'positive' },
      { key: 'legacy', label: 'Legacy', direction: 'positive' },
      { key: 'growth', label: 'Growth', direction: 'positive' },
    ],
    bands: defaultAssessmentBands,
  },
  'relationship-satisfaction': {
    mode: 'profile',
    dimensions: [
      { key: 'consensus', label: 'Consensus', direction: 'positive' },
      { key: 'satisfaction', label: 'Satisfaction', direction: 'positive' },
      { key: 'cohesion', label: 'Cohesion', direction: 'positive' },
    ],
    bands: defaultAssessmentBands,
  },
  'stress-coping': {
    mode: 'profile',
    dimensions: [
      { key: 'individual', label: 'Individual Coping', direction: 'positive' },
      { key: 'partner', label: 'Partner Support', direction: 'positive' },
      { key: 'team', label: 'Team Coping', direction: 'positive' },
    ],
    bands: defaultAssessmentBands,
  },
  'fun-personality': {
    mode: 'profile',
    dimensions: [
      { key: 'playfulness', label: 'Playfulness', direction: 'positive' },
      { key: 'activities', label: 'Shared Activities', direction: 'positive' },
      { key: 'humor', label: 'Humor', direction: 'positive' },
      { key: 'adventure', label: 'Adventure', direction: 'positive' },
    ],
    bands: defaultAssessmentBands,
  },
  'appreciation-gratitude': {
    mode: 'profile',
    dimensions: [
      { key: 'expression', label: 'Expression', direction: 'positive' },
      { key: 'recognition', label: 'Recognition', direction: 'positive' },
      { key: 'positivity', label: 'Positivity', direction: 'positive' },
    ],
    bands: defaultAssessmentBands,
  },
};

export const dimensionActionMap = {
  words: 'Say one specific appreciation out loud every day.',
  time: 'Schedule one short no-phone moment together this week.',
  gifts: 'Leave one small, thoughtful token or note.',
  acts: 'Take one task off your partner’s plate without being asked.',
  touch: 'Offer steady physical affection in a way that feels warm and safe.',
  anxiety: 'Ask for reassurance directly instead of hinting or testing.',
  avoidance: 'Share one feeling you usually keep private.',
  expression: 'Use one clear I-statement in your next hard conversation.',
  listening: 'Paraphrase before you respond.',
  validation: 'Name your partner’s feeling before offering a solution.',
  accountability: 'Own your part first when tension shows up.',
  criticism: 'Replace blame with a concrete request.',
  contempt: 'Cut sarcasm and disrespect; stay kind and specific.',
  defensiveness: 'Pause and name your part before explaining yourself.',
  stonewalling: 'Take a brief pause, then return to the conversation.',
  composure: 'Slow the moment down and keep your tone steady.',
  compromise: 'Look for a third option that gives both of you something.',
  empathy: 'Reflect what your partner may be feeling before you answer.',
  repair: 'Practice a repair attempt: apologize, soften, or reconnect quickly.',
  family: 'Talk about one family value you want to protect.',
  finance: 'Discuss one money choice without making it a fight.',
  spirituality: 'Share what gives your life meaning and grounding.',
  lifestyle: 'Name the routines that make your life feel manageable.',
  relationships: 'Notice how your relationship affects the rest of your life.',
  goals: 'Pick one shared goal and define the next small step.',
  selfAwareness: 'Name the feeling before reacting to it.',
  selfRegulation: 'Pause before responding when you are activated.',
  socialSkills: 'Practice one clear, calm communication moment.',
  emotional: 'Share one vulnerable feeling instead of staying guarded.',
  physical: 'Create a small ritual of safe physical closeness.',
  intellectual: 'Ask one deeper question and listen for the real answer.',
  trust: 'Keep one promise you make this week.',
  vulnerability: 'Say one honest thing you usually leave unsaid.',
  safety: 'Create one moment of emotional safety on purpose.',
  attitudes: 'Notice the money story behind your reaction.',
  communication: 'Discuss money or sex with the same clarity you want to receive.',
  boundaries: 'State one boundary clearly and kindly.',
  satisfaction: 'Say what would make this area feel better, not just what is wrong.',
  rituals: 'Create one repeatable ritual you can both keep.',
  roles: 'Talk about who does what without assuming.',
  legacy: 'Name the kind of relationship you want to be remembered for.',
  growth: 'Choose one habit that helps you both grow.',
  consensus: 'Identify one thing you already agree on and build from there.',
  cohesion: 'Do one thing this week that makes you feel like a unit.',
  individual: 'Protect your own regulation so stress does not spill everywhere.',
  partner: 'Ask for support clearly when you need it.',
  team: 'Choose one stress routine to practice together.',
  playfulness: 'Make room for one silly, light moment this week.',
  activities: 'Plan one shared activity you will actually keep.',
  humor: 'Let yourself laugh together, even in imperfect moments.',
  adventure: 'Pick one small adventure and put it on the calendar.',
  recognition: 'Notice one specific thing your partner did well today.',
  positivity: 'End one day this week by naming three good things.',
  overall: 'Repeat the habit that best supports this relationship.',
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

function normalizeLikert(rawScore) {
  if (!rawScore) return 0;
  return clamp(((rawScore - 1) / 4) * 100, 0, 100);
}

function getConfig(assessmentId) {
  return assessmentScoringConfigs[assessmentId] || {
    mode: 'profile',
    dimensions: [{ key: 'overall', label: 'Overall', direction: 'positive' }],
    bands: defaultAssessmentBands,
  };
}

function getBand(score, bands = defaultAssessmentBands) {
  return bands.find((band) => score >= band.minScore && score <= band.maxScore) || bands[bands.length - 1];
}

function buildDimensionScore(dimension, rawScore) {
  const rawPercent = normalizeLikert(rawScore);
  const score = dimension.direction === 'risk' ? 100 - rawPercent : rawPercent;
  return {
    key: dimension.key,
    label: dimension.label,
    direction: dimension.direction,
    rawScore: round(rawScore || 0, 2),
    rawPercent: round(rawPercent, 1),
    score: round(score, 1),
  };
}

function attachmentQuadrant(anxietyScore, avoidanceScore) {
  const anxiousHigh = anxietyScore >= 3;
  const avoidantHigh = avoidanceScore >= 3;

  if (!anxiousHigh && !avoidantHigh) {
    return {
      key: 'secure',
      title: 'Secure',
      summary: 'You generally feel safe with closeness, independence, and emotional connection.',
      recommendation: 'Keep reinforcing the habits that create safety and consistency.',
    };
  }

  if (anxiousHigh && !avoidantHigh) {
    return {
      key: 'anxious',
      title: 'Anxious',
      summary: 'You want closeness deeply, and uncertainty can feel especially loud.',
      recommendation: 'Practice direct reassurance and self-soothing before you spiral.',
    };
  }

  if (!anxiousHigh && avoidantHigh) {
    return {
      key: 'avoidant',
      title: 'Avoidant',
      summary: 'You may value independence strongly and feel safer with emotional space.',
      recommendation: 'Practice sharing more of your inner world before you pull away.',
    };
  }

  return {
    key: 'fearful',
    title: 'Fearful',
    summary: 'You want closeness but may also feel guarded or unsure about safety.',
    recommendation: 'Focus on predictable repair, patience, and small acts of trust-building.',
  };
}

function unique(list) {
  return [...new Set(list)];
}

function buildActions(dimensionScores) {
  const growth = dimensionScores
    .slice()
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map((dimension) => dimensionActionMap[dimension.key] || dimensionActionMap.overall)
    .filter(Boolean);

  return unique(growth);
}

function buildStrengths(dimensionScores) {
  return dimensionScores
    .slice()
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map((dimension) => ({
      key: dimension.key,
      label: dimension.label,
      score: dimension.score,
      summary: dimension.score >= 80 ? 'Exceptional' : dimension.score >= 60 ? 'Strong' : 'Emerging',
    }));
}

function buildGrowthAreas(dimensionScores) {
  return dimensionScores
    .slice()
    .sort((a, b) => a.score - b.score)
    .slice(0, 2)
    .map((dimension) => ({
      key: dimension.key,
      label: dimension.label,
      score: dimension.score,
      summary: dimension.score >= 80 ? 'Keep it up' : dimension.score >= 60 ? 'Solid but worth reinforcing' : 'Needs attention',
    }));
}

function buildSummary(assessmentId, profile, assessment) {
  if (assessmentId === 'attachment-style' && profile.profileType) {
    return `${profile.profileType.title}. ${profile.profileType.summary}`;
  }

  const top = profile.topDimensions[0];
  const second = profile.topDimensions[1];

  if (assessmentId === 'love-languages') {
    const names = profile.topDimensions.map((dimension) => dimension.label).join(' and ');
    return `Your strongest love languages are ${names}.`;
  }

  if (assessmentId === 'gottman-four-horsemen') {
    return `Your healthiest patterns are strongest in ${top?.label || 'your relationship'}${second ? ` and ${second.label}` : ''}.`;
  }

  if (assessment?.resultDescription) {
    return `${assessment.resultDescription} Your strongest areas are ${top?.label || 'your top dimension'}${second ? ` and ${second.label}` : ''}.`;
  }

  return `Your strongest areas are ${top?.label || 'your top dimension'}${second ? ` and ${second.label}` : ''}.`;
}

function buildProfileType(assessmentId, dimensionScores) {
  if (assessmentId !== 'attachment-style') return null;
  const anxiety = dimensionScores.find((dimension) => dimension.key === 'anxiety')?.rawScore || 0;
  const avoidance = dimensionScores.find((dimension) => dimension.key === 'avoidance')?.rawScore || 0;
  return attachmentQuadrant(anxiety, avoidance);
}

function buildProfileFromRawScores(assessmentId, storedScores = {}) {
  const assessment = allAssessments.find((item) => item.id === assessmentId) || null;
  const config = getConfig(assessmentId);
  const rawCategoryScores = storedScores.rawCategoryScores || storedScores;
  const dimensionScores = config.dimensions.map((dimension) =>
    buildDimensionScore(dimension, rawCategoryScores[dimension.key] || 0)
  );
  const overallScore = round(
    storedScores.overallScore ?? average(dimensionScores.map((dimension) => dimension.score)),
    1
  );
  const rawAverage = round(
    storedScores.rawAverage ?? average(dimensionScores.map((dimension) => dimension.rawScore)),
    2
  );
  const band = storedScores.band || getBand(overallScore, config.bands);
  const profileType = storedScores.profileType || buildProfileType(assessmentId, dimensionScores);
  const topDimensions = storedScores.topDimensions || dimensionScores.slice().sort((a, b) => b.score - a.score).slice(0, 2);
  const strengths = storedScores.strengths || buildStrengths(dimensionScores);
  const growthAreas = storedScores.growthAreas || buildGrowthAreas(dimensionScores);
  const recommendations = storedScores.recommendations || buildActions(dimensionScores);
  const summary = storedScores.summary || buildSummary(assessmentId, { topDimensions, profileType }, assessment);

  return {
    assessmentId,
    assessmentName: assessment?.name || assessmentId,
    framework: assessment?.framework || '',
    mode: storedScores.mode || config.mode,
    questionCount: storedScores.questionCount || (assessmentQuestionBanks[assessmentId] || []).length,
    answeredCount: storedScores.answeredCount || 0,
    rawCategoryScores,
    dimensionScores,
    overallScore,
    rawAverage,
    band,
    profileType,
    topDimensions,
    strengths,
    growthAreas,
    recommendations,
    summary,
    resultDescription: assessment?.resultDescription || '',
  };
}

function normalizeProfileInput(assessmentId, input) {
  if (input?.dimensionScores) return input;
  if (input?.rawCategoryScores || input?.overallScore !== undefined || input?.summary) {
    return buildProfileFromRawScores(assessmentId, input);
  }
  return calculateAssessmentProfile(assessmentId, input || {});
}

export function generateGenericQuestions(count) {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    text: genericQuestionPool[index % genericQuestionPool.length],
    type: 'likert',
    scale: 5,
    category: 'overall',
    reverse: false,
  }));
}

export function calculateAssessmentProfile(assessmentId, answers = {}) {
  const assessment = allAssessments.find((item) => item.id === assessmentId) || null;
  const config = getConfig(assessmentId);
  const questions = assessmentQuestionBanks[assessmentId] || [];
  const rawCategoryScores = calculateCategoryScores(assessmentId, answers);

  const dimensionScores = config.dimensions.map((dimension) =>
    buildDimensionScore(dimension, rawCategoryScores[dimension.key] || 0)
  );

  const overallScore = round(average(dimensionScores.map((dimension) => dimension.score)), 1);
  const rawAverage = round(average(dimensionScores.map((dimension) => dimension.rawScore)), 2);
  const band = getBand(overallScore, config.bands);
  const profileType = buildProfileType(assessmentId, dimensionScores);
  const topDimensions = dimensionScores.slice().sort((a, b) => b.score - a.score).slice(0, 2);
  const strengths = buildStrengths(dimensionScores);
  const growthAreas = buildGrowthAreas(dimensionScores);
  const recommendations = buildActions(dimensionScores);
  const summary = buildSummary(assessmentId, { topDimensions, profileType }, assessment);

  return {
    assessmentId,
    assessmentName: assessment?.name || assessmentId,
    framework: assessment?.framework || '',
    mode: config.mode,
    questionCount: questions.length,
    answeredCount: Object.values(answers).filter((value) => value !== undefined && value !== null && value !== '').length,
    rawCategoryScores,
    dimensionScores,
    overallScore,
    rawAverage,
    band,
    profileType,
    topDimensions,
    strengths,
    growthAreas,
    recommendations,
    summary,
    resultDescription: assessment?.resultDescription || '',
  };
}

export function calculateCompatibilityScore(assessmentId, leftInput, rightInput) {
  const leftProfile = normalizeProfileInput(assessmentId, leftInput);
  const rightProfile = normalizeProfileInput(assessmentId, rightInput);
  const leftMap = new Map(leftProfile.dimensionScores.map((dimension) => [dimension.key, dimension]));
  const rightMap = new Map(rightProfile.dimensionScores.map((dimension) => [dimension.key, dimension]));
  const keys = [...new Set([...leftMap.keys(), ...rightMap.keys()])];

  const comparisons = keys
    .map((key) => {
      const left = leftMap.get(key);
      const right = rightMap.get(key);
      if (!left || !right) return null;
      const gap = Math.abs(left.score - right.score);
      const compatibility = clamp(100 - gap, 0, 100);
      return {
        key,
        label: left.label,
        leftScore: left.score,
        rightScore: right.score,
        gap: round(gap, 1),
        compatibility: round(compatibility, 1),
      };
    })
    .filter(Boolean);

  const compatibilityScore = comparisons.length
    ? round(average(comparisons.map((comparison) => comparison.compatibility)), 1)
    : round(average([leftProfile.overallScore, rightProfile.overallScore]), 1);

  const strongestMatch = comparisons.slice().sort((a, b) => b.compatibility - a.compatibility)[0] || null;
  const biggestGap = comparisons.slice().sort((a, b) => b.gap - a.gap)[0] || null;

  return {
    assessmentId,
    compatibilityScore,
    strongestMatch,
    biggestGap,
    comparisons,
    leftProfile,
    rightProfile,
  };
}

export function getAssessmentScoringConfig(assessmentId) {
  return getConfig(assessmentId);
}
