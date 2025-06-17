import axios from 'axios';
import config from '@/config/config';
import { createClient } from '@supabase/supabase-js';

// Digiflazz API Configuration from config
const API_PROXY_URL = '/digiflazz-proxy';
const BUYER_SKU_CODE_PREFIX = config.app.transactionPrefix;

// Note: DIGIFLAZZ_USERNAME and DIGIFLAZZ_API_KEY are now handled securely in the backend proxy

// Interface definitions
export interface DigiflazzProduct {
  buyer_sku_code: string;
  product_name: string;
  category: string;
  brand: string;
  type: string;
  seller_name: string;
  price: number;
  buyer_price: number;
  buyer_product_status: boolean;
  seller_product_status: boolean;
  unlimited_stock: boolean;
  stock: number;
  multi: boolean;
  start_cut_off: string;
  end_cut_off: string;
  desc: string;
}

export interface PriceListResponse {
  data: DigiflazzProduct[];
}

export interface CheckBalanceResponse {
  data: {
    deposit: number;
  };
}

export interface PrepaidTransactionRequest {
  username: string;
  buyer_sku_code: string;
  customer_no: string;
  ref_id: string;
  sign?: string; // Optional, to be handled by backend proxy for security
  testing?: boolean;
}

export interface PostpaidInquiryRequest {
  commands: string;
  customer_no: string;
  buyer_sku_code: string;
  ref_id: string;
  testing?: boolean;
}

export interface PostpaidPaymentRequest {
  commands: string;
  customer_no: string;
  buyer_sku_code: string;
  ref_id: string;
  testing?: boolean;
}

export interface TransactionResponse {
  data: {
    ref_id: string;
    customer_no: string;
    buyer_sku_code: string;
    message: string;
    status: string;
    rc: string;
    sn: string;
    buyer_last_balance: number;
    price: number;
    selling_price: number;
    wa_number?: string;
    desc?: {
      bill_quantity?: number;
      customer_id?: string;
      customer_name?: string;
      period?: string;
      nominal?: number;
      admin_fee?: number;
      amount?: number;
    };
  }
}

export interface CheckTransactionStatusRequest {
  ref_id: string;
  commands: string;
}

// Helper to generate a unique reference ID
export const generateRefId = (): string => {
  const timestamp = new Date().getTime();
  const random = Math.floor(Math.random() * 1000);
  return `${BUYER_SKU_CODE_PREFIX}-${timestamp}-${random}`;
};

// Note: SHA1 signature generation is now handled in the DigiflazzService class
// DigiflazzService class
class DigiflazzService {
  private username: string;
  private apiKey: string;
  private supabase: any;

