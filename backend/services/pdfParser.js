const fs = require('fs');
const { PDFParse } = require('pdf-parse');
const path = require('path');
const db = require('../database');

/**
 * Parses the Security+ PDF and returns a structured object.
 * Hardened version to avoid page numbers and footer artifacts.
 */
async function parseSecurityPlusPdf(pdfPath) {
  const dataBuffer = fs.readFileSync(pdfPath);
  const parser = new PDFParse({ data: dataBuffer });
  const result = await parser.getText();
  const rawText = result.text;
  await parser.destroy();

  // Filter out page footer numbers like "-- 4 of 24 --" or alone digits
  const lines = rawText.split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0)
    .filter(l => !l.match(/^-- \d+ of \d+ --$/)) // Filter footer page counts
    .filter(l => !l.match(/^\d+$/)); // Filter alone digits (often page numbers)
  
  const domains = [];
  let currentDomain = null;
  let currentSubsection = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Identify Domain: e.g., "1.0 | General Security Concepts" or "1.0 General Security Concepts"
    const domainMatch = line.match(/^([1-5]\.0)\s*(?:\|)?\s*(.*)/);
    if (domainMatch) {
      const code = domainMatch[1];
      const title = domainMatch[2].trim() || `Domain ${code}`;
      
      currentDomain = {
        code: code,
        title: title,
        subsections: []
      };
      domains.push(currentDomain);
      currentSubsection = null;
      continue;
    }

    // Identify Subsection: e.g., "1.1" 
    const subMatch = line.match(/^([1-5]\.[1-9][0-9]?)$/);
    if (subMatch) {
      const code = subMatch[1];
      
      // Look ahead for the title, skipping any Junk lines
      let titleIdx = i + 1;
      let title = "Untitled Section";
      
      while (titleIdx < lines.length) {
        const nextLine = lines[titleIdx];
        // If next line is another code, we missed the title or it's a sub-header
        if (nextLine.match(/^[1-5]\.[0-9]/)) break; 
        // If next line starts with a bullet, it's already a topic
        if (nextLine.match(/^[•−◦\-]/)) break;
        
        // Proper title found
        title = nextLine;
        i = titleIdx; // Move parent loop index to this title line
        break;
      }
      
      currentSubsection = {
        code: code,
        title: title,
        topics: []
      };
      
      // Safety: find/create domain if context was lost
      if (!currentDomain || currentDomain.code[0] !== code[0]) {
        const domainCode = `${code[0]}.0`;
        currentDomain = domains.find(d => d.code === domainCode);
        if (!currentDomain) {
          currentDomain = { code: domainCode, title: `Domain ${domainCode}`, subsections: [] };
          domains.push(currentDomain);
        }
      }
      
      currentDomain.subsections.push(currentSubsection);
      continue;
    }

    // Identify Topic: starts with bullet points •, −, ◦, or -
    if (line.match(/^[•−◦\-]/) && currentSubsection) {
      currentSubsection.topics.push(line.replace(/^[•−◦\-]\s*/, ''));
    }
  }

  return domains;
}

/**
 * Seeds the database with the parsed domains, subsections, and topics.
 * Now clears existing data first for a clean re-parse.
 */
async function seedDatabase(domains) {
  // Clear existing to avoid duplicates or orphaned topics
  db.prepare('DELETE FROM topics').run();
  db.prepare('DELETE FROM subsections').run();
  db.prepare('DELETE FROM session_state').run();

  const insertSubsection = db.prepare('INSERT OR IGNORE INTO subsections (code, title, objective_text) VALUES (?, ?, ?)');
  const insertTopic = db.prepare('INSERT INTO topics (subsection_id, name) VALUES (?, ?)');

  const transaction = db.transaction((data) => {
    for (const domain of data) {
      for (const sub of domain.subsections) {
        const objectiveText = `Domain: ${domain.title}. Objective: ${sub.title}`;
        insertSubsection.run(sub.code, sub.title, objectiveText);
        
        const subRow = db.prepare('SELECT id FROM subsections WHERE code = ?').get(sub.code);
        if (subRow) {
          const subId = subRow.id;
          for (const topic of sub.topics) {
            insertTopic.run(subId, topic);
          }
        }
      }
    }
  });

  transaction(domains);
}

/**
 * Seeds the database directly from the verified objectives.json file.
 * This is the preferred method for the SY0-701 syllabus.
 */
async function seedFromJson() {
  const jsonPath = path.join(__dirname, '../data/objectives.json');
  const rawData = fs.readFileSync(jsonPath, 'utf8');
  const domains = JSON.parse(rawData);

  // Clear existing to avoid duplicates
  db.prepare('DELETE FROM topics').run();
  db.prepare('DELETE FROM subsections').run();
  db.prepare('DELETE FROM session_state').run();
  db.prepare('DELETE FROM analytics_cache').run();
  db.prepare('DELETE FROM attempts').run();

  const insertSubsection = db.prepare('INSERT OR IGNORE INTO subsections (code, title, objective_text) VALUES (?, ?, ?)');
  const insertTopic = db.prepare('INSERT INTO topics (subsection_id, name) VALUES (?, ?)');
  const insertSubtopic = db.prepare('INSERT INTO subtopics (topic_id, name) VALUES (?, ?)');

  const transaction = db.transaction((data) => {
    for (const domain of data) {
      for (const sub of domain.subsections) {
        const objectiveText = `Domain ${domain.code}: ${domain.title}. Objective: ${sub.title}`;
        insertSubsection.run(sub.code, sub.title, objectiveText);
        
        const subIdQuery = db.prepare('SELECT id FROM subsections WHERE code = ?').get(sub.code);
        if (subIdQuery) {
          const subId = subIdQuery.id;
          for (const topicObj of sub.topics) {
            const topicInfo = insertTopic.run(subId, topicObj.name);
            const topicId = topicInfo.lastInsertRowid;
            
            if (topicObj.subtopics && topicObj.subtopics.length > 0) {
              for (const subtopicName of topicObj.subtopics) {
                insertSubtopic.run(topicId, subtopicName);
              }
            } else {
              // Fallback: If no subtopics, use the topic name itself as a subtopic
              // so the study queue has a target.
              insertSubtopic.run(topicId, topicObj.name);
            }
          }
        }
      }
    }
  });

  transaction(domains);
  return { domainsCount: domains.length };
}

module.exports = {
  parseSecurityPlusPdf,
  seedDatabase,
  seedFromJson
};
