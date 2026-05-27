// Assessment question banks based on PRD

export const assessments = [
  {
    id: 'love-languages',
    name: 'Love Languages',
    framework: 'Five Love Languages (Chapman)',
    description: 'Discover how you and your partner prefer to give and receive love',
    estimatedTime: '8 min',
    questionsCount: 30,
    icon: '❤️',
  },
  {
    id: 'attachment-style',
    name: 'Attachment Style',
    framework: 'Attachment Theory (Bowlby, Ainsworth)',
    description: 'Understand your attachment patterns and how they shape your relationship',
    estimatedTime: '6 min',
    questionsCount: 20,
    icon: '🔗',
  },
  {
    id: 'communication-style',
    name: 'Communication Style',
    framework: 'Nonviolent Communication (Rosenberg)',
    description: 'Explore how you communicate needs, feelings, and boundaries',
    estimatedTime: '5 min',
    questionsCount: 15,
    icon: '💬',
  },
];

// Love Languages Questions (30 questions)
export const loveLanguagesQuestions = [
  { id: 1, text: 'I feel most loved when my partner...', type: 'choice', options: [
    { text: 'Tells me they love me', category: 'words' },
    { text: 'Gives me their undivided attention', category: 'time' },
    { text: 'Brings me thoughtful gifts', category: 'gifts' },
    { text: 'Does something helpful for me', category: 'acts' },
    { text: 'Gives me a warm hug or kiss', category: 'touch' },
  ]},
  { id: 2, text: 'I appreciate it most when my partner...', type: 'choice', options: [
    { text: 'Compliments me or says encouraging words', category: 'words' },
    { text: 'Plans special activities for just the two of us', category: 'time' },
    { text: 'Surprises me with meaningful presents', category: 'gifts' },
    { text: 'Takes care of tasks I usually handle', category: 'acts' },
    { text: 'Holds my hand or puts their arm around me', category: 'touch' },
  ]},
  { id: 3, text: 'What makes me feel closest to my partner is...', type: 'choice', options: [
    { text: 'Hearing "I love you" and other affirmations', category: 'words' },
    { text: 'Spending uninterrupted time together', category: 'time' },
    { text: 'Receiving symbols of their love', category: 'gifts' },
    { text: 'Watching them help me without being asked', category: 'acts' },
    { text: 'Physical closeness and affection', category: 'touch' },
  ]},
  { id: 4, text: 'I feel hurt when my partner...', type: 'choice', options: [
    { text: 'Criticizes me or uses harsh words', category: 'words' },
    { text: 'Is distracted when we\'re together', category: 'time' },
    { text: 'Forgets important occasions like birthdays', category: 'gifts' },
    { text: 'Doesn\'t help when I\'m overwhelmed', category: 'acts' },
    { text: 'Pulls away from physical touch', category: 'touch' },
  ]},
  { id: 5, text: 'I show love to my partner by...', type: 'choice', options: [
    { text: 'Expressing appreciation and admiration', category: 'words' },
    { text: 'Making time for meaningful conversations', category: 'time' },
    { text: 'Giving thoughtful gifts', category: 'gifts' },
    { text: 'Doing helpful things for them', category: 'acts' },
    { text: 'Initiating physical affection', category: 'touch' },
  ]},
];

// Attachment Style Questions (20 questions)
export const attachmentQuestions = [
  { id: 1, text: 'I find it easy to get emotionally close to my partner', type: 'likert', scale: 5 },
  { id: 2, text: 'I worry that my partner doesn\'t really love me', type: 'likert', scale: 5 },
  { id: 3, text: 'I\'m comfortable depending on my partner', type: 'likert', scale: 5 },
  { id: 4, text: 'I often feel my partner wants more closeness than I\'m comfortable with', type: 'likert', scale: 5 },
  { id: 5, text: 'I need a lot of reassurance that I am loved', type: 'likert', scale: 5 },
  { id: 6, text: 'I prefer not to show my partner how I feel deep down', type: 'likert', scale: 5 },
  { id: 7, text: 'I worry about being abandoned', type: 'likert', scale: 5 },
  { id: 8, text: 'I feel comfortable sharing my private thoughts with my partner', type: 'likert', scale: 5 },
  { id: 9, text: 'I find it difficult to allow myself to depend on my partner', type: 'likert', scale: 5 },
  { id: 10, text: 'I often wish my partner\'s feelings for me were as strong as mine for them', type: 'likert', scale: 5 },
];

// Communication Style Questions (15 questions)
export const communicationQuestions = [
  { id: 1, text: 'I clearly express my needs to my partner', type: 'likert', scale: 5 },
  { id: 2, text: 'I listen without interrupting when my partner is speaking', type: 'likert', scale: 5 },
  { id: 3, text: 'I use "I feel" statements rather than blaming', type: 'likert', scale: 5 },
  { id: 4, text: 'I can discuss difficult topics calmly', type: 'likert', scale: 5 },
  { id: 5, text: 'I validate my partner\'s feelings even when I disagree', type: 'likert', scale: 5 },
  { id: 6, text: 'I avoid bringing up past conflicts during current disagreements', type: 'likert', scale: 5 },
  { id: 7, text: 'I ask clarifying questions to understand my partner better', type: 'likert', scale: 5 },
  { id: 8, text: 'I take responsibility for my part in conflicts', type: 'likert', scale: 5 },
  { id: 9, text: 'I express appreciation for my partner regularly', type: 'likert', scale: 5 },
  { id: 10, text: 'I can compromise when our needs differ', type: 'likert', scale: 5 },
];