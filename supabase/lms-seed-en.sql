-- ═══════════════════════════════════════════════════════════════════
-- WCA Hub LMS — Estructura Inglés Wide Angle (5 niveles × 12 unidades)
-- Ejecutar DESPUÉS de lms-schema.sql
-- Nota: los contenidos se agregan desde SuperAdmin → Academia
-- ═══════════════════════════════════════════════════════════════════

-- ── A1 — Starter ─────────────────────────────────────────────────
INSERT INTO public.units (program_id, level, unit_number, title, topic, grammar, vocabulary, published) VALUES
('en','A1', 1,'Nice to Meet You',        'Greetings & introductions',   ARRAY['verb to be (I am)','personal pronouns'],                ARRAY['greetings','countries','nationalities'],true),
('en','A1', 2,'My Life',                 'Family & personal information',ARRAY['possessive adjectives','verb to be (questions)'],       ARRAY['family members','numbers','jobs'],true),
('en','A1', 3,'Around Town',             'Places & directions',         ARRAY['there is/there are','prepositions of place'],           ARRAY['places in town','locations'],true),
('en','A1', 4,'Day by Day',              'Daily routines',              ARRAY['simple present','adverbs of frequency'],                ARRAY['daily activities','time expressions'],true),
('en','A1', 5,'Food & Drink',            'Talking about food',          ARRAY['countable & uncountable nouns','some/any'],             ARRAY['food','drinks','meals'],true),
('en','A1', 6,'Getting Around',          'Transport & travel',          ARRAY['can for ability','imperatives'],                        ARRAY['transport','directions','travel'],true),
('en','A1', 7,'Free Time',               'Hobbies & leisure',           ARRAY['like/love/hate + -ing','simple present questions'],     ARRAY['hobbies','sports','free time'],true),
('en','A1', 8,'Shopping',                'Shopping & money',            ARRAY['this/that/these/those','How much/many?'],               ARRAY['clothes','shopping','prices'],true),
('en','A1', 9,'Health & Body',           'Health & the body',           ARRAY['have got','feel + adjective'],                          ARRAY['body parts','health','symptoms'],true),
('en','A1',10,'Work & Jobs',             'Jobs & workplaces',           ARRAY['simple present (3rd person)','work collocations'],      ARRAY['jobs','workplaces','skills'],true),
('en','A1',11,'Home & Living',           'Describing your home',        ARRAY['there is/are (extended)','prepositions of place'],      ARRAY['rooms','furniture','home'],true),
('en','A1',12,'Past Events',             'Simple past & memories',      ARRAY['simple past regular & irregular','time expressions'],   ARRAY['past time','irregular verbs','memories'],true)
ON CONFLICT (program_id, level, unit_number) DO UPDATE SET title = EXCLUDED.title, published = true;

-- ── A2 — Elementary ──────────────────────────────────────────────
INSERT INTO public.units (program_id, level, unit_number, title, topic, grammar, vocabulary, published) VALUES
('en','A2', 1,'Getting to Know You',     'Talking about past & present', ARRAY['past simple vs present simple','question forms'],      ARRAY['personality','relationships'],true),
('en','A2', 2,'Experiences',             'Present perfect',              ARRAY['present perfect with ever/never','been vs gone'],      ARRAY['travel','life experiences'],true),
('en','A2', 3,'Making Plans',            'Future plans & intentions',    ARRAY['going to','present continuous for future'],            ARRAY['future plans','arrangements'],true),
('en','A2', 4,'The Natural World',       'Nature & environment',         ARRAY['comparatives & superlatives','too/enough'],            ARRAY['nature','animals','environment'],true),
('en','A2', 5,'City Life',               'Describing cities & places',   ARRAY['used to','would for past habits'],                     ARRAY['city features','urban life'],true),
('en','A2', 6,'Staying in Touch',        'Communication & technology',   ARRAY['object pronouns','verb patterns'],                     ARRAY['communication','technology','social media'],true),
('en','A2', 7,'Healthy Living',          'Health & lifestyle',           ARRAY['should/shouldnt','have to/dont have to'],              ARRAY['health habits','diet','exercise'],true),
('en','A2', 8,'Entertainment',           'Film, music & books',          ARRAY['past continuous','while/when'],                        ARRAY['entertainment','opinions','art'],true),
('en','A2', 9,'Career Paths',            'Jobs & ambitions',             ARRAY['will for predictions','might for possibility'],        ARRAY['career','ambitions','work'],true),
('en','A2',10,'Culture & Customs',       'Cultural differences',         ARRAY['modals of obligation','passive voice intro'],          ARRAY['culture','customs','traditions'],true),
('en','A2',11,'Global Issues',           'The world around us',          ARRAY['first conditional','if clauses'],                      ARRAY['global issues','problems','solutions'],true),
('en','A2',12,'Looking Back',            'Reviewing A2 language',        ARRAY['review of A2 grammar','mixed tenses'],                 ARRAY['review vocabulary','achievements'],true)
ON CONFLICT (program_id, level, unit_number) DO UPDATE SET title = EXCLUDED.title, published = true;

