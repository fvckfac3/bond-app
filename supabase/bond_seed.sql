-- BOND Seeds — Assessments, Couple Rules, Patterns, Onboarding, Learning Series
-- Requires bond_schema.sql to be run first

-- ============================================================
-- ASSESSMENTS (16)
-- ============================================================

INSERT INTO assessments (id,name,framework,description,estimated_time,questions_count,icon,category,intro_title,intro_description,result_description,scoring_mode,content_version) VALUES
  ('love-languages','Love Languages','Five Love Languages (Gary Chapman)','Discover how you and your partner prefer to give and receive love.','8 min',30,'❤️','connection','How do you experience love?','This reveals your primary love language and how you prefer to give and receive affection.','Your love language profile.','preference','v2'),
  ('attachment-style','Attachment Style','Attachment Theory (Bowlby & Ainsworth)','Understand your attachment patterns and how they shape your relationship.','6 min',20,'🔗','emotional','How do you connect emotionally?','Attachment style influences how you seek closeness, handle anxiety, and maintain independence.','Your attachment style.','quadrant','v2'),
  ('communication-style','Communication Style','Nonviolent Communication (Rosenberg)','Explore how you communicate needs, feelings, and boundaries.','5 min',15,'💬','communication','How do you express yourself?','Discover your strengths and growth areas.','Your communication profile.','profile','v2'),
  ('gottman-four-horsemen','Four Horsemen','Gottman Method','Identify destructive communication patterns.','7 min',20,'🐴','communication','Are hidden patterns hurting your connection?','The Four Horsemen are criticism, contempt, defensiveness, and stonewalling.','Understanding these patterns.','risk-profile','v2'),
  ('conflict-resolution','Conflict Resolution','Gottman Conflict Management','Discover your conflict resolution styles.','8 min',25,'⚡','conflict','How do you handle disagreements?','How you navigate moments of disagreement determines relationship health.','Your conflict style.','mixed-profile','v2'),
  ('values-alignment','Values Alignment','ACT','Explore shared values and life priorities.','10 min',30,'🎯','values','What truly matters to you both?','Shared values create shared purpose.','Your values profile.','profile','v2'),
  ('emotional-intelligence','Emotional Intelligence','Goleman EQ Model','Assess emotional awareness, regulation, and responsiveness.','8 min',24,'🧠','emotional','How well do you manage emotions?','High EQ is linked to stronger relationships.','Your EQ profile.','profile','v2'),
  ('intimacy-closeness','Intimacy & Closeness','Sternberg Triangular Theory','Measure emotional, physical, and intellectual intimacy.','9 min',27,'💕','intimacy','How intimate is your connection?','True intimacy combines emotional, physical, and intellectual depth.','Your intimacy profile.','profile','v2'),
  ('trust-vulnerability','Trust & Vulnerability','Brené Brown Research','Evaluate trust and comfort with vulnerability.','7 min',18,'🛡️','trust','How safe do you feel being vulnerable?','Trust is built through consistent vulnerability.','Your trust profile.','profile','v2'),
  ('financial-values','Financial Values','Financial Therapy','Understand money beliefs, spending, and communication.','8 min',22,'💰','values','How do your money values align?','Financial stress is a leading cause of relationship tension.','Your financial profile.','profile','v2'),
  ('sexual-compatibility','Sexual Compatibility','Sexual Health Models','Explore desires, boundaries, and sexual communication.','10 min',25,'🔥','intimacy','How aligned are your sexual needs?','Sexual compatibility requires openness, understanding, and mutual respect.','Your sexual compatibility.','profile','v2'),
  ('shared-meaning','Shared Meaning','Gottman Sound Relationship House','Build shared rituals, goals, and life dreams.','12 min',30,'🏡','connection','What shared story are you building?','Shared meaning gives you a joint vision for the future.','Your shared meaning profile.','profile','v2'),
  ('relationship-satisfaction','Relationship Satisfaction','RDAS','Overall relationship quality and satisfaction.','6 min',14,'⭐','general','How satisfied are you?','A complete picture of relationship wellness.','Your satisfaction profile.','profile','v2'),
  ('stress-coping','Stress & Coping','Lazarus & Folkman','How you handle stress as a couple.','7 min',20,'🌊','resilience','How do you navigate stress together?','Stress can strain or strengthen relationships.','Your stress coping profile.','profile','v2'),
  ('fun-personality','Fun & Personality','Leisure & Play Research','Explore how you enjoy time together.','6 min',18,'🎉','connection','How do you have fun together?','Play and laughter are essential for long-term satisfaction.','Your fun profile.','profile','v2'),
  ('appreciation-gratitude','Appreciation & Gratitude','Positive Psychology','How you express and receive appreciation.','5 min',15,'🙏','connection','Do you feel appreciated?','Gratitude is among the strongest predictors of satisfaction.','Your appreciation profile.','profile','v2')
ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,framework=EXCLUDED.framework,description=EXCLUDED.description,estimated_time=EXCLUDED.estimated_time,questions_count=EXCLUDED.questions_count,icon=EXCLUDED.icon,category=EXCLUDED.category,intro_title=EXCLUDED.intro_title,intro_description=EXCLUDED.intro_description,result_description=EXCLUDED.result_description,scoring_mode=EXCLUDED.scoring_mode,content_version=EXCLUDED.content_version;

-- ============================================================
-- DIMENSIONS
-- ============================================================

