const fetch = require('node-fetch');
const crypto = require('crypto');

const DIGIFLAZZ_BASE_URL = process.env.DIGIFLAZZ_BASE_URL || 'https://api.digiflazz.com';
const DIGIFLAZZ_USERNAME = process.env.DIGIFLAZZ_USERNAME;
const DIGIFLAZZ_API_KEY = process.env.DIGIFLAZZ_API_KEY;

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
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Preflight request successful' })
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: 'Method Not Allowed' })
    };
  }

  try {
    console.log('Request body:', event.body);
    const requestBody = JSON.parse(event.body || '{}');
    console.log('Parsed request body:', requestBody);

    // Extract the path from the request
    const path = event.path.replace('/netlify/functions/digiflazz-proxy/', '');
    console.log('Request path:', path);

    // Handle different endpoints
    switch (path) {
      case 'v1/service-list':
        console.log('Handling category list request');
        const sign = generateSignature(DIGIFLAZZ_USERNAME, DIGIFLAZZ_API_KEY, 'category-list');
        
        // Make request to Digiflazz API
        const response = await fetch(`${DIGIFLAZZ_BASE_URL}/v1/service-list`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            username: DIGIFLAZZ_USERNAME,
            cmd: 'category-list',
            sign
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Digiflazz API Error:', {
            status: response.status,
            text: errorText,
            body: requestBody
          });
          
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
              status: 'error',
              message: `HTTP error! Status: ${response.status}`,
              details: errorText
            })
          };
        }

        const data = await response.json();
        console.log('Category list response:', data);

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(data)
        };
      case 'v1/price-list':
        console.log('Handling price list request');
        const signPriceList = generateSignature(DIGIFLAZZ_USERNAME, DIGIFLAZZ_API_KEY, 'pricelist');
        
        // Make request to Digiflazz API
        const responsePriceList = await fetch(`${DIGIFLAZZ_BASE_URL}/v1/price-list`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            username: DIGIFLAZZ_USERNAME,
            cmd: 'pricelist',
            sign: signPriceList,
            category_id: requestBody.category_id
          })
        });

        if (!responsePriceList.ok) {
          const errorText = await responsePriceList.text();
          console.error('Digiflazz API Error:', {
            status: responsePriceList.status,
            text: errorText,
            body: requestBody
          });
          
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
              status: 'error',
              message: `HTTP error! Status: ${responsePriceList.status}`,
              details: errorText
            })
          };
        }

        const priceListData = await responsePriceList.json();
        console.log('Price list response:', priceListData);

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(priceListData)
        };

      case 'v1/transaction':
        console.log('Handling transaction request');
        // Log credentials used for signature (mask API key for security)
        console.log('Using credentials - Username:', DIGIFLAZZ_USERNAME);
        console.log('API Key (first 4 chars):', DIGIFLAZZ_API_KEY ? DIGIFLAZZ_API_KEY.substring(0, 4) + '****' : 'Not set');
        
        let transactionBody = requestBody;
        // If no signature provided, generate one
        if (!requestBody.sign && requestBody.ref_id) {
          console.log('No signature provided, generating one for transaction');
          const signTransaction = generateSignature(DIGIFLAZZ_USERNAME, DIGIFLAZZ_API_KEY, requestBody.ref_id);
          transactionBody = { ...requestBody, sign: signTransaction };
          console.log('Generated signature:', signTransaction);
        } else if (requestBody.sign) {
          console.log('Signature provided in request, using as is');
        } else {
          console.log('No signature and no ref_id provided, proceeding without signature');
        }
        
        // Log the final body sent to Digiflazz (mask sensitive fields if needed)
        console.log('Final transaction body to Digiflazz:', { 
          ...transactionBody, 
          sign: transactionBody.sign ? transactionBody.sign.substring(0, 4) + '****' : 'Not set' 
        });
        
        // Make request to Digiflazz API
        const responseTransaction = await fetch(`${DIGIFLAZZ_BASE_URL}/v1/transaction`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(transactionBody)
        });
        
        if (!responseTransaction.ok) {
          const errorText = await responseTransaction.text();
          console.error('Digiflazz API Transaction Error:', {
            status: responseTransaction.status,
            text: errorText,
            body: { 
              ...transactionBody, 
              sign: transactionBody.sign ? transactionBody.sign.substring(0, 4) + '****' : 'Not set' 
            }
          });
          
          return {
            statusCode: responseTransaction.status,
            headers,
            body: errorText
          };
        }
        
        const dataTransaction = await responseTransaction.json();
        console.log('Transaction response:', dataTransaction);
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(dataTransaction)
        };

      default:
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({
            message: 'Endpoint not found'
          })
        };
    }
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        message: 'Internal Server Error', 
        error: error.message 
      })
    };
  }
};
