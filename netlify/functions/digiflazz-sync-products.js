const axios = require('axios');

// Function to generate signature for Digiflazz API (you'll need to adjust this based on your setup)
const generateSignature = (username, apiKey, action) => {
  const crypto = require('crypto');
  return crypto.createHash('md5').update(`${username}${apiKey}${action}`).digest('hex');
};

// You'll need to implement or import this function to get credentials
const getDigiflazzCredentials = async () => {
  // This is a placeholder - replace with actual retrieval from your database or environment
  return {
    username: process.env.DIGIFLAZZ_USERNAME || 'your-username',
    apiKey: process.env.DIGIFLAZZ_API_KEY || 'your-api-key',
    mode: process.env.DIGIFLAZZ_MODE || 'development'
  };
};

// You'll need to implement this function to save to your database
const saveProductsToDatabase = async (products) => {
  // This is a placeholder - implement saving to your Supabase or other database
  console.log(`Saving ${products.length} products to database...`);
  // Example: await supabase.from('products').upsert(products);
  return products.length;
};

exports.handler = async (event, context) => {
  try {
    console.log('Starting Digiflazz product sync...');
    const credentials = await getDigiflazzCredentials();
    
    // Generate signature for price list request
    const sign = generateSignature(credentials.username, credentials.apiKey, 'pricelist');
    
    // Fetch product price list from Digiflazz
    const response = await axios({
      method: 'POST',
      url: 'https://api.digiflazz.com/v1/price-list',
      data: {
        cmd: 'prepaid',
        username: credentials.username,
        sign: sign
      }
    });
    
    if (!response.data || !response.data.data) {
      throw new Error('Invalid response from Digiflazz API');
    }
    
    const products = response.data.data;
    console.log(`Received ${products.length} products from Digiflazz`);
    
    // Save products to database
    const savedCount = await saveProductsToDatabase(products);
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        count: savedCount,
        message: `Successfully synced ${savedCount} products from Digiflazz`
      })
    };
  } catch (error) {
    console.error('Error syncing products:', error.message);
    return {
      statusCode: error.response?.status || 500,
      body: JSON.stringify({
        success: false,
        message: error.message || 'Failed to sync products from Digiflazz'
      })
    };
  }
};
