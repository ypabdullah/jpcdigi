const fetch = require('node-fetch');
const crypto = require('crypto');
const { getActiveDigiflazzCredentials } = require('./supabase-client');

const DIGIFLAZZ_BASE_URL = 'https://api.digiflazz.com';

// MD5 Signature Generator
const generateSignature = (username, apiKey, token) => {
  return crypto.createHash('md5').update(username + apiKey + token).digest('hex');
};

exports.handler = async function (event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Preflight request successful' }),
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: 'Method Not Allowed' }),
    };
  }

  try {
    const requestBody = JSON.parse(event.body || '{}');
    const credentials = await getActiveDigiflazzCredentials();

    if (!credentials || !credentials.username || !credentials.apiKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          message: 'Server configuration error: Missing Digiflazz credentials.',
          status: 'error',
        }),
      };
    }

    const cmd = requestBody.cmd || 'price_list';
    let sign;

    // Generate proper signature based on cmd
    if (cmd === 'pay-pasca') {
      const { buyer_sku_code, customer_no, ref_id } = requestBody;

      if (!buyer_sku_code || !customer_no || !ref_id) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            message: 'Missing required fields for pay-pasca: buyer_sku_code, customer_no, or ref_id',
            status: 'error',
          }),
        };
      }

      // Correct signature for pay-pasca
      const token = buyer_sku_code + customer_no + ref_id;
      sign = generateSignature(credentials.username, credentials.apiKey, token);
    } else {
      // Default for other cmds (e.g. price_list, inquiry)
      sign = generateSignature(credentials.username, credentials.apiKey, cmd);
    }

    // Merge request body and attach credentials
    const bodyPayload = {
      ...requestBody,
      username: credentials.username,
      sign: sign,
    };

    // Get target Digiflazz endpoint
    const path = event.path.replace('/.netlify/functions/digiflazz-proxy', '');
    const endpoint = path || '/v1/price-list';

    // Send request to Digiflazz
    const response = await fetch(`${DIGIFLAZZ_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyPayload),
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
      body: JSON.stringify({
        message: 'Internal Server Error',
        error: error.message,
      }),
    };
  }
};
