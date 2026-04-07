const express = require('express');
const router = express.Router();
const db = require('../database');
const AdaptiveQueue = require('../services/adaptiveQueue');

// GET /api/custom/topics (Searchable list for the builder)
router.get('/topics', (req, res) => {
  const query = req.query.q || '';
  const topics = db.prepare(`
    SELECT t.id, t.name, s.code as subsection_code, s.title as subsection_title
    FROM topics t
    JOIN subsections s ON t.subsection_id = s.id
    WHERE t.name LIKE ? OR s.code LIKE ? OR s.title LIKE ?
    ORDER BY s.code, t.id
  `).all(`%${query}%`, `%${query}%`, `%${query}%`);
  
  res.json(topics);
});

// POST /api/custom/create
router.post('/create', (req, res) => {
  try {
    const { name, topicIds } = req.body;
    
    const result = db.prepare(`
      INSERT INTO custom_tests (name, topic_ids)
      VALUES (?, ?)
    `).run(name || 'Untitled Custom Test', JSON.stringify(topicIds));
    
    const testId = result.lastInsertRowid;
    res.json({ success: true, testId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/custom/session/:testId
router.get('/session/:testId', async (req, res) => {
  try {
    const testId = req.params.testId;
    const test = db.prepare('SELECT * FROM custom_tests WHERE id = ?').get(testId);
    if (!test) return res.status(404).json({ error: "Custom test not found" });

    // Custom Queue Logic
    let state = db.prepare('SELECT * FROM custom_session_state WHERE test_id = ?').get(testId);
    let queue = state ? JSON.parse(state.queue) : [];
    let isRevealed = state ? !!state.is_revealed : false;
    let selectedAnswers = state && state.selected_answers ? JSON.parse(state.selected_answers) : [];

    // If no queue, generate first batch from all topics
    if (queue.length === 0) {
      const topicIds = JSON.parse(test.topic_ids);
      const { generateQuestions } = require('../services/questionGenerator');
      
      // Pull 2 questions for each selected topic to start
      for (const topicId of topicIds) {
        // Find subtopics for this topic
        const subtopics = db.prepare('SELECT id FROM subtopics WHERE topic_id = ?').all(topicId);
        for (const st of subtopics) {
           const batch = await generateQuestions(topicId, st.id);
           queue.push(...batch.map(q => q.id));
        }
      }
      
      // Save initial state
      db.prepare(`
        INSERT OR REPLACE INTO custom_session_state (test_id, queue, is_revealed, selected_answers)
        VALUES (?, ?, ?, ?)
      `).run(testId, JSON.stringify(queue), 0, JSON.stringify([]));
    }

    const questionId = queue[0];
    if (!questionId) return res.json({ finished: true });

    const question = db.prepare('SELECT * FROM questions WHERE id = ?').get(questionId);
    question.options = JSON.parse(question.options);

    res.json({
      question,
      testName: test.name,
      isRevealed,
      selectedAnswers,
      progress: { current: 1, total: queue.length } // Simple progress for custom
    });
  } catch (err) {
     console.error(err);
     res.status(500).json({ error: err.message });
  }
});

// POST /api/custom/submit
router.post('/submit', async (req, res) => {
  try {
    const { testId, questionId, rating, selectedAnswers } = req.body;
    
    db.prepare(`
      UPDATE custom_session_state 
      SET is_revealed = 1, selected_answers = ?
      WHERE test_id = ?
    `).run(JSON.stringify(selectedAnswers), testId);
    
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/custom/advance
router.post('/advance', (req, res) => {
    try {
      const { testId, rating } = req.body;
      const state = db.prepare('SELECT queue FROM custom_session_state WHERE test_id = ?').get(testId);
      let queue = JSON.parse(state.queue);
      const finishedId = queue.shift();

      if (rating === 'again') {
        queue.splice(Math.min(3, queue.length), 0, finishedId);
      } else if (rating === 'hard') {
        queue.push(finishedId);
      }

      db.prepare(`
        UPDATE custom_session_state 
        SET queue = ?, is_revealed = 0, selected_answers = ?
        WHERE test_id = ?
      `).run(JSON.stringify(queue), JSON.stringify([]), testId);

      res.json({ success: true, finished: queue.length === 0 });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
});

module.exports = router;
