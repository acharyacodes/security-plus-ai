const db = require('./backend/database'); db.exec('DROP TABLE IF EXISTS session_state;'); require('child_process').execSync('node backend/server.js', {stdio: 'inherit'});
