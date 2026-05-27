-- BOND Couple Assessment Scoring Seed
-- Requires schema.sql, schema_phase2.sql, 003_assessment_content_schema.sql, 004_couple_assessment_schema.sql, and assessment_seed.sql first.

INSERT INTO assessment_couple_rules (
  assessment_id,
  scoring_version,
  average_weight,
  alignment_weight,
  floor_weight,
  high_gap_threshold,
  shared_strength_threshold,
  shared_growth_threshold,
  low_floor_threshold,
  notes
) VALUES
  ('love-languages', 'couple-v1', 0.35, 0.45, 0.20, 30, 72, 55, 45, 'Alignment matters more than raw average because love language mismatch affects daily expression.'),
  ('attachment-style', 'couple-v1', 0.25, 0.35, 0.40, 20, 70, 52, 40, 'Lowest score matters most because attachment insecurity can dominate the dynamic.'),
  ('communication-style', 'couple-v1', 0.30, 0.35, 0.35, 22, 72, 55, 45, 'Balance clarity, listening, validation, and accountability.'),
  ('gottman-four-horsemen', 'couple-v1', 0.20, 0.35, 0.45, 18, 75, 58, 45, 'Risk floor matters most because high horsemen scores can destabilize repair.'),
  ('conflict-resolution', 'couple-v1', 0.30, 0.30, 0.40, 22, 70, 55, 45, 'Repair and composure matter more than average conflict comfort.'),
  ('values-alignment', 'couple-v1', 0.35, 0.30, 0.35, 25, 72, 55, 50, 'Shared direction matters as much as the score itself.'),
  ('emotional-intelligence', 'couple-v1', 0.33, 0.33, 0.34, 22, 72, 56, 45, 'Emotional skill is strongest when both people can self-regulate and empathize.'),
  ('intimacy-closeness', 'couple-v1', 0.30, 0.35, 0.35, 22, 72, 55, 45, 'Connection should be judged by the lower score when safety or closeness is weak.'),
  ('trust-vulnerability', 'couple-v1', 0.25, 0.35, 0.40, 20, 72, 55, 45, 'Trust grows slowly and is constrained by the least safe partner.'),
  ('financial-values', 'couple-v1', 0.30, 0.35, 0.35, 24, 72, 55, 45, 'Money alignment should surface the habits and conversation patterns behind the score.'),
  ('sexual-compatibility', 'couple-v1', 0.25, 0.35, 0.40, 20, 72, 55, 45, 'The lower score should carry more weight because desire and safety both matter.'),
  ('shared-meaning', 'couple-v1', 0.35, 0.30, 0.35, 24, 72, 55, 48, 'Rituals and goals matter more than a single number.'),
  ('relationship-satisfaction', 'couple-v1', 0.35, 0.30, 0.35, 22, 72, 55, 50, 'Satisfaction should be interpreted with both average and mismatch.'),
  ('stress-coping', 'couple-v1', 0.30, 0.30, 0.40, 22, 70, 55, 45, 'A good team can still struggle if one partner is overwhelmed.'),
  ('fun-personality', 'couple-v1', 0.35, 0.30, 0.35, 22, 70, 54, 45, 'Fun should reflect shared joy, not just individual playfulness.'),
  ('appreciation-gratitude', 'couple-v1', 0.35, 0.30, 0.35, 20, 72, 55, 48, 'Gratitude is most useful when both people give and receive it consistently.')
ON CONFLICT (assessment_id) DO UPDATE SET
  scoring_version = EXCLUDED.scoring_version,
  average_weight = EXCLUDED.average_weight,
  alignment_weight = EXCLUDED.alignment_weight,
  floor_weight = EXCLUDED.floor_weight,
  high_gap_threshold = EXCLUDED.high_gap_threshold,
  shared_strength_threshold = EXCLUDED.shared_strength_threshold,
  shared_growth_threshold = EXCLUDED.shared_growth_threshold,
  low_floor_threshold = EXCLUDED.low_floor_threshold,
  notes = EXCLUDED.notes;

