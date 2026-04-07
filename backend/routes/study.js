const express = require('express');
const router = express.Router();
const db = require('../database');
const AdaptiveQueue = require('../services/adaptiveQueue');

// GET /api/study/dashboard
router.get('/dashboard', (req, res) => {
  const subsections = db.prepare(`
    SELECT s.*, 
    (SELECT COUNT(*) FROM subtopics st JOIN topics t ON st.topic_id = t.id WHERE t.subsection_id = s.id) as total_topics,
    (SELECT COUNT(*) FROM subtopics st JOIN topics t ON st.topic_id = t.id WHERE t.subsection_id = s.id AND st.mastery_status = 'mastered') as mastered_topics
    FROM subsections s
  `).all();

  // Get Ongoing Sessions
  const ongoing = db.prepare(`
    SELECT 
      ss.current_subsection_id,
      s.code as subsection_code,
      s.title as subsection_title,
      ss.last_updated
    FROM session_state ss
    JOIN subsections s ON ss.current_subsection_id = s.id
    ORDER BY ss.last_updated DESC
  `).all();

  // Group by Domain (X.0)
  const domains = {};
  for (const s of subsections) {
    const domainPrefix = s.code.split('.')[0] + '.0';
    if (!domains[domainPrefix]) {
      domains[domainPrefix] = {
        code: domainPrefix,
        subsections: [],
        total_topics: 0,
        mastered_topics: 0
      };
    }
    domains[domainPrefix].subsections.push(s);
    domains[domainPrefix].total_topics += s.total_topics;
    domains[domainPrefix].mastered_topics += s.mastered_topics;
  }

  res.json({
    domains: Object.values(domains),
    ongoing
  });
});

// GET /api/study/session/:subsectionId
router.get('/session/:subsectionId', async (req, res) => {
  try {
    const queue = new AdaptiveQueue(req.params.subsectionId);
    await queue.initialize();
    
    const question = queue.getNextQuestion();
    if (!question) {
      return res.json({ finished: true });
    }

    const topic = db.prepare('SELECT name FROM topics WHERE id = ?').get(question.topic_id);
    const progress = getSubsectionProgress(req.params.subsectionId);

    // If session was bookmarked on 'revealed' state, send that state back
    res.json({
      question,
      topicName: topic.name,
      progress,
      isRevealed: queue.isRevealed,
      selectedAnswers: queue.selectedAnswers
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/study/submit
router.post('/submit', async (req, res) => {
  try {
    const { 
      subsectionId, 
      questionId, 
      topicId, 
      selectedAnswers, 
      isCorrect, 
      rating, 
      userReason, 
      userConfidence 
    } = req.body;

    // Record attempt
    db.prepare(`
      INSERT INTO attempts 
      (question_id, topic_id, subsection_id, subtopic_id, selected_answers, is_correct, rating, user_reason, user_confidence)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      questionId, 
      topicId, 
      subsectionId, 
      req.body.subtopicId || null, 
      JSON.stringify(selectedAnswers), 
      isCorrect ? 1 : 0, 
      rating, 
      userReason, 
      userConfidence
    );

    // Sync queue (BUT DO NOT SHIFT YET)
    const queue = new AdaptiveQueue(subsectionId);
    await queue.initialize();
    await queue.submitAnswer(questionId, rating, selectedAnswers);

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/study/advance
router.post('/advance', async (req, res) => {
  try {
    const { subsectionId, questionId, rating } = req.body;
    
    const queue = new AdaptiveQueue(subsectionId);
    await queue.initialize();
    await queue.advanceQueue(questionId, rating);
    
    const nextQuestion = queue.getNextQuestion();
    res.json({ 
      success: true, 
      nextQuestion, 
      finished: !nextQuestion,
      progress: getSubsectionProgress(subsectionId)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

function getSubsectionProgress(subsectionId) {
  const row = db.prepare(`
    SELECT 
      (SELECT COUNT(*) FROM subtopics st JOIN topics t ON st.topic_id = t.id WHERE t.subsection_id = ?) as total,
      (SELECT COUNT(*) FROM subtopics st JOIN topics t ON st.topic_id = t.id WHERE t.subsection_id = ? AND st.mastery_status = 'mastered') as mastered
  `).get(subsectionId, subsectionId);
  return row;
}

module.exports = router;