INSERT INTO assessment_dimensions (assessment_id,dimension_key,label,direction,weight,sort_order) VALUES
  ('love-languages','words','Words of Affirmation','positive',1,1),('love-languages','time','Quality Time','positive',1,2),('love-languages','gifts','Receiving Gifts','positive',1,3),('love-languages','acts','Acts of Service','positive',1,4),('love-languages','touch','Physical Touch','positive',1,5),
  ('attachment-style','anxiety','Attachment Anxiety','risk',1,1),('attachment-style','avoidance','Attachment Avoidance','risk',1,2),
  ('communication-style','expression','Expression','positive',1,1),('communication-style','listening','Listening','positive',1,2),('communication-style','validation','Validation','positive',1,3),('communication-style','accountability','Accountability','positive',1,4),
  ('gottman-four-horsemen','criticism','Criticism','risk',1,1),('gottman-four-horsemen','contempt','Contempt','risk',1,2),('gottman-four-horsemen','defensiveness','Defensiveness','risk',1,3),('gottman-four-horsemen','stonewalling','Stonewalling','risk',1,4),
  ('conflict-resolution','avoidance','Avoidance','risk',1,1),('conflict-resolution','composure','Composure','positive',1,2),('conflict-resolution','compromise','Compromise','positive',1,3),('conflict-resolution','empathy','Empathy','positive',1,4),('conflict-resolution','repair','Repair','positive',1,5),
  ('values-alignment','family','Family','positive',1,1),('values-alignment','finance','Finance','positive',1,2),('values-alignment','spirituality','Spirituality','positive',1,3),('values-alignment','lifestyle','Lifestyle','positive',1,4),('values-alignment','relationships','Relationships','positive',1,5),('values-alignment','goals','Goals','positive',1,6),
  ('emotional-intelligence','selfAwareness','Self-awareness','positive',1,1),('emotional-intelligence','selfRegulation','Self-regulation','positive',1,2),('emotional-intelligence','empathy','Empathy','positive',1,3),('emotional-intelligence','socialSkills','Social Skills','positive',1,4),
  ('intimacy-closeness','emotional','Emotional Intimacy','positive',1,1),('intimacy-closeness','physical','Physical Intimacy','positive',1,2),('intimacy-closeness','intellectual','Intellectual Intimacy','positive',1,3),
  ('trust-vulnerability','trust','Trust','positive',1,1),('trust-vulnerability','vulnerability','Vulnerability','positive',1,2),('trust-vulnerability','safety','Safety','positive',1,3),
  ('financial-values','attitudes','Money Attitudes','positive',1,1),('financial-values','communication','Money Communication','positive',1,2),('financial-values','goals','Financial Goals','positive',1,3),('financial-values','habits','Money Habits','positive',1,4),
  ('sexual-compatibility','desire','Sexual Desire','positive',1,1),('sexual-compatibility','communication','Sexual Communication','positive',1,2),('sexual-compatibility','boundaries','Boundaries','positive',1,3),('sexual-compatibility','satisfaction','Satisfaction','positive',1,4),
  ('shared-meaning','rituals','Rituals','positive',1,1),('shared-meaning','goals','Goals','positive',1,2),('shared-meaning','roles','Roles','positive',1,3),('shared-meaning','legacy','Legacy','positive',1,4),('shared-meaning','growth','Growth','positive',1,5),
  ('relationship-satisfaction','consensus','Consensus','positive',1,1),('relationship-satisfaction','satisfaction','Satisfaction','positive',1,2),('relationship-satisfaction','cohesion','Cohesion','positive',1,3),
  ('stress-coping','individual','Individual Coping','positive',1,1),('stress-coping','partner','Partner Support','positive',1,2),('stress-coping','team','Team Coping','positive',1,3),
  ('fun-personality','playfulness','Playfulness','positive',1,1),('fun-personality','activities','Shared Activities','positive',1,2),('fun-personality','humor','Humor','positive',1,3),('fun-personality','adventure','Adventure','positive',1,4),
  ('appreciation-gratitude','expression','Expression','positive',1,1),('appreciation-gratitude','recognition','Recognition','positive',1,2),('appreciation-gratitude','positivity','Positivity','positive',1,3)
ON CONFLICT (assessment_id,dimension_key) DO UPDATE SET label=EXCLUDED.label,direction=EXCLUDED.direction,weight=EXCLUDED.weight,sort_order=EXCLUDED.sort_order;

-- ============================================================
-- BANDS
-- ============================================================

INSERT INTO assessment_bands (assessment_id,band_key,min_score,max_score,title,summary,recommendation,sort_order) VALUES
  ('love-languages','needs-attention',0,39,'Needs attention','Needs more care and conversation.','Pick one small habit and repeat it daily.',1),
  ('love-languages','developing',40,59,'Developing','Good foundations but uneven.','Focus on one recurring moment.',2),
  ('love-languages','strong',60,79,'Strong','Solid and generally healthy.','Protect what works and keep practicing.',3),
  ('love-languages','exceptional',80,100,'Exceptional','A genuine relationship strength.','Keep reinforcing it.',4),
  ('attachment-style','needs-attention',0,39,'Needs attention','Attachment patterns may be creating instability.','Build predictability and direct reassurance.',1),
  ('attachment-style','developing',40,59,'Developing','Some insecurity affecting closeness.','Practice sharing emotions and staying present.',2),
  ('attachment-style','strong',60,79,'Strong','Generally secure attachment patterns.','Protect safety and keep building trust.',3),
  ('attachment-style','exceptional',80,100,'Exceptional','Strong, secure attachment.','Use this base to support growth.',4)
ON CONFLICT (assessment_id,band_key) DO UPDATE SET min_score=EXCLUDED.min_score,max_score=EXCLUDED.max_score,title=EXCLUDED.title,summary=EXCLUDED.summary,recommendation=EXCLUDED.recommendation,sort_order=EXCLUDED.sort_order;

-- ============================================================
-- QUESTIONS (sampled — full in app code)
-- ============================================================