INSERT INTO assessment_couple_dimension_rules (
  assessment_id,
  dimension_key,
  label,
  weight,
  priority,
  high_shared_text,
  shared_gap_text,
  asymmetry_text,
  action_text,
  guidance_order
) VALUES
  ('love-languages', 'words', 'Words of Affirmation', 1, 'support', 'You both value verbal reassurance, which makes praise and kindness very effective.', 'You may be speaking different emotional dialects, so expressions of care can miss.', 'One partner may need more reassurance than the other naturally gives.', 'Use one specific appreciation and one specific request every day.', 1),
  ('love-languages', 'time', 'Quality Time', 1, 'support', 'Shared attention is already a strong connector for you.', 'A mismatch here usually shows up as one person feeling neglected or crowded.', 'One of you may want togetherness while the other wants less intensity.', 'Protect one no-phone block of time together.', 2),
  ('love-languages', 'gifts', 'Receiving Gifts', 1, 'support', 'Thoughtful gestures land well for both of you.', 'The relationship may feel uneven if one person uses gifts and the other ignores them.', 'One partner may be showing love through effort while the other wants visible symbols.', 'Exchange one small meaningful token this week.', 3),
  ('love-languages', 'acts', 'Acts of Service', 1, 'support', 'Practical care is a real strength in your relationship.', 'If one of you is low here, helpfulness can feel invisible or controlling.', 'One partner may feel loved by action while the other wants emotional acknowledgment.', 'Do one concrete task for each other without being asked.', 4),
  ('love-languages', 'touch', 'Physical Touch', 1, 'support', 'Physical affection appears to be a reliable source of closeness.', 'A mismatch can make affection feel too much for one person and too little for the other.', 'One partner may need more touch than the other naturally offers.', 'Create one safe touch ritual that you both agree on.', 5),
  ('attachment-style', 'anxiety', 'Attachment Anxiety', 1, 'risk', 'Lower anxiety here helps both people feel steadier.', 'When both scores are high, reassurance becomes a major need in the relationship.', 'One person may seek closeness while the other feels pressure from it.', 'Practice direct reassurance and a predictable check-in habit.', 1),
  ('attachment-style', 'avoidance', 'Attachment Avoidance', 1, 'risk', 'Lower avoidance supports easy closeness and repair.', 'High avoidance on either side can make emotional distance the default.', 'One person may pursue connection while the other protects with space.', 'Share one honest feeling before you withdraw.', 2),
  ('communication-style', 'expression', 'Expression', 1, 'support', 'You can usually say what matters in a direct way.', 'A mismatch may create unclear asks and built-up resentment.', 'One partner may communicate more openly than the other can absorb.', 'Use one clear I-statement before the next hard topic.', 1),
  ('communication-style', 'listening', 'Listening', 1, 'support', 'Listening appears to be a shared strength.', 'A gap here often means one person feels unheard even when both are talking.', 'One person may speak to be understood while the other speaks to respond.', 'Paraphrase first, then reply.', 2),
  ('communication-style', 'validation', 'Validation', 1, 'support', 'You may already know how to make each other feel emotionally understood.', 'If validation is uneven, people can feel dismissed even in calm conversations.', 'One partner may want empathy while the other jumps too quickly to solutions.', 'Name the feeling before offering advice.', 3),
  ('communication-style', 'accountability', 'Accountability', 1, 'support', 'Owning your part could be a real asset here.', 'When accountability is weak, conflict can become a blame contest.', 'One partner may apologize more easily than the other.', 'Start with your part first when tension rises.', 4),
  ('gottman-four-horsemen', 'criticism', 'Criticism', 1, 'risk', 'Low criticism means conversations are less likely to attack the person.', 'A mismatch can make one person feel routinely blamed or unsafe.', 'One partner may complain while the other experiences it as attack.', 'Replace global blame with one specific request.', 1),
  ('gottman-four-horsemen', 'contempt', 'Contempt', 1, 'risk', 'Low contempt is a major protective factor.', 'If contempt is high for either person, the bond is getting corroded.', 'One partner may feel superior, the other devalued.', 'Remove sarcasm, eye-rolling, and disrespect immediately.', 2),
  ('gottman-four-horsemen', 'defensiveness', 'Defensiveness', 1, 'risk', 'Lower defensiveness makes repair much easier.', 'High defensiveness usually means the conversation never fully resolves.', 'One person may explain themselves instead of hearing the impact.', 'Own one part before defending your intent.', 3),
  ('gottman-four-horsemen', 'stonewalling', 'Stonewalling', 1, 'risk', 'Low stonewalling means you can stay engaged under stress.', 'If one person shuts down, repair gets delayed or abandoned.', 'One partner may pursue while the other disappears.', 'Take a short pause and return to finish the conversation.', 4),
  ('conflict-resolution', 'avoidance', 'Avoidance', 1, 'risk', 'Lower avoidance means problems are less likely to pile up.', 'A mismatch here often means one person wants resolution and the other wants distance.', 'One partner may push to talk while the other goes quiet.', 'Pick a time to return to the issue instead of leaving it open.', 1),
  ('conflict-resolution', 'repair', 'Repair', 1, 'support', 'You likely know how to come back together after strain.', 'When repair is low, small problems stay emotionally alive too long.', 'One person may try to repair while the other still feels hurt.', 'Use a repair attempt within the same day.', 2),
  ('values-alignment', 'family', 'Family', 1, 'support', 'You seem aligned on family expectations and support.', 'Differences here can quietly shape major decisions.', 'One partner may want closeness with family while the other wants distance.', 'Talk through one family boundary or expectation.', 1),
  ('values-alignment', 'finance', 'Finance', 1, 'risk', 'Money alignment appears fairly workable.', 'A mismatch can show up as stress over spending, saving, or priorities.', 'One partner may be cautious while the other is more flexible.', 'Make one money decision together with full transparency.', 2),
  ('values-alignment', 'goals', 'Goals', 1, 'support', 'You may already be moving in a similar direction.', 'A gap here can create a sense that you are building different lives.', 'One person may want clarity while the other stays vague.', 'Pick one shared goal and define the next step.', 3),
  ('trust-vulnerability', 'trust', 'Trust', 1, 'risk', 'Trust looks like a reliable base here.', 'Low trust on either side is a relationship-wide bottleneck.', 'One partner may need proof while the other expects goodwill.', 'Keep one promise you make this week.', 1),
  ('trust-vulnerability', 'vulnerability', 'Vulnerability', 1, 'support', 'You can probably share more than average without feeling exposed.', 'A gap here means one person has not yet felt safe enough to open up.', 'One person may reveal more while the other stays guarded.', 'Say one honest thing you usually leave unsaid.', 2),
  ('trust-vulnerability', 'safety', 'Safety', 1, 'risk', 'Emotional safety looks like a meaningful strength.', 'When safety is low, every other score becomes less stable.', 'One partner may react quickly to threat while the other minimizes it.', 'Build one predictable moment of safety on purpose.', 3),
  ('shared-meaning', 'rituals', 'Rituals', 1, 'support', 'Your daily or weekly rituals likely give the relationship structure.', 'A mismatch can make the relationship feel less anchored.', 'One partner may want more ritual than the other naturally creates.', 'Create one repeatable ritual you can both keep.', 1),
  ('shared-meaning', 'goals', 'Goals', 1, 'support', 'You seem to agree on where the relationship is going.', 'Differences here can create drift even when affection is strong.', 'One partner may want long-range planning while the other stays present-only.', 'Name one goal and the next action.', 2),
  ('shared-meaning', 'legacy', 'Legacy', 1, 'support', 'You may share a strong sense of what you want this relationship to stand for.', 'If legacy is weak, values can feel abstract instead of lived.', 'One partner may think about the future while the other thinks about the present.', 'Talk about the kind of partnership you want to be remembered for.', 3),
  ('fun-personality', 'playfulness', 'Playfulness', 1, 'support', 'You likely have good access to play and lightness.', 'If playfulness is mismatched, one person may feel the other is too serious or too much.', 'One partner may want more spontaneity than the other.', 'Make room for one silly moment this week.', 1),
  ('fun-personality', 'activities', 'Shared Activities', 1, 'support', 'Doing things together is probably a real bonding path.', 'A gap can mean one person keeps inviting while the other keeps declining.', 'One partner may want shared plans; the other may prefer low-pressure time.', 'Put one enjoyable shared activity on the calendar.', 2),
  ('fun-personality', 'humor', 'Humor', 1, 'support', 'You may already use laughter as a connector.', 'If humor is uneven, one person may feel too serious or not taken seriously.', 'One partner may joke to connect; the other may joke to deflect.', 'Use humor to soften, not to avoid.', 3),
  ('appreciation-gratitude', 'expression', 'Expression', 1, 'support', 'Gratitude is easy to say out loud for both of you.', 'A gap can make appreciation feel rare or performative.', 'One partner may expect gratitude while the other assumes it is obvious.', 'Say one specific thank-you every day.', 1),
  ('appreciation-gratitude', 'recognition', 'Recognition', 1, 'support', 'You likely notice each other’s effort fairly well.', 'A mismatch can leave one partner feeling invisible.', 'One person may give a lot but feel unrecognized.', 'Name one specific thing your partner did well today.', 2),
  ('appreciation-gratitude', 'positivity', 'Positivity', 1, 'support', 'A positive tone appears to be available to both of you.', 'Low positivity can make even small issues feel heavier.', 'One partner may default to criticism while the other seeks warmth.', 'End one day by naming three good things.', 3)
