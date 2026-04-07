const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for frontend (after build)
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Routes
const setupRoutes = require('./routes/setup');
const studyRoutes = require('./routes/study');
const analyticsRoutes = require('./routes/analytics');
const settingsRoutes = require('./routes/settings');
const customRoutes = require('./routes/custom');

app.use('/api/setup', setupRoutes);
app.use('/api/study', studyRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/custom', customRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', database: db ? 'connected' : 'error' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
