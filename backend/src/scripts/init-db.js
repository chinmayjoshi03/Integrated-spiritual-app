require('dotenv').config();
const { Pool } = require('pg');

async function initializeDatabase() {
  const dbName = process.env.DB_NAME || 'spiritual_app';
  const user = process.env.DB_USER || 'postgres';
  const password = process.env.DB_PASSWORD || 'postgres';
  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT || '5432', 10);

  console.log('🔧 Initializing database setup...');
  console.log(`📌 Connecting to PostgreSQL at ${host}:${port} as user "${user}"...`);

  // Step 1: Connect to default 'postgres' database to ensure target database exists
  const rootPool = new Pool({ host, port, database: 'postgres', user, password });

  try {
    const dbCheckRes = await rootPool.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [dbName]
    );

    if (dbCheckRes.rows.length === 0) {
      console.log(`🔨 Database "${dbName}" does not exist. Creating database...`);
      await rootPool.query(`CREATE DATABASE "${dbName}";`);
      console.log(`✅ Database "${dbName}" created!`);
    } else {
      console.log(`ℹ️ Database "${dbName}" already exists.`);
    }
  } catch (error) {
    console.error(`\n❌ PostgreSQL Connection Error: ${error.message}`);
    console.error(`\n============================================================`);
    console.error(`💡 HOW TO FIX:`);
    console.error(`1. Check your PostgreSQL credentials in backend/.env`);
    console.error(`   - DB_USER (current: "${user}")`);
    console.error(`   - DB_PASSWORD (current: "${password}")`);
    console.error(`   - DB_PORT (current: ${port})`);
    console.error(`2. Make sure your local PostgreSQL service is running.`);
    console.error(`3. Update DB_PASSWORD in backend/.env to match your PostgreSQL password.`);
    console.error(`============================================================\n`);
    await rootPool.end();
    process.exit(1);
  } finally {
    await rootPool.end();
  }

  // Step 2: Connect to target database and create tables
  const appPool = new Pool({ host, port, database: dbName, user, password });

  try {
    console.log(`🔧 Creating table schema in "${dbName}"...`);

    await appPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    console.log('✅ Table "users" created (or already exists)');

    await appPool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `);
    console.log('✅ Index "idx_users_email" created (or already exists)');

    // ── Courses / LMS ─────────────────────────────────────────────────────────

    await appPool.query(`
      CREATE TABLE IF NOT EXISTS courses (
        id            SERIAL PRIMARY KEY,
        title         VARCHAR(255) NOT NULL,
        description   TEXT,
        thumbnail_url VARCHAR(512),
        level         VARCHAR(50)  DEFAULT 'Beginner',
        total_lessons INTEGER      DEFAULT 0,
        is_published  BOOLEAN      DEFAULT true,
        sort_order    INTEGER      DEFAULT 0,
        created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✅ Table "courses" created (or already exists)');

    await appPool.query(`
      CREATE TABLE IF NOT EXISTS lessons (
        id             SERIAL PRIMARY KEY,
        course_id      INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        title          VARCHAR(255) NOT NULL,
        description    TEXT,
        video_filename VARCHAR(512),
        duration_sec   INTEGER DEFAULT 0,
        sort_order     INTEGER DEFAULT 0,
        is_free        BOOLEAN DEFAULT false,
        created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_lessons_course ON lessons(course_id);
    `);
    console.log('✅ Table "lessons" created (or already exists)');

    await appPool.query(`
      CREATE TABLE IF NOT EXISTS lesson_progress (
        id          SERIAL PRIMARY KEY,
        user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        lesson_id   INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
        completed   BOOLEAN DEFAULT false,
        watched_sec INTEGER DEFAULT 0,
        completed_at TIMESTAMP WITH TIME ZONE,
        UNIQUE(user_id, lesson_id)
      );
      CREATE INDEX IF NOT EXISTS idx_lesson_progress_user ON lesson_progress(user_id);
    `);
    console.log('✅ Table "lesson_progress" created (or already exists)');

    await appPool.query(`
      CREATE TABLE IF NOT EXISTS resources (
        id           SERIAL PRIMARY KEY,
        course_id    INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        title        VARCHAR(255) NOT NULL,
        description  TEXT,
        file_url     VARCHAR(512),
        file_type    VARCHAR(20) DEFAULT 'pdf',
        sort_order   INTEGER DEFAULT 0,
        created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_resources_course ON resources(course_id);
    `);
    console.log('✅ Table "resources" created (or already exists)');

    await appPool.query(`
      CREATE TABLE IF NOT EXISTS assignments (
        id           SERIAL PRIMARY KEY,
        course_id    INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        title        VARCHAR(255) NOT NULL,
        description  TEXT,
        instructions TEXT,
        due_offset_days INTEGER DEFAULT 7,
        sort_order   INTEGER DEFAULT 0,
        created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_assignments_course ON assignments(course_id);
    `);
    console.log('✅ Table "assignments" created (or already exists)');

    await appPool.query(`
      CREATE TABLE IF NOT EXISTS assignment_submissions (
        id            SERIAL PRIMARY KEY,
        assignment_id INTEGER NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
        user_id       INTEGER NOT NULL REFERENCES users(id)       ON DELETE CASCADE,
        response_text TEXT,
        submitted_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(assignment_id, user_id)
      );
      CREATE INDEX IF NOT EXISTS idx_submissions_user ON assignment_submissions(user_id);
    `);
    console.log('✅ Table "assignment_submissions" created (or already exists)');

    await appPool.query(`
      CREATE TABLE IF NOT EXISTS quizzes (
        id          SERIAL PRIMARY KEY,
        course_id   INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        title       VARCHAR(255) NOT NULL,
        description TEXT,
        sort_order  INTEGER DEFAULT 0,
        created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_quizzes_course ON quizzes(course_id);
    `);
    console.log('✅ Table "quizzes" created (or already exists)');

    await appPool.query(`
      CREATE TABLE IF NOT EXISTS quiz_questions (
        id           SERIAL PRIMARY KEY,
        quiz_id      INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
        question     TEXT NOT NULL,
        options      JSONB NOT NULL,
        correct_idx  INTEGER NOT NULL,
        explanation  TEXT,
        sort_order   INTEGER DEFAULT 0
      );
      CREATE INDEX IF NOT EXISTS idx_questions_quiz ON quiz_questions(quiz_id);
    `);
    console.log('✅ Table "quiz_questions" created (or already exists)');

    await appPool.query(`
      CREATE TABLE IF NOT EXISTS quiz_attempts (
        id          SERIAL PRIMARY KEY,
        quiz_id     INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
        user_id     INTEGER NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
        score       INTEGER DEFAULT 0,
        total       INTEGER DEFAULT 0,
        answers     JSONB,
        attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_attempts_user ON quiz_attempts(user_id);
    `);
    console.log('✅ Table "quiz_attempts" created (or already exists)');

    // ── Daily tasks ───────────────────────────────────────────────────────────
    await appPool.query(`
      CREATE TABLE IF NOT EXISTS daily_tasks (
        id          SERIAL PRIMARY KEY,
        user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        task_name   VARCHAR(255) NOT NULL,
        completed   BOOLEAN DEFAULT false,
        task_date   DATE NOT NULL DEFAULT CURRENT_DATE,
        UNIQUE(user_id, task_name, task_date)
      );
      CREATE INDEX IF NOT EXISTS idx_daily_tasks_user_date ON daily_tasks(user_id, task_date);
    `);
    console.log('✅ Table "daily_tasks" created (or already exists)');

    // ── Meditations (Audio) ───────────────────────────────────────────────────
    await appPool.query(`
      CREATE TABLE IF NOT EXISTS meditations (
        id             SERIAL PRIMARY KEY,
        title          VARCHAR(255) NOT NULL,
        description    TEXT,
        category       VARCHAR(50) NOT NULL DEFAULT 'Guided',
        audio_filename VARCHAR(512),
        duration_sec   INTEGER DEFAULT 600,
        guide_name     VARCHAR(255) DEFAULT 'Guru Varma',
        thumbnail_url  VARCHAR(512),
        is_featured    BOOLEAN DEFAULT false,
        sort_order     INTEGER DEFAULT 0,
        created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_meditations_category ON meditations(category);
    `);
    console.log('✅ Table "meditations" created (or already exists)');

    await appPool.query(`
      CREATE TABLE IF NOT EXISTS meditation_progress (
        id               SERIAL PRIMARY KEY,
        user_id          INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        meditation_id    INTEGER NOT NULL REFERENCES meditations(id) ON DELETE CASCADE,
        completed        BOOLEAN DEFAULT false,
        listened_sec     INTEGER DEFAULT 0,
        last_listened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        completed_at     TIMESTAMP WITH TIME ZONE,
        UNIQUE(user_id, meditation_id)
      );
      CREATE INDEX IF NOT EXISTS idx_meditation_progress_user ON meditation_progress(user_id);
    `);
    console.log('✅ Table "meditation_progress" created (or already exists)');

    // ── Community (Posts, Likes, Comments) ───────────────────────────────────
    await appPool.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id           SERIAL PRIMARY KEY,
        user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        author_name  VARCHAR(255) NOT NULL,
        title        VARCHAR(255) NOT NULL,
        content      TEXT NOT NULL,
        category     VARCHAR(50) DEFAULT 'General',
        likes_count  INTEGER DEFAULT 0,
        created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category);

      CREATE TABLE IF NOT EXISTS post_likes (
        id        SERIAL PRIMARY KEY,
        user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        post_id   INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        liked_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, post_id)
      );

      CREATE TABLE IF NOT EXISTS post_comments (
        id           SERIAL PRIMARY KEY,
        post_id      INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        author_name  VARCHAR(255) NOT NULL,
        content      TEXT NOT NULL,
        created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_comments_post ON post_comments(post_id);
    `);
    console.log('✅ Tables "posts", "post_likes", "post_comments" created (or already exist)');

    // ── Events ─────────────────────────────────────────────────────────────
    await appPool.query(`
      CREATE TABLE IF NOT EXISTS events (
        id              SERIAL PRIMARY KEY,
        title           VARCHAR(255) NOT NULL,
        description     TEXT,
        event_date      TIMESTAMP WITH TIME ZONE NOT NULL,
        time_str        VARCHAR(100),
        location        VARCHAR(255),
        is_online       BOOLEAN DEFAULT true,
        meeting_link    VARCHAR(512),
        banner_url      VARCHAR(512),
        attendees_count INTEGER DEFAULT 0,
        created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS event_registrations (
        id            SERIAL PRIMARY KEY,
        user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        event_id      INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, event_id)
      );
    `);
    console.log('✅ Tables "events" and "event_registrations" created (or already exist)');

    // ── Volunteering (Seva) ──────────────────────────────────────────────────
    await appPool.query(`
      CREATE TABLE IF NOT EXISTS volunteer_opportunities (
        id                  SERIAL PRIMARY KEY,
        title               VARCHAR(255) NOT NULL,
        description         TEXT,
        category            VARCHAR(100) DEFAULT 'Community Service',
        location            VARCHAR(255),
        required_volunteers INTEGER DEFAULT 5,
        current_volunteers  INTEGER DEFAULT 0,
        created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS volunteer_applications (
        id             SERIAL PRIMARY KEY,
        user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        opportunity_id INTEGER NOT NULL REFERENCES volunteer_opportunities(id) ON DELETE CASCADE,
        notes          TEXT,
        status         VARCHAR(50) DEFAULT 'Applied',
        applied_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, opportunity_id)
      );
    `);
    console.log('✅ Tables "volunteer_opportunities" and "volunteer_applications" created (or already exist)');

    // ── Divine Shop ────────────────────────────────────────────────────────
    await appPool.query(`
      CREATE TABLE IF NOT EXISTS shop_items (
        id             SERIAL PRIMARY KEY,
        title          VARCHAR(255) NOT NULL,
        description    TEXT,
        price          NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
        currency       VARCHAR(10) DEFAULT 'INR',
        category       VARCHAR(100) DEFAULT 'Sacred Malas',
        image_url      VARCHAR(512),
        stock_quantity INTEGER DEFAULT 50,
        is_featured    BOOLEAN DEFAULT false,
        created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_shop_items_category ON shop_items(category);

      CREATE TABLE IF NOT EXISTS shop_orders (
        id               SERIAL PRIMARY KEY,
        user_id          INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        item_id          INTEGER NOT NULL REFERENCES shop_items(id) ON DELETE CASCADE,
        quantity         INTEGER DEFAULT 1,
        total_price      NUMERIC(10, 2) NOT NULL,
        shipping_address TEXT NOT NULL,
        status           VARCHAR(50) DEFAULT 'Confirmed',
        created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_shop_orders_user ON shop_orders(user_id);
    `);
    console.log('✅ Tables "shop_items" and "shop_orders" created (or already exist)');

    // ── Seed data ─────────────────────────────────────────────────────────────
    const existingCourses = await appPool.query('SELECT id FROM courses LIMIT 1');
    if (existingCourses.rows.length === 0) {
      console.log('🌱 Seeding LMS data...');

      // Courses
      const c1 = await appPool.query(`INSERT INTO courses (title, description, level, total_lessons, sort_order) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
        ['Foundations of Mindful Living', 'A step-by-step introduction to mindfulness, breath awareness, and daily contemplative practice.', 'Beginner', 6, 1]);
      const c2 = await appPool.query(`INSERT INTO courses (title, description, level, total_lessons, sort_order) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
        ['The Art of Self-Inquiry', 'Explore the ancient practice of self-inquiry (Atma Vichara) to discover your true nature.', 'Intermediate', 5, 2]);
      const c3 = await appPool.query(`INSERT INTO courses (title, description, level, total_lessons, sort_order) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
        ['Bhagavad Gita: A Gentle Introduction', 'Walk through the 18 chapters of the Gita with modern, accessible commentary.', 'Beginner', 7, 3]);
      const c4 = await appPool.query(`INSERT INTO courses (title, description, level, total_lessons, sort_order) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
        ['Living with Compassion', 'Practices for cultivating loving-kindness, forgiveness, and service in everyday life.', 'Beginner', 4, 4]);

      const courseIds = [c1.rows[0].id, c2.rows[0].id, c3.rows[0].id, c4.rows[0].id];

      // Lessons for course 1
      const lessons1 = [
        ['What is Mindfulness?', 'An overview of mindfulness and its roots in contemplative tradition.', 1],
        ['The Breath as Anchor', 'Learning to use the breath as a steady point of awareness.', 2],
        ['Body Scan Practice', 'A guided body scan to develop somatic awareness.', 3],
        ['Mindful Eating & Movement', 'Bringing presence into ordinary daily activities.', 4],
        ['Working with Thoughts', 'Techniques for observing thoughts without identification.', 5],
        ['Integration & Daily Practice', 'Building a sustainable home practice.', 6],
      ];
      for (const [title, desc, ord] of lessons1) {
        await appPool.query(`INSERT INTO lessons (course_id, title, description, video_filename, duration_sec, sort_order, is_free) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [courseIds[0], title, desc, null, Math.floor(Math.random() * 900) + 300, ord, ord === 1]);
      }

      // Lessons for course 2
      const lessons2 = [
        ['Who Am I? The Central Question', 'Introduction to self-inquiry as a direct path.', 1],
        ['Tracing the I-Thought', 'Practical guidance on following the sense of "I".', 2],
        ['Silence and the Self', 'Using silence as a vehicle for recognition.', 3],
        ['Common Obstacles', 'Addressing doubt, dryness, and distraction.', 4],
        ['Living as Awareness', 'Integrating self-inquiry into ordinary life.', 5],
      ];
      for (const [title, desc, ord] of lessons2) {
        await appPool.query(`INSERT INTO lessons (course_id, title, description, video_filename, duration_sec, sort_order, is_free) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [courseIds[1], title, desc, null, Math.floor(Math.random() * 900) + 300, ord, ord === 1]);
      }

      // Resources for course 1
      await appPool.query(`INSERT INTO resources (course_id, title, description, file_url, file_type, sort_order) VALUES ($1,$2,$3,$4,$5,$6)`,
        [courseIds[0], 'Mindfulness Course Workbook', 'A printable workbook with all key exercises and reflection prompts.', null, 'pdf', 1]);
      await appPool.query(`INSERT INTO resources (course_id, title, description, file_url, file_type, sort_order) VALUES ($1,$2,$3,$4,$5,$6)`,
        [courseIds[0], 'Daily Practice Guide', 'A one-page reference card for your morning and evening routines.', null, 'pdf', 2]);
      await appPool.query(`INSERT INTO resources (course_id, title, description, file_url, file_type, sort_order) VALUES ($1,$2,$3,$4,$5,$6)`,
        [courseIds[0], 'Recommended Reading List', 'Books and articles that complement this course beautifully.', null, 'pdf', 3]);

      // Resources for course 2
      await appPool.query(`INSERT INTO resources (course_id, title, description, file_url, file_type, sort_order) VALUES ($1,$2,$3,$4,$5,$6)`,
        [courseIds[1], 'Self-Inquiry Journal Template', 'Structured journal pages to deepen your inquiry practice.', null, 'pdf', 1]);
      await appPool.query(`INSERT INTO resources (course_id, title, description, file_url, file_type, sort_order) VALUES ($1,$2,$3,$4,$5,$6)`,
        [courseIds[1], 'Ramana Maharshi Quotations', 'Selected teachings from the master of self-inquiry.', null, 'pdf', 2]);

      // Assignments for course 1
      await appPool.query(`INSERT INTO assignments (course_id, title, description, instructions, due_offset_days, sort_order) VALUES ($1,$2,$3,$4,$5,$6)`,
        [courseIds[0], 'Week 1 Reflection', 'Reflect on your first week of mindfulness practice.', 'Write 200–400 words on what you noticed during your first week of breath-awareness practice. What was easy? What was challenging? Did anything surprise you?', 7, 1]);
      await appPool.query(`INSERT INTO assignments (course_id, title, description, instructions, due_offset_days, sort_order) VALUES ($1,$2,$3,$4,$5,$6)`,
        [courseIds[0], 'Mindful Activity Log', 'Document one mindful activity each day for a week.', 'Each day for 7 days, choose one ordinary activity (eating, walking, washing dishes) and bring full attention to it. Record a brief note about the experience. Share a summary of what you discovered.', 7, 2]);

      // Assignments for course 2
      await appPool.query(`INSERT INTO assignments (course_id, title, description, instructions, due_offset_days, sort_order) VALUES ($1,$2,$3,$4,$5,$6)`,
        [courseIds[1], 'Self-Inquiry Journal Entry', 'Record your experience with the "Who am I?" inquiry.', 'Sit quietly for 20 minutes and practice the "Who am I?" inquiry. Afterward, write freely about what arose — thoughts, feelings, insights, obstacles. There is no right answer; honest observation is the practice.', 7, 1]);

      // Quizzes for course 1
      const q1 = await appPool.query(`INSERT INTO quizzes (course_id, title, description, sort_order) VALUES ($1,$2,$3,$4) RETURNING id`,
        [courseIds[0], 'Foundations Check-In', 'Test your understanding of the core mindfulness concepts.', 1]);
      const q1id = q1.rows[0].id;
      const q1questions = [
        ['What is the primary "object" used as an anchor in basic mindfulness meditation?', JSON.stringify(['The mantra', 'The breath', 'A candle flame', 'A sacred image']), 1, 'The breath is the most common anchor because it is always present and reflects the state of the nervous system.'],
        ['Which of the following best describes the attitude of mindfulness toward thoughts?', JSON.stringify(['Suppress them as distractions', 'Analyse them deeply', 'Observe them without identification', 'Replace them with positive thoughts']), 2, 'Mindfulness cultivates the capacity to witness thoughts arising and passing without being pulled into their content.'],
        ['Body scan practice primarily develops which quality?', JSON.stringify(['Breath control', 'Somatic awareness', 'Concentration on a point', 'Emotional suppression']), 1, 'By moving attention systematically through the body, we build sensitivity to physical sensations and release unconscious tension.'],
        ['In the context of this course, "integration" means:', JSON.stringify(['Completing all lessons in one sitting', 'Bringing mindful awareness into ordinary daily activities', 'Memorising the key teachings', 'Practising only in a dedicated meditation space']), 1, 'Integration means carrying the quality of presence cultivated in formal practice into every moment of daily life.'],
        ['Which statement about thoughts is consistent with mindfulness teaching?', JSON.stringify(['Thoughts are the self', 'Thoughts must be eliminated', 'Thoughts are events in consciousness, not commands', 'Positive thoughts should be encouraged; negative ones stopped']), 2, 'Mindfulness teaches us to recognise thoughts as mental events — they arise, they pass — they do not define who we are.'],
      ];
      for (let i = 0; i < q1questions.length; i++) {
        const [q, opts, cidx, expl] = q1questions[i];
        await appPool.query(`INSERT INTO quiz_questions (quiz_id, question, options, correct_idx, explanation, sort_order) VALUES ($1,$2,$3,$4,$5,$6)`,
          [q1id, q, opts, cidx, expl, i + 1]);
      }

      // Quiz for course 2
      const q2 = await appPool.query(`INSERT INTO quizzes (course_id, title, description, sort_order) VALUES ($1,$2,$3,$4) RETURNING id`,
        [courseIds[1], 'Self-Inquiry Understanding', 'Check your understanding of the self-inquiry approach.', 1]);
      const q2id = q2.rows[0].id;
      const q2questions = [
        ['Self-inquiry (Atma Vichara) asks us to investigate:', JSON.stringify(['The nature of the mind', 'The identity behind the sense of "I"', 'Past karma', 'The structure of the ego']), 1, 'Self-inquiry directs attention back to the very source of the "I"-thought to reveal its true nature.'],
        ['According to the teachings in this course, the "I-thought" is:', JSON.stringify(['The true self', 'A story told by the body', 'The first and root thought from which all others arise', 'A product of karma']), 2, 'Ramana Maharshi taught that the I-thought is the first modification of pure awareness, and all other thoughts depend on it.'],
        ['What is the recommended response when thoughts arise during self-inquiry?', JSON.stringify(['Stop the inquiry and start again', 'Ask again "To whom does this thought arise?"', 'Suppress the thought forcefully', 'Write the thought down for later']), 1, 'Every thought is turned back to its source by asking "To whom does this arise?" — thus deepening the inquiry rather than being distracted.'],
      ];
      for (let i = 0; i < q2questions.length; i++) {
        const [q, opts, cidx, expl] = q2questions[i];
        await appPool.query(`INSERT INTO quiz_questions (quiz_id, question, options, correct_idx, explanation, sort_order) VALUES ($1,$2,$3,$4,$5,$6)`,
          [q2id, q, opts, cidx, expl, i + 1]);
      }

      console.log('✅ LMS seed data inserted');
    }

    // Seed meditations if table is empty
    const existingMeditations = await appPool.query('SELECT id FROM meditations LIMIT 1');
    if (existingMeditations.rows.length === 0) {
      console.log('🌱 Seeding Meditation audio data...');
      const meditationsSeed = [
        ['Stillness Within', 'A guided return to the breath and the quiet beneath it.', 'Guided', 'stillness_within.mp3', 720, 'Ananya Devi', true, 1],
        ['Deep Rest for Sleep', 'Release bodily tension and ease into tranquil, restoring sleep.', 'Guided', 'deep_rest.mp3', 1200, 'Ravi Shankar', false, 2],
        ['Releasing Daily Stress', 'A gentle body scan to unwind mental fatigue and physical tightness.', 'Guided', 'release_stress.mp3', 600, 'Ananya Devi', false, 3],
        ['Tibetan Singing Bowls Sound Bath', 'Harmonic resonant frequencies to align mind and body in deep meditation.', 'Sound', 'singing_bowls.mp3', 900, 'Sound Healer Dev', true, 4],
        ['741 Hz Solfeggio Aura Cleansing', 'Pure ambient sound therapy designed for spiritual clarity and emotional peace.', 'Sound', 'solfeggio_741.mp3', 1500, 'Sound Healer Dev', false, 5],
        ['Box Breathing for Inner Focus', 'Equal count inhalation, retention, exhalation, and pause to restore balance.', 'Breathwork', 'box_breathing.mp3', 480, 'Mira Joshi', false, 6],
        ['Om Chanting & Temple Bell', 'Traditional sacred vibration chant immersed in gentle temple bells.', 'Ambient', 'om_chanting.mp3', 1800, 'Swami Anand', false, 7],
      ];

      for (const [title, desc, cat, filename, dur, guide, feat, ord] of meditationsSeed) {
        await appPool.query(
          `INSERT INTO meditations (title, description, category, audio_filename, duration_sec, guide_name, is_featured, sort_order)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [title, desc, cat, filename, dur, guide, feat, ord]
        );
      }
      console.log('✅ Meditation audio seed data inserted');
    }

    // Seed Community Posts if empty
    const existingPosts = await appPool.query('SELECT id FROM posts LIMIT 1');
    if (existingPosts.rows.length === 0) {
      console.log('🌱 Seeding Community Posts data...');
      const defaultUser = await appPool.query('SELECT id, name FROM users LIMIT 1');
      const userId = defaultUser.rows[0] ? defaultUser.rows[0].id : 1;

      const p1 = await appPool.query(
        `INSERT INTO posts (user_id, author_name, title, content, category, likes_count)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [
          userId,
          'Aarav Sharma',
          'How do you maintain a consistent 20-minute morning meditation routine?',
          'I often find myself rushing into work emails right after waking up. What subtle habit shifts have helped you protect your morning quiet time?',
          'Q&A',
          14,
        ]
      );

      const p2 = await appPool.query(
        `INSERT INTO posts (user_id, author_name, title, content, category, likes_count)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [
          userId,
          'Priya Patel',
          'A reflection on witnessing thoughts without judgment during breathwork',
          'During today’s box breathing session, I realized that thoughts are like passing clouds in an open sky. We do not need to chase them or push them away — simply observing allows them to dissolve naturally.',
          'Reflections',
          28,
        ]
      );

      const p3 = await appPool.query(
        `INSERT INTO posts (user_id, author_name, title, content, category, likes_count)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [
          userId,
          'Swami Anand',
          'The essence of Karma Yoga: Action without attachment to fruits',
          'When we perform our daily duties with full presence and devotion, releasing anxiety over the final outcome, work itself transforms into meditation.',
          'Teachings',
          42,
        ]
      );

      // Comments for p1
      await appPool.query(
        `INSERT INTO post_comments (post_id, user_id, author_name, content) VALUES ($1,$2,$3,$4)`,
        [p1.rows[0].id, userId, 'Meera N.', 'I place my phone in another room overnight and set an analog alarm. That single change protected my morning practice!']
      );
      await appPool.query(
        `INSERT INTO post_comments (post_id, user_id, author_name, content) VALUES ($1,$2,$3,$4)`,
        [p1.rows[0].id, userId, 'Rohan K.', 'Even 5 minutes right after getting out of bed helps build momentum before starting 20 minutes!']
      );

      console.log('✅ Community Posts seed data inserted');
    }

    // Seed Events if empty
    const existingEvents = await appPool.query('SELECT id FROM events LIMIT 1');
    if (existingEvents.rows.length === 0) {
      console.log('🌱 Seeding Events data...');
      await appPool.query(
        `INSERT INTO events (title, description, event_date, time_str, location, is_online, meeting_link, attendees_count)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          'Full Moon Meditation & Satsang',
          'A tranquil evening of collective silence, sacred chanting, and guided reflection under the full moon.',
          new Date(Date.now() + 86400000 * 3), // 3 days from now
          '7:30 PM - 8:45 PM IST',
          'Online Sanctuary & Zoom',
          true,
          'https://zoom.us/j/spiritual-full-moon-meditation',
          84,
        ]
      );

      await appPool.query(
        `INSERT INTO events (title, description, event_date, time_str, location, is_online, meeting_link, attendees_count)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          'Weekend Seva & Tree Plantation Gathering',
          'Join fellow seekers for a community tree plantation drive and eco-seva in the local green belt.',
          new Date(Date.now() + 86400000 * 7), // 7 days from now
          '8:00 AM - 11:30 AM IST',
          'Karmic Peace Grove, Sector 14',
          false,
          null,
          32,
        ]
      );

      await appPool.query(
        `INSERT INTO events (title, description, event_date, time_str, location, is_online, meeting_link, attendees_count)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          'Bhagavad Gita Wisdom Study Circle',
          'Interactive chapter study exploring Chapter 2 (Sankhya Yoga) commentary and practical daily application.',
          new Date(Date.now() + 86400000 * 10), // 10 days from now
          '6:00 PM - 7:15 PM IST',
          'Online Sanctuary',
          true,
          'https://zoom.us/j/gita-study-circle',
          56,
        ]
      );

      console.log('✅ Events seed data inserted');
    }

    // Seed Volunteer Opportunities if empty
    const existingVolunteers = await appPool.query('SELECT id FROM volunteer_opportunities LIMIT 1');
    if (existingVolunteers.rows.length === 0) {
      console.log('🌱 Seeding Volunteer opportunities data...');
      await appPool.query(
        `INSERT INTO volunteer_opportunities (title, description, category, location, required_volunteers, current_volunteers)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [
          'Food & Meal Distribution Seva',
          'Assist in preparing and distributing nutritious warm meals to underserved local communities.',
          'Community Meal Seva',
          'Central Community Kitchen',
          10,
          4,
        ]
      );

      await appPool.query(
        `INSERT INTO volunteer_opportunities (title, description, category, location, required_volunteers, current_volunteers)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [
          'Event Usher & Sanctuary Greeter',
          'Welcome guests, assist with check-in, and manage seating for upcoming Satsang and meditation events.',
          'Event Support',
          'Spiritual Center Main Hall',
          6,
          2,
        ]
      );

      await appPool.query(
        `INSERT INTO volunteer_opportunities (title, description, category, location, required_volunteers, current_volunteers)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [
          'Audio & Technical Broadcast Assistant',
          'Help operate sound equipment, audio streaming, and Zoom moderation for online wisdom circles.',
          'Technical Seva',
          'Online / Hybrid Hall',
          4,
          1,
        ]
      );

      console.log('✅ Volunteer opportunities seed data inserted');
    }

    // Seed Divine Shop Items if empty
    const existingShopItems = await appPool.query('SELECT id FROM shop_items LIMIT 1');
    if (existingShopItems.rows.length === 0) {
      console.log('🌱 Seeding Divine Shop data...');
      const shopItemsSeed = [
        [
          'Panchmukhi 108 Rudraksha Prayer Mala',
          'Authentic 5-faced Himalayan Rudraksha beads strung with silk thread and traditional tassel for Japa meditation.',
          899.00,
          'Sacred Malas',
          'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
          35,
          true,
        ],
        [
          'Hand-Carved Brass Ganesha Idol (5 Inches)',
          'Solid antique-finish brass deity statue depicting Lord Ganesha in a peaceful seated blessing posture.',
          1499.00,
          'Brassware',
          'https://images.unsplash.com/photo-1567591414440-622f98642231?auto=format&fit=crop&w=600&q=80',
          20,
          true,
        ],
        [
          'Organic Mysore Sandalwood Dhoop & Incense Sticks',
          'Pure natural sandalwood incense prepared without bamboo core or synthetic fragrance. Set of 50 sticks with ceramic holder.',
          349.00,
          'Incense',
          'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80',
          100,
          false,
        ],
        [
          'Ergonomic Organic Buckwheat Meditation Cushion (Zafu)',
          'Double-layered organic cotton cushion filled with natural buckwheat hulls for spinal alignment and comfortable posture.',
          1299.00,
          'Cushions',
          'https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=600&q=80',
          15,
          true,
        ],
        [
          'Bhagavad Gita As It Is — Deluxe Hardcover Edition',
          'Complete Sanskrit verses, English transliteration, word-for-word meanings, and comprehensive commentary by A.C. Bhaktivedanta Swami Prabhupada.',
          599.00,
          'Books',
          'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
          40,
          false,
        ],
        [
          'Pure Copper Water Bottle & Cup Set (950ml)',
          'Hand-hammered 99.9% pure ayurvedic copper vessel for storing Tamra Jal water overnight.',
          799.00,
          'Brassware',
          'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=600&q=80',
          25,
          false,
        ],
      ];

      for (const [title, desc, price, cat, imgUrl, stock, feat] of shopItemsSeed) {
        await appPool.query(
          `INSERT INTO shop_items (title, description, price, category, image_url, stock_quantity, is_featured)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [title, desc, price, cat, imgUrl, stock, feat]
        );
      }
      console.log('✅ Divine Shop seed data inserted');
    }

    console.log('\n🎉 Database initialization complete!');
  } catch (error) {
    console.error('❌ Table schema creation failed:', error.message);
  } finally {
    await appPool.end();
  }
}

initializeDatabase();
