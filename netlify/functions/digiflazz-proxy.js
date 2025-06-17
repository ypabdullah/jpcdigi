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
    });

    // Handle response
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Digiflazz API Error:', {
        status: response.status,
        text: errorText,
        body: requestBody,
        endpoint: endpoint,
        signData: signData
      });
      
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({
          message: `HTTP error! Status: ${response.status}`,
          details: errorText,
          request: requestBody,
          endpoint: endpoint,
          signData: signData
        })
      };
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({
          message: `HTTP error! Status: ${response.status}`,
          details: errorText,
          request: requestBody
        })
      };
    }

    // Parse and return response
    const data = await response.json();
    console.log('Digiflazz API Response:', JSON.stringify(data, null, 2));
    
    // Handle PLN inquiry response
    if (event.path.includes('/v1/inquiry-pln')) {
      const plnResponse = {
        status: data.data?.status || 'Gagal',
        message: data.data?.message || 'No message',
        customer_no: data.data?.customer_no || requestBody.customer_no,
        meter_no: data.data?.meter_no || 'N/A',
        subscriber_id: data.data?.subscriber_id || 'N/A',
        name: data.data?.name || 'N/A',
        segment_power: data.data?.segment_power || 'N/A',
        rc: data.data?.rc || 'N/A'
      };
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ data: plnResponse })
      };
    }

    // Handle category list response
    if (event.path.includes('/v1/service-list')) {
      console.log('Category list response data:', data);
      
      // Handle different possible response formats
      let categories = [];
      if (data.data && data.data.categories) {
        categories = data.data.categories;
      } else if (data.data && Array.isArray(data.data)) {
        categories = data.data;
      }
      
      // Transform categories to include status
      categories = categories.map(category => ({
        ...category,
        status: category.status || 'active',
        category_id: category.category_id || category.id
      }));

      const categoryListResponse = {
        status: data.data?.status || 'success',
        message: data.data?.message || 'Categories fetched successfully',
        categories
      };
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ data: categoryListResponse })
      };
    }

    // Handle transaction status response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data)
    };

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
