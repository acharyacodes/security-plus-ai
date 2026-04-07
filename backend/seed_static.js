const fs = require('fs');
const path = require('path');
const db = require('./database');

async function seed() {
  console.log("🚀 Starting static database seeding with 3-layer hierarchy (Domain > Subsection > Topic > Subtopic)...");
  
  try {
    const objectivesPath = path.join(__dirname, 'data/objectives.json');
    const objectives = JSON.parse(fs.readFileSync(objectivesPath, 'utf8'));
    
    console.log("🧹 Clearing old data...");
    db.prepare('DELETE FROM subtopics').run();
    db.prepare('DELETE FROM topics').run();
    db.prepare('DELETE FROM subsections').run();
    db.prepare('DELETE FROM attempts').run();
    db.prepare('DELETE FROM analytics_cache').run();
    db.prepare('DELETE FROM session_state').run();
    db.prepare('DELETE FROM questions').run();

    const insertSubsection = db.prepare('INSERT INTO subsections (code, title, objective_text) VALUES (?, ?, ?)');
    const insertTopic = db.prepare('INSERT INTO topics (subsection_id, name) VALUES (?, ?)');
    const insertSubtopic = db.prepare('INSERT INTO subtopics (topic_id, name) VALUES (?, ?)');

    const transaction = db.transaction((data) => {
      for (const domain of data) {
        for (const sub of domain.subsections) {
          const objectiveText = `Domain ${domain.code}: ${domain.title}. Objective: ${sub.title}`;
          insertSubsection.run(sub.code, sub.title, objectiveText);
          
          const subRow = db.prepare('SELECT id FROM subsections WHERE code = ?').get(sub.code);
          const subId = subRow.id;

          for (const topicData of sub.topics) {
             // Handle both string topics and object-based topics with subtopics
             const topicName = typeof topicData === 'string' ? topicData : topicData.name;
             const subtopicList = topicData.subtopics || [];

             insertTopic.run(subId, topicName);
             const topicRow = db.prepare('SELECT id FROM topics WHERE subsection_id = ? AND name = ?').get(subId, topicName);
             const topicId = topicRow.id;

             if (subtopicList.length > 0) {
               for (const st of subtopicList) {
                 insertSubtopic.run(topicId, st);
               }
             } else {
               // If no subtopics, treat the topic name as the single subtopic for consistent mastery tracking
               insertSubtopic.run(topicId, topicName);
             }
          }
        }
      }
    });

    transaction(objectives);
    console.log("✅ Database successfully re-seeded with verified 3-layer objective data.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Deep seeding failed:", err);
    process.exit(1);
  }
}

seed();
