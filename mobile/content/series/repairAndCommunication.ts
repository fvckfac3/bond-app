import type { SeriesModule } from './seriesContent';

export const repairAndCommunicationSeries: SeriesModule[] = [
  {
    id: 'rc-1',
    title: 'Soft Startups and Hard Conversations',
    description: 'Learn how to raise difficult topics without triggering instant defensiveness.',
    duration: '12 min',
    content: {
      introduction: `Hard conversations usually fail before the actual issue is discussed. The first 30 seconds matter because they set the nervous system tone for everything that follows.

A soft startup is not weakness. It is a way of making truth easier to hear.`,
      sections: [
        {
          title: 'Lead with the real issue, not the charge',
          body: `When people start with blame, the other person hears threat before meaning. When they start with the issue and their feeling, the conversation stays usable for longer.

Try to lead with "I feel" and "I need" instead of the story your anger is telling.`,
        },
        {
          title: 'One sentence can change the whole tone',
          body: `A better opening is specific, short, and non-accusatory. It names what happened, why it matters, and what kind of response would help.

That keeps the conversation focused on repair instead of defense.`,
          example: {
            scenario: 'You feel dismissed when your partner checks their phone mid-conversation.',
            dialogue: `"I want to talk about something that matters to me. When I feel interrupted, I start to shut down. Can we put the phone away for ten minutes?"`,
            analysis: 'The message is direct, but it does not attack character. That makes it easier to hear.',
          },
        },
        {
          title: 'Timing matters as much as wording',
          body: `Even a good opening can fail if someone is flooded, hungry, tired, or distracted. Part of communication skill is choosing a moment when both people can actually listen.

The goal is not to avoid hard topics. It is to choose a moment when the topic has a chance.`,
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
      introduction: `Most people do not calm down because they are given a solution. They calm down because they feel understood.

Listening is not passive. It is an active signal that the relationship is safe enough for the truth.`,
      sections: [
        {
          title: 'Mirror before you interpret',
          body: `Good listening begins with reflecting back what you heard in simple language. That keeps you from arguing with a version of the story that only exists in your head.

Mirroring is not agreeing. It is checking whether you actually understood.`,
        },
        {
          title: 'Validation is not surrender',
          body: `Validation means the other person’s feelings make sense in context. It does not mean they are right about everything or that you must give in.

It is often the fastest way to lower defensiveness so both people can keep talking.`,
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
          body: `Repair language includes phrases like "I see what you mean," "I missed that," "Let me try again," and "Help me understand better."

These words matter because they show the relationship matters more than being perfectly right in the moment.`,
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
          'Write a one-sentence reflection of your partner’s point',
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
      introduction: `Boundaries are not walls. They are agreements that help two people stay safe, respected, and clear.

Healthy couples do not treat boundaries as rejection. They treat them as structure.`,
      sections: [
        {
          title: 'Boundaries reduce resentment',
          body: `When people know what is okay and what is not, they stop guessing and start cooperating. Boundaries protect energy, time, privacy, and emotional bandwidth.

Without them, resentment tends to grow in the dark.`,
        },
        {
          title: 'Autonomy strengthens trust',
          body: `Trust gets stronger when both people can be themselves without constant monitoring. That includes having individual space, separate interests, and room to make choices.

Autonomy does not weaken the relationship. It makes the relationship less brittle.`,
        },
        {
          title: 'Repair after a crossed line',
          body: `If a boundary gets crossed, repair has to include ownership, a clear change, and time. The point is not to punish. The point is to restore safety.

A boundary that cannot be talked about is not really a healthy boundary.`,
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
      introduction: `Relationships need rhythm. Without a shared pattern, even loving partners can drift into logistics, exhaustion, and disconnection.

Rituals are not fluff. They are how connection becomes dependable.`,
      sections: [
        {
          title: 'Rituals make closeness easier',
          body: `A ritual is a repeatable moment that tells both people, "We still matter to each other." It can be a morning check-in, a nightly walk, a Sunday reset, or a goodbye kiss that never gets skipped.

The smaller and more consistent the ritual, the more powerful it usually is.`,
        },
        {
          title: 'Desire grows with safety and anticipation',
          body: `For many couples, desire improves when pressure goes down and warmth goes up. Safety, playfulness, and predictability all help create more room for connection.

The point is not to force chemistry. It is to create the conditions where chemistry has a chance.`,
        },
        {
          title: 'Make your rhythm visible',
          body: `Write down the habits that make your relationship feel alive, then protect them with the same seriousness you would give any other important part of life.

What gets scheduled tends to survive.`,
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

export default repairAndCommunicationSeries;
