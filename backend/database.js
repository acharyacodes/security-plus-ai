const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config();

const dbPath = process.env.DB_PATH || path.join(__dirname, 'data', 'study.db');
const db = new Database(dbPath);

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS subsections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE,
    title TEXT,
    objective_text TEXT,
    is_complete INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS topics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subsection_id INTEGER,
    name TEXT,
    FOREIGN KEY (subsection_id) REFERENCES subsections(id)
  );

  CREATE TABLE IF NOT EXISTS subtopics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    topic_id INTEGER,
    name TEXT,
    mastery_status TEXT DEFAULT 'not_started',
    FOREIGN KEY (topic_id) REFERENCES topics(id)
  );

  CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    topic_id INTEGER,
    subtopic_id INTEGER,
    question_text TEXT,
    question_type TEXT,
    multiple_correct INTEGER DEFAULT 0,
    options TEXT, -- JSON string
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (topic_id) REFERENCES topics(id),
    FOREIGN KEY (subtopic_id) REFERENCES subtopics(id)
  );

  CREATE TABLE IF NOT EXISTS attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_id INTEGER,
    topic_id INTEGER,
    subtopic_id INTEGER,
    subsection_id INTEGER,
    selected_answers TEXT, -- JSON string
    is_correct INTEGER,
    rating TEXT, -- easy, hard, again
    user_reason TEXT,
    user_confidence TEXT,
    session_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES questions(id),
    FOREIGN KEY (topic_id) REFERENCES topics(id),
    FOREIGN KEY (subtopic_id) REFERENCES subtopics(id),
    FOREIGN KEY (subsection_id) REFERENCES subsections(id)
  );

  CREATE TABLE IF NOT EXISTS analytics_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subsection_id INTEGER,
    analysis_text TEXT,
    generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    has_new_attempts_since INTEGER DEFAULT 0,
    FOREIGN KEY (subsection_id) REFERENCES subsections(id)
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  -- Internal state for current study session persistence
  CREATE TABLE IF NOT EXISTS session_state (
    current_subsection_id INTEGER PRIMARY KEY,
    current_topic_id INTEGER,
    current_subtopic_id INTEGER,
    queue TEXT, -- JSON array of question IDs
    is_revealed INTEGER DEFAULT 0, -- 1 if answers are currently shown
    selected_answers TEXT, -- JSON array of user selections
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (current_subsection_id) REFERENCES subsections(id)
  );

  CREATE TABLE IF NOT EXISTS custom_tests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    topic_ids TEXT, -- JSON array of topic IDs
    subtopic_ids TEXT, -- JSON array of subtopic IDs
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS custom_session_state (
    test_id INTEGER PRIMARY KEY,
    queue TEXT, -- JSON array of question IDs
    is_revealed INTEGER DEFAULT 0,
    selected_answers TEXT,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (test_id) REFERENCES custom_tests(id)
  );
`);

module.exports = db;