-- ── B1 — Intermediate ────────────────────────────────────────────
INSERT INTO public.units (program_id, level, unit_number, title, topic, grammar, vocabulary, published) VALUES
('en','B1', 1,'Identity',                'Who we are',                  ARRAY['present perfect continuous','for/since'],              ARRAY['identity','background','heritage'],true),
('en','B1', 2,'Story Time',              'Narrative & storytelling',     ARRAY['past perfect','narrative tenses'],                     ARRAY['storytelling','sequencing','drama'],true),
('en','B1', 3,'The World of Work',       'Careers & the workplace',      ARRAY['gerunds & infinitives','verb patterns'],               ARRAY['work skills','workplace','career'],true),
('en','B1', 4,'Science & Technology',    'Tech in our lives',            ARRAY['passive voice (present & past)','by + agent'],         ARRAY['technology','innovation','science'],true),
('en','B1', 5,'Going Places',            'Travel & adventure',           ARRAY['second conditional','wish + past simple'],             ARRAY['travel','adventure','geography'],true),
('en','B1', 6,'Money Matters',           'Finance & economy',            ARRAY['reported speech','say vs tell'],                       ARRAY['money','banking','economy'],true),
('en','B1', 7,'The Arts',                'Art, music & literature',      ARRAY['relative clauses (defining)','which/who/that'],        ARRAY['art forms','creative expression'],true),
('en','B1', 8,'Mind & Body',             'Psychology & wellbeing',       ARRAY['modal verbs of deduction','must/cant/might'],          ARRAY['emotions','mental health','wellbeing'],true),
('en','B1', 9,'The Environment',         'Climate & sustainability',     ARRAY['third conditional','mixed conditionals intro'],        ARRAY['environment','climate','sustainability'],true),
('en','B1',10,'Media & Communication',   'News & social media',          ARRAY['non-defining relative clauses','punctuation'],         ARRAY['media','journalism','communication'],true),
('en','B1',11,'Society & Community',     'Social issues & change',       ARRAY['causative have/get','complex passive'],                ARRAY['society','community','change'],true),
('en','B1',12,'Looking Forward',         'Future possibilities',         ARRAY['future perfect','future continuous'],                  ARRAY['ambitions','predictions','future'],true)
ON CONFLICT (program_id, level, unit_number) DO UPDATE SET title = EXCLUDED.title, published = true;

