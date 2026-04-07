const express = require('express');
const router = express.Router();
const db = require('../database');
const { generateSubsectionAnalysis } = require('../services/analyticsEngine');

// GET /api/analytics/subsection/:id
router.get('/subsection/:id', (req, res) => {
  const subsectionId = req.params.id;
  const cache = db.prepare('SELECT * FROM analytics_cache WHERE subsection_id = ?').get(subsectionId);
  const stats = getSubsectionStats(subsectionId);
  const topics = getTopicBreakdown(subsectionId);

  res.json({
    analysis: cache || null,
    stats,
    topics
  });
});

// POST /api/analytics/refresh/:id
router.post('/refresh/:id', async (req, res) => {
  try {
    const subsectionId = req.params.id;
    const analysisText = await generateSubsectionAnalysis(subsectionId);
    res.json({ analysis_text: analysisText });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/analytics/redo/:id
router.post('/redo/:id', (req, res) => {
  const subsectionId = req.params.id;
  // Reset mastery status for all topics in this subsection
  db.prepare('UPDATE topics SET mastery_status = "not_started" WHERE subsection_id = ?').run(subsectionId);
  db.prepare('UPDATE subsections SET is_complete = 0 WHERE id = ?').run(subsectionId);
  
  // Clean up the session state for this subsection
  db.prepare('DELETE FROM session_state WHERE current_subsection_id = ?').run(subsectionId);

  res.json({ success: true, message: 'Subsection reset. Fresh questions will be generated informed by your previous history.' });
});

function getSubsectionStats(subsectionId) {
  return db.prepare(`
    SELECT 
      COUNT(*) as total_questions,
      SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_questions,
      SUM(CASE WHEN rating = 'easy' THEN 1 ELSE 0 END) as easy_count,
      SUM(CASE WHEN rating = 'hard' THEN 1 ELSE 0 END) as hard_count,
      SUM(CASE WHEN rating = 'again' THEN 1 ELSE 0 END) as again_count
    FROM attempts WHERE subsection_id = ?
  `).get(subsectionId);
}

function getTopicBreakdown(subsectionId) {
  return db.prepare(`
    SELECT t.name, t.mastery_status,
    (SELECT COUNT(*) FROM attempts a WHERE a.topic_id = t.id) as attempts_count,
    (SELECT COUNT(*) FROM attempts a WHERE a.topic_id = t.id AND a.is_correct = 0) as missed_count
    FROM topics t WHERE t.subsection_id = ?
  `).all(subsectionId);
}

// GET /api/analytics/history/:id
router.get('/history/:id', (req, res) => {
  const subsectionId = req.params.id;
  const history = db.prepare(`
    SELECT 
      st.name as subtopic_name,
      q.question_text,
      q.options,
      a.user_reason,
      a.created_at
    FROM attempts a
    JOIN questions q ON a.question_id = q.id
    JOIN subtopics st ON q.subtopic_id = st.id
    WHERE a.subsection_id = ? AND a.is_correct = 0
    ORDER BY a.created_at DESC
  `).all(subsectionId);

  // Parse options to find correct one for every question
  const formatted = history.map(h => {
    const options = JSON.parse(h.options);
    const correct = options.filter(o => o.is_correct).map(o => o.text).join(', ');
    return {
      subtopic: h.subtopic_name,
      question: h.question_text,
      correctAnswer: correct,
      reason: h.reason || h.user_reason,
      date: h.created_at
    };
  });

  res.json(formatted);
});

module.exports = router;
