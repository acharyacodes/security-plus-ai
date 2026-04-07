const path = require('path');
const { parseSecurityPlusPdf, seedDatabase } = require('./services/pdfParser');

async function run() {
  console.log("Starting manual re-parse of Security+ objectives...");
  
  const pdfPath = path.join(__dirname, '../CompTIA Security+ SY0-701 Exam Objectives (7.0).pdf');
  
  try {
    const domains = await parseSecurityPlusPdf(pdfPath);
    console.log(`Successfully parsed ${domains.length} domains.`);
    
    await seedDatabase(domains);
    console.log("Database successfully re-seeded with hardened data.");
    process.exit(0);
  } catch (err) {
    console.error("Manual re-parse failed:", err);
    process.exit(1);
  }
}

run();
