// Supabase client for serverless functions
const { createClient } = require('@supabase/supabase-js');

// Get Supabase URL and key from environment variables
const SUPABASE_URL = process.env.SUPABASE_URL || "https://vpztrjwitxvldrdhndlr.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Create and export Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Function to get active Digiflazz credentials
async function getActiveDigiflazzCredentials() {
  try {
    // Query for active username
    const { data: usernameData, error: usernameError } = await supabase
      .from('api_credentials')
      .select('key_value')
      .eq('provider', 'digiflazz')
      .eq('key_name', 'username')
      .eq('is_active', true)
      .single();

    if (usernameError) throw usernameError;

    // Query for active API key
    const { data: apiKeyData, error: apiKeyError } = await supabase
      .from('api_credentials')
      .select('key_value')
      .eq('provider', 'digiflazz')
      .eq('key_name', 'apiKey')
      .eq('is_active', true)
      .single();

    if (apiKeyError) throw apiKeyError;

    // Return the credentials
    return {
      username: usernameData?.key_value,
      apiKey: apiKeyData?.key_value
    };
  } catch (error) {
    console.error('Error fetching Digiflazz credentials from Supabase:', error);
    return null;
  }
}

module.exports = {
  supabase,
  getActiveDigiflazzCredentials
};
