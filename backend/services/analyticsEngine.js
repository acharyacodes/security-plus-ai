const db = require('../database');
const axios = require('axios');

/**
 * Generates an AI reasoning analysis for a subsection based on attempt history.
 */
async function generateSubsectionAnalysis(subsectionId) {
  const attempts = db.prepare(`
    SELECT a.*, q.question_text, q.question_type 
    FROM attempts a 
    JOIN questions q ON a.question_id = q.id 
    WHERE a.subsection_id = ?
    ORDER BY a.created_at DESC
  `).all(subsectionId);

  const subsection = db.prepare('SELECT title FROM subsections WHERE id = ?').get(subsectionId);
  const settings = getSettings();

  if (!settings.apiKey) throw new Error('API Key missing');

  const summary = attempts.map(a => ({
    question: a.question_text,
    type: a.question_type,
    isCorrect: a.is_correct === 1,
    rating: a.rating,
    reason: a.user_reason,
    confidence: a.user_confidence
  }));

  const prompt = `
    Analyze these study attempts for a student in the subsection: "${subsection.title}".
    Data: ${JSON.stringify(summary)}

    Your Goal:
    Provide a professional, insightful analysis (3-4 paragraphs) in plain English.
    1. Identify consistent patterns where the student's thinking breaks down (based on 'reason' and 'type').
    2. Focus on "Hard" rated correct answers and all "Incorrect" answers.
    3. Note if they are overconfident or second-guessing themselves.
    4. Provide 3 actionable tips for this specific subsection.

    Structure the response clearly.
  `;

  const analysisText = await callAI(settings, prompt);

  // Cache it
  db.prepare(`
    INSERT OR REPLACE INTO analytics_cache (subsection_id, analysis_text, generated_at, has_new_attempts_since)
    VALUES (?, ?, CURRENT_TIMESTAMP, 0)
  `).run(subsectionId, analysisText);

  return analysisText;
}

function getSettings() {
  const rows = db.prepare('SELECT * FROM settings').all();
  return rows.reduce((acc, row) => {
    acc[row.key] = row.value;
    return acc;
  }, {});
}

async function callAI(settings, prompt) {
  const { provider, model, apiKey } = settings;
  
  if (provider === 'gemini' || provider === 'google') {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const response = await axios.post(url, {
      contents: [{ parts: [{ text: prompt }] }]
    });
    return response.data.candidates[0].content.parts[0].text;
  } else if (provider === 'openai') {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: model,
      messages: [{ role: "system", content: "You are an educational psychologist." }, { role: "user", content: prompt }]
    }, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    return response.data.choices[0].message.content;
  } else if (provider === 'anthropic') {
    const response = await axios.post('https://api.anthropic.com/v1/messages', {
      model: model,
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }]
    }, {
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' }
    });
    return response.data.content[0].text;
  }
}

module.exports = { generateSubsectionAnalysis };