-- ── B2 — Upper Intermediate ──────────────────────────────────────
INSERT INTO public.units (program_id, level, unit_number, title, topic, grammar, vocabulary, published) VALUES
('en','B2', 1,'The Human Mind',          'Psychology & behavior',        ARRAY['mixed conditionals','inverted conditionals'],          ARRAY['psychology','behavior','cognition'],true),
('en','B2', 2,'Global Citizenship',      'Global issues & identity',     ARRAY['complex passive structures','impersonal passive'],     ARRAY['global issues','citizenship','ethics'],true),
('en','B2', 3,'Language & Culture',      'How language shapes us',       ARRAY['cleft sentences','emphasis structures'],               ARRAY['language','culture','communication'],true),
('en','B2', 4,'The Digital Age',         'Technology & society',         ARRAY['noun clauses','reporting verbs'],                      ARRAY['digital world','AI','privacy'],true),
('en','B2', 5,'Business & Finance',      'The corporate world',          ARRAY['formal language','hedging expressions'],               ARRAY['business','finance','economics'],true),
('en','B2', 6,'Health & Medicine',       'Medical advances',             ARRAY['participle clauses','reduced relative clauses'],       ARRAY['medicine','health','research'],true),
('en','B2', 7,'Art & Creativity',        'Creative industries',          ARRAY['subjunctive mood','formal writing'],                   ARRAY['creativity','art','design'],true),
('en','B2', 8,'Environment & Energy',    'Sustainability solutions',     ARRAY['complex conditionals','future in the past'],           ARRAY['environment','energy','solutions'],true),
('en','B2', 9,'Law & Society',           'Justice & social issues',      ARRAY['gerund vs infinitive advanced','complex objects'],     ARRAY['law','justice','society'],true),
('en','B2',10,'Science & Discovery',     'Scientific thinking',          ARRAY['ellipsis & substitution','cohesion devices'],         ARRAY['science','discovery','research'],true),
('en','B2',11,'Interpersonal Skills',    'Communication & leadership',   ARRAY['discourse markers','linking expressions'],             ARRAY['leadership','communication','EQ'],true),
('en','B2',12,'Review & Exam Prep',      'B2 consolidation',             ARRAY['mixed B2 structures','exam strategies'],               ARRAY['revision','exam skills','fluency'],true)
ON CONFLICT (program_id, level, unit_number) DO UPDATE SET title = EXCLUDED.title, published = true;

-- ── C1 — Advanced ────────────────────────────────────────────────
INSERT INTO public.units (program_id, level, unit_number, title, topic, grammar, vocabulary, published) VALUES
('en','C1', 1,'Language in Use',         'Advanced grammar & style',     ARRAY['inversion','formal and informal register'],            ARRAY['precise vocabulary','connotation','style'],true),
('en','C1', 2,'Critical Thinking',       'Analysis & argumentation',     ARRAY['complex sentence structures','sophisticated clauses'], ARRAY['critical thinking','academic language'],true),
('en','C1', 3,'Professional English',    'Workplace communication',      ARRAY['advanced reporting structures','persuasive language'], ARRAY['professional register','negotiation'],true),
('en','C1', 4,'Literature & Analysis',   'Texts & interpretation',       ARRAY['narrative voice','literary devices'],                  ARRAY['literary terms','analysis','metaphor'],true),
('en','C1', 5,'Media Literacy',          'Understanding media',          ARRAY['complex noun phrases','nominalization'],               ARRAY['media terms','discourse','rhetoric'],true),
('en','C1', 6,'Academic Writing',        'Essays & research',            ARRAY['cohesion & coherence','hedging & boosting'],           ARRAY['academic vocabulary','citations','argumentation'],true),
('en','C1', 7,'Intercultural Communication','Global communication',      ARRAY['pragmatics','speech acts'],                           ARRAY['cultural concepts','diplomacy','politeness'],true),
('en','C1', 8,'Economics & Society',     'Global economic systems',      ARRAY['complex conditionals & speculation','nuance'],         ARRAY['economic terms','social systems'],true),
('en','C1', 9,'Ethics & Philosophy',     'Big ideas & moral questions',  ARRAY['abstract language','philosophical register'],         ARRAY['ethics','philosophy','values'],true),
('en','C1',10,'Science Communication',   'Explaining complex ideas',     ARRAY['passive & impersonal structures','precision'],         ARRAY['technical vocabulary','simplification'],true),
('en','C1',11,'Speaking & Presenting',   'Advanced oral skills',         ARRAY['spoken grammar','fluency devices'],                    ARRAY['presentation language','debate vocabulary'],true),
('en','C1',12,'Capstone & Certification','Final review & assessment',    ARRAY['review all C1 structures','exam strategies'],          ARRAY['review all C1 vocabulary','fluency'],true)
ON CONFLICT (program_id, level, unit_number) DO UPDATE SET title = EXCLUDED.title, published = true;

