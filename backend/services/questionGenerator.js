const axios = require('axios');
const db = require('../database');

// ─────────────────────────────────────────────
// Question count scales with subtopic count
// ─────────────────────────────────────────────
function getRequiredQuestionCount(subtopicCount) {
  if (subtopicCount === 0) return 2;
  if (subtopicCount <= 3) return 3;
  if (subtopicCount <= 6) return 4;
  return Math.min(6, Math.ceil(subtopicCount / 2)); // cap at 6
}

// ─────────────────────────────────────────────
// Distribute question types across count
// e.g. count=5 → concept, scenario, elimination, application, scenario
// ─────────────────────────────────────────────
function getQuestionTypes(count) {
  const base = ['concept', 'scenario', 'elimination', 'application'];
  const extras = ['scenario', 'concept']; // extras if count > 4
  return [...base, ...extras].slice(0, count);
}

// ─────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────
async function generateQuestions(topicId, subtopicId) {
  // ── Fetch topic, subtopic, and sibling subtopics for full coverage ──
  const subtopic = db.prepare(`
    SELECT 
      st.id,
      st.name AS subtopic_name,
      t.id AS topic_id,
      t.name AS topic_name,
      s.code AS subsection_code,
      s.title AS subsection_title,
      s.objective_text
    FROM subtopics st
    JOIN topics t ON st.topic_id = t.id
    JOIN subsections s ON t.subsection_id = s.id
    WHERE st.id = ?
  `).get(subtopicId);

  if (!subtopic) throw new Error(`Subtopic ${subtopicId} not found`);

  // All subtopics under this same topic (for coverage instruction)
  const allSubtopics = db.prepare(`
    SELECT name FROM subtopics WHERE topic_id = ?
  `).all(subtopic.topic_id).map(r => r.name);

  const settings = getSettings();
  if (!settings.apiKey) throw new Error('API key missing in settings');

  // ── Attempt history for this subtopic ──
  const history = db.prepare(`
    SELECT 
      a.selected_answers,
      a.is_correct,
      a.user_reason,
      a.rating,
      q.question_text,
      q.question_type
    FROM attempts a
    JOIN questions q ON a.question_id = q.id
    WHERE a.subtopic_id = ?
    ORDER BY a.created_at DESC
    LIMIT 10
  `).all(subtopicId);

  // ── Determine question count and types ──
  const questionCount = getRequiredQuestionCount(allSubtopics.length);
  const questionTypes = getQuestionTypes(questionCount);

  // ── Build history context ──
  const historyContext = buildHistoryContext(history);

  // ── Build prompt ──
  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt({
    subtopic,
    allSubtopics,
    questionCount,
    questionTypes,
    historyContext,
  });

  // ── Call AI with retry ──
  let questions;
  let lastError;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const rawResponse = await callAI(settings, systemPrompt, userPrompt);
      questions = parseAIResponse(rawResponse);
      break; // success
    } catch (err) {
      lastError = err;
      console.warn(`Question generation attempt ${attempt} failed:`, err.message);
      if (attempt < 3) await sleep(1000 * attempt); // backoff
    }
  }

  if (!questions) {
    throw new Error(`Failed to generate questions after 3 attempts: ${lastError?.message}`);
  }

  // ── Validate parsed questions ──
  const validated = validateQuestions(questions, questionCount);

  // ── Save to DB in a single transaction (all or nothing) ──
  const savedQuestions = saveQuestions(topicId, subtopicId, validated);

  return savedQuestions;
}

// ─────────────────────────────────────────────
// Build history context string
// ─────────────────────────────────────────────
function buildHistoryContext(history) {
  if (history.length === 0) {
    return 'No previous attempts for this subtopic.';
  }

  const wrongAttempts = history.filter(h => !h.is_correct);
  const hardAttempts = history.filter(h => h.rating === 'hard');
  const reasonPatterns = history
    .filter(h => h.user_reason && h.user_reason.trim().length > 0)
    .map(h => `[${h.is_correct ? 'CORRECT' : 'WRONG'} / ${h.rating}] Q: "${h.question_text}" — User reason: "${h.user_reason}"`)
    .join('\n');

  return `
PREVIOUS ATTEMPT HISTORY (${history.length} attempts):
- Wrong answers: ${wrongAttempts.length}
- Hard-rated: ${hardAttempts.length}

User reasoning patterns:
${reasonPatterns || 'No reasons recorded yet.'}

INSTRUCTIONS BASED ON HISTORY:
- If the user has been getting wrong answers, increase foundational concept testing.
- If user_reason reveals a specific misconception (e.g., confusing two similar terms), 
  generate a question that directly addresses that confusion.
- If user_reason shows keyword-matching behavior (picking answers based on word matching 
  rather than understanding), generate more scenario-based questions.
- If the user has rated questions as Hard, provide more context in explanations.
  `.trim();
}

