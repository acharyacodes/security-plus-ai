const { AsyncLocalStorage } = require('async_hooks');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// ─────────────────────────────────────────────────────────────
// Each authenticated request runs inside storage.run(username, next).
// Any code that calls db.prepare(...) transparently lands on
// that user's private SQLite file — no changes needed in routes
// or services.
// ─────────────────────────────────────────────────────────────
const storage = new AsyncLocalStorage();
const dbCache = new Map();

const SCHEMA = `
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
    options TEXT,
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
    selected_answers TEXT,
    is_correct INTEGER,
    rating TEXT,
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

  CREATE TABLE IF NOT EXISTS session_state (
    current_subsection_id INTEGER PRIMARY KEY,
    current_topic_id INTEGER,
    current_subtopic_id INTEGER,
    queue TEXT,
    is_revealed INTEGER DEFAULT 0,
    selected_answers TEXT,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (current_subsection_id) REFERENCES subsections(id)
  );

  CREATE TABLE IF NOT EXISTS custom_tests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    topic_ids TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS custom_session_state (
    test_id INTEGER PRIMARY KEY,
    queue TEXT,
    is_revealed INTEGER DEFAULT 0,
    selected_answers TEXT,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (test_id) REFERENCES custom_tests(id)
  );
`;

function initSchema(db) {
  db.pragma('foreign_keys = ON');
  db.exec(SCHEMA);
}

function getUserDb(username) {
  if (!dbCache.has(username)) {
    const userDataDir = path.join(__dirname, 'data', 'users');
    if (!fs.existsSync(userDataDir)) fs.mkdirSync(userDataDir, { recursive: true });

    const dbPath = path.join(userDataDir, `${username}.db`);
    const db = new Database(dbPath);
    initSchema(db);
    dbCache.set(username, db);
  }
  return dbCache.get(username);
}

// ─────────────────────────────────────────────────────────────
// Proxy — every property access is routed to the current user's
// Database instance based on the AsyncLocalStorage context.
// ─────────────────────────────────────────────────────────────
const dbProxy = new Proxy({}, {
  get(target, prop) {
    // Allow properties attached directly to the proxy (storage, getUserDb)
    if (Object.prototype.hasOwnProperty.call(target, prop)) return target[prop];

    // Ignore Symbol lookups (Symbol.toPrimitive, Symbol.iterator, etc.)
    if (typeof prop === 'symbol') return undefined;

    const username = storage.getStore();
    if (!username) {
      throw new Error(
        `DB accessed without a user context (prop: "${prop}"). ` +
        'Is the auth middleware missing for this route?'
      );
    }

    const db = getUserDb(username);
    const val = db[prop];
    return typeof val === 'function' ? val.bind(db) : val;
  },
});

// Attach helpers — server.js and auth.js import these directly
module.exports = dbProxy;
module.exports.storage = storage;
module.exports.getUserDb = getUserDb;
