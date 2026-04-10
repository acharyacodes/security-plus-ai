const express = require('express');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
require('dotenv').config();

const { storage: dbStorage } = require('./database');
const { requireAuth } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Session secret — auto-generated on first run ───────────────
// If SESSION_SECRET is in .env, use it. Otherwise load from
// data/session.secret (created automatically on first startup).
// Users never need to touch a config file.
function getOrCreateSessionSecret() {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;

  const secretFile = path.join(__dirname, 'data', 'session.secret');
  const dataDir = path.join(__dirname, 'data');

  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  if (fs.existsSync(secretFile)) {
    return fs.readFileSync(secretFile, 'utf8').trim();
  }

  // First run: generate a cryptographically random secret and persist it
  const secret = crypto.randomBytes(48).toString('hex');
  fs.writeFileSync(secretFile, secret, { encoding: 'utf8', mode: 0o600 });
  console.log('Generated session secret → backend/data/session.secret');
  return secret;
}

const SESSION_SECRET = getOrCreateSessionSecret();

// Trust the first proxy (Cloudflare Tunnel / nginx) so that
// req.secure and forwarded headers work correctly.
app.set('trust proxy', 1);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Session ────────────────────────────────────────────────────
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    // secure: true tells the browser to only send the cookie over HTTPS.
    // With Cloudflare Tunnel the browser always talks HTTPS, so this is safe.
    // Locally (no HTTPS) set NODE_ENV=development to relax this.
    secure: process.env.NODE_ENV !== 'development',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
}));

// ── Static files (production build) ───────────────────────────
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// ── Public routes (no auth required) ──────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', require('./routes/auth'));

// ── Auth + per-user DB context for all other /api routes ───────
// Every request past this point must have a valid session.
// dbStorage.run() sets the AsyncLocalStorage context so every
// db.prepare() call in routes/services hits the right user's DB.
function setUserContext(req, res, next) {
  dbStorage.run(req.session.username, next);
}

app.use('/api', requireAuth, setUserContext);

// ── Protected routes ───────────────────────────────────────────
app.use('/api/setup',     require('./routes/setup'));
app.use('/api/study',     require('./routes/study'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/settings',  require('./routes/settings'));
app.use('/api/custom',    require('./routes/custom'));

// ── SPA catch-all ─────────────────────────────────────────────
app.get('*path', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