INSERT INTO assessment_questions (assessment_id,question_key,question_text,question_type,scale,category,reverse,sort_order) VALUES
  ('love-languages',1,'I feel most loved when my partner tells me they love me or compliments me','likert',5,'words',false,1),
  ('love-languages',2,'Hearing encouraging words means more than any gift','likert',5,'words',false,2),
  ('love-languages',3,'I appreciate it when my partner acknowledges my efforts, even for small things','likert',5,'words',false,3),
  ('love-languages',4,'Written notes or text messages expressing love mean a lot to me','likert',5,'words',false,4),
  ('love-languages',5,'When my partner criticizes me with harsh words, I feel deeply hurt','likert',5,'words',true,5),
  ('love-languages',6,'I feel closest when my partner says kind things about me to others','likert',5,'words',false,6),
  ('love-languages',7,'I feel most loved when my partner gives me their undivided attention','likert',5,'time',false,7),
  ('love-languages',8,'I value time spent together more than receiving gifts','likert',5,'time',false,8),
  ('love-languages',9,'When my partner is distracted or on their phone during time together, I feel neglected','likert',5,'time',true,9),
  ('love-languages',10,'I love making plans for just the two of us with no distractions','likert',5,'time',false,10),
  ('love-languages',11,'Scheduled date nights are important to me','likert',5,'time',false,11),
  ('love-languages',12,'I feel loved when we spend an evening talking and catching up','likert',5,'time',false,12),
  ('love-languages',13,'I feel most loved when my partner gives me thoughtful gifts','likert',5,'gifts',false,13),
  ('love-languages',14,'The effort my partner puts into finding a meaningful gift shows me they care','likert',5,'gifts',false,14),
  ('love-languages',15,'I feel hurt when my partner forgets important occasions','likert',5,'gifts',true,15),
  ('love-languages',16,'Surprise gifts or little tokens of affection make me feel special','likert',5,'gifts',false,16),
  ('love-languages',17,'I appreciate when my partner picks up small things they know I would like','likert',5,'gifts',false,17),
  ('love-languages',18,'A gift does not need to be expensive to be meaningful—what matters is the thought','likert',5,'gifts',false,18),
  ('love-languages',19,'I feel most loved when my partner does helpful things for me without being asked','likert',5,'acts',false,19),
  ('love-languages',20,'When my partner takes care of tasks I usually handle, I feel truly cared for','likert',5,'acts',false,20),
  ('love-languages',21,'I feel hurt and unappreciated when I am overwhelmed and my partner does not help','likert',5,'acts',true,21),
  ('love-languages',22,'I appreciate when my partner actively looks for ways to make my life easier','likert',5,'acts',false,22),
  ('love-languages',23,'Actions speak louder than words to me—doing shows love more than saying it','likert',5,'acts',false,23),
  ('love-languages',24,'When my partner cooks a meal for me or helps with chores, I feel deeply loved','likert',5,'acts',false,24),
  ('love-languages',25,'I feel most loved when my partner holds my hand, hugs me, or shows physical affection','likert',5,'touch',false,25),
  ('love-languages',26,'Physical closeness and touch are essential to me feeling connected','likert',5,'touch',false,26),
  ('love-languages',27,'When my partner pulls away from physical touch, I feel rejected and unloved','likert',5,'touch',true,27),
  ('love-languages',28,'I love cuddling, kissing, and general physical affection throughout the day','likert',5,'touch',false,28),
  ('love-languages',29,'Physical touch is my primary way of feeling emotionally close','likert',5,'touch',false,29),
  ('love-languages',30,'A warm embrace after a long day means more than any verbal reassurance','likert',5,'touch',false,30),
  ('attachment-style',1,'I worry that my partner does not love me as much as I love them','likert',5,'anxiety',false,1),
  ('attachment-style',2,'I am afraid that my partner might want to leave me','likert',5,'anxiety',false,2),
  ('attachment-style',3,'I often wish my partner would show more emotion and affection','likert',5,'anxiety',false,3),
  ('attachment-style',4,'I need a lot of reassurance that my partner loves me','likert',5,'anxiety',false,4),
  ('attachment-style',5,'I often feel anxious when my partner is not around','likert',5,'anxiety',false,5),
  ('attachment-style',6,'I often wonder whether my partner really cares about me','likert',5,'anxiety',false,6),
  ('attachment-style',7,'When my partner does something hurtful, I cannot stop thinking about it','likert',5,'anxiety',false,7),
  ('attachment-style',8,'I feel jealous when my partner spends time with others','likert',5,'anxiety',false,8),
  ('attachment-style',9,'I am afraid of being abandoned in this relationship','likert',5,'anxiety',false,9),
  ('attachment-style',10,'I often feel that my partner does not fully understand me','likert',5,'anxiety',false,10),
  ('attachment-style',11,'I find it difficult to get emotionally close to my partner','likert',5,'avoidance',false,11),
  ('attachment-style',12,'I prefer not to show my partner how I feel deep down','likert',5,'avoidance',false,12),
  ('attachment-style',13,'I feel uncomfortable depending on my partner','likert',5,'avoidance',false,13),
  ('attachment-style',14,'I am better at solving problems on my own','likert',5,'avoidance',false,14),
  ('attachment-style',15,'I do not like to rely on others for emotional support','likert',5,'avoidance',false,15),
  ('attachment-style',16,'I keep my thoughts and feelings private even from my partner','likert',5,'avoidance',false,16),
  ('attachment-style',17,'I become uncomfortable when a partner gets too close','likert',5,'avoidance',false,17),
  ('attachment-style',18,'I feel suffocated when a relationship gets too intense','likert',5,'avoidance',false,18),
  ('attachment-style',19,'I am fine with my partner depending on me, but not the other way around','likert',5,'avoidance',false,19),
  ('attachment-style',20,'I find it hard to let my guard down even in close relationships','likert',5,'avoidance',false,20),
  ('communication-style',1,'I can clearly state what I need in a conversation','likert',5,'expression',false,1),
  ('communication-style',2,'I express my feelings openly rather than holding them in','likert',5,'expression',false,2),
  ('communication-style',3,'I am able to ask for what I need directly','likert',5,'expression',false,3),
  ('communication-style',4,'I can communicate difficult truths without becoming aggressive','likert',5,'expression',false,4),
  ('communication-style',5,'I can share needs and feelings without blaming my partner','likert',5,'expression',false,5),
  ('communication-style',6,'I listen to understand rather than to respond','likert',5,'listening',false,6),
  ('communication-style',7,'I can hear feedback without becoming defensive','likert',5,'listening',false,7),
  ('communication-style',8,'My partner feels heard when we talk','likert',5,'listening',false,8),
  ('communication-style',9,'I can stay present in a conversation even when the topic is hard','likert',5,'listening',false,9),
  ('communication-style',10,'I do not interrupt or finish my partner sentences','likert',5,'listening',false,10),
  ('communication-style',11,'I acknowledge my partner feelings before offering a solution','likert',5,'validation',false,11),
  ('communication-style',12,'I can validate an emotion even when I disagree with the perspective','likert',5,'validation',false,12),
  ('communication-style',13,'My partner feels understood by me','likert',5,'validation',false,13),
  ('communication-style',14,'I do not dismiss or minimize my partner feelings','likert',5,'validation',false,14),
  ('communication-style',15,'I can respond to emotions without trying to fix everything immediately','likert',5,'validation',false,15),
  ('gottman-four-horsemen',1,'I make critical statements about my partner character or personality','likert',5,'criticism',false,1),
  ('gottman-four-horsemen',2,'I use words like always or never when raising complaints','likert',5,'criticism',false,2),
  ('gottman-four-horsemen',3,'I attack my partner to make a point','likert',5,'criticism',false,3),
  ('gottman-four-horsemen',4,'I sometimes say things like you are selfish or you do not care','likert',5,'criticism',false,4),
  ('gottman-four-horsemen',5,'I use sarcasm or mockery when my partner upsets me','likert',5,'contempt',false,5),
  ('gottman-four-horsemen',6,'I mock or imitate my partner when we disagree','likert',5,'contempt',false,6),
  ('gottman-four-horsemen',7,'I roll my eyes or show disrespect when my partner is talking','likert',5,'contempt',false,7),
  ('gottman-four-horsemen',8,'I have used hostile humor or put-downs during arguments','likert',5,'contempt',false,8),
  ('gottman-four-horsemen',9,'When my partner raises a concern, my first reaction is to explain myself','likert',5,'defensiveness',false,9),
  ('gottman-four-horsemen',10,'I respond to complaints by denying responsibility','likert',5,'defensiveness',false,10),
  ('gottman-four-horsemen',11,'I make excuses for my behavior instead of addressing the issue','likert',5,'defensiveness',false,11),
  ('gottman-four-horsemen',12,'I turn my partner concerns back on them','likert',5,'defensiveness',false,12),
  ('gottman-four-horsemen',13,'I go silent or withhold engagement when we are in conflict','likert',5,'stonewalling',false,13),
  ('gottman-four-horsemen',14,'I withdraw emotionally during disagreements','likert',5,'stonewalling',false,14),
  ('gottman-four-horsemen',15,'I catastrophize or mentally check out during arguments','likert',5,'stonewalling',false,15),
  ('gottman-four-horsemen',16,'I refuse to engage even when my partner is trying to resolve something','likert',5,'stonewalling',false,16),
  ('gottman-four-horsemen',17,'When I stonewall, I feel overwhelmed and cannot process','likert',5,'stonewalling',false,17),
  ('gottman-four-horsemen',18,'I shut down to protect myself from feeling flooded','likert',5,'stonewalling',false,18),
  ('gottman-four-horsemen',19,'My heart rate goes up during conflict and I need to calm down first','likert',5,'stonewalling',false,19),
  ('gottman-four-horsemen',20,'I have needed to leave mid-conversation to prevent saying something I regret','likert',5,'stonewalling',false,20)