// ─────────────────────────────────────────────
// System prompt — provider-agnostic instructions
// ─────────────────────────────────────────────
function buildSystemPrompt() {
  return `You are a CompTIA Security+ SY0-701 exam question writer with deep expertise in cybersecurity.
Your job is to generate exam-quality multiple choice questions that genuinely test understanding, not memorization.
You always respond with valid JSON only. No markdown, no explanation text outside the JSON.`;
}

// ─────────────────────────────────────────────
// User prompt — the actual generation request
// ─────────────────────────────────────────────
function buildUserPrompt({ subtopic, allSubtopics, questionCount, questionTypes, historyContext }) {
  const subtopicListStr = allSubtopics.length > 0
    ? allSubtopics.map((s, i) => `  ${i + 1}. ${s}`).join('\n')
    : '  (no specific subtopics listed)';

  return `
Generate exactly ${questionCount} multiple choice questions for the following:

SUBSECTION: ${subtopic.subsection_code} — ${subtopic.subsection_title}
TOPIC: ${subtopic.topic_name}
SPECIFIC SUBTOPIC BEING TESTED: ${subtopic.subtopic_name}
EXAM OBJECTIVE: ${subtopic.objective_text}

ALL SUBTOPICS UNDER THIS TOPIC (you MUST ensure coverage across these):
${subtopicListStr}

QUESTION TYPES TO GENERATE (in this order):
${questionTypes.map((t, i) => `  Question ${i + 1}: ${t}`).join('\n')}

${historyContext}

═══════════════════════════════════════════
CRITICAL QUALITY REQUIREMENTS
═══════════════════════════════════════════

1. SUBTOPIC COVERAGE
   - Every subtopic listed above must be tested by at least one question.
   - Do not cluster all questions around the obvious/most-known subtopic.
   - Obscure subtopics that appear on the exam must be included.

2. DISTRACTOR QUALITY (ELITE REQUIREMENT)
   - ALL wrong answer options must be plausible and contextually related.
   - Wrong options must fall into one of these categories:
     a) Technically correct in a DIFFERENT context (e.g., right answer for wireless but not for switches).
     b) A "Reasoning Trap": A technical answer that sounds good, but the question actually asked for a "Managerial" or "Physical" control.
     c) The "Correct Next Step": An option that is a valid part of the process, but not the FIRST or BEST step requested.
   - NEVER use obviously unrelated or nonsensical distractors.
   - A test-taker should find at least 2 options equally tempting if they only have a surface-level understanding.

3. DIFFICULTY & NUANCE (EXAM FIDELITY)
   - Avoid "obvious" or "clear-cut" correct answers. Use CompTIA qualifiers: "Which is the BEST...", "Which is the FIRST step...", "Which is the MOST likely...".
   - Scenario and application questions must describe a complex enterprise situation where multiple solutions could work, but only one is optimal.
   - Elimination questions must use options that are all technically valid somewhere in the SY0-701 objectives.
   - If user history shows keyword-matching behavior, deliberately use those keywords in DISTRACTORS to trap them into a wrong choice.

4. EXPLANATION FORMAT (required for every option)
   - For CORRECT options: explain clearly why this is the right answer in this context.
   - For WRONG options: provide TWO parts:
     a) why_this_context: why it is wrong for THIS specific question
     b) when_would_be_correct: the exact scenario or context where this option WOULD be the right answer
   - Explanations must be specific and educational, not generic.

5. MULTIPLE CORRECT ANSWERS
   - Some questions may have 2 correct answers (set multiple_correct: true).
   - Use multiple correct answers naturally — not on every question, but vary it.
   - When multiple_correct is true, the question text must say "Select TWO" or "Select ALL that apply".

═══════════════════════════════════════════
RESPONSE FORMAT
═══════════════════════════════════════════

Return ONLY a JSON array with exactly ${questionCount} objects. No other text.

[
  {
    "question_text": "Full question text here. If multiple correct, state 'Select TWO' in the question.",
    "question_type": "concept|scenario|elimination|application",
    "multiple_correct": false,
    "options": [
      {
        "id": "A",
        "text": "Option text here",
        "is_correct": true,
        "explanation": {
          "why_this_context": "Why this is correct for this specific question..."
        }
      },
      {
        "id": "B",
        "text": "Option text here",
        "is_correct": false,
        "explanation": {
          "why_this_context": "Why this is wrong for this specific question...",
          "when_would_be_correct": "This would be correct when... [specific scenario]"
        }
      },
      {
        "id": "C",
        "text": "Option text here",
        "is_correct": false,
        "explanation": {
          "why_this_context": "Why this is wrong for this specific question...",
          "when_would_be_correct": "This would be correct when... [specific scenario]"
        }
      },
      {
        "id": "D",
        "text": "Option text here",
        "is_correct": false,
        "explanation": {
          "why_this_context": "Why this is wrong for this specific question...",
          "when_would_be_correct": "This would be correct when... [specific scenario]"
        }
      }
    ]
  }
]
  `.trim();
}

