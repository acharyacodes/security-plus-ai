const db = require('./database');
const axios = require('axios');

async function testKey() {
  const settings = db.prepare('SELECT * FROM settings').all().reduce((acc, row) => {
    acc[row.key] = row.value;
    return acc;
  }, {});

  const { provider, model, apiKey } = settings;
  console.log(`Testing API: Provider=${provider}, Model=${model}`);
  
  if (!apiKey) {
    console.error("❌ No API key found in settings table.");
    return;
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const response = await axios.post(url, {
      contents: [{ parts: [{ text: "Hello" }] }]
    });
    console.log("✅ API Success! The key is working correctly.");
  } catch (err) {
    console.error("❌ API Test Failed!");
    if (err.response) {
      console.error("Status:", err.response.status);
      console.error("Error Detail:", JSON.stringify(err.response.data, null, 2));
    } else {
      console.error("Message:", err.message);
    }
  }
}

testKey();
