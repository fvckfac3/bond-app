export interface SeriesModule {
  id: string;
  title: string;
  description: string;
  duration: string;
  content: {
    introduction: string;
    sections: {
      title: string;
      body: string;
      research?: {
        text: string;
        source: string;
        year: number;
      };
      example?: {
        scenario: string;
        dialogue?: string;
        analysis?: string;
      };
      tip?: {
        title: string;
        steps: string[];
      };
    }[];
    conclusion: string;
  };
  keyTakeaways: string[];
  exercises?: {
    title: string;
    description: string;
    duration: string;
    instructions: string[];
    variation?: string;
  }[];
  reflection?: {
    question: string;
    followUp: string;
  };
}

export const relationshipFoundationsSeries: SeriesModule[] = [
  {
    id: 'rf-1',
    title: 'What Makes Relationships Succeed',
    description: 'Explore the science of relationship success and the predictable patterns that distinguish thriving couples.',
    duration: '12 min',
    content: {
      introduction: `Research by relationship scientists shows that healthy relationships are not mostly about luck or perfect compatibility. They are built from repeatable habits: turning toward bids for connection, repairing quickly after conflict, keeping trust visible, and protecting appreciation.

The big idea is simple: strong relationships are not conflict-free. They are good at recovery.`,
      sections: [
        {
          title: 'The pattern behind thriving couples',
          body: `The most resilient couples do not avoid tension. They stay emotionally engaged, even when they disagree. They know each other well enough to interpret stress accurately, and they repair instead of escalating.

That means the important question is not "Do we ever struggle?" It is "What do we do after we struggle?"`,
          research: {
            text: 'Longitudinal relationship research consistently shows that repair, responsiveness, and positive emotional climate predict stability.',
            source: 'Gottman & Silver, The Seven Principles for Making Marriage Work',
            year: 2015,
          },
        },
        {
          title: 'The 5:1 ratio',
          body: `Thriving couples tend to maintain a strong balance of positive to negative interactions, especially during stress. The exact number is less important than the principle: positive emotion has to stay present enough to keep difficult moments from defining the whole relationship.

Small appreciation, warmth, humor, and curiosity matter more than people think.`,
          tip: {
            title: 'Daily positivity check',
            steps: [
              'Name one thing your partner did well today',
              'Say one thing you appreciated about how they handled stress',
              'End one conversation with warmth instead of drifting apart',
            ],
          },
        },
        {
          title: 'Repair is the real superpower',
          body: `Every couple will misread each other, disappoint each other, and occasionally hurt each other. The difference is whether they know how to come back together.

Repair can be tiny: a softer tone, a good-faith clarification, a pause, a genuine apology, or a bid to reconnect. Small repair attempts are often more important than dramatic breakthroughs.`,
          example: {
            scenario: 'One partner feels ignored after a rough evening.',
            dialogue: `Partner A: "I think I came in too sharp. Let me try again. I care about this, and I want to understand you."
Partner B: "Okay. I needed that reset. Let me explain what I was feeling."`,
            analysis: 'Repair did not erase the conflict. It made the conversation safe enough to continue.',
          },
        },
      ],
      conclusion: 'Relationships succeed when two people can stay kind, stay curious, and recover together. The goal is not perfection. The goal is a relationship that can absorb stress without losing connection.',
    },
    keyTakeaways: [
      'Healthy relationships are built, not found',
      'Repair matters more than avoiding conflict',
      'Positive emotional climate protects the relationship under stress',
      'Knowing each other well improves connection and resilience',
    ],
    exercises: [
      {
        title: 'Repair History',
        description: 'Review how you recover after conflict.',
        duration: '15 min',
        instructions: [
          'Think of the last 3 disagreements',
          'Write down what helped and what made things worse',
          'Identify one repair move that actually works for you both',
          'Agree to use that move the next time tension rises',
        ],
      },
    ],
    reflection: {
      question: 'What does a healthy relationship feel like to you in real life, not in theory?',
      followUp: 'What one habit would make your relationship feel more stable this week?',
    },
  },
  {
    id: 'rf-2',
    title: 'Attachment Theory in Adult Relationships',
    description: 'Understand how attachment patterns shape closeness, distance, and emotional safety.',
    duration: '15 min',
    content: {
      introduction: `Attachment theory explains why closeness can feel soothing to one person and overwhelming to another. In adult relationships, attachment is not a diagnosis. It is a pattern of protection.

Once you understand that pattern, you can stop personalizing every reaction and start building security on purpose.`,
      sections: [
        {
          title: 'The four common attachment patterns',
          body: `Secure partners are comfortable with intimacy and independence. Anxious partners tend to scan for signs of distance and may need more reassurance. Avoidant partners often protect themselves through space and emotional self-reliance. Fearful partners want closeness but do not always trust it.

None of these patterns mean someone is broken. They mean they learned a way to stay safe.`,
          research: {
            text: 'Adult attachment patterns can change through awareness, supportive relationships, and repeated corrective experiences.',
            source: 'Mikulincer & Shaver, Attachment in Adulthood',
            year: 2007,
          },
        },
        {
          title: 'The pursue-withdraw loop',
          body: `A common problem pair is anxious pursuit and avoidant withdrawal. The more one partner pursues reassurance, the more the other may pull back. The more the other pulls back, the more the first person intensifies their effort.

The issue is usually not lack of love. It is mismatch in how safety gets restored.`,
          example: {
            scenario: 'One partner wants immediate reassurance after an argument, while the other wants space before talking.',
            analysis: 'Both partners are trying to regulate threat, but their coping styles collide.',
          },
        },
        {
          title: 'How to build earned security',
          body: `Earned security comes from doing the thing your nervous system does not expect: staying steady, naming feelings, and making repair predictable.

That includes saying what you need directly, honoring pauses, following through, and proving through repetition that the relationship can survive discomfort.`,
          tip: {
            title: 'Security script',
            steps: [
              'Name what you feel',
              'Say what you need without blame',
              'Give your partner a clear way to respond',
              'Follow through on what you said you would do',
            ],
          },
        },
      ],
      conclusion: 'Attachment patterns are changeable. Security is not about never getting activated. It is about learning how to return to connection faster and with less damage.',
    },
    keyTakeaways: [
      'Attachment is a protection pattern, not a character flaw',
      'Anxious and avoidant styles often create a pursue-withdraw cycle',
      'Security grows through repetition, honesty, and predictable repair',
      'Direct reassurance and clear space both matter',
    ],
    exercises: [
      {
        title: 'Trigger Map',
        description: 'Track what activates your attachment system.',
        duration: '20 min',
        instructions: [
          'List 3 moments that make you feel most insecure',
          'Write what you typically do next',
          'Ask what your partner would see from the outside',
          'Choose one calmer response to practice next time',
        ],
      },
    ],
    reflection: {
      question: 'When you feel threatened in love, do you move closer, move away, or do both at once?',
      followUp: 'What would a more secure response look like for you?',
    },
  },
  {
    id: 'rf-3',
    title: 'Love Languages and Daily Care',
    description: 'Learn how care lands differently for different people and how to use that information well.',
    duration: '10 min',
    content: {
      introduction: `Love languages are useful because they remind couples that love is not just about intent. It is also about reception.

You can mean well and still miss the mark. The fix is not more effort in the abstract. It is more accuracy.`,
      sections: [
        {
          title: 'Five ways love is commonly felt',
          body: `Words, time, gifts, acts, and touch are all valid pathways to feeling cared for. Most people have one or two that land more deeply than the others.

The mistake couples make is assuming their own preferred style is universal. It is not.`,
        },
        {
          title: 'Why mismatch matters',
          body: `A mismatch does not mean the relationship is weak. It means one partner may be offering care in a language the other does not register as easily.

This is why a person can be deeply loved and still feel unloved if the expression does not match their preference.`,
        },
        {
          title: 'Using the result well',
          body: `Your results should not become a scoreboard. They should become a care map.

The best use of the data is simple: give more in the language your partner receives, and explain your own needs clearly enough that your partner can actually meet them.`,
          tip: {
            title: 'One-week love-language practice',
            steps: [
              'Pick one love language for each partner',
              'Do one intentional act in that language every day',
              'Notice what lands most strongly',
              'Talk about what felt most meaningful at the end of the week',
            ],
          },
        },
      ],
      conclusion: 'Love languages work best when they become a daily practice of translation, not a one-time label.',
    },
    keyTakeaways: [
      'Love languages describe how care is received, not just given',
      'Mismatch is common and fixable',
      'The best result is a care map, not a ranking',
    ],
    exercises: [
      {
        title: 'Care Translation',
        description: 'Turn one generic loving habit into a specific gesture that your partner feels.',
        duration: '10 min',
        instructions: [
          'Write one way you usually show love',
          'Rewrite it in your partner’s preferred language',
          'Do it once within 48 hours',
        ],
      },
    ],
    reflection: {
      question: 'What do you do out of love that your partner may not automatically feel as love?',
      followUp: 'What do you most want your partner to do more consistently?',
    },
  },
  {
    id: 'rf-4',
    title: 'Conflict and Repair',
    description: 'Learn why conflict is normal and how repair keeps hard moments from becoming relationship damage.',
    duration: '12 min',
    content: {
      introduction: `Conflict is not a sign that a relationship is failing. It is a sign that two real people with needs, limits, and histories are trying to build a life together.

The question is never whether conflict will happen. The question is whether you can repair without making each other feel unsafe.`,
      sections: [
        {
          title: 'Why conflict is not the enemy',
          body: `Many couples try to avoid conflict entirely, but avoidance often leaves important issues unresolved. Healthy couples do not stay perfectly calm. They stay engaged enough to keep talking.

The problem is not disagreement. The problem is contempt, defensiveness, stonewalling, and escalation that makes repair harder later.`,
          research: {
            text: 'Conflict style matters less than whether partners can recover, de-escalate, and stay respectful while disagreeing.',
            source: 'Gottman research on marital stability and repair',
            year: 2015,
          },
        },
        {
          title: 'Repair moves that actually work',
          body: `Repair attempts are small signals that say, "I am still with you." They can be as simple as softening your tone, naming your part, or asking to restart the conversation.

The key is that repair happens early enough to matter. Waiting too long usually makes both people more rigid.`,
          tip: {
            title: 'Repair menu',
            steps: [
              'Pause and lower your volume',
              'Name one thing you can own',
              'Ask one curious question',
              'Restate the real issue in one sentence',
            ],
          },
        },
        {
          title: 'A simple repair sequence',
          body: `A good repair sequence is predictable: notice the rupture, lower intensity, name the need, and reconnect around the issue instead of around blame.

That sequence is boring in the best way. It works because it makes safety feel repeatable.`,
          example: {
            scenario: 'One partner shuts down after feeling criticized.',
            dialogue: `Partner A: "I got too sharp. Let me try that again without the edge."
Partner B: "Thank you. I can stay in this conversation if we slow it down."`,
            analysis: 'Both partners are choosing connection over winning, which lowers threat immediately.',
          },
        },
      ],
      conclusion: 'Conflict becomes workable when repair is faster, clearer, and more respectful than the escalation that came before it.',
    },
    keyTakeaways: [
      'Conflict is normal; damage is optional',
      'Repair attempts should come early and often',
      'Respectful disagreement is a skill, not a personality trait',
      'Small resets matter more than perfect arguments',
    ],
    exercises: [
      {
        title: 'Repair Practice',
        description: 'Rehearse one repair line you can use in real life.',
        duration: '10 min',
        instructions: [
          'Pick one recurring conflict pattern',
          'Write the repair line you wish you used sooner',
          'Practice saying it out loud',
          'Agree to use it the next time things start to escalate',
        ],
      },
    ],
    reflection: {
      question: 'What do you usually do first when conflict starts: defend, explain, withdraw, or repair?',
      followUp: 'What would it look like to make repair your first instinct?',
    },
  },
  {
    id: 'rf-5',
    title: 'Communication and Emotional Safety',
    description: 'Learn how to talk in ways that lower defensiveness and make hard conversations usable.',
    duration: '12 min',
    content: {
      introduction: `Good communication is not just about saying more. It is about making it easier for your partner to hear what you mean.

When people feel emotionally safe, they can be more honest, more open, and less reactive.`,
      sections: [
        {
          title: 'Speak to regulate, not to win',
          body: `In stressed relationships, people often use communication to prove a point or protect themselves. That usually backfires. The more useful goal is regulation: helping both people stay in the conversation long enough to understand what is happening.

Clear communication lowers threat when it is direct, kind, and not overloaded with assumptions.`,
        },
        {
          title: 'Validation before solutions',
          body: `Many fights are not solved because one partner jumps to advice before the other feels understood. Validation does not mean agreement. It means showing the other person that their experience makes sense to you.

That small move often opens the door to actual problem-solving.`,
          tip: {
            title: 'Validation first',
            steps: [
              'Reflect what you heard',
              'Name the emotion you think they feel',
              'Ask if you understood correctly',
              'Only then offer a solution',
            ],
          },
        },
        {
          title: 'Pausing well is part of communication',
          body: `Some conversations need a timeout, not because the relationship is bad, but because the nervous system is overloaded.

A good pause has a return plan. Otherwise it just becomes avoidance in disguise.`,
        },
      ],
      conclusion: 'Communication gets better when both people feel less attacked, more seen, and more able to return to the conversation later if needed.',
    },
    keyTakeaways: [
      'The goal of communication is clarity and safety',
      'Validation helps people stay open',
      'Pauses work best when they include a return time',
      'Talking less defensively often helps more than talking more',
    ],
    exercises: [
      {
        title: 'Reflect Before Responding',
        description: 'Practice a single conversation pattern that reduces defensiveness.',
        duration: '10 min',
        instructions: [
          'Choose one recent disagreement',
          'Rewrite your response as a reflection first',
          'Add one question that invites clarity',
          'Compare how it feels to your original response',
        ],
      },
    ],
    reflection: {
      question: 'What usually makes you feel unheard in conversation?',
      followUp: 'What would help you stay open instead of getting defensive?',
    },
  },
  {
    id: 'rf-6',
    title: 'Trust and Vulnerability',
    description: 'Understand how trust is built through predictability, honesty, and safe disclosure.',
    duration: '11 min',
    content: {
      introduction: `Trust is not just a feeling. It is a pattern of evidence.

People trust when actions are predictable, promises are kept, and vulnerability is handled with care.`,
      sections: [
        {
          title: 'Trust grows from small deposits',
          body: `The relationship does not need one huge breakthrough to build trust. It needs many small moments that prove a partner can be counted on.

Consistency, follow-through, and honesty matter because they make the future feel less uncertain.`,
        },
        {
          title: 'Vulnerability should be paced',
          body: `Being open too quickly can feel risky, but being closed forever can make the relationship shallow. Healthy vulnerability is paced and mutual.

You reveal enough to be real, and you pay attention to whether the relationship responds with care.`,
          example: {
            scenario: 'One partner wants to share a fear, but is unsure whether it will be received gently.',
            analysis: 'Trust increases when disclosure is met with protection rather than dismissal.',
          },
        },
        {
          title: 'After a rupture, trust needs repair plus proof',
          body: `An apology helps, but trust also needs repeated proof that the behavior changed. Words matter, but behavior is what the nervous system remembers.

If trust was shaken, do not rely on one conversation. Use consistency.`,
          tip: {
            title: 'Trust rebuild steps',
            steps: [
              'Name what happened without minimizing it',
              'Say what will be different next time',
              'Follow through on a concrete promise',
              'Let the pattern prove itself over time',
            ],
          },
        },
      ],
      conclusion: 'Trust and vulnerability work together: trust makes disclosure possible, and vulnerability gives trust something real to respond to.',
    },
    keyTakeaways: [
      'Trust is built through predictable behavior',
      'Vulnerability should be mutual and paced',
      'Repair after rupture needs proof, not just apology',
      'Safety is a pattern the body learns over time',
    ],
    exercises: [
      {
        title: 'Trust Audit',
        description: 'Identify where trust is strong and where it needs more evidence.',
        duration: '15 min',
        instructions: [
          'Name one area where your partner is reliable',
          'Name one area where trust feels shaky',
          'Choose one concrete behavior that would help',
          'Discuss how you will measure progress',
        ],
      },
    ],
    reflection: {
      question: 'What helps you feel safe enough to be vulnerable?',
      followUp: 'What can your partner do that makes trust easier to offer?',
    },
  },
  {
    id: 'rf-7',
    title: 'Intimacy and Closeness',
    description: 'Explore emotional, physical, intellectual, and shared-time intimacy.',
    duration: '13 min',
    content: {
      introduction: `Intimacy is broader than sex. It is the experience of being known, chosen, and emotionally near.

Couples often struggle when they only track one kind of closeness and ignore the others.`,
      sections: [
        {
          title: 'Closeness has multiple forms',
          body: `Some couples connect best through conversation. Others through touch, shared activities, playful energy, or quiet presence.

The real question is not which form is best. It is which forms help each of you feel most alive and connected.`,
        },
        {
          title: 'Desire and safety both matter',
          body: `People often want closeness and safety at the same time, but stress can make those needs feel in conflict. Intimacy improves when partners can name what helps them feel relaxed and what makes them shut down.

That honesty turns guesswork into collaboration.`,
          example: {
            scenario: 'One partner wants more affection, while the other feels pressure and pulls back.',
            analysis: 'The solution is not forcing more contact. It is finding a pace that increases safety for both people.',
          },
        },
        {
          title: 'Rituals create closeness on purpose',
          body: `Rituals are small repeated moments that remind each person that they matter. They can be a good morning check-in, a walk after dinner, a kiss goodbye, or a weekly sit-down.

Closeness gets easier when it is built into the rhythm of the relationship.`,
          tip: {
            title: 'Create one ritual',
            steps: [
              'Pick one daily or weekly moment',
              'Make it short and repeatable',
              'Keep it low-pressure',
              'Protect it even when life gets busy',
            ],
          },
        },
      ],
      conclusion: 'Intimacy deepens when partners understand the forms of closeness each person needs and build rituals that support them.',
    },
    keyTakeaways: [
      'Intimacy includes emotional, physical, intellectual, and shared-time closeness',
      'Safety and desire both matter',
      'Rituals help intimacy become reliable',
      'The best closeness is felt, not forced',
    ],
    exercises: [
      {
        title: 'Intimacy Map',
        description: 'Identify your preferred forms of closeness and one way to strengthen each.',
        duration: '15 min',
        instructions: [
          'Write the top 2 forms of closeness that matter most to you',
          'Ask your partner to do the same',
          'Choose one small action for each form',
          'Try it for one week',
        ],
      },
    ],
    reflection: {
      question: 'What kind of closeness do you want more of right now?',
      followUp: 'What makes closeness feel easier instead of pressured?',
    },
  },
  {
    id: 'rf-8',
    title: 'Shared Meaning and Values',
    description: 'Build direction, purpose, and shared identity as a couple.',
    duration: '12 min',
    content: {
      introduction: `Shared meaning is the sense that your relationship stands for something. It is the feeling that your day-to-day life fits into a bigger picture.

Couples without shared meaning can still love each other, but they may feel less grounded when life gets hard.`,
      sections: [
        {
          title: 'Rituals and roles shape meaning',
          body: `The story of the relationship lives in routines, traditions, and the responsibilities you each carry. Even small rituals can create a feeling of "us."

Meaning grows when both partners feel like co-authors instead of passengers.`,
        },
        {
          title: 'Values conflict is normal',
          body: `No two people match perfectly. The goal is not identical values. It is enough alignment to make decisions without constant friction.

Healthy couples can name what matters most, where they differ, and how they will navigate the gap respectfully.`,
        },
        {
          title: 'A shared future needs a shared picture',
          body: `When couples can describe the kind of life they want together, they tend to make better decisions in the present.

A shared future does not need to be dramatic. It just needs to feel believable and mutual.`,
          tip: {
            title: 'Shared meaning conversation',
            steps: [
              'Describe what kind of couple you want to be',
              'Name one tradition you want to protect',
              'Pick one value that should guide big decisions',
              'Write one sentence about your shared future',
            ],
          },
        },
      ],
      conclusion: 'Shared meaning makes love feel directional. It turns connection into a life the two of you are intentionally building.',
    },
    keyTakeaways: [
      'Shared meaning gives the relationship direction',
      'Values alignment is about workable overlap, not sameness',
      'Rituals and roles help create a sense of "us"',
      'A shared future makes decisions easier',
    ],
    exercises: [
      {
        title: 'Meaning Statement',
        description: 'Write a short statement about what your relationship stands for.',
        duration: '15 min',
        instructions: [
          'Finish the sentence: "Our relationship is about..."',
          'Share your version with your partner',
          'Find one phrase you both like',
          'Keep it somewhere visible',
        ],
      },
    ],
    reflection: {
      question: 'What do you want your relationship to stand for over time?',
      followUp: 'What shared tradition or value would make that feel more real?',
    },
  },
];

export default relationshipFoundationsSeries;