// ─────────────────────────────────────────────
// AI provider router
// Anthropic uses system + user message structure
// OpenAI uses system + user messages
// Gemini uses single content block
// ─────────────────────────────────────────────
async function callAI(settings, systemPrompt, userPrompt) {
  const { provider, model, apiKey } = settings;

  try {
    if (provider === 'anthropic') {
      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: model,
          max_tokens: 6000,
          system: systemPrompt, // proper system field, not concatenated
          messages: [{ role: 'user', content: userPrompt }],
        },
        {
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
        }
      );
      return response.data.content[0].text;

    } else if (provider === 'openai') {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.7,
        },
        {
          headers: { Authorization: `Bearer ${apiKey}` },
        }
      );
      return response.data.choices[0].message.content;

    } else if (provider === 'gemini' || provider === 'google') {
      const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`;
      const response = await axios.post(url, {
        contents: [
          {
            parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
          },
        ],
        generationConfig: { response_mime_type: 'application/json' },
      });
      return response.data.candidates[0].content.parts[0].text;

    } else {
      throw new Error(`Unknown AI provider: ${provider}`);
    }
  } catch (err) {
    const status = err.response?.status;
    const detail = JSON.stringify(err.response?.data || err.message);
    console.error(`AI call failed [${provider}] status=${status}:`, detail);
    throw new Error(`AI call failed (${status ?? 'network error'}): ${detail}`);
  }
}

// ─────────────────────────────────────────────
// Parse and clean AI response
// ─────────────────────────────────────────────
function parseAIResponse(text) {
  try {
    // Strip markdown code fences if present
    let cleaned = text
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();

    // Some providers wrap array in an object key — unwrap if needed
    const parsed = JSON.parse(cleaned);

    // Handle { "questions": [...] } wrapper
    if (!Array.isArray(parsed)) {
      const keys = Object.keys(parsed);
      for (const key of keys) {
        if (Array.isArray(parsed[key])) return parsed[key];
      }
      throw new Error('AI response is not an array and no array key found');
    }

    return parsed;
  } catch (err) {
    console.error('Failed to parse AI JSON response:', text.substring(0, 500));
    throw new Error('AI returned invalid JSON: ' + err.message);
  }
}

// ─────────────────────────────────────────────
// Validate structure of parsed questions
// ─────────────────────────────────────────────
function validateQuestions(questions, expectedCount) {
  if (!Array.isArray(questions)) {
    throw new Error('Questions is not an array');
  }

  const validTypes = ['concept', 'scenario', 'elimination', 'application'];

  return questions.slice(0, expectedCount).map((q, i) => {
    if (!q.question_text) throw new Error(`Question ${i + 1} missing question_text`);
    if (!validTypes.includes(q.question_type)) {
      console.warn(`Question ${i + 1} has invalid type "${q.question_type}", defaulting to "concept"`);
      q.question_type = 'concept';
    }
    if (!Array.isArray(q.options) || q.options.length < 2) {
      throw new Error(`Question ${i + 1} has insufficient options`);
    }

    const correctCount = q.options.filter(o => o.is_correct).length;
    if (correctCount === 0) {
      throw new Error(`Question ${i + 1} has no correct answer`);
    }

    // Ensure multiple_correct is consistent with actual correct count
    q.multiple_correct = correctCount > 1;

    // Ensure all options have explanation object
    q.options = q.options.map(o => {
      if (typeof o.explanation === 'string') {
        // Normalize string explanation to object format
        o.explanation = { why_this_context: o.explanation };
      }
      if (!o.explanation) {
        o.explanation = { why_this_context: 'No explanation provided.' };
      }
      return o;
    });

    return q;
  });
}

// ─────────────────────────────────────────────
// Save questions to DB — all or nothing
// ─────────────────────────────────────────────
function saveQuestions(topicId, subtopicId, questions) {
  const insert = db.prepare(`
    INSERT INTO questions (topic_id, subtopic_id, question_text, question_type, multiple_correct, options)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const savedQuestions = [];

  const saveAll = db.transaction(() => {
    for (const q of questions) {
      const info = insert.run(
        topicId,
        subtopicId,
        q.question_text,
        q.question_type,
        q.multiple_correct ? 1 : 0,
        JSON.stringify(q.options)
      );
      savedQuestions.push({ ...q, id: info.lastInsertRowid });
    }
  });

  saveAll(); // throws if any insert fails — rolls back all
  return savedQuestions;
}

// ─────────────────────────────────────────────
// Get settings from DB
// ─────────────────────────────────────────────
function getSettings() {
  const rows = db.prepare('SELECT * FROM settings').all();
  return rows.reduce((acc, row) => {
    acc[row.key] = row.value;
    return acc;
  }, {});
}

// ─────────────────────────────────────────────
// Utility
// ─────────────────────────────────────────────
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { generateQuestions };
