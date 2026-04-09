const express = require('express');
const router = express.Router();
const db = require('../database');
const axios = require('axios');

// GET /api/settings
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM settings').all();
  const settings = rows.reduce((acc, row) => {
    acc[row.key] = row.value;
    return acc;
  }, {});
  res.json(settings);
});

// POST /api/settings
router.post('/', (req, res) => {
  const { provider, model, apiKey } = req.body;
  const upsert = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  
  db.transaction(() => {
    if (provider) upsert.run('provider', provider.trim());
    if (model) upsert.run('model', model.trim());
    if (apiKey) upsert.run('apiKey', apiKey.trim());
  })();

  res.json({ message: 'Settings saved' });
});

// POST /api/settings/test
router.post('/test', async (req, res) => {
  const { provider, model, apiKey } = req.body;
  
  try {
    let result = false;
    if (provider === 'gemini' || provider === 'google') {
      const cleanModel = model.trim();
      const cleanKey = apiKey.trim();
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${cleanKey}`;
      const response = await axios.post(url, {
        contents: [{ parts: [{ text: "Hello, reply with 'ok'" }] }]
      });
      result = response.status === 200;
    } else if (provider === 'openai') {
      const cleanKey = apiKey.trim();
      const cleanModel = model.trim();
      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: cleanModel,
        messages: [{ role: "user", content: "Hello" }]
      }, {
        headers: { 'Authorization': `Bearer ${cleanKey}` }
      });
      result = response.status === 200;
    } else if (provider === 'anthropic') {
      const cleanKey = apiKey.trim();
      const cleanModel = model.trim();
      const response = await axios.post('https://api.anthropic.com/v1/messages', {
        model: cleanModel,
        max_tokens: 10,
        messages: [{ role: "user", content: "Hello" }]
      }, {
        headers: { 
          'x-api-key': cleanKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        }
      });
      result = response.status === 200;
    }

    res.json({ success: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Connection test failed: ' + (err.response?.data?.error?.message || err.message) });
  }
});

module.exports = router;