ON CONFLICT (assessment_id,question_key) DO UPDATE SET question_text=EXCLUDED.question_text,question_type=EXCLUDED.question_type,scale=EXCLUDED.scale,category=EXCLUDED.category,reverse=EXCLUDED.reverse,sort_order=EXCLUDED.sort_order;

-- ============================================================
-- COUPLE RULES
-- ============================================================

INSERT INTO assessment_couple_rules (assessment_id,scoring_version,average_weight,alignment_weight,floor_weight,high_gap_threshold,shared_strength_threshold,shared_growth_threshold,low_floor_threshold,notes) VALUES
  ('love-languages','couple-v1',0.35,0.45,0.20,30,72,55,45,'Alignment matters more than raw average because love language mismatch affects daily expression.'),
  ('attachment-style','couple-v1',0.25,0.35,0.40,20,70,52,40,'Lowest score matters most because attachment insecurity can dominate the dynamic.'),
  ('communication-style','couple-v1',0.30,0.35,0.35,22,72,55,45,'Balance clarity, listening, validation, and accountability.'),
  ('gottman-four-horsemen','couple-v1',0.20,0.35,0.45,18,75,58,45,'Risk floor matters most because high horsemen scores can destabilize repair.'),
  ('conflict-resolution','couple-v1',0.30,0.30,0.40,22,70,55,45,'Repair and composure matter more than average conflict comfort.'),
  ('values-alignment','couple-v1',0.35,0.30,0.35,25,72,55,50,'Shared direction matters as much as the score itself.'),
  ('emotional-intelligence','couple-v1',0.33,0.33,0.34,22,72,56,45,'Emotional skill is strongest when both people self-regulate and empathize.'),
  ('intimacy-closeness','couple-v1',0.30,0.35,0.35,22,72,55,45,'Connection should be judged by the lower score when safety or closeness is weak.'),
  ('trust-vulnerability','couple-v1',0.25,0.35,0.40,20,72,55,45,'Trust is constrained by the least safe partner.'),
  ('financial-values','couple-v1',0.30,0.35,0.35,24,72,55,45,'Money alignment should surface the habits and conversation behind the score.'),
  ('sexual-compatibility','couple-v1',0.25,0.35,0.40,20,72,55,45,'The lower score should carry more weight because desire and safety both matter.'),
  ('shared-meaning','couple-v1',0.35,0.30,0.35,24,72,55,48,'Rituals and goals matter more than a single number.'),
  ('relationship-satisfaction','couple-v1',0.35,0.30,0.35,22,72,55,50,'Satisfaction should be interpreted with both average and mismatch.'),
  ('stress-coping','couple-v1',0.30,0.30,0.40,22,70,55,45,'A good team can still struggle if one partner is overwhelmed.'),
  ('fun-personality','couple-v1',0.35,0.30,0.35,22,70,54,45,'Fun should reflect shared joy, not just individual playfulness.'),
  ('appreciation-gratitude','couple-v1',0.35,0.30,0.35,20,72,55,48,'Gratitude is most useful when both people give and receive it consistently.')
ON CONFLICT (assessment_id) DO UPDATE SET scoring_version=EXCLUDED.scoring_version,average_weight=EXCLUDED.average_weight,alignment_weight=EXCLUDED.alignment_weight,floor_weight=EXCLUDED.floor_weight,high_gap_threshold=EXCLUDED.high_gap_threshold,shared_strength_threshold=EXCLUDED.shared_strength_threshold,shared_growth_threshold=EXCLUDED.shared_growth_threshold,low_floor_threshold=EXCLUDED.low_floor_threshold,notes=EXCLUDED.notes;

-- ============================================================
-- COUPLE DIMENSION RULES
-- ============================================================