ON CONFLICT (assessment_id, dimension_key) DO UPDATE SET
  label = EXCLUDED.label,
  weight = EXCLUDED.weight,
  priority = EXCLUDED.priority,
  high_shared_text = EXCLUDED.high_shared_text,
  shared_gap_text = EXCLUDED.shared_gap_text,
  asymmetry_text = EXCLUDED.asymmetry_text,
  action_text = EXCLUDED.action_text,
  guidance_order = EXCLUDED.guidance_order;

INSERT INTO assessment_couple_dimension_rules
  (assessment_id, dimension_key, label, weight, priority, high_shared_text, shared_gap_text, asymmetry_text, action_text, guidance_order)
VALUES
-- Emotional Intelligence
  ('emotional-intelligence', 'selfAwareness', 'Self-awareness', 1, 'support', 'You both have good access to your own emotional landscape.', 'A gap here often means one person names feelings while the other acts on them.', 'One partner may be tuned in while the other runs on autopilot.', 'Practice naming one feeling out loud before reacting.', 1),
  ('emotional-intelligence', 'selfRegulation', 'Self-regulation', 1, 'support', 'Both of you can generally stay regulated under pressure.', 'If one partner floods, the relationship carries that weight.', 'One partner may stay calm while the other escalates.', 'Take a 60-second pause before responding to tension.', 2),
  ('emotional-intelligence', 'empathy', 'Empathy', 1, 'support', 'Empathy looks like a shared strength — you naturally feel each other well.', 'When empathy is uneven, one partner feels unseen even in calm conversation.', 'One partner may prioritize understanding while the other prioritizes responding.', 'Reflect what you heard before you reply.', 3),
  ('emotional-intelligence', 'socialSkills', 'Social Skills', 1, 'support', 'Social skill around connection looks solid for both of you.', 'A gap here can show up as mismatched repair attempts.', 'One partner may navigate conflict smoothly while the other avoids it.', 'Name the emotional state first, then offer the solution.', 4),

