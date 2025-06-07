const fetch = require('node-fetch');
const crypto = require('crypto');
const { getActiveDigiflazzCredentials } = require('./supabase-client');

// Base URL for Digiflazz API
const DIGIFLAZZ_BASE_URL = 'https://api.digiflazz.com';

// Generate MD5 signature on the server side (using Node.js crypto)
const generateSignature = (username, apiKey, cmd) => {
  return crypto.createHash('md5').update(username + apiKey + cmd).digest('hex');
};

exports.handler = async function(event, context) {
  // Set CORS headers for all responses
  const headers = {
    'Access-Control-Allow-Origin': '*', // In production you might want to restrict this
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Preflight request successful' })
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: 'Method Not Allowed' }),
    };
  }

  try {
    // Get the request body
    const requestBody = JSON.parse(event.body || '{}');
    
    // Get Digiflazz credentials from Supabase
    const credentials = await getActiveDigiflazzCredentials();
    
    // Don't proceed if credentials are missing
    if (!credentials || !credentials.username || !credentials.apiKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          message: 'Server configuration error: Missing Digiflazz credentials. Please configure them in the admin panel.',
          status: 'error'
        })
      };
    }
    
    // Get the Digiflazz endpoint from the path parameter
    const path = event.path.replace('/.netlify/functions/digiflazz-proxy', '');
    const endpoint = path || '/v1/price-list'; // Default to price-list if no specific endpoint
    
    // Create the sign for authentication using MD5
    const cmd = requestBody.cmd || 'price_list';
    const sign = generateSignature(credentials.username, credentials.apiKey, cmd);

    // Make request to Digiflazz API
    const response = await fetch(`${DIGIFLAZZ_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cmd: cmd,
        username: credentials.username,
        sign: sign,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Internal Server Error', error: error.message }),
    };
  }
};