INSERT INTO assessment_couple_dimension_rules (assessment_id,dimension_key,label,weight,priority,high_shared_text,shared_gap_text,asymmetry_text,action_text,guidance_order) VALUES
  ('love-languages','words','Words of Affirmation',1,'support','You both value verbal reassurance—praise and kindness are very effective.','You may be speaking different emotional dialects, so expressions of care can miss.','One partner may need more reassurance than the other naturally gives.','Use one specific appreciation and one specific request every day.',1),
  ('love-languages','time','Quality Time',1,'support','Shared attention is already a strong connector for you.','A mismatch here usually shows up as one person feeling neglected or crowded.','One of you may want togetherness while the other wants less intensity.','Protect one no-phone block of time together.',2),
  ('love-languages','gifts','Receiving Gifts',1,'support','Thoughtful gestures land well for both of you.','The relationship may feel uneven if one person uses gifts and the other ignores them.','One partner may show love through effort while the other wants visible symbols.','Exchange one small meaningful token this week.',3),
  ('love-languages','acts','Acts of Service',1,'support','Practical care is a real strength in your relationship.','If one of you is low here, helpfulness can feel invisible or controlling.','One partner may feel loved by action while the other wants emotional acknowledgment.','Do one concrete task for each other without being asked.',4),
  ('love-languages','touch','Physical Touch',1,'support','Physical affection appears to be a reliable source of closeness.','A mismatch can make affection feel too much for one person and too little for the other.','One partner may need more touch than the other naturally offers.','Create one safe touch ritual that you both agree on.',5),
  ('attachment-style','anxiety','Attachment Anxiety',1,'risk','Lower anxiety here helps both people feel steadier.','When both scores are high, reassurance becomes a major need.','One person may seek closeness while the other feels pressure from it.','Practice direct reassurance and a predictable check-in habit.',1),
  ('attachment-style','avoidance','Attachment Avoidance',1,'risk','Lower avoidance supports easy closeness and repair. When avoidance is high on either side, emotional distance can become the default response in tense moments. One person may pursue connection while the other protects with space. The avoidant pattern is not rejection—it is self-protection. But it can leave the pursuing partner feeling alone.','Share one honest feeling before you withdraw. If you are the partner who withdraws, name that you need space rather than disappearing.','One partner may need more space while the other needs more closeness.','Practice stating your need for space clearly, and agree on a time to reconnect.',2),
  ('communication-style','expression','Expression',1,'support','You can usually say what matters in a direct way.','A mismatch may create unclear asks and built-up resentment.','One partner may communicate more openly than the other can absorb.','Use one clear I-statement before the next hard topic.',1),
  ('communication-style','listening','Listening',1,'support','Listening appears to be a shared strength.','A gap here often means one person feels unheard even when both are talking.','One person may speak to be understood while the other speaks to respond.','Paraphrase first, then reply.',2),
  ('communication-style','validation','Validation',1,'support','You may already know how to make things understood.','If validation is uneven, people can feel dismissed even in calm conversations.','One partner may want empathy while the other jumps to solutions.','Name the feeling before offering advice.',3),
  ('communication-style','accountability','Accountability',1,'support','Owning your part could be a real asset here.','When accountability is weak, conflict can become a blame contest.','One partner may apologize more easily than the other.','Start with your part first when tension rises.',4),
  ('gottman-four-horsemen','criticism','Criticism',1,'risk','Low criticism means conversations are less likely to attack the person.','A mismatch can make one person feel routinely blamed or unsafe.','One partner may complain while the other experiences it as attack.','Replace global blame with one specific request.',1),
  ('gottman-four-horsemen','contempt','Contempt',1,'risk','Low contempt is a major protective factor.','If contempt is high for either person, the bond is getting corroded.','One partner may feel superior, the other devalued.','Remove sarcasm, eye-rolling, and disrespect immediately.',2),
  ('gottman-four-horsemen','defensiveness','Defensiveness',1,'risk','Lower defensiveness makes repair much easier.','High defensiveness usually means the conversation never fully resolves.','One person may explain themselves instead of hearing the impact.','Own one part before defending your intent.',3),
  ('gottman-four-horsemen','stonewalling','Stonewalling',1,'risk','Low stonewalling means you can stay engaged under stress.','If one person shuts down, repair gets delayed or abandoned.','One partner may pursue while the other disappears.','Take a short pause and return to finish the conversation.',4),
  ('conflict-resolution','avoidance','Avoidance',1,'risk','Lower avoidance means problems are less likely to pile up.','A mismatch here often means one person wants resolution and the other wants distance.','One partner may push to talk while the other goes quiet.','Pick a time to return to the issue instead of leaving it open.',1),
  ('conflict-resolution','composure','Composure',1,'support','You likely keep the temperature manageable even in hard conversations.','When composure slips, small issues become big ones quickly.','One person may stay regulated while the other escalates.','Lower the temperature first—the topic can wait 20 minutes.',2),
  ('conflict-resolution','compromise','Compromise',1,'support','You likely find workable middle ground without either person giving up too much.','A mismatch means one person gets their way while the other habitually concedes.','One partner may push for their solution while the other disengages.','Find the third option that gives both of you something.',3),
  ('conflict-resolution','empathy','Empathy',1,'support','You likely understand each other well even in tension.','When empathy is low, people feel dismissed long after the conversation ends.','One partner may understand while the other still feels unheard.','Reflect back what you believe the other person feels.',4),
  ('conflict-resolution','repair','Repair',1,'support','You likely know how to come back together after strain.','When repair is low, small problems stay emotionally alive too long.','One person may try to repair while the other still feels hurt.','Use a repair attempt within the same day.',5),
  ('trust-vulnerability','trust','Trust',1,'risk','Trust looks like a reliable base here.','Low trust on either side is a relationship-wide bottleneck.','One partner may need proof while the other expects goodwill.','Keep one promise you make this week.',1),
  ('trust-vulnerability','vulnerability','Vulnerability',1,'support','You can probably share more than average without feeling exposed.','A gap here means one person has not yet felt safe enough to open up.','One person may reveal more while the other stays guarded.','Say one honest thing you usually leave unsaid.',2),
  ('trust-vulnerability','safety','Safety',1,'risk','Emotional safety looks like a meaningful strength.','When safety is low, every other score becomes less stable.','One partner may react quickly to threat while the other minimizes it.','Build one predictable moment of safety on purpose.',3),
  ('shared-meaning','rituals','Rituals',1,'support','Your daily or weekly rituals likely give the relationship structure.','A mismatch can make the relationship feel less anchored.','One partner may want more ritual than the other naturally creates.','Create one repeatable ritual you can both keep.',1),
  ('shared-meaning','goals','Goals',1,'support','You may already be moving in a similar direction.','A gap here can create a sense that you are building different lives.','One partner may want clarity while the other stays vague.','Pick one shared goal and define the next step.',2),
  ('shared-meaning','roles','Roles',1,'support','Roles and responsibilities feel clear and workable.','A mismatch here can create ongoing silent resentment.','One partner may carry more invisible load than the other realizes.','Review one recurring responsibility and agree on who handles it.',3),
  ('shared-meaning','legacy','Legacy',1,'support','You may share a strong sense of what you want this relationship to stand for.','If legacy is weak, values can feel abstract instead of lived.','One partner may think about the future while the other thinks about the present.','Talk about the kind of partnership you want to be remembered for.',4),
  ('shared-meaning','growth','Growth',1,'support','You both support each other evolving.','When growth is uneven, one partner may feel held back.','One partner may push for growth while the other is content with the status quo.','Share one goal for who you want to become, individually and together.',5),
  ('emotional-intelligence','selfAwareness','Self-awareness',1,'support','You both have good access to your own emotional landscape.','A gap here often means one person names feelings while the other acts on them.','One partner may be tuned in while the other runs on autopilot.','Practice naming one feeling out loud before reacting.',1),
  ('emotional-intelligence','selfRegulation','Self-regulation',1,'support','Both of you can generally stay regulated under pressure.','If one partner floods, the relationship carries that weight.','One partner may stay calm while the other escalates.','Take a 60-second pause before responding to tension.',2),
  ('emotional-intelligence','empathy','Empathy',1,'support','Empathy looks like a shared strength—you naturally feel each other well.','When empathy is uneven, one partner feels unseen even in calm conversation.','One partner may prioritize understanding while the other prioritizes responding.','Reflect what you heard before you reply.',3),
  ('emotional-intelligence','socialSkills','Social Skills',1,'support','Social skill around connection looks solid for both of you.','A gap here can show up as mismatched repair attempts.','One partner may navigate conflict smoothly while the other avoids it.','Name the emotional state first, then offer the solution.',4),
  ('intimacy-closeness','emotional','Emotional Intimacy',1,'support','Emotional honesty and depth seem available to both of you.','When emotional intimacy is low, the relationship can feel surface-level.','One partner may want more depth while the other is comfortable staying light.','Share one feeling you normally keep private this week.',1),
  ('intimacy-closeness','physical','Physical Intimacy',1,'risk','Physical closeness appears to be an accessible part of your connection.','Mismatch here is one of the most common silent relationship stressors.','One partner may want more touch; the other may want less.','Create one pressure-free moment of physical closeness.',2),
  ('intimacy-closeness','intellectual','Intellectual Intimacy',1,'support','Intellectual engagement seems like a reliable connector for you both.','A gap here can make the relationship feel less stimulating over time.','One partner may want deeper conversation; the other prefers lighter topics.','Start one conversation about an idea or dream, not a problem.',3),
  ('financial-values','attitudes','Financial Attitudes',1,'support','Money attitudes look fairly aligned—financial discussions seem workable.','Mismatch here creates silent stress that builds over time.','One partner may be more relaxed about money; the other more anxious.','Have one transparent money conversation without fixing anything.',1),
  ('financial-values','communication','Financial Communication',1,'support','You seem able to talk about money without it turning hostile.','When financial communication is low, decisions get made in the dark.','One partner may be open about money; the other avoids it.','Name one financial priority you both agree on this week.',2),
  ('financial-values','goals','Financial Goals',1,'support','You seem reasonably aligned on financial direction.','Differences here can create drift even when affection is strong.','One partner may plan ahead; the other prefers to stay present.','Pick one shared financial goal and define the next step.',3),
  ('financial-values','habits','Financial Habits',1,'risk','Daily financial habits appear compatible.','Mismatched habits create ongoing friction around spending and saving.','One partner may budget carefully; the other prefers flexibility.','Agree on one spending threshold before making purchases.',4),
  ('sexual-compatibility','desire','Sexual Desire',1,'risk','Desire seems relatively compatible for both of you.','Desire mismatch is one of the most common quiet relationship stressors.','One partner may want more; the other less.','Talk about desire openly without trying to fix anything yet.',1),
  ('sexual-compatibility','communication','Sexual Communication',1,'support','Sexual communication seems open and respectful between you.','When comfort is uneven, preferences stay unspoken and resentment grows.','One partner may name needs freely while the other stays quiet.','Share one preference or boundary in a neutral moment.',2),
  ('sexual-compatibility','boundaries','Boundaries',1,'risk','Boundaries seem clearly established and respected.','Unspoken boundaries create vulnerability that is hard to reverse.','One partner may set limits more clearly; the other may not realize they exist.','Ask directly what makes physical intimacy feel safest.',3),
  ('sexual-compatibility','satisfaction','Sexual Satisfaction',1,'support','Sexual connection appears to be a positive part of the relationship.','When satisfaction is uneven, one partner may feel disconnected.','One partner may feel fulfilled; the other more neutral.','Name one thing that would make physical intimacy feel better.',4),
  ('relationship-satisfaction','consensus','Consensus',1,'support','You seem aligned on most major decisions and priorities.','Lack of consensus on basics can stack up as ongoing friction.','One partner may defer often; the other may not notice.','Pick one recurring decision and make it explicitly together.',1),
  ('relationship-satisfaction','satisfaction','Satisfaction',1,'risk','Baseline satisfaction looks like a meaningful strength.','Low satisfaction can mean the relationship is stable but joyless.','One partner may feel content; the other more neutral.','Name three things the relationship does well every day for a week.',2),
  ('relationship-satisfaction','cohesion','Cohesion',1,'support','Togetherness and shared time look like genuine connectors for you.','Cohesion gaps can make the relationship feel like roommates.','One partner may want more togetherness; the other more autonomy.','Put one meaningful shared activity on the calendar this week.',3),
  ('stress-coping','individual','Individual Coping',1,'support','Both of you appear capable of managing stress without dumping it on the relationship.','When individual coping is weak, the partnership carries too much weight.','One partner may self-regulate well; the other may flood.','Build one healthy stress habit that you do for yourself first.',1),
  ('stress-coping','partner','Partner Support',1,'support','Mutual support during stress appears to be a real resource here.','Support gaps leave one partner underserved in hard moments.','One partner may lean in; the other may not know how to help.','Ask explicitly for what you need, then let your partner try it.',2),
  ('stress-coping','team','Team Coping',1,'risk','Team coping around stress looks like a genuine shared strength.','Weak team coping makes external stressors into relationship stressors.','One partner may rally; the other may withdraw.','Treat one external stressor as a shared project this month.',3),
  ('fun-personality','playfulness','Playfulness',1,'support','Play and lightness look accessible for both of you.','When playfulness is mismatched, one partner may feel bored or too serious.','One partner may bring humor; the other may not.','Plan one deliberately light moment that is just for fun.',1),
  ('fun-personality','activities','Shared Activities',1,'support','Doing things together seems to be a real bonding path for you.','Activities gaps mean one partner keeps inviting while the other declines.','One partner may seek shared plans; the other prefers low-pressure time.','Put one enjoyable shared activity on the calendar.',2),
  ('fun-personality','humor','Humor',1,'support','Laughter looks like a genuine connector here.','If humor is uneven, one partner may feel unseen or too teased.','One partner may joke to connect; the other to deflect.','Use humor to soften tension, not to avoid it.',3),
  ('fun-personality','adventure','Adventure',1,'support','Adventure and curiosity look like shared values.','A gap here can make the relationship feel predictable over time.','One partner may seek novelty; the other prefers the familiar.','Plan one small adventure within the next two weeks.',4),
  ('appreciation-gratitude','expression','Expression',1,'support','Gratitude seems easy to express for both of you.','Expression gaps make appreciation feel one-directional.','One partner may say thanks often; the other assumes it is obvious.','Say one specific thank-you every day this week.',1),
  ('appreciation-gratitude','recognition','Recognition',1,'support','Effort recognition looks like a natural strength here.','Recognition gaps can make one partner feel invisible.','One partner may recognize effort freely; the other may not notice.','Name one specific thing your partner did well today.',2),
  ('appreciation-gratitude','positivity','Positivity',1,'risk','Positive tone looks available and accessible to both of you.','Low positivity makes even small issues feel heavier than they are.','One partner may lean positive; the other more critical.','End one day by naming three good things about each other.',3)
