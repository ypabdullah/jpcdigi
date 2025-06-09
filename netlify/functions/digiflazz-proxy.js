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

    let cmd = '';
    let signData = '';

    // Determine the cmd for signature based on the requested endpoint
    if (event.path.includes('/v1/price-list')) {
      cmd = 'pricelist';
      signData = credentials.username + credentials.apiKey + cmd;
    } else if (event.path.includes('/v1/transaction')) {
      cmd = 'deposit';
      signData = credentials.username + credentials.apiKey + cmd;
    } else if (event.path.includes('/v1/transaction-history')) {
      cmd = 'history';
      signData = credentials.username + credentials.apiKey + cmd;
    } else if (event.path.includes('/v1/inquiry-pln')) {
      signData = credentials.username + credentials.apiKey + requestBody.customer_no;
      console.log('Inquiry PLN request body:', JSON.stringify(requestBody));
    }else {
      // Default case
      cmd = event.path.split('/').pop() || 'unknown';
      signData = credentials.username + credentials.apiKey + cmd;
    }

    console.log('Generating signature with cmd:', cmd);
    const sign = requestBody.sign || generateSignature(credentials.username, credentials.apiKey, requestBody.customer_no);

    console.log('Generated signature:', sign);

    // Prepare the request body for Digiflazz API
    const apiRequestBody = {
      username: credentials.username,
      sign: sign,
      ...requestBody
    };
    
    // Make request to Digiflazz API
    const response = await fetch(`${DIGIFLAZZ_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apiRequestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Digiflazz API Error:', response.status, errorText);
      throw new Error(`HTTP error! Status: ${response.status}, Details: ${errorText}`);
    }

    const data = await response.json();

    // Format response for inquiry-pln to match expected structure
    if (event.path.includes('/v1/inquiry-pln')) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          data: {
            status: data.data?.status || 'Gagal',
            message: data.data?.message || 'No message',
            customer_no: data.data?.customer_no || requestBody.customer_no,
            meter_no: data.data?.meter_no || 'N/A',
            subscriber_id: data.data?.subscriber_id || 'N/A',
            name: data.data?.name || 'N/A',
            segment_power: data.data?.segment_power || 'N/A',
            rc: data.data?.rc || 'N/A'
          }
        }),
      };
    }

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
