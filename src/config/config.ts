// Application configuration
const config = {
  // Digiflazz API Configuration
  digiflazz: {
    baseUrl: import.meta.env.VITE_DIGIFLAZZ_BASE_URL || 'https://api.digiflazz.com/v1',
    username: import.meta.env.VITE_DIGIFLAZZ_USERNAME || 'vatuviWmrQGg', // Replace with your actual username
    apiKey: import.meta.env.VITE_DIGIFLAZZ_API_KEY || 'dev-f0fbd220-4113-11f0-88e0-4582a8959ef0', // Replace with your actual API key
    useTestMode: import.meta.env.MODE !== 'development', // Auto use test mode in dev environments
  },
  
  // Application Identifiers
  app: {
    name: 'JPCDIGI',
    transactionPrefix: 'JPC-DIGI', // Prefix for transaction references
  }
};

export default config;