-- Intimacy & Closeness
  ('intimacy-closeness', 'emotional', 'Emotional Intimacy', 1, 'support', 'Emotional honesty and depth seem available to both of you.', 'When emotional intimacy is low, the relationship can feel surface-level.', 'One partner may want more depth while the other is comfortable staying light.', 'Share one feeling you normally keep private this week.', 1),
  ('intimacy-closeness', 'physical', 'Physical Intimacy', 1, 'risk', 'Physical closeness appears to be an accessible part of your connection.', 'Mismatch here is one of the most common silent relationship stressors.', 'One partner may want more touch; the other may want less.', 'Create one pressure-free moment of physical closeness.', 2),
  ('intimacy-closeness', 'intellectual', 'Intellectual Intimacy', 1, 'support', 'Intellectual engagement seems like a reliable connector for you both.', 'A gap here can make the relationship feel less stimulating over time.', 'One partner may want deeper conversation; the other prefers lighter topics.', 'Start one conversation about an idea or dream, not a problem.', 3),

-- Financial Values
  ('financial-values', 'attitudes', 'Financial Attitudes', 1, 'support', 'Money attitudes look fairly aligned — financial discussions seem workable.', 'Mismatch here creates silent stress that builds over time.', 'One partner may be more relaxed about money; the other more anxious.', 'Have one transparent money conversation without fixing anything.', 1),
  ('financial-values', 'communication', 'Financial Communication', 1, 'support', 'You seem able to talk about money without it turning hostile.', 'When financial communication is low, decisions get made in the dark.', 'One partner may be open about money; the other avoids it.', 'Name one financial priority you both agree on this week.', 2),
  ('financial-values', 'goals', 'Financial Goals', 1, 'support', 'You seem reasonably aligned on financial direction.', 'Differences here can create drift even when affection is strong.', 'One partner may plan ahead; the other prefers to stay present.', 'Pick one shared financial goal and define the next step.', 3),
  ('financial-values', 'habits', 'Financial Habits', 1, 'risk', 'Daily financial habits appear compatible.', 'Mismatched habits create ongoing friction around spending and saving.', 'One partner may budget carefully; the other prefers flexibility.', 'Agree on one spending threshold before making purchases.', 4),

