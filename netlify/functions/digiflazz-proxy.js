const fetch = require('node-fetch');
const crypto = require('crypto');
const { getActiveDigiflazzCredentials } = require('./supabase-client');

const DIGIFLAZZ_BASE_URL = 'https://api.digiflazz.com';

const generateSignature = (username, apiKey, value) => {
  return crypto.createHash('md5').update(username + apiKey + value).digest('hex');
};

exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: JSON.stringify({ message: 'Preflight request successful' }) };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ message: 'Method Not Allowed' }) };
  }

  try {
    const requestBody = JSON.parse(event.body || '{}');
    const credentials = await getActiveDigiflazzCredentials();

    if (!credentials || !credentials.username || !credentials.apiKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ message: 'Missing Digiflazz credentials', status: 'error' })
      };
    }

    const path = event.path.replace('/.netlify/functions/digiflazz-proxy', '');
    const endpoint = path || '/v1/price-list';

    let signData = '';

    if (event.path.includes('/v1/price-list')) {
      signData = credentials.username + credentials.apiKey + 'pricelist';
    } else if (event.path.includes('/v1/transaction')) {
      // ✅ SIGNATURE untuk transaksi PPOB pakai ref_id, BUKAN cmd
      if (!requestBody.ref_id) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ message: 'Missing ref_id in request body' }),
        };
      }
      signData = credentials.username + credentials.apiKey + requestBody.ref_id;
    } else if (event.path.includes('/v1/transaction-history')) {
      signData = credentials.username + credentials.apiKey + 'history';
    } else if (event.path.includes('/v1/inquiry-pln')) {
      signData = credentials.username + credentials.apiKey + requestBody.customer_no;
      console.log('Inquiry PLN request body:', JSON.stringify(requestBody));
    } else {
      const fallback = event.path.split('/').pop() || 'unknown';
      signData = credentials.username + credentials.apiKey + fallback;
    }

    const generateSignature = (username, apiKey, value) => {
      return crypto.createHash('md5').update(username + apiKey + value).digest('hex');
    };
    
    const sign = generateSignature(credentials.username, credentials.apiKey, requestBody.ref_id);

    // ✅ Jaga agar ref_id tidak tertimpa oleh ...requestBody
    const { ref_id } = requestBody;

    const apiRequestBody = {
      username: credentials.username,
      buyer_sku_code: requestBody.buyer_sku_code,
      customer_no: requestBody.customer_no,
      ref_id: requestBody.ref_id, // ⬅️ WAJIB ADA agar tidak dianggap buyer_trx_id
      sign
    };
    

    console.log('Payload dikirim ke Digiflazz:', JSON.stringify(apiRequestBody, null, 2));

    const response = await fetch(`${DIGIFLAZZ_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(apiRequestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Digiflazz API Error:', response.status, errorText);
      throw new Error(`HTTP error! Status: ${response.status}, Details: ${errorText}`);
    }

    const data = await response.json();

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