ON CONFLICT (assessment_id,dimension_key) DO UPDATE SET label=EXCLUDED.label,weight=EXCLUDED.weight,priority=EXCLUDED.priority,high_shared_text=EXCLUDED.high_shared_text,shared_gap_text=EXCLUDED.shared_gap_text,asymmetry_text=EXCLUDED.asymmetry_text,action_text=EXCLUDED.action_text,guidance_order=EXCLUDED.guidance_order;

-- ============================================================
-- COUPLE RELATIONSHIP PATTERNS
-- ============================================================

INSERT INTO couple_relationship_patterns (pattern_key,title,summary,default_action,default_script,severity,applicable_assessments) VALUES
  ('secure-foundation','Secure Foundation','You have a generally steady relationship with enough safety to focus on growth.','Keep doing what works and protect the habits that create safety.','I think we already have a strong base. Can we name what is working and make sure we keep doing it?','low',ARRAY['attachment-style','trust-vulnerability','communication-style','relationship-satisfaction']),
  ('pursue-withdraw','Pursue / Withdraw','One partner moves toward connection while the other protects with distance.','Slow the conversation down and make both reassurance and space explicit.','When I get scared, I move toward you. When you get overwhelmed, you pull back. Can we talk about what helps each of us feel safe?','high',ARRAY['attachment-style','communication-style','conflict-resolution','trust-vulnerability']),
  ('repair-deficit','Repair Deficit','You may not be settling conflict fully, even when the issue looks small.','Add one repair step before the day ends.','Can we pause and repair this before we go to bed?','high',ARRAY['gottman-four-horsemen','conflict-resolution','relationship-satisfaction','stress-coping']),
  ('values-drift','Values Drift','You may care about each other but be operating with different maps for the future.','Name the differences and build a shared operating plan.','We do not need to be identical, but we do need to understand what we are each building.','moderate',ARRAY['values-alignment','shared-meaning','financial-values','relationship-satisfaction']),
  ('trust-fragile','Trust is Fragile','One or both partners do not yet feel fully safe relying on the relationship.','Prioritize consistency, transparency, and follow-through.','Let''s make trust concrete by keeping small promises and checking in honestly.','critical',ARRAY['trust-vulnerability','attachment-style','intimacy-closeness']),
  ('reconnection-opportunity','Reconnection Opportunity','There is enough goodwill here to make meaningful progress quickly.','Use your strongest area to support the strongest one.','What is one thing we already do well that could help us with the thing that is hardest?','moderate',ARRAY['fun-personality','appreciation-gratitude','communication-style','intimacy-closeness'])