-- Sexual Compatibility
  ('sexual-compatibility', 'desire', 'Sexual Desire', 1, 'risk', 'Desire seems relatively compatible for both of you.', 'Desire mismatch is one of the most common quiet relationship stressors.', 'One partner may want more; the other less.', 'Talk about desire openly without trying to fix anything yet.', 1),
  ('sexual-compatibility', 'communication', 'Sexual Communication', 1, 'support', 'Sexual communication seems Open and respectful between you.', 'When comfort is uneven, preferences stay unspoken and resentment grows.', 'One partner may name needs freely while the other stays quiet.', 'Share one preference or boundary in a neutral moment.', 2),
  ('sexual-compatibility', 'boundaries', 'Boundaries & Consent', 1, 'risk', 'Boundaries seem clearly established and respected.', 'Unspoken boundaries create vulnerability that is hard to reverse.', 'One partner may set limits more clearly; the other may not realize they exist.', 'Ask directly what makes physical intimacy feel safest.', 3),
  ('sexual-compatibility', 'satisfaction', 'Sexual Satisfaction', 1, 'support', 'Sexual connection appears to be a positive part of the relationship.', 'When satisfaction is uneven, one partner may feel disconnected.', 'One partner may feel fulfilled; the other more neutral.', 'Name one thing that would make physical intimacy feel better.', 4),

-- Relationship Satisfaction
  ('relationship-satisfaction', 'consensus', 'Consensus', 1, 'support', 'You seem aligned on most major decisions and priorities.', 'Lack of consensus on basics can stack up as ongoing friction.', 'One partner may defer often; the other may not notice.', 'Pick one recurring decision and make it explicitly together.', 1),
  ('relationship-satisfaction', 'satisfaction', 'Satisfaction', 1, 'risk', 'Baseline satisfaction looks like a meaningful strength.', 'Low satisfaction can mean the relationship is stable but joyless.', 'One partner may feel content; the other more neutral.', 'Name three things the relationship does well every day for a week.', 2),
  ('relationship-satisfaction', 'cohesion', 'Cohesion', 1, 'support', 'Togetherness and shared time look like genuine connectors for you.', 'Cohesion gaps can make the relationship feel like roommates.', 'One partner may want more togetherness; the other more autonomy.', 'Put one meaningful shared activity on the calendar this week.', 3),

