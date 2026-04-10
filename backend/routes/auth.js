const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const masterDb = require('../masterDb');
const { storage: dbStorage, getUserDb } = require('../database');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// ─────────────────────────────────────────────────────────────
// GET /api/auth/status
// Public — tells the frontend whether bootstrap is needed or
// if the user is already logged in.
// ─────────────────────────────────────────────────────────────
router.get('/status', (req, res) => {
  const userCount = masterDb.prepare('SELECT COUNT(*) as count FROM users').get().count;
  const loggedIn = !!req.session?.username;
  res.json({
    needsBootstrap: userCount === 0,
    loggedIn,
    user: loggedIn
      ? { username: req.session.username, isAdmin: !!req.session.isAdmin }
      : null,
  });
});

// ─────────────────────────────────────────────────────────────
// POST /api/auth/bootstrap
// Creates the very first admin account.
// Locked out once any user exists.
// ─────────────────────────────────────────────────────────────
router.post('/bootstrap', async (req, res) => {
  const userCount = masterDb.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount > 0) {
    return res.status(403).json({ error: 'Bootstrap is only allowed when no users exist.' });
  }

  const { username, password } = req.body;
  if (!username || !password || password.length < 6) {
    return res.status(400).json({ error: 'Username and password (min 6 characters) required.' });
  }

  try {
    const hash = await bcrypt.hash(password, 12);
    masterDb
      .prepare('INSERT INTO users (username, password_hash, is_admin) VALUES (?, ?, 1)')
      .run(username.trim(), hash);

    await seedUserDb(username.trim());

    req.session.username = username.trim();
    req.session.isAdmin = true;
    res.json({ success: true });
  } catch (err) {
    console.error('Bootstrap error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required.' });
  }

  const user = masterDb
    .prepare('SELECT * FROM users WHERE username = ? COLLATE NOCASE')
    .get(username.trim());

  // Use a constant-time compare even on "user not found" to prevent
  // timing-based username enumeration
  const dummyHash = '$2a$12$invalidhashpadding000000000000000000000000000000000000000';
  const valid = user
    ? await bcrypt.compare(password, user.password_hash)
    : await bcrypt.compare(password, dummyHash).then(() => false);

  if (!user || !valid) {
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

  req.session.username = user.username;
  req.session.isAdmin = !!user.is_admin;
  res.json({ success: true, username: user.username, isAdmin: !!user.is_admin });
});

// ─────────────────────────────────────────────────────────────
// POST /api/auth/logout
// ─────────────────────────────────────────────────────────────
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
});

// ─────────────────────────────────────────────────────────────
// GET /api/auth/me
// ─────────────────────────────────────────────────────────────
router.get('/me', requireAuth, (req, res) => {
  res.json({ username: req.session.username, isAdmin: !!req.session.isAdmin });
});

// ─────────────────────────────────────────────────────────────
// GET /api/auth/users  (admin only)
// ─────────────────────────────────────────────────────────────
router.get('/users', requireAuth, requireAdmin, (req, res) => {
  const users = masterDb
    .prepare('SELECT id, username, is_admin, created_at FROM users ORDER BY created_at ASC')
    .all();
  res.json(users);
});

// ─────────────────────────────────────────────────────────────
// POST /api/auth/users  (admin only) — create a new user
// Auto-seeds the new user's DB with the SY0-701 syllabus.
// ─────────────────────────────────────────────────────────────
router.post('/users', requireAuth, requireAdmin, async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password || password.length < 6) {
    return res.status(400).json({ error: 'Username and password (min 6 characters) required.' });
  }

  try {
    const hash = await bcrypt.hash(password, 12);
    masterDb
      .prepare('INSERT INTO users (username, password_hash, is_admin) VALUES (?, ?, 0)')
      .run(username.trim(), hash);

    await seedUserDb(username.trim());

    res.json({ success: true, message: `User "${username.trim()}" created.` });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'That username is already taken.' });
    }
    console.error('Create user error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/auth/users/:username/password  (admin only)
// ─────────────────────────────────────────────────────────────
router.post('/users/:username/password', requireAuth, requireAdmin, async (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }
  const hash = await bcrypt.hash(password, 12);
  masterDb
    .prepare('UPDATE users SET password_hash = ? WHERE username = ? COLLATE NOCASE')
    .run(hash, req.params.username);
  res.json({ success: true });
});

// ─────────────────────────────────────────────────────────────
// DELETE /api/auth/users/:username  (admin only)
// ─────────────────────────────────────────────────────────────
router.delete('/users/:username', requireAuth, requireAdmin, (req, res) => {
  const { username } = req.params;
  if (username.toLowerCase() === req.session.username.toLowerCase()) {
    return res.status(400).json({ error: 'You cannot delete your own account.' });
  }
  masterDb.prepare('DELETE FROM users WHERE username = ? COLLATE NOCASE').run(username);
  res.json({ success: true });
});

// ─────────────────────────────────────────────────────────────
// Helper: seed a new user's private DB with the syllabus JSON
// ─────────────────────────────────────────────────────────────
async function seedUserDb(username) {
  // Pre-warm the cache entry so the DB file exists
  getUserDb(username);

  // Check if already seeded
  const count = dbStorage.run(username, () => {
    return getUserDb(username).prepare('SELECT COUNT(*) as c FROM subsections').get().c;
  });

  if (count === 0) {
    // Run inside the user's context so pdfParser's db.prepare() hits their DB
    await dbStorage.run(username, async () => {
      const { seedFromJson } = require('../services/pdfParser');
      await seedFromJson();
    });
  }
}

module.exports = router;