ON CONFLICT (pattern_key) DO UPDATE SET title=EXCLUDED.title,summary=EXCLUDED.summary,default_action=EXCLUDED.default_action,default_script=EXCLUDED.default_script,severity=EXCLUDED.severity,applicable_assessments=EXCLUDED.applicable_assessments;

INSERT INTO assessment_couple_pattern_rules (assessment_id,pattern_key,match_type,rule_data,priority_order) VALUES
  ('attachment-style','pursue-withdraw','attachment-quadrant','{"anxious":"high","avoidant":"high"}'::JSONB,1),
  ('attachment-style','secure-foundation','attachment-quadrant','{"anxious":"low","avoidant":"low"}'::JSONB,2),
  ('gottman-four-horsemen','repair-deficit','numeric','{"min_gap":18,"max_average":65}'::JSONB,1),
  ('conflict-resolution','repair-deficit','numeric','{"min_gap":18,"max_average":65}'::JSONB,1),
  ('values-alignment','values-drift','numeric','{"min_gap":20,"max_average":65}'::JSONB,1),
  ('trust-vulnerability','trust-fragile','numeric','{"min_floor":45}'::JSONB,1),
  ('communication-style','reconnection-opportunity','numeric','{"min_average":65,"min_floor":55}'::JSONB,1)
ON CONFLICT (assessment_id,pattern_key,match_type) DO UPDATE SET rule_data=EXCLUDED.rule_data,priority_order=EXCLUDED.priority_order;

-- ============================================================
-- ONBOARDING
-- ============================================================

INSERT INTO onboarding_assessment_patterns (pattern_key,title,summary,signal_rules,default_action,default_script,severity) VALUES
  ('secure-foundation','Secure Foundation','You have enough safety and stability to focus on growth.','{"minAverage":78}','Keep doing what works and protect the habits that create safety.','What is one thing we already do well that should stay part of our relationship?','low'),
  ('pursue-withdraw','Pursue / Withdraw','One of you tends to move toward connection while the other protects with distance.','{"attachment":true}','Slow the conversation down and make reassurance and space explicit.','When I get scared, I move toward you. When you get overwhelmed, you pull back. Can we talk about what helps each of us feel safe?','high'),
  ('repair-deficit','Repair Deficit','You may not be resolving unresolved even when the issues are small.','{"conflict":true}','Add one repair step before the day ends.','Can we pause and repair this before we to go to bed?','high'),
  ('values-drift','Values Drift','You may care about each other but be operating with different maps for the future.','{"values":true}','Name the differences and build a shared operating plan.','We do not need to be identical, but we do need to understand what we are each building.','moderate'),
  ('trust-fragile','Trust is Fragile','One or both partners do not yet feel fully safe relying on the relationship.','{"trust":true}','Prioritize consistency, transparency, and follow-through.','Let''s make trust concrete by keeping small promises and checking in honestly.','critical'),
  ('reconnection-opportunity','Reconnection Opportunity','There is enough goodwill here to make meaningful progress quickly.','{"general":true}','Use your strongest area to support the weakest one.','What is one thing we already do well that could help us with the thing that is hardest?','moderate')
ON CONFLICT (pattern_key) DO UPDATE SET title=EXCLUDED.title,summary=EXCLUDED.summary,signal_rules=EXCLUDED.signal_rules,default_action=EXCLUDED.default_action,default_script=EXCLUDED.default_script,severity=EXCLUDED.severity;

INSERT INTO onboarding_assessment_recommendation_rules (rule_key,title,assessment_ids,series_keys,min_score,max_score,match_type,priority_order,summary,recommendation) VALUES
  ('onboarding-very-low','Immediate Stabilization',ARRAY['attachment-style','communication-style','conflict-resolution','trust-vulnerability'],ARRAY['communication-series','conflict-repair-series','trust-vulnerability-series'],0,39,'stabilize',1,'This relationship needs immediate repair and support.','Start with communication, trust, and repair before deeper intimacy or values work.'),
  ('onboarding-growing','Build the Basics',ARRAY['communication-style','love-languages','conflict-resolution'],ARRAY['connection-series','communication-series','conflict-repair-series'],40,59,'foundations',2,'You have a base, but the pattern is inconsistent.','Focus on foundational connection habits, clearer communication, and one small repair ritual.'),
  ('onboarding-strong','Deepen the Connection',ARRAY['values-alignment','shared-meaning','intimacy-closeness'],ARRAY['intimacy-series','life-growth-series','key-concepts-series'],60,79,'deepening',3,'This is a great place to deepen rather than patch.','Lean into meaning, intimacy, and shared goals while protecting what already works.'),
  ('onboarding-exceptional','Protect the Strength',ARRAY['appreciation-gratitude','fun-personality','relationship-satisfaction'],ARRAY['connection-series','health-wellness-series','key-concepts-series'],80,100,'maintenance',4,'This is a strong relationship area worth protecting.','Keep reinforcing the habits that make this strength visible and durable.')
ON CONFLICT (rule_key) DO UPDATE SET title=EXCLUDED.title,assessment_ids=EXCLUDED.assessment_ids,series_keys=EXCLUDED.series_keys,min_score=EXCLUDED.min_score,max_score=EXCLUDED.max_score,match_type=EXCLUDED.match_type,priority_order=EXCLUDED.priority_order,summary=EXCLUDED.summary,recommendation=EXCLUDED.recommendation;

-- ============================================================
-- LEARNING SERIES (10 series)
-- ============================================================

INSERT INTO learning_series (series_key,title,summary,description,icon,sort_order) VALUES
  ('relationship-foundations','Relationship Foundations','Core relationship science in short, practical modules.','A research-backed starting point for couples who want to understand the habits that support closeness, stability, and repair.','📚',1),
  ('repair-and-communication','Repair & Communication','How to start hard conversations, listen well, and build shared rhythm.','A research-backed series on repair and communication.','🔧',2),
  ('connection-series','Connection','The habits that help partners feel close, responsive, and emotionally present.','A research-backed series on connection.','🤝',3),
  ('communication-series','Communication','How to talk about hard topics, listen well, and stay connected under pressure.','A research-backed series on communication.','💬',4),
  ('conflict-repair-series','Conflict Repair','How to fight clean, repair quickly, and come back together stronger.','A research-backed series on conflict repair.','🛡️',5),
  ('trust-vulnerability-series','Trust & Vulnerability','How emotional safety is built, maintained, and rebuilt after rupture.','A research-backed series on trust and vulnerability.','💎',6),
  ('intimacy-series','Intimacy','Emotional, physical, intellectual, and shared-time closeness.','A research-backed series on intimacy.','✨',7),
  ('life-growth-series','Life & Growth','How everyday systems and long-term direction shape the relationship.','A research-backed series on life and growth.','🌱',8),
  ('health-wellness-series','Health & Wellness','How health, stress, and well-being show up in your relationship.','A research-backed series on health and wellness.','🌿',9),
  ('key-concepts-series','Key Concepts','Gottman research-backed principles every couple should know.','A research-backed series on key concepts.','🔑',10),
  ('repair-and-communication','Repair & Communication','How to start hard conversations, listen well, and build shared rhythm.','A research-backed series on repair and communication.','🔧',11)