-- Stress & Coping
  ('stress-coping', 'individual', 'Individual Coping', 1, 'support', 'Both of you appear capable of managing stress without dumping it on the relationship.', 'When individual coping is weak, the partnership carries too much weight.', 'One partner may self-regulate well; the other may flood.', 'Build one healthy stress habit that you do for yourself first.', 1),
  ('stress-coping', 'partner', 'Partner Support', 1, 'support', 'Mutual support during stress appears to be a real resource here.', 'Support gaps leave one partner underserved in hard moments.', 'One partner may lean in; the other may not know how to help.', 'Ask explicitly for what you need, then let your partner try it.', 2),
  ('stress-coping', 'team', 'Team Coping', 1, 'risk', 'Team coping around stress looks like a genuine shared strength.', 'Weak team coping makes external stressors into relationship stressors.', 'One partner may rally; the other may withdraw.', 'Treat one external stressor as a shared project this month.', 3),

-- Fun & Personality
  ('fun-personality', 'playfulness', 'Playfulness', 1, 'support', 'Play and lightness look accessible for both of you.', 'When playfulness is mismatched, one partner may feel bored or too serious.', 'One partner may bring humor; the other may not.', 'Plan one deliberately light moment that is just for fun.', 1),
  ('fun-personality', 'activities', 'Shared Activities', 1, 'support', 'Doing things together seems to be a real bonding path for you.', 'Activities gaps mean one partner keeps inviting while the other declines.', 'One partner may seek shared plans; the other prefers low-pressure time.', 'Put one enjoyable shared activity on the calendar.', 2),
  ('fun-personality', 'humor', 'Humor', 1, 'support', 'Laughter looks like a genuine connector here.', 'If humor is uneven, one partner may feel unseen or too teased.', 'One partner may joke to connect; the other to deflect.', 'Use humor to soften tension, not to avoid it.', 3),
  ('fun-personality', 'adventure', 'Adventure', 1, 'support', 'Adventure and curiosity look like shared values.', 'A gap here can make the relationship feel predictable over time.', 'One partner may seek novelty; the other prefers the familiar.', 'Plan one small adventure within the next two weeks.', 4),

-- Appreciation & Gratitude
  ('appreciation-gratitude', 'expression', 'Expression', 1, 'support', 'Gratitude seems easy to express for both of you.', 'Expression gaps make appreciation feel one-directional.', 'One partner may say thanks often; the other assumes it is obvious.', 'Say one specific thank-you every day this week.', 1),
  ('appreciation-gratitude', 'recognition', 'Recognition', 1, 'support', 'Effort recognition looks like a natural strength here.', 'Recognition gaps can make one partner feel invisible.', 'One partner may recognize effort freely; the other may not notice.', 'Name one specific thing your partner did well today.', 2),
  ('appreciation-gratitude', 'positivity', 'Positivity', 1, 'risk', 'Positive tone looks available and accessible to both of you.', 'Low positivity makes even small issues feel heavier than they are.', 'One partner may lean positive; the other more critical.', 'End one day by naming three good things about each other.', 3)

ON CONFLICT (assessment_id, dimension_key) DO UPDATE SET
  label = EXCLUDED.label,
  weight = EXCLUDED.weight,
  priority = EXCLUDED.priority,
  high_shared_text = EXCLUDED.high_shared_text,
  shared_gap_text = EXCLUDED.shared_gap_text,
  asymmetry_text = EXCLUDED.asymmetry_text,
  action_text = EXCLUDED.action_text,
  guidance_order = EXCLUDED.guidance_order;

