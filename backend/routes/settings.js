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
    if (provider) upsert.run('provider', provider);
    if (model) upsert.run('model', model);
    if (apiKey) upsert.run('apiKey', apiKey);
  })();

  res.json({ message: 'Settings saved' });
});

// POST /api/settings/test
router.post('/test', async (req, res) => {
  const { provider, model, apiKey } = req.body;
  
  try {
    let result = false;
    if (provider === 'gemini' || provider === 'google') {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await axios.post(url, {
        contents: [{ parts: [{ text: "Hello, reply with 'ok'" }] }]
      });
      result = response.status === 200;
    } else if (provider === 'openai') {
      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: model,
        messages: [{ role: "user", content: "Hello" }]
      }, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      result = response.status === 200;
    } else if (provider === 'anthropic') {
      const response = await axios.post('https://api.anthropic.com/v1/messages', {
        model: model,
        max_tokens: 10,
        messages: [{ role: "user", content: "Hello" }]
      }, {
        headers: { 
          'x-api-key': apiKey,
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