-- Seed placeholder activities for A1 Unit 1 (as template)
DO $$
DECLARE v_unit_id uuid;
BEGIN
  SELECT id INTO v_unit_id FROM public.units WHERE program_id='en' AND level='A1' AND unit_number=1;

  INSERT INTO public.unit_activities (unit_id,type,order_num,title,xp_reward,content) VALUES
  (v_unit_id,'video',1,'Introducción: Nice to Meet You',20,'{
    "youtube_id": "PLACEHOLDER_EN_A1_U1",
    "duration_min": 10,
    "description": "Unidad 1 de Wide Angle A1 — saludos e introducciones en inglés.",
    "key_points": ["Greetings: Hello, Hi, Good morning","Introductions: My name is / I am","Countries and nationalities","Numbers 1-20"]
  }'::jsonb),
  (v_unit_id,'lesson',2,'Vocabulary: Greetings & Introductions',15,'{
    "sections": [
      {"title": "Formal vs Informal Greetings","content": "**Formal:**\n• Good morning / Good afternoon / Good evening\n• How do you do? (very formal)\n• Pleased to meet you\n\n**Informal:**\n• Hi / Hey\n• How are you? / How''s it going?\n• What''s up?","highlight": "💡 In a work context, always start with formal greetings until the client invites informality."},
      {"title": "Introducing yourself","content": "Basic introduction formula:\n\n**Name:** My name is ___ / I''m ___\n**Origin:** I''m from Honduras / I''m Honduran\n**Job:** I''m a Virtual Assistant / I work as a...\n**Nice to meet you:** It''s nice to meet you / Pleased to meet you","highlight": "⭐ Practice saying your professional introduction until it sounds completely natural."}
    ]
  }'::jsonb),
  (v_unit_id,'quiz',3,'Quiz — Unit 1: Nice to Meet You',30,'{
    "pass_score": 70,
    "time_limit_min": 10,
    "questions": [
      {"q": "Which greeting is most appropriate for a first business meeting?","opts": ["Hey, what''s up?","Good morning, pleased to meet you.","Yo, how are you doing?","What''s good?"],"ans": 1,"explanation": "In a professional context, formal greetings show respect and set a professional tone."},
      {"q": "How do you say your nationality if you are from Honduras?","opts": ["I am Honduras","I am from Honduran","I am Honduran","My country is Honduras"],"ans": 2,"explanation": "Nationalities are adjectives in English: Honduras → Honduran, similar to Mexico → Mexican."},
      {"q": "Complete: ''___ name is María. ___ is from Honduras.''","opts": ["My / She","Her / She","My / Her","She / She"],"ans": 1,"explanation": "Possessive adjective for the speaker = My. Pronoun for a woman = She."},
      {"q": "Which phrase is used to respond to ''Nice to meet you''?","opts": ["Yes, I am","Nice to meet you too","I agree","Thank you for coming"],"ans": 1,"explanation": "''Nice to meet you too'' or ''Pleased to meet you too'' are the standard responses."},
      {"q": "What does ''How do you do?'' mean?","opts": ["A question about your job","An informal greeting between friends","A very formal greeting, typically at a first meeting","A question about your health"],"ans": 2,"explanation": "''How do you do?'' is a very formal greeting used at first meetings in British English — the response is also ''How do you do?''"}
    ]
  }'::jsonb)
  ON CONFLICT DO NOTHING;
END $$;

SELECT level, COUNT(*) as units FROM public.units WHERE program_id='en' GROUP BY level ORDER BY level;