ON CONFLICT (series_key) DO UPDATE SET title=EXCLUDED.title,summary=EXCLUDED.summary,description=EXCLUDED.description,icon=EXCLUDED.icon,sort_order=EXCLUDED.sort_order;

INSERT INTO learning_series_modules (series_key,module_key,title,summary,duration,sort_order) VALUES
  -- Relationship Foundations
  ('relationship-foundations','rf-1','What Makes Relationships Work','The research on what predicts relationship success and failure.','10 min',1),
  ('relationship-foundations','rf-2','Building Emotional Connection','What creates felt safety and attunement between partners.','10 min',2),
  ('relationship-foundations','rf-3','Love Languages and Daily Care','How care lands differently and how to translate it well.','10 min',3),
  ('relationship-foundations','rf-4','Repair and Recovery','How to come back together after strain without lasting damage.','10 min',4),
  ('relationship-foundations','rf-5','Conflict with Viability','How to fight clean and still make progress towards workable solutions.','10 min',5),
  ('relationship-foundations','rf-6','Shared Dreams and Meaning','How purpose, rituals, and shared goals create a sense of us.','10 min',6),
  -- Repair & Communication
  ('repair-and-communication','rc-1','Soft Startups and Hard Conversations','How to raise difficult topics without triggering instant defensiveness.','12 min',1),
  ('repair-and-communication','rc-2','Active Listening','How to listen in a way that creates safety and understanding.','10 min',2),
  ('repair-and-communication','rc-3','Repair Sequences','How to fix what went wrong and come back together.','11 min',3),
  ('repair-and-communication','rc-4','Boundaries and Rhythm','How to set boundaries without withdrawing the relationship.','10 min',4),
  -- Connection Series
  ('connection-series','cn-1','Foundations of Connection','What makes partners feel close, responsive, and emotionally present.','10 min',1),
  ('connection-series','cn-2','Emotional Connection','How attunement and responsiveness create felt safety.','10 min',2),
  ('connection-series','cn-3','Deepening Bond','Practical habits that deepen connection over time.','11 min',3),
  ('connection-series','cn-4','Feeling Closer','How to create moments of closeness even in busy lives.','10 min',4),
  -- Communication Series
  ('communication-series','cm-1','Communication','How to talk about hard topics, listen well, and stay connected under pressure.','10 min',1),
  ('communication-series','cm-2','Clear Communication','How to say what you mean without making your partner defensive.','10 min',2),
  ('communication-series','cm-3','Healthy Conflict','How to fight clean and still make progress.','10 min',3),
  -- Conflict Repair Series
  ('conflict-repair-series','cr-1','Conflict Repair','How to fight clean and come back together after strain.','10 min',1),
  ('conflict-repair-series','cr-2','Repair After Rupture','How to repair after conflict before damage compounds.','10 min',2),
  -- Trust & Vulnerability Series
  ('trust-vulnerability-series','tv-1','Trust and Vulnerability','How emotional safety is built, maintained, and rebuilt.','10 min',1),
  ('trust-vulnerability-series','tv-2','Building Safety','What creates and breaks felt safety between partners.','10 min',2),
  -- Intimacy Series
  ('intimacy-series','im-1','Intimacy','Emotional, physical, intellectual, and shared-time closeness.','10 min',1),
  -- Life & Growth Series
  ('life-growth-series','lg-1','Life and Growth','How everyday systems and long-term direction shape the relationship.','10 min',1),
  -- Health & Wellness Series
  ('health-wellness-series','hw-1','Health and Wellness','How health, stress, and well-being show up in your relationship.','10 min',1),
  -- Key Concepts Series
  ('key-concepts-series','kc-1','Key Concepts','Gottman research-backed principles every couple should know.','8 min',1)
ON CONFLICT (series_key,module_key) DO UPDATE SET title=EXCLUDED.title,summary=EXCLUDED.summary,duration=EXCLUDED.duration,sort_order=EXCLUDED.sort_order;

-- ============================================================
-- ACTIVITIES (sample)
-- ============================================================

INSERT INTO activities (type,title,description,content,category,duration,difficulty) VALUES
  ('conversation_starter','Three Worst Things','Each partner shares three things that annoy them without judgment.','{"prompt":"What are three small things that bother you in our relationship?","rules":"No solving during the share—just listening. Then each person picks one to work on."}','communication','10 min','easy'),
  ('conversation_starter','Ideal Day','Share what your ideal day off together would look like.','{"prompt":"Describe your ideal day off together from morning to night.","followUp":"What is one thing from each person''s vision we can combine?"}','connection','15 min','easy'),
  ('activity','Memory Lane Walk','Take a walk together and share one memory from each year you have been together.','{"instructions":["Find a time to walk together outside","Take turns sharing one memory from each year","Notice which memories come up easily and which take effort"]}','connection','30 min','medium'),
  ('journal','Relationship Timeline','Create a timeline of your relationship milestones together.','{"instructions":["Mark when you met, first date, first trip","Add challenges you overcame together","Include moments of growth and joy"]}','milestones','20 min','easy')
ON CONFLICT DO NOTHING;

-- ============================================================
-- DAILY QUESTIONS (sample)
-- ============================================================

INSERT INTO daily_questions (question,category,priority) VALUES
  ('What is one thing I did today that made you feel loved?','connection',1),
  ('What is one thing I could do better at tomorrow?','growth',1),
  ('What made you laugh or smile today?','fun',1),
  ('What is one thing you are grateful for about us?','gratitude',1),
  ('What is something you want to talk about but have not brought up?','communication',2),
  ('If you could change one thing about how we communicate, what would it be?','communication',2),
  ('What is a dream or goal you have that you want us to support?','goals',2),
  ('What does our relationship need more of right now?','intimacy',2)
ON CONFLICT DO NOTHING;

INSERT INTO check_in_topics (topic_name,description,category,prompt_questions) VALUES
  ('Communication Check-in','How well are you and your partner communicating lately?','communication',ARRAY['How has our communication been this week?','Is there anything unsaid that you would like to share?','What can we do to improve our dialogue?']),
  ('Quality Time','Are you spending enough meaningful time together?','fun',ARRAY['How much quality time have we spent together recently?','What activities bring us the most joy?','Do we need to schedule more time together?']),
  ('Financial Alignment','Are you and your partner on the same page about money?','finances',ARRAY['Do we have any financial stresses to discuss?','Are we aligned on our spending priorities?','What financial goals do we share?']),
  ('Intimacy and Affection','How is your physical and emotional intimacy?','intimacy',ARRAY['How satisfied are you with our level of intimacy?','Is there anything you need more or less of?','How can we nurture our connection?']),
  ('Conflict Resolution','How are conflicts being handled in your relationship?','conflict',ARRAY['Have we had any unresolved disagreements?','How do we typically handle disagreements?','What can we do to fight fairer?']),
  ('Future Goals','Are you both working toward common goals?','goals',ARRAY['What goals are we working toward together?','Are our individual goals aligned?','What support do you need from me?'])
ON CONFLICT DO NOTHING;