  constructor() {
    // Initialize with empty values, will be set after fetching from Supabase
    this.username = '';
    this.apiKey = '';
    this.supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL || '',
      import.meta.env.VITE_SUPABASE_ANON_KEY || ''
    );
    // Load credentials from Supabase on initialization
    this.loadCredentials();
  }

  async loadCredentials(): Promise<void> {
    try {
      console.log('Attempting to load Digiflazz credentials from Supabase');
      const { data, error } = await this.supabase
        .from('api_credentials')
        .select('username, api_key')
        .eq('active', true)
        .limit(1)
        .single();

      if (error) {
        console.error('Error fetching Digiflazz credentials from Supabase:', error.message);
        console.log('Table might not exist or other error occurred. Falling back to environment variables.');
        // Fallback to environment variables or default values
        this.username = import.meta.env.VITE_DIGIFLAZZ_USERNAME || '';
        this.apiKey = import.meta.env.VITE_DIGIFLAZZ_API_KEY || '';
        console.log('Falling back to environment variables for credentials');
        console.log('Username from env:', this.username);
        console.log('API Key (first 4 chars) from env:', this.apiKey.substring(0, 4) + "****");
        // If environment variables are empty, use hardcoded values for debugging
        if (!this.username || !this.apiKey) {
          console.log('Environment variables not set, using hardcoded credentials for debugging');
          this.username = 'vatuviWmrQGg';
          this.apiKey = 'd5271510-8de5-5767-b6cb-b252090c57ae';
          console.log('Using hardcoded username:', this.username);
          console.log('Using hardcoded API Key (first 4 chars):', this.apiKey.substring(0, 4) + "****");
        }
      } else if (data) {
        this.username = data.username;
        this.apiKey = data.api_key;
        console.log('Successfully loaded Digiflazz credentials from Supabase');
        console.log('Username from Supabase:', this.username);
        console.log('API Key (first 4 chars) from Supabase:', this.apiKey.substring(0, 4) + "****");
      } else {
        console.error('No active Digiflazz credentials found in Supabase, using fallback values');
        // Fallback to environment variables or default values
        this.username = import.meta.env.VITE_DIGIFLAZZ_USERNAME || '';
        this.apiKey = import.meta.env.VITE_DIGIFLAZZ_API_KEY || '';
        console.log('Falling back to environment variables for credentials');
        console.log('Username from env:', this.username);
        console.log('API Key (first 4 chars) from env:', this.apiKey.substring(0, 4) + "****");
        // If environment variables are empty, use hardcoded values for debugging
        if (!this.username || !this.apiKey) {
          console.log('Environment variables not set, using hardcoded credentials for debugging');
          this.username = 'vatuviWmrQGg';
          this.apiKey = 'd5271510-8de5-5767-b6cb-b252090c57ae';
          console.log('Using hardcoded username:', this.username);
          console.log('Using hardcoded API Key (first 4 chars):', this.apiKey.substring(0, 4) + "****");
        }
      }
    } catch (error: any) {
      console.error('Error loading Digiflazz credentials from Supabase:', error.message);
      console.log('Exception occurred while loading credentials. Falling back to environment variables.');
      // Fallback to environment variables or default values
      this.username = import.meta.env.VITE_DIGIFLAZZ_USERNAME || '';
      this.apiKey = import.meta.env.VITE_DIGIFLAZZ_API_KEY || '';
      console.log('Falling back to environment variables due to error');
      console.log('Username from env:', this.username);
      console.log('API Key (first 4 chars) from env:', this.apiKey.substring(0, 4) + "****");
      // If environment variables are empty, use hardcoded values for debugging
      if (!this.username || !this.apiKey) {
        console.log('Environment variables not set, using hardcoded credentials for debugging');
        this.username = 'vatuviWmrQGg';
        this.apiKey = 'd5271510-8de5-5767-b6cb-b252090c57ae';
        console.log('Using hardcoded username:', this.username);
        console.log('Using hardcoded API Key (first 4 chars):', this.apiKey.substring(0, 4) + "****");
      }
    }
  }

  private generateSignature(action: string, refId: string = ''): string {
    let input = `${this.username}${this.apiKey}${action}`;
    if (action === 'prepaid' && refId) {
      // Use the loaded username for signature generation
      input = `${this.username}${this.apiKey}${refId}`;
      console.log('Generating signature for prepaid transaction');
      console.log('Username used for signature:', this.username);
      console.log('API Key (first 4 chars) used for signature:', this.apiKey.substring(0, 4) + "****");
      console.log('Ref ID used for signature:', refId);
      console.log('Signature input string:', input);
    }
    const signature = this.md5(input);
    console.log('Generated signature:', signature);
    return signature;
  }

  // Simple MD5 implementation for browser compatibility
  private md5(input: string): string {
    // This is a basic MD5 hash function. For production, consider a more robust library.
    // Source: https://github.com/blueimp/JavaScript-MD5
    function rhex(n: number): string {
      return (n < 16 ? '0' : '') + n.toString(16);
    }
    function utf8Encode(str: string): string {
      let utftext = '';
      for (let n = 0; n < str.length; n++) {
        const c = str.charCodeAt(n);
        if (c < 128) {
          utftext += String.fromCharCode(c);
        } else if ((c > 127) && (c < 2048)) {
          utftext += String.fromCharCode((c >> 6) | 192);
          utftext += String.fromCharCode((c & 63) | 128);
        } else {
          utftext += String.fromCharCode((c >> 12) | 224);
          utftext += String.fromCharCode(((c >> 6) & 63) | 128);
          utftext += String.fromCharCode((c & 63) | 128);
        }
      }
      return utftext;
    }
    function md5cycle(x: number[], k: number[]): void {
      let a = x[0], b = x[1], c = x[2], d = x[3];
      a += (b & c | ~b & d) + k[0] - 680876936 | 0; a = ((a << 7) | (a >>> 25)) + b | 0;
      d += (a & b | ~a & c) + k[1] - 389564586 | 0; d = ((d << 12) | (d >>> 20)) + a | 0;
      c += (d & a | ~d & b) + k[2] + 606105819 | 0; c = ((c << 17) | (c >>> 15)) + d | 0;
      b += (c & d | ~c & a) + k[3] - 1044525330 | 0; b = ((b << 22) | (b >>> 10)) + c | 0;
      a += (c ^ (b | ~d)) + k[1] - 165796510 | 0; a = ((a << 5) | (a >>> 27)) + b | 0;
      d += (b ^ (a | ~c)) + k[6] - 1069501632 | 0; d = ((d << 9) | (d >>> 23)) + a | 0;
      c += (a ^ (d | ~b)) + k[11] + 643717713 | 0; c = ((c << 14) | (c >>> 18)) + d | 0;
      b += (d ^ (c | ~a)) + k[0] - 373897302 | 0; b = ((b << 20) | (b >>> 12)) + c | 0;
      a += (c ^ (b | ~d)) + k[5] - 701558691 | 0; a = ((a << 5) | (a >>> 27)) + b | 0;
      d += (b ^ (a | ~c)) + k[10] + 38016083 | 0; d = ((d << 9) | (d >>> 23)) + a | 0;
      c += (a ^ (d | ~b)) + k[15] - 660478335 | 0; c = ((c << 14) | (c >>> 18)) + d | 0;
      b += (d ^ (c | ~a)) + k[4] - 405537848 | 0; b = ((b << 20) | (b >>> 12)) + c | 0;
      a += (c ^ (b | ~d)) + k[9] + 568446438 | 0; a = ((a << 5) | (a >>> 27)) + b | 0;
      d += (b ^ (a | ~c)) + k[14] - 1019803690 | 0; d = ((d << 9) | (d >>> 23)) + a | 0;
      c += (a ^ (d | ~b)) + k[3] - 187363961 | 0; c = ((c << 14) | (c >>> 18)) + d | 0;
      b += (d ^ (c | ~a)) + k[8] + 1163531501 | 0; b = ((b << 20) | (b >>> 12)) + c | 0;
      a += (c ^ (b | ~d)) + k[13] - 1444681467 | 0; a = ((a << 5) | (a >>> 27)) + b | 0;
      d += (b ^ (a | ~c)) + k[2] - 51403784 | 0; d = ((d << 9) | (d >>> 23)) + a | 0;
      c += (a ^ (d | ~b)) + k[7] + 1735328473 | 0; c = ((c << 14) | (c >>> 18)) + d | 0;
      b += (d ^ (c | ~a)) + k[12] - 1926607734 | 0; b = ((b << 20) | (b >>> 12)) + c | 0;
      a += (c ^ (b | ~d)) + k[5] - 378558 | 0; a = ((a << 4) | (a >>> 28)) + b | 0;
      d += (b ^ (a | ~c)) + k[8] - 2022574463 | 0; d = ((d << 11) | (d >>> 21)) + a | 0;
      c += (a ^ (d | ~b)) + k[11] + 1839030562 | 0; c = ((c << 16) | (c >>> 16)) + d | 0;
      b += (d ^ (c | ~a)) + k[14] - 35309556 | 0; b = ((b << 23) | (b >>> 9)) + c | 0;
      a += (b ^ c ^ d) + k[1] - 1530992060 | 0; a = ((a << 4) | (a >>> 28)) + b | 0;
      d += (a ^ b ^ c) + k[4] + 1272893353 | 0; d = ((d << 11) | (d >>> 21)) + a | 0;
      c += (d ^ a ^ b) + k[7] - 155497632 | 0; c = ((c << 16) | (c >>> 16)) + d | 0;
      b += (c ^ d ^ a) + k[10] - 1094730640 | 0; b = ((b << 23) | (b >>> 9)) + c | 0;
      a += (b ^ c ^ d) + k[13] + 681279174 | 0; a = ((a << 4) | (a >>> 28)) + b | 0;
      d += (a ^ b ^ c) + k[0] - 358537222 | 0; d = ((d << 11) | (d >>> 21)) + a | 0;
      c += (d ^ a ^ b) + k[3] - 722521979 | 0; c = ((c << 16) | (c >>> 16)) + d | 0;
      b += (c ^ d ^ a) + k[6] + 76029189 | 0; b = ((b << 23) | (b >>> 9)) + c | 0;
      a += (c ^ (b | ~d)) + k[9] - 640364487 | 0; a = ((a << 4) | (a >>> 28)) + b | 0;
      d += (b ^ (a | ~c)) + k[12] - 421815835 | 0; d = ((d << 11) | (d >>> 21)) + a | 0;
      c += (a ^ (d | ~b)) + k[15] + 530742520 | 0; c = ((c << 16) | (c >>> 16)) + d | 0;
      b += (d ^ (c | ~a)) + k[2] - 995338651 | 0; b = ((b << 23) | (b >>> 9)) + c | 0;
      a += (c ^ (b | ~d)) + k[0] - 198630844 | 0; a = ((a << 6) | (a >>> 26)) + b | 0;
      d += (b ^ (a | ~c)) + k[7] + 1126891415 | 0; d = ((d << 10) | (d >>> 22)) + a | 0;
      c += (a ^ (d | ~b)) + k[14] - 1416354905 | 0; c = ((c << 15) | (c >>> 17)) + d | 0;
      b += (d ^ (c | ~a)) + k[5] - 57434055 | 0; b = ((b << 21) | (b >>> 11)) + c | 0;
      a += (c ^ (b | ~d)) + k[12] + 1700485571 | 0; a = ((a << 6) | (a >>> 26)) + b | 0;
      d += (b ^ (a | ~c)) + k[3] - 1894986606 | 0; d = ((d << 10) | (d >>> 22)) + a | 0;
      c += (a ^ (d | ~b)) + k[10] - 1051523 | 0; c = ((c << 15) | (c >>> 17)) + d | 0;
      b += (d ^ (c | ~a)) + k[1] - 2054922799 | 0; b = ((b << 21) | (b >>> 11)) + c | 0;
      a += (c ^ (b | ~d)) + k[8] + 1873313359 | 0; a = ((a << 6) | (a >>> 26)) + b | 0;
      d += (b ^ (a | ~c)) + k[15] - 30611744 | 0; d = ((d << 10) | (d >>> 22)) + a | 0;
      c += (a ^ (d | ~b)) + k[6] - 1560198380 | 0; c = ((c << 15) | (c >>> 17)) + d | 0;
      b += (d ^ (c | ~a)) + k[13] + 1309151649 | 0; b = ((b << 21) | (b >>> 11)) + c | 0;
      a += (c ^ (b | ~d)) + k[4] - 145523070 | 0; a = ((a << 6) | (a >>> 26)) + b | 0;
      d += (b ^ (a | ~c)) + k[11] - 1120210379 | 0; d = ((d << 10) | (d >>> 22)) + a | 0;
      c += (a ^ (d | ~b)) + k[2] + 718787259 | 0; c = ((c << 15) | (c >>> 17)) + d | 0;
      b += (d ^ (c | ~a)) + k[9] - 343485551 | 0; b = ((b << 21) | (b >>> 11)) + c | 0;
      x[0] = a + x[0] | 0;
      x[1] = b + x[1] | 0;
      x[2] = c + x[2] | 0;
      x[3] = d + x[3] | 0;
    }
    function md5blk(s: string): number[] {
      const md5blks: number[] = [];
      for (let i = 0; i < 64; i += 4) {
        md5blks[i >> 2] = s.charCodeAt(i) + (s.charCodeAt(i + 1) << 8) + (s.charCodeAt(i + 2) << 16) + (s.charCodeAt(i + 3) << 24);
      }
      return md5blks;
    }
    function md5ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
      return ((a + ((b & c) | (~b & d)) + x + t) << s) | ((a + ((b & c) | (~b & d)) + x + t) >>> (32 - s));
    }
    function md5gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
      return ((a + ((b & d) | (c & ~d)) + x + t) << s) | ((a + ((b & d) | (c & ~d)) + x + t) >>> (32 - s));
    }
    function md5hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
      return ((a + (b ^ c ^ d) + x + t) << s) | ((a + (b ^ c ^ d) + x + t) >>> (32 - s));
    }
    function md5ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
      return ((a + (c ^ (b | ~d)) + x + t) << s) | ((a + (c ^ (b | ~d)) + x + t) >>> (32 - s));
    }
    const s = utf8Encode(input);
    const x = [1732584193, -271733879, -1732584194, 271733878];
    for (let i = 0; i < s.length; i += 64) {
      const chunk = md5blk(s.substring(i, i + 64));
      md5cycle(x, chunk);
    }
    return rhex(x[0]) + rhex(x[1]) + rhex(x[2]) + rhex(x[3]);
  }

  // Check account balance
  async checkBalance(): Promise<number> {
    try {
      const response = await axios.post<CheckBalanceResponse>(
        `${API_PROXY_URL}/v1/cek-saldo`,
        {
          cmd: 'deposit'
        }
      );

      return response.data.data.deposit;
    } catch (error) {
      console.error('Error checking balance:', error);
      throw new Error('Failed to check balance');
    }
  }

  // Get product price list
  async getPriceList(category?: string, denomination?: string, operator?: string): Promise<DigiflazzProduct[]> {
    console.log('getPriceList called with category:', category, 'denomination:', denomination, 'operator:', operator);
    try {
      // Fetch real data from Digiflazz API through our proxy
      const response = await axios.post(`${API_PROXY_URL}/v1/price-list`, {
        cmd: 'prepaid',
        username: this.username,
        sign: this.generateSignature('pricelist')
      });

      if (response.data && response.data.data) {
        let products = response.data.data as DigiflazzProduct[];
        console.log(`Received ${products.length} products from Digiflazz`);

        // Apply filters if provided
        if (category) {
          console.log(`Filtering by category: ${category}`);
          products = products.filter(p => p.category.toLowerCase() === category.toLowerCase());
        }
        if (operator) {
          console.log(`Filtering by brand/operator: ${operator}`);
          products = products.filter(p => p.brand.toLowerCase() === operator.toLowerCase());
        }
        if (denomination) {
          console.log(`Filtering by denomination: ${denomination}`);
          products = products.filter(p => p.product_name.toLowerCase().includes(denomination.toLowerCase()));
        }

        console.log(`Returning filtered products: ${products.length}`);
        return products;
      } else {
        console.log('No data received from Digiflazz API, returning empty array');
        return [];
      }
    } catch (error) {
      console.error('Error fetching price list from Digiflazz:', error.message);
      // Fallback to mock data in case of error

      // Mock data for testing
      const mockProducts: DigiflazzProduct[] = [
        {
          buyer_sku_code: 'PULSA-TELKOMSEL-1000',
          product_name: 'Pulsa Telkomsel 1000',
          category: 'pulsa',
          brand: 'Telkomsel',
          type: 'pulsa',
          seller_name: 'Digiflazz',
          price: 1000,
          buyer_price: 1000,
          buyer_product_status: true,
          seller_product_status: true,
          unlimited_stock: false,
          stock: 100,
          multi: false,
          start_cut_off: '00:00',
          end_cut_off: '23:59',
          desc: 'Pulsa Telkomsel 1000'
        },
        {
          buyer_sku_code: 'PULSA-INDOSAT-5000',
          product_name: 'Pulsa Indosat 5000',
          category: 'pulsa',
          brand: 'Indosat',
          type: 'pulsa',
          seller_name: 'Digiflazz',
          price: 5000,
          buyer_price: 5000,
          buyer_product_status: true,
          seller_product_status: true,
          unlimited_stock: false,
          stock: 50,
          multi: false,
          start_cut_off: '00:00',
          end_cut_off: '23:59',
          desc: 'Pulsa Indosat 5000'
        }
      ];

      // Apply filters to mock data if needed
      let filteredProducts = mockProducts;
      if (category) {
        console.log(`Filtering mock data by category: ${category}`);
        filteredProducts = filteredProducts.filter(p => p.category.toLowerCase() === category.toLowerCase());
      }
      if (operator) {
        console.log(`Filtering mock data by brand/operator: ${operator}`);
        filteredProducts = filteredProducts.filter(p => p.brand.toLowerCase() === operator.toLowerCase());
      }
      if (denomination) {
        console.log(`Filtering mock data by denomination: ${denomination}`);
        filteredProducts = filteredProducts.filter(p => p.product_name.toLowerCase().includes(denomination.toLowerCase()));
      }

      console.log(`Returning filtered mock products: ${filteredProducts.length}`);
      return filteredProducts;
    }
  }

  // Get mobile operator from phone number
  getOperatorFromPhoneNumber(phoneNumber: string): string {
    const cleanNumber = phoneNumber.replace(/\D/g, "");
    const prefix = cleanNumber.substring(0, 4);

    if (["0811", "0812", "0813", "0821", "0822", "0823"].includes(prefix)) {
      return "Telkomsel";
    } else if (["0817", "0818", "0819", "0859", "0877", "0878"].includes(prefix)) {
      return "XL Axiata";
    } else if (["0851", "0852", "0853", "0815", "0816"].includes(prefix)) {
      return "Indosat Ooredoo";
    } else if (["0881", "0882", "0883", "0884", "0885", "0886", "0887", "0888", "0889"].includes(prefix)) {
      return "Smartfren";
    } else if (["0896", "0897", "0898", "0899"].includes(prefix)) {
      return "Tri Indonesia";
    } else {
      return "Unknown";
    }
  }

  async topupPrepaid(customerNo: string, skuCode: string, testing: boolean = false): Promise<TransactionResponse> {
    try {
      // Generate a unique reference ID
      const refId = generateRefId();
      console.log('Initiating prepaid topup with Ref ID:', refId);
      console.log('Username used in payload:', this.username);
      const request: PrepaidTransactionRequest = {
        username: this.username,
        buyer_sku_code: skuCode,
        customer_no: customerNo,
        ref_id: refId,
        sign: this.generateSignature('prepaid', refId)
      };
      if (testing) {
        request.testing = true;
      }
      console.log('Signature components - Username:', this.username);
      console.log('Signature components - API Key (first 4 chars):', this.apiKey.substring(0, 4) + "****");
      console.log('Signature components - Ref ID:', refId);
      console.log('Signature input for prepaid transaction:', `${this.username}${this.apiKey}${refId}`);
      console.log('Generated signature:', request.sign);
      console.log('Sending prepaid transaction request to API proxy');
      console.log('Payload (excluding sensitive data):', {
        username: request.username,
        buyer_sku_code: request.buyer_sku_code,
        customer_no: request.customer_no,
        ref_id: request.ref_id,
        testing: request.testing
      });

      // Send the request to the API proxy
      const response = await axios.post<TransactionResponse>('/digiflazz-proxy/v1/transaction', request);

      console.log('Received response from API proxy for prepaid transaction');
      console.log('Response status:', response.status);
      console.log('Response data:', response.data);

      // Return the response data
      return response.data;
    } catch (error: any) {
      console.error('Error in topupPrepaid:', error.message);
      if (error.response) {
        console.error('API response error details:', error.response.data);
        console.error('API response status:', error.response.status);
        throw new Error(`API request failed with status ${error.response.status}: ${JSON.stringify(error.response.data)}`);
      } else if (error.request) {
        console.error('No response received from API:', error.request);
        throw new Error('Failed to process prepaid transaction: No response received from API');
      } else {
        console.error('Error setting up API request:', error.message);
        throw new Error(`Failed to process prepaid transaction: ${error.message}`);
      }
    }
  }

  async inquiryPostpaid(customerNo: string, skuCode: string, testing: boolean = false): Promise<TransactionResponse> {
    try {
      const refId = generateRefId();

      const payload: PostpaidInquiryRequest = {
        commands: 'inq-pasca',
        customer_no: customerNo,
        buyer_sku_code: skuCode,
        ref_id: refId,
        testing: testing
      };

      const response = await axios.post<TransactionResponse>(
        `${API_PROXY_URL}/v1/inquiry-pln`,
        payload
      );

      return response.data;
    } catch (error) {
      console.error('Error processing postpaid inquiry:', error);
      throw new Error('Failed to process postpaid inquiry');
    }
  }

  async payPostpaid(customerNo: string, skuCode: string, refId: string, testing: boolean = false): Promise<TransactionResponse> {
    try {
      const payload: PostpaidPaymentRequest = {
        commands: 'pay-pasca',
        customer_no: customerNo,
        buyer_sku_code: skuCode,
        ref_id: refId,
        testing: testing
      };

      const response = await axios.post<TransactionResponse>(
        `${API_PROXY_URL}/v1/transaction`,
        payload
      );

      return response.data;
    } catch (error) {
      console.error('Error processing postpaid payment:', error);
      throw new Error('Failed to process postpaid payment');
    }
  }

  async checkTransactionStatus(refId: string, isPrepaid: boolean = true): Promise<TransactionResponse> {
    try {
      const payload: CheckTransactionStatusRequest = {
        ref_id: refId,
        commands: isPrepaid ? 'status' : 'status-pasca'
      };

      const response = await axios.post<TransactionResponse>(
        `${API_PROXY_URL}/v1/transaction`,
        payload
      );

      return response.data;
    } catch (error) {
      console.error('Error checking transaction status:', error);
      throw new Error('Failed to check transaction status');
    }
  }

  // Add method to sync products from Digiflazz to database
  async syncProducts(): Promise<any> {
    try {
      // Directly call Digiflazz API for product list
      const response = await axios.post('https://api.digiflazz.com/v1/price-list', {
        cmd: 'prepaid',
        username: this.username,
        sign: await this.generateSignature('pricelist')
      });

      if (response.data && response.data.data) {
        const products = response.data.data;
        console.log(`Received ${products.length} products from Digiflazz`);

        // Save products to database (assuming Supabase)
        try {
          const savedCount = await this.saveProductsToDatabase(products);
          return {
            success: true,
            data: {
              count: savedCount
            }
          };
        } catch (error) {
          console.error('Error saving products to database:', error.message);
          throw new Error(`Failed to save products: ${error.message}`);
        }
      } else {
        throw new Error('Invalid response from Digiflazz API');
      }
    } catch (error) {
      console.error('Error syncing products:', error.message);
      throw error;
    }
  }

  private async saveProductsToDatabase(products: DigiflazzProduct[]): Promise<number> {
    try {
      // Use Supabase client to upsert products to produk_ppob table
      const supabase = createClient(
        import.meta.env.VITE_SUPABASE_URL || 'https://vpztrjwitxvldrdhndlr.supabase.co',
        import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwenRyandpdHh2bGRyZGhuZGxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4MTE3NzIsImV4cCI6MjA2MzM4Nzc3Mn0._NFTwCpQGgMThUeh1sew8y5ulRXSGmwHLmXRQx544PM'
      );

      // Transform products to match your database schema if needed
      const productsToSave = products.map(product => ({
        buyer_sku_code: product.buyer_sku_code,
        product_name: product.product_name,
        category: product.category,
        brand: product.brand,
        type: product.type,
        seller_name: product.seller_name,
        price: product.price,
        buyer_price: product.buyer_price,
        desc: product.desc,
        buyer_product_status: product.buyer_product_status,
        seller_product_status: product.seller_product_status,
        unlimited_stock: product.unlimited_stock,
        stock: product.stock,
        multi: product.multi,
        start_cut_off: product.start_cut_off,
        end_cut_off: product.end_cut_off
      }));

      // Upsert products to avoid duplicates
      const { data, error } = await supabase
        .from('digiflazz_products')
        .upsert(productsToSave, { onConflict: 'buyer_sku_code' });

      if (error) {
        console.error('Error saving products to database:', error.message);
        throw new Error(`Failed to save products: ${error.message}`);
      }

      console.log(`Saved ${products.length} products to database`);
      return products.length;
    } catch (error) {
      console.error('Error saving products to database:', error.message);
      throw error;
    }
  }
}

export const digiflazzService = new DigiflazzService();
export default digiflazzService;