INSERT INTO couple_relationship_patterns (
  pattern_key,
  title,
  summary,
  default_action,
  default_script,
  severity,
  applicable_assessments
) VALUES
  ('secure-foundation', 'Secure Foundation', 'You have a generally steady relationship structure with enough safety to handle growth.', 'Keep doing what works and protect the habits that create safety.', 'I think we already have a strong base. Can we name what is working and make sure we keep doing it?', 'low', ARRAY['attachment-style','trust-vulnerability','communication-style','relationship-satisfaction']),
  ('pursue-withdraw', 'Pursue / Withdraw', 'One partner moves toward connection or repair while the other protects with distance.', 'Slow the conversation down and make both reassurance and space explicit.', 'When I get scared, I move toward you. When you get overwhelmed, you pull back. Can we talk about what helps each of us feel safe?', 'high', ARRAY['attachment-style','communication-style','conflict-resolution','trust-vulnerability']),
  ('repair-deficit', 'Repair Deficit', 'You may not be settling conflict fully, even when the issue looks small.', 'Add one repair step before the day ends.', 'Can we pause and repair this before we go to bed?', 'high', ARRAY['gottman-four-horsemen','conflict-resolution','relationship-satisfaction','stress-coping']),
  ('values-drift', 'Values Drift', 'You may care about each other but be operating with different maps.', 'Name the differences and build a shared operating plan.', 'We do not need to be identical, but we do need to understand what we are each building.', 'moderate', ARRAY['values-alignment','shared-meaning','financial-values','relationship-satisfaction']),
  ('trust-fragile', 'Trust is Fragile', 'One or both partners do not yet feel fully safe relying on the relationship.', 'Prioritize consistency, transparency, and follow-through.', 'Let’s make trust concrete by keeping small promises and checking in honestly.', 'critical', ARRAY['trust-vulnerability','attachment-style','intimacy-closeness']),
  ('reconnection-opportunity', 'Reconnection Opportunity', 'There is enough goodwill here to make meaningful progress quickly.', 'Use your strongest area to support the weakest one.', 'What is one thing we already do well that could help us with the thing that is hardest?', 'moderate', ARRAY['fun-personality','appreciation-gratitude','communication-style','intimacy-closeness'])
ON CONFLICT (pattern_key) DO UPDATE SET
  title = EXCLUDED.title,
  summary = EXCLUDED.summary,
  default_action = EXCLUDED.default_action,
  default_script = EXCLUDED.default_script,
  severity = EXCLUDED.severity,
  applicable_assessments = EXCLUDED.applicable_assessments;

INSERT INTO assessment_couple_pattern_rules (
  assessment_id,
  pattern_key,
  match_type,
  rule_data,
  priority_order
) VALUES
  ('attachment-style', 'pursue-withdraw', 'attachment-quadrant', '{"anxious":"high","avoidant":"high"}'::JSONB, 1),
  ('attachment-style', 'secure-foundation', 'attachment-quadrant', '{"anxious":"low","avoidant":"low"}'::JSONB, 2),
  ('gottman-four-horsemen', 'repair-deficit', 'numeric', '{"min_gap":18,"max_average":65}'::JSONB, 1),
  ('conflict-resolution', 'repair-deficit', 'numeric', '{"min_gap":18,"max_average":65}'::JSONB, 1),
  ('values-alignment', 'values-drift', 'numeric', '{"min_gap":20,"max_average":65}'::JSONB, 1),
  ('trust-vulnerability', 'trust-fragile', 'numeric', '{"min_floor":45}'::JSONB, 1),
  ('communication-style', 'reconnection-opportunity', 'numeric', '{"min_average":65,"min_floor":55}'::JSONB, 1)
ON CONFLICT (assessment_id, pattern_key, match_type) DO UPDATE SET
  rule_data = EXCLUDED.rule_data,
  priority_order = EXCLUDED.priority_order;
