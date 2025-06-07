const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Digiflazz API base URL
const DIGIFLAZZ_BASE_URL = 'https://api.digiflazz.com';

// Replace these with your actual Digiflazz credentials
const DIGIFLAZZ_USERNAME = process.env.DIGIFLAZZ_USERNAME || 'vatuviWmrQGg';
const DIGIFLAZZ_API_KEY = process.env.DIGIFLAZZ_API_KEY || 'dev-f0fbd220-4113-11f0-88e0-4582a8959ef0';

// Generate MD5 signature
const generateSignature = (username, apiKey, cmd) => {
  return crypto.createHash('md5').update(username + apiKey + cmd).digest('hex');
};

// Proxy endpoint
app.post('/api/digiflazz-proxy', async (req, res) => {
  try {
    const fullUrl = DIGIFLAZZ_BASE_URL;
    const requestBody = req.body || {};
    
    if (requestBody.cmd) {
      requestBody.username = DIGIFLAZZ_USERNAME;
      requestBody.sign = generateSignature(DIGIFLAZZ_USERNAME, DIGIFLAZZ_API_KEY, requestBody.cmd);
    }
    
    console.log('Forwarding request to Digiflazz:', fullUrl, requestBody);
    
    const apiResponse = await axios.post(fullUrl, requestBody, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('Digiflazz API response:', apiResponse.data);
    res.json(apiResponse.data);
  } catch (error) {
    console.error('Error forwarding request to Digiflazz:', error.message);
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: 'Proxy server error', message: error.message });
    }
  }
});

// Handle preflight OPTIONS requests for CORS
app.options('/api/digiflazz-proxy', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.status(200).send();
});

// Add CORS headers to all responses
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

app.listen(port, () => {
  console.log(`Digiflazz proxy server running on port ${port}`);
});
