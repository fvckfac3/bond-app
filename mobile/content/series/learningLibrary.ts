import type { SeriesModule } from './seriesContent';

export type LearningSeriesKey =
  | 'connection-series'
  | 'communication-series'
  | 'conflict-repair-series'
  | 'trust-vulnerability-series'
  | 'intimacy-series'
  | 'life-growth-series'
  | 'health-wellness-series'
  | 'key-concepts-series'
  | 'repair-and-communication';

interface SeriesConfig {
  title: string;
  summary: string;
  icon: string;
  intro: string;
  focus: string;
  researchText: string;
  researchSource: string;
  researchYear: number;
  practiceLabel: string;
  practiceSteps: string[];
  exampleScenario: string;
  exampleAnalysis: string;
  reflectionQuestion: string;
  reflectionFollowUp: string;
  conclusion: string;
}

interface TopicListItem {
  title: string;
  duration?: string;
}

const seriesConfig: Record<LearningSeriesKey, SeriesConfig> = {
  'connection-series': {
    title: 'Connection',
    summary: 'The habits that help partners feel close, responsive, and emotionally present.',
    icon: '✨',
    intro: 'Connection is the felt experience of being noticed and met. It grows through small, repeated moments of turning toward each other.',
    focus: 'how couples notice bids, respond with warmth, and keep closeness alive even during busy or stressful seasons',
    researchText: 'Connection is strengthened by responsiveness, positive emotion, and repeated moments of emotional attunement.',
    researchSource: 'Gottman research on bids and emotional connection',
    researchYear: 2015,
    practiceLabel: 'Connection practice',
    practiceSteps: [
      'Notice one bid your partner made today',
      'Answer it with a clear and warm response',
      'Name one thing that made you feel close',
    ],
    exampleScenario: 'One partner is tired after work and the other wants attention right away.',
    exampleAnalysis: 'A successful response does not force intensity. It makes the bid visible and answers it in a way the other person can actually receive.',
    reflectionQuestion: 'What does closeness feel like when it is happening naturally?',
    reflectionFollowUp: 'What small action would make this feel easier to repeat?',
    conclusion: 'Connection becomes durable when attention, warmth, and follow-through happen often enough to feel ordinary.',
  },
  'communication-series': {
    title: 'Communication',
    summary: 'How couples speak, listen, and make hard conversations easier to handle.',
    icon: '💬',
    intro: 'Communication is not just speech. It is the process of helping another person understand what is true for you without making them go on defense.',
    focus: 'how couples say difficult things in ways that reduce threat and increase the chance of being understood',
    researchText: 'Clear communication works best when it lowers defensiveness, names needs directly, and keeps the conversation emotionally usable.',
    researchSource: 'Nonviolent Communication and Gottman communication research',
    researchYear: 2015,
    practiceLabel: 'Communication practice',
    practiceSteps: [
      'Say what happened without globalizing it',
      'Name the feeling underneath the reaction',
      'Make one specific request',
    ],
    exampleScenario: 'A partner asks for help but sounds frustrated.',
    exampleAnalysis: 'The point is not to be perfectly polished. The point is to keep the message clear enough that the other person can hear the need instead of only the tone.',
    reflectionQuestion: 'What makes it hard for you to stay open while talking?',
    reflectionFollowUp: 'What would help you feel safer without shutting the topic down?',
    conclusion: 'Communication improves when both people aim for clarity, timing, and emotional steadiness instead of simply talking more.',
  },
  'conflict-repair-series': {
    title: 'Conflict and Repair',
    summary: 'How disagreement stays workable when repair happens early and respectfully.',
    icon: '🛠️',
    intro: 'Conflict is not the enemy. Disconnection is. The key is whether a rupture gets repaired before it hardens into distance.',
    focus: 'how couples handle disagreement, recovery, and the moments that determine whether a fight becomes damage',
    researchText: 'Repair, de-escalation, and respectful conflict behavior are stronger predictors of long-term stability than the absence of disagreement.',
    researchSource: 'Gottman research on repair and conflict patterns',
    researchYear: 2015,
    practiceLabel: 'Repair practice',
    practiceSteps: [
      'Pause before the conversation turns sharp',
      'Name one thing you own',
      'Offer one specific repair move',
    ],
    exampleScenario: 'A small complaint becomes a bigger argument than intended.',
    exampleAnalysis: 'Repair works when it happens before both people feel cornered. The quicker the reset, the more likely the relationship stays intact.',
    reflectionQuestion: 'What usually makes a conflict get bigger in your relationship?',
    reflectionFollowUp: 'What would a faster repair look like for you both?',
    conclusion: 'Healthy conflict is not conflict-free; it is recovery-rich.',
  },
  'trust-vulnerability-series': {
    title: 'Trust and Vulnerability',
    summary: 'How safety grows through consistency, honesty, and paced openness.',
    icon: '🛡️',
    intro: 'Trust is a pattern of evidence. Vulnerability is the brave act of giving that evidence somewhere to land.',
    focus: 'how people build safety through predictability, reliability, and the courage to disclose what matters',
    researchText: 'Trust strengthens through repeated follow-through and respectful handling of sensitive information.',
    researchSource: 'Attachment theory and trust repair research',
    researchYear: 2007,
    practiceLabel: 'Trust practice',
    practiceSteps: [
      'Choose one promise you can keep reliably',
      'Follow through without reminders',
      'Notice what changes when trust gets more evidence',
    ],
    exampleScenario: 'One partner wants to share something vulnerable but is unsure how it will be received.',
    exampleAnalysis: 'Trust grows when the response is steady, non-shaming, and consistent over time rather than dramatic once.',
    reflectionQuestion: 'What helps you decide whether it is safe to open up?',
    reflectionFollowUp: 'What behavior would make trust easier to offer?',
    conclusion: 'Trust gets built in ordinary moments, not just in crisis.',
  },
  'intimacy-series': {
    title: 'Intimacy',
    summary: 'How emotional, physical, intellectual, and shared-time closeness all matter.',
    icon: '💕',
    intro: 'Intimacy is the experience of being known and chosen. It is broader than sex, and it deepens when multiple kinds of closeness are nourished.',
    focus: 'how couples create closeness through touch, conversation, shared rituals, desire, and emotional safety',
    researchText: 'Intimacy deepens when partners understand the different forms of closeness and create routines that protect them.',
    researchSource: 'Relationship science on closeness, desire, and bonding',
    researchYear: 2016,
    practiceLabel: 'Intimacy practice',
    practiceSteps: [
      'Name one form of closeness that matters most to you',
      'Ask your partner what helps that form feel safe',
      'Repeat one small ritual this week',
    ],
    exampleScenario: 'One partner wants more affection while the other feels pressure.',
    exampleAnalysis: 'Closeness improves when partners trade pressure for pacing and make safety easier to feel.',
    reflectionQuestion: 'Which kind of closeness do you want more of right now?',
    reflectionFollowUp: 'What makes closeness feel invited rather than forced?',
    conclusion: 'Intimacy grows when the relationship makes room for feeling seen in more than one way.',
  },
  'life-growth-series': {
    title: 'Life and Growth',
    summary: 'How everyday systems like parenting, work, habits, and distance shape the relationship.',
    icon: '🌿',
    intro: 'A couple does not only live inside emotions. They also live inside schedules, roles, responsibilities, and changing seasons.',
    focus: 'how real-life pressures like parenting, family culture, work, habits, and distance affect the bond',
    researchText: 'Shared systems and explicit expectations reduce friction when life gets more complex.',
    researchSource: 'Family systems and relationship adaptation research',
    researchYear: 2014,
    practiceLabel: 'Growth practice',
    practiceSteps: [
      'Choose one life system that needs more clarity',
      'Name what is currently working',
      'Make one small adjustment that both people can sustain',
    ],
    exampleScenario: 'Busy schedules start to crowd out the relationship.',
    exampleAnalysis: 'This is usually not a motivation problem. It is often a system design problem.',
    reflectionQuestion: 'What part of daily life most affects your relationship right now?',
    reflectionFollowUp: 'What small change would make that easier to handle together?',
    conclusion: 'Growth becomes relational when the couple treats ordinary life as part of the work, not a distraction from it.',
  },
  'health-wellness-series': {
    title: 'Health and Wellness',
    summary: 'How stress, mood, mental health, and money affect connection and stability.',
    icon: '🫶',
    intro: 'Relationships do not happen outside of mental health, stress, or resources. They are shaped by all three every day.',
    focus: 'how anxiety, depression, postpartum changes, illness, stress, acceptance, and money pressure change the emotional climate of the relationship',
    researchText: 'Stress and mental health strongly influence how available, patient, and regulated partners can be with each other.',
    researchSource: 'ACT-informed relationship care and stress research',
    researchYear: 2018,
    practiceLabel: 'Wellness practice',
    practiceSteps: [
      'Name the pressure out loud instead of letting it stay vague',
      'Ask what support would actually help',
      'Protect one shared routine that restores stability',
    ],
    exampleScenario: 'One partner is overwhelmed and the other thinks they are being shut out.',
    exampleAnalysis: 'The issue is often capacity, not care. The better response is to understand the strain before interpreting the behavior.',
    reflectionQuestion: 'What outside pressure is shaping your relationship most right now?',
    reflectionFollowUp: 'What would support look like if it were concrete and realistic?',
    conclusion: 'Wellness becomes relational when both partners can name stress honestly and respond with steadiness.',
  },
  'key-concepts-series': {
    title: 'Key Concepts',
    summary: 'The methods and pitfalls that appear across relationship science and real-life practice.',
    icon: '📎',
    intro: 'These are the recurring ideas that help couples make sense of patterns, language, and repair across the whole app.',
    focus: 'the methods that strengthen connection and the pitfalls that quietly damage it if left unchecked',
    researchText: 'Across relationship research, a few recurring concepts explain a large share of what helps and hurts couples.',
    researchSource: 'Integrated relationship science and communication research',
    researchYear: 2016,
    practiceLabel: 'Concept practice',
    practiceSteps: [
      'Pick one concept that matters most for your relationship',
      'Write what it looks like when it goes well',
      'Write what it looks like when it goes poorly',
    ],
    exampleScenario: 'A couple keeps repeating the same misunderstanding in different forms.',
    exampleAnalysis: 'Understanding the concept underneath the argument is what turns repetition into learning.',
    reflectionQuestion: 'Which concept has the most power to change your relationship right now?',
    reflectionFollowUp: 'What would it mean to practice that concept this week?',
    conclusion: 'Key concepts work best when they become a shared vocabulary for noticing what is happening and what to do next.',
  },
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function buildModule(seriesKey: LearningSeriesKey, index: number, topic: TopicListItem): SeriesModule {
  const config = seriesConfig[seriesKey];
  const topicSlug = slugify(topic.title);
  const duration = topic.duration || (seriesKey === 'life-growth-series' ? '11 min' : seriesKey === 'health-wellness-series' ? '12 min' : '10 min');
  const topicLead = topic.title.toLowerCase();

  return {
    id: `${seriesKey}-${topicSlug}`,
    title: topic.title,
    description: `A practical guide to ${topicLead} within ${config.title.toLowerCase()}.`,
    duration,
    content: {
      introduction: `${config.intro} This lesson looks at ${topicLead} as a usable relationship skill, not just an abstract idea. It is about making the pattern visible so partners can work with it instead of guessing at it.`,
      sections: [
        {
          title: `What ${topic.title} means`,
          body: `${topic.title} is one of the most useful ways to understand ${config.focus}. It gives couples a shared language for what is happening, what tends to trigger it, and what a steadier response looks like.

When people can name the pattern clearly, they stop arguing with shadows and start dealing with the real issue.`,
          research: {
            text: config.researchText,
            source: config.researchSource,
            year: config.researchYear,
          },
        },
        {
          title: 'How it usually shows up',
          body: `In real life, ${topicLead} tends to appear in ordinary moments: a quick text, a tense pause, a routine decision, a missed check-in, or a feeling that something important is not being understood.

The behavior itself is usually small. What matters is the pattern underneath it and the story each partner tells about what it means.`,
          example: {
            scenario: `${config.title} example: one partner notices a pattern, the other experiences it differently, and both need a clearer way to talk about it.`,
            analysis: config.exampleAnalysis,
          },
        },
        {
          title: `How to work with ${topic.title.toLowerCase()}`,
          body: `The goal is not to perfect the concept. The goal is to use it. Once you can see ${topicLead}, you can slow the moment down, make the need more specific, and choose a response that is easier to repeat.

That is what turns insight into change.`,
          tip: {
            title: config.practiceLabel,
            steps: config.practiceSteps,
          },
        },
      ],
      conclusion: config.conclusion,
    },
    keyTakeaways: [
      `${topic.title} is a pattern, not a verdict`,
      `Naming ${topicLead} makes the relationship easier to understand`,
      `Small, repeated responses matter more than dramatic insight`,
      `Clarity helps both people respond with less guessing`,
    ],
    exercises: [
      {
        title: `${topic.title} in your relationship`,
        description: `Identify what ${topicLead} looks like for each of you and where it helps or hurts the most.`,
        duration: '10 min',
        instructions: [
          `Describe one recent moment that involved ${topicLead}`,
          'Name what each partner needed in that moment',
          'Write one response that would work better next time',
        ],
      },
    ],
    reflection: {
      question: config.reflectionQuestion,
      followUp: config.reflectionFollowUp,
    },
  };
}

function buildSeries(seriesKey: LearningSeriesKey, topics: TopicListItem[]) {
  return topics.map((topic, index) => buildModule(seriesKey, index, topic));
}

const connectionTopics: TopicListItem[] = [
  { title: 'Foundations', duration: '10 min' },
  { title: 'Emotional Connection', duration: '10 min' },
  { title: 'Deepening Bond', duration: '11 min' },
  { title: 'Roots', duration: '10 min' },
  { title: 'Feeling Closer', duration: '10 min' },
  { title: 'Happiness', duration: '10 min' },
];

const communicationTopics: TopicListItem[] = [
  { title: 'Communication', duration: '10 min' },
  { title: 'Clear Communication', duration: '10 min' },
  { title: 'Healthy Conflict', duration: '11 min' },
  { title: 'Listening', duration: '10 min' },
  { title: 'Meta Emotions', duration: '10 min' },
  { title: 'Soft Startup', duration: '10 min' },
];

const conflictRepairTopics: TopicListItem[] = [
  { title: 'Conflict', duration: '10 min' },
  { title: 'Repair', duration: '10 min' },
  { title: 'Forgiveness', duration: '10 min' },
  { title: 'Perpetual Problems', duration: '10 min' },
  { title: 'Flooding', duration: '10 min' },
];

const trustVulnerabilityTopics: TopicListItem[] = [
  { title: 'Trust', duration: '10 min' },
  { title: 'Building Trust', duration: '10 min' },
  { title: 'Infidelity', duration: '11 min' },
  { title: 'Vulnerability', duration: '10 min' },
  { title: 'Contempt', duration: '10 min' },
];

const intimacyTopics: TopicListItem[] = [
  { title: 'Sexual Connection', duration: '10 min' },
  { title: 'Sexual Desire', duration: '10 min' },
  { title: 'Body Image', duration: '10 min' },
  { title: 'Sex Script', duration: '10 min' },
  { title: 'Rituals', duration: '10 min' },
];

const lifeGrowthTopics: TopicListItem[] = [
  { title: 'Parenting', duration: '11 min' },
  { title: 'Family Culture', duration: '10 min' },
  { title: 'Expectations', duration: '10 min' },
  { title: 'In-Laws', duration: '10 min' },
  { title: 'Premarital', duration: '10 min' },
  { title: 'Personal Growth', duration: '10 min' },
  { title: 'Habits', duration: '10 min' },
  { title: 'Technology', duration: '10 min' },
  { title: 'Long Distance', duration: '11 min' },
];

const healthWellnessTopics: TopicListItem[] = [
  { title: 'Emotional Intelligence', duration: '10 min' },
  { title: 'Anxiety', duration: '10 min' },
  { title: 'Depression', duration: '10 min' },
  { title: 'Postpartum', duration: '10 min' },
  { title: 'Chronic Illness', duration: '10 min' },
  { title: 'Stress', duration: '10 min' },
  { title: 'Acceptance', duration: '10 min' },
  { title: 'Money', duration: '10 min' },
];

const keyConceptTopics: TopicListItem[] = [
  { title: 'Emotional Calls', duration: '8 min' },
  { title: 'Empathy', duration: '8 min' },
  { title: 'Appreciation', duration: '8 min' },
  { title: 'Inner World', duration: '8 min' },
  { title: 'Interdependence', duration: '8 min' },
  { title: 'Rituals', duration: '8 min' },
  { title: 'Sacrifice', duration: '8 min' },
  { title: 'Shared Meaning', duration: '8 min' },
  { title: 'Speaking Equation', duration: '8 min' },
  { title: 'We Language', duration: '8 min' },
  { title: 'Contempt', duration: '8 min' },
  { title: 'Flooding', duration: '8 min' },
  { title: 'Neuroplasticity', duration: '8 min' },
  { title: 'Perpetual Problems', duration: '8 min' },
  { title: 'Repair', duration: '8 min' },
  { title: 'Boundaries', duration: '8 min' },
  { title: 'Attunement', duration: '8 min' },
  { title: 'Consistency', duration: '8 min' },
];

export const connectionSeries = buildSeries('connection-series', connectionTopics);
export const communicationSeries = buildSeries('communication-series', communicationTopics);
export const conflictRepairSeries = buildSeries('conflict-repair-series', conflictRepairTopics);
export const trustVulnerabilitySeries = buildSeries('trust-vulnerability-series', trustVulnerabilityTopics);
export const intimacySeries = buildSeries('intimacy-series', intimacyTopics);
export const lifeGrowthSeries = buildSeries('life-growth-series', lifeGrowthTopics);
export const healthWellnessSeries = buildSeries('health-wellness-series', healthWellnessTopics);
export const keyConceptsSeries = buildSeries('key-concepts-series', keyConceptTopics);

export const repairAndCommunicationSeries: SeriesModule[] = [
  {
    id: 'rc-1',
    title: 'Soft Startups and Hard Conversations',
    description: 'Learn how to raise difficult topics without triggering instant defensiveness.',
    duration: '12 min',
    content: {
      introduction: `Hard conversations usually fail before the actual issue is discussed. The first 30 seconds matter because they set the nervous system tone for everything that follows.\n\nA soft startup is not weakness. It is a way of making truth easier to hear.`,
      sections: [
        {
          title: 'Lead with the real issue, not the charge',
          body: `When people start with blame, the other person hears threat before meaning. When they start with the issue and their feeling, the conversation stays usable for longer.\n\nTry to lead with "I feel" and "I need" instead of the story your anger is telling.`,
        },
        {
          title: 'One sentence can change the whole tone',
          body: `A better opening is specific, short, and non-accusatory. It names what happened, why it matters, and what kind of response would help.\n\nThat keeps the conversation focused on repair instead of defense.`,
          example: {
            scenario: 'You feel dismissed when your partner checks their phone mid-conversation.',
            dialogue: `"I want to talk about something that matters to me. When I feel interrupted, I start to shut down. Can we put the phone away for ten minutes?"`,
            analysis: 'The message is direct, but it does not attack character. That makes it easier to hear.',
          },
        },
        {
          title: 'Timing matters as much as wording',
          body: `Even a good opening can fail if someone is flooded, hungry, tired, or distracted. Part of communication skill is choosing a moment when both people can actually listen.\n\nThe goal is not to avoid hard topics. It is to choose a moment when the topic has a chance.`,
        },
      ],
      conclusion: 'Soft starts help relationships stay open long enough to solve real problems instead of fighting about tone.',
    },
    keyTakeaways: [
      'The first 30 seconds shape the conversation',
      'Lead with feeling and need, not blame',
      'Timing matters as much as wording',
    ],
    exercises: [
      {
        title: 'Rewrite a Startup',
        description: 'Turn one recent complaint into a softer opening.',
        duration: '10 min',
        instructions: [
          'Write the opening you actually used',
          'Underline the part that sounds blaming or global',
          'Rewrite it as a feeling + need + request',
          'Practice saying the new version out loud',
        ],
      },
    ],
    reflection: {
      question: 'How do you usually start hard conversations?',
      followUp: 'What would make your opening feel clearer and less threatening?',
    },
  },
  {
    id: 'rc-2',
    title: 'Listening, Validation, and Repair Language',
    description: 'Learn the skills that make people feel understood before solutions start.',
    duration: '11 min',
    content: {
      introduction: `Most people do not calm down because they are given a solution. They calm down because they feel understood.\n\nListening is not passive. It is an active signal that the relationship is safe enough for the truth.`,
      sections: [
        {
          title: 'Mirror before you interpret',
          body: `Good listening begins with reflecting back what you heard in simple language. That keeps you from arguing with a version of the story that only exists in your head.\n\nMirroring is not agreeing. It is checking whether you actually understood.`,
        },
        {
          title: 'Validation is not surrender',
          body: `Validation means the other person's feelings make sense in context. It does not mean they are right about everything or that you must give in.\n\nIt is often the fastest way to lower defensiveness so both people can keep talking.`,
          tip: {
            title: 'Validation formula',
            steps: [
              'Say what you heard',
              'Name the feeling',
              'Acknowledge why it makes sense',
              'Ask if you got it right',
            ],
          },
        },
        {
          title: 'Repair language keeps the door open',
          body: `Repair language includes phrases like "I see what you mean," "I missed that," "Let me try again," and "Help me understand better."\n\nThese words matter because they show the relationship matters more than being perfectly right in the moment.`,
        },
      ],
      conclusion: 'The goal of listening is not to win agreement. It is to make understanding strong enough that the conversation can continue.',
    },
    keyTakeaways: [
      'People calm down when they feel understood',
      'Validation is not the same as agreement',
      'Repair language should be normal, not rare',
    ],
    exercises: [
      {
        title: 'Mirror and Validate',
        description: 'Practice reflecting your partner before adding your own view.',
        duration: '12 min',
        instructions: [
          'Pick one recent frustration',
          'Write a one-sentence reflection of your partner\'s point',
          'Add one validating sentence',
          'Only then add your perspective',
        ],
      },
    ],
    reflection: {
      question: 'What do you need most when you are upset: solutions, reassurance, or understanding?',
      followUp: 'How can you make that need easier for your partner to meet?',
    },
  },
  {
    id: 'rc-3',
    title: 'Boundaries, Autonomy, and Trust Repair',
    description: 'Use boundaries to protect connection instead of using them to create distance.',
    duration: '13 min',
    content: {
      introduction: `Boundaries are not walls. They are agreements that help two people stay safe, respected, and clear.\n\nHealthy couples do not treat boundaries as rejection. They treat them as structure.`,
      sections: [
        {
          title: 'Boundaries reduce resentment',
          body: `When people know what is okay and what is not, they stop guessing and start cooperating. Boundaries protect energy, time, privacy, and emotional bandwidth.\n\nWithout them, resentment tends to grow in the dark.`,
        },
        {
          title: 'Autonomy strengthens trust',
          body: `Trust gets stronger when both people can be themselves without constant monitoring. That includes having individual space, separate interests, and room to make choices.\n\nAutonomy does not weaken the relationship. It makes the relationship less brittle.`,
        },
        {
          title: 'Repair after a crossed line',
          body: `If a boundary gets crossed, repair has to include ownership, a clear change, and time. The point is not to punish. The point is to restore safety.\n\nA boundary that cannot be talked about is not really a healthy boundary.`,
          example: {
            scenario: 'One partner keeps bringing up sensitive topics in front of other people.',
            analysis: 'The repair needs both an apology and a new agreement about privacy.',
          },
        },
      ],
      conclusion: 'Boundaries and trust work best together: boundaries clarify what is safe, and trust grows when those agreements are respected.',
    },
    keyTakeaways: [
      'Boundaries protect connection when they are clear',
      'Autonomy helps trust stay healthy',
      'Crossed boundaries require ownership and a real change',
    ],
    exercises: [
      {
        title: 'Boundary Reset',
        description: 'Choose one boundary that needs to be clearer or kinder.',
        duration: '10 min',
        instructions: [
          'Name one line you wish was clearer',
          'Rewrite it without blame',
          'Add what you need instead',
          'Agree on how you will follow it',
        ],
      },
    ],
    reflection: {
      question: 'Where does your relationship need clearer structure?',
      followUp: 'What boundary would actually make you feel more loved, not less?',
    },
  },
  {
    id: 'rc-4',
    title: 'Rituals, Desire, and Shared Rhythm',
    description: 'Create repeatable habits that keep intimacy and connection from fading into routine.',
    duration: '12 min',
    content: {
      introduction: `Relationships need rhythm. Without a shared pattern, even loving partners can drift into logistics, exhaustion, and disconnection.\n\nRituals are not fluff. They are how connection becomes dependable.`,
      sections: [
        {
          title: 'Rituals make closeness easier',
          body: `A ritual is a repeatable moment that tells both people, "We still matter to each other." It can be a morning check-in, a nightly walk, a Sunday reset, or a goodbye kiss that never gets skipped.\n\nThe smaller and more consistent the ritual, the more powerful it usually is.`,
        },
        {
          title: 'Desire grows with safety and anticipation',
          body: `For many couples, desire improves when pressure goes down and warmth goes up. Safety, playfulness, and predictability all help create more room for connection.\n\nThe point is not to force chemistry. It is to create the conditions where chemistry has a chance.`,
        },
        {
          title: 'Make your rhythm visible',
          body: `Write down the habits that make your relationship feel alive, then protect them with the same seriousness you would give any other important part of life.\n\nWhat gets scheduled tends to survive.`,
          tip: {
            title: 'Build one ritual',
            steps: [
              'Pick a moment that already happens',
              'Attach one loving action to it',
              'Keep it short',
              'Repeat it for two weeks before changing anything',
            ],
          },
        },
      ],
      conclusion: 'Shared rhythm turns intimacy into a pattern instead of a hope. That is what helps relationships feel steady over time.',
    },
    keyTakeaways: [
      'Rituals create dependable connection',
      'Safety and anticipation both matter for desire',
      'Short repeated habits are stronger than big occasional gestures',
    ],
    exercises: [
      {
        title: 'Ritual Design',
        description: 'Design one small ritual that fits your life right now.',
        duration: '10 min',
        instructions: [
          'Choose one existing daily moment',
          'Add one intentional connection habit to it',
          'Keep it short enough to repeat easily',
          'Try it for 14 days',
        ],
      },
    ],
    reflection: {
      question: 'What rhythm would make your relationship feel more alive?',
      followUp: 'What could you start doing consistently this week?',
    },
  },
];

export const learningSeriesCatalog = [
  { key: 'connection-series', title: 'Connection', summary: seriesConfig['connection-series'].summary, icon: seriesConfig['connection-series'].icon, modules: connectionSeries },
  { key: 'communication-series', title: 'Communication', summary: seriesConfig['communication-series'].summary, icon: seriesConfig['communication-series'].icon, modules: communicationSeries },
  { key: 'conflict-repair-series', title: 'Conflict & Repair', summary: seriesConfig['conflict-repair-series'].summary, icon: seriesConfig['conflict-repair-series'].icon, modules: conflictRepairSeries },
  { key: 'trust-vulnerability-series', title: 'Trust & Vulnerability', summary: seriesConfig['trust-vulnerability-series'].summary, icon: seriesConfig['trust-vulnerability-series'].icon, modules: trustVulnerabilitySeries },
  { key: 'intimacy-series', title: 'Intimacy', summary: seriesConfig['intimacy-series'].summary, icon: seriesConfig['intimacy-series'].icon, modules: intimacySeries },
  { key: 'life-growth-series', title: 'Life & Growth', summary: seriesConfig['life-growth-series'].summary, icon: seriesConfig['life-growth-series'].icon, modules: lifeGrowthSeries },
  { key: 'health-wellness-series', title: 'Health & Wellness', summary: seriesConfig['health-wellness-series'].summary, icon: seriesConfig['health-wellness-series'].icon, modules: healthWellnessSeries },
  { key: 'key-concepts-series', title: 'Key Concepts', summary: seriesConfig['key-concepts-series'].summary, icon: seriesConfig['key-concepts-series'].icon, modules: keyConceptsSeries },
  { key: 'repair-and-communication', title: 'Repair & Communication', summary: 'How to start hard conversations, listen well, set boundaries, and build shared rhythm.', icon: '🔧', modules: repairAndCommunicationSeries },
];

export const learningSeriesIndex = Object.fromEntries(
  learningSeriesCatalog.map((series) => [series.key, series.modules])
) as Record<LearningSeriesKey, SeriesModule[]>;

export const learningSeriesBannerMap: Record<LearningSeriesKey, string> = {
  'connection-series': '/images/bond/bond-cover-wide-dark.png',
  'communication-series': '/images/bond/bond-cover-wide-dark.png',
  'conflict-repair-series': '/images/bond/bond-cover-cinematic-dark.png',
  'trust-vulnerability-series': '/images/bond/bond-cover-cinematic-dark.png',
  'intimacy-series': '/images/bond/bond-cover-wide-dark.png',
  'life-growth-series': '/images/bond/bond-cover-cinematic-dark.png',
  'health-wellness-series': '/images/bond/bond-cover-cinematic-dark.png',
  'key-concepts-series': '/images/bond/bond-cover-wide-dark.png',
  'repair-and-communication': '/images/bond/bond-cover-cinematic-dark.png',
};