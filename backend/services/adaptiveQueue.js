const db = require('../database');
const { generateQuestions } = require('./questionGenerator');

class AdaptiveQueue {
  constructor(subsectionId) {
    this.subsectionId = subsectionId;
    this.currentTopicId = null;
    this.currentSubtopicId = null;
    this.queue = [];
    this.isRevealed = false;
    this.selectedAnswers = [];
  }

  async initialize() {
    const state = db.prepare('SELECT * FROM session_state WHERE current_subsection_id = ?').get(this.subsectionId);

    if (state && state.queue) {
      this.currentTopicId = state.current_topic_id;
      this.currentSubtopicId = state.current_subtopic_id;
      this.queue = JSON.parse(state.queue);
      this.isRevealed = !!state.is_revealed;
      this.selectedAnswers = state.selected_answers ? JSON.parse(state.selected_answers) : [];

      // If queue is empty but session exists, replenish
      if (this.queue.length === 0) {
        await this.replenishQueue();
      }
    } else {
      await this.startNewSubtopic();
    }
  }

  async startNewSubtopic() {
    // Find next unmastered subtopic in this subsection
    const subtopic = db.prepare(`
      SELECT st.id, st.topic_id 
      FROM subtopics st
      JOIN topics t ON st.topic_id = t.id
      WHERE t.subsection_id = ? 
      AND (st.mastery_status != 'mastered' OR st.mastery_status IS NULL)
      ORDER BY st.id ASC LIMIT 1
    `).get(this.subsectionId);

    if (!subtopic) {
      this.queue = [];
      return;
    }

    this.currentTopicId = subtopic.topic_id;
    this.currentSubtopicId = subtopic.id;
    await this.replenishQueue();
  }

  async replenishQueue() {
    const questions = await generateQuestions(this.currentTopicId, this.currentSubtopicId);
    this.queue = questions.map(q => q.id);
    this.isRevealed = false;
    this.selectedAnswers = [];
    this.saveState();
  }

  getNextQuestionId() {
    return this.queue[0] || null;
  }

  getNextQuestion() {
    const questionId = this.getNextQuestionId();
    if (!questionId) return null;

    const question = db.prepare('SELECT * FROM questions WHERE id = ?').get(questionId);
    if (question) {
      question.options = JSON.parse(question.options);
    }
    return question;
  }

  // Step 1: Submit Answer (Updates rating, BUT stays on current question)
  async submitAnswer(questionId, rating, selectedAnswers) {
    this.isRevealed = true;
    this.selectedAnswers = selectedAnswers;
    
    // Update question-specific logic if needed (e.g., if we were re-inserting)
    // For now, we just lock the state as "Revealed"
    this.saveState();
  }

  // Step 2: Advance Queue (Actually moves to next item)
  async advanceQueue(questionId, rating) {
    // Remove the question we just finished
    this.queue.shift();

    // Re-insertion logic if rating was 'again' or 'hard'
    if (rating === 'again') {
      const pos = Math.min(4, this.queue.length);
      this.queue.splice(pos, 0, questionId);
    } else if (rating === 'hard') {
      this.queue.push(questionId);
    }

    this.isRevealed = false;
    this.selectedAnswers = [];

    // If subtopic finished, move to next
    if (this.queue.length === 0) {
      await this.checkSubtopicMasteryAndReplenish();
    } else {
      this.saveState();
    }
  }

  async checkSubtopicMasteryAndReplenish() {
    // Mastery check: 2 easiest consecutive (simplified)
    const recent = db.prepare(`
      SELECT rating FROM attempts 
      WHERE subtopic_id = ? 
      ORDER BY created_at DESC LIMIT 3
    `).all(this.currentSubtopicId);

    const easyCount = recent.filter(a => a.rating === 'easy').length;
    
    if (easyCount >= 3) {
      db.prepare('UPDATE subtopics SET mastery_status = "mastered" WHERE id = ?').run(this.currentSubtopicId);
      await this.startNewSubtopic();
    } else {
      await this.replenishQueue();
    }
  }

  saveState() {
    db.prepare(`
      INSERT OR REPLACE INTO session_state (current_subsection_id, current_topic_id, current_subtopic_id, queue, is_revealed, selected_answers, last_updated)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(
      this.subsectionId, 
      this.currentTopicId, 
      this.currentSubtopicId, 
      JSON.stringify(this.queue),
      this.isRevealed ? 1 : 0,
      JSON.stringify(this.selectedAnswers)
    );
  }
}

module.exports = AdaptiveQueue;
