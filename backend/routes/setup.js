const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { parseSecurityPlusPdf, seedDatabase } = require('../services/pdfParser');
const db = require('../database');

const upload = multer({ dest: 'uploads/' });

// POST /api/setup/upload
router.post('/upload', upload.single('pdf'), async (req, res) => {
  try {
    const pdfPath = req.file ? req.file.path : null;
    if (!pdfPath) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    const domains = await parseSecurityPlusPdf(pdfPath);
    await seedDatabase(domains);
    
    // Clean up uploaded file
    fs.unlinkSync(pdfPath);
    
    res.json({ message: 'Setup complete!', domainsExtracted: domains.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to process PDF: ' + err.message });
  }
});

// POST /api/setup/auto - Trigger from local file (the one already provided)
router.post('/auto', async (req, res) => {
  try {
    const pdfPath = path.join(__dirname, '../../CompTIA Security+ SY0-701 Exam Objectives (7.0).pdf');
    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({ error: 'PDF not found at expected path' });
    }

    const domains = await parseSecurityPlusPdf(pdfPath);
    await seedDatabase(domains);
    
    res.json({ message: 'Auto-setup complete!', domainsExtracted: domains.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to process PDF: ' + err.message });
  }
});

// POST /api/setup/reset - Wipe the database for re-parsing
router.post('/reset', (req, res) => {
  try {
    db.prepare('DELETE FROM topics').run();
    db.prepare('DELETE FROM subsections').run();
    db.prepare('DELETE FROM attempts').run();
    db.prepare('DELETE FROM analytics').run();
    db.prepare('DELETE FROM session_state').run();
    res.json({ message: 'Database wiped successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to reset database: ' + err.message });
  }
});

// GET /api/setup/status
router.get('/status', (req, res) => {
  const count = db.prepare('SELECT COUNT(*) as total FROM subsections').get();
  res.json({ isSetup: count.total > 0, subsectionCount: count.total });
});

module.exports = router;
