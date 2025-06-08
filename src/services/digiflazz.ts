import axios from 'axios';
import config from '@/config/config';

// Digiflazz API Configuration from config
const API_PROXY_URL = 'http://202.10.44.157:5173/netlify/functions/digiflazz-proxy';
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
  buyer_sku_code: string;
  customer_no: string;
  ref_id: string;
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

// Note: MD5 signature generation is now handled in the Netlify Function proxy
// DigiflazzService class
class DigiflazzService {
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
  async getPriceList(category?: string): Promise<DigiflazzProduct[]> {
    try {
      const response = await axios.post<PriceListResponse>(
        `${API_PROXY_URL}/v1/price-list`,
        {
          cmd: 'prepaid'
        }
      );
      
      let products = response.data.data;
      
      // Filter by category if provided
      if (category) {
        products = products.filter(product => 
          product.category.toLowerCase() === category.toLowerCase()
        );
      }
      
      return products;
    } catch (error) {
      console.error('Error fetching price list:', error);
      throw new Error('Failed to fetch price list');
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

  // Process prepaid transaction (pulsa, data, etc)
  async topupPrepaid(customerNo: string, skuCode: string, testing: boolean = false): Promise<TransactionResponse> {
    try {
      const refId = generateRefId();
      
      const payload: PrepaidTransactionRequest = {
        buyer_sku_code: skuCode,
        customer_no: customerNo,
        ref_id: refId,
        testing: testing
      };
      
      const response = await axios.post<TransactionResponse>(
        `${API_PROXY_URL}/v1/transaction`,
        payload
      );
      
      return response.data;
    } catch (error) {
      console.error('Error processing prepaid transaction:', error);
      throw new Error('Failed to process prepaid transaction');
    }
  }

  // Inquiry for postpaid services (PLN, PDAM, etc)
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
        `${API_PROXY_URL}/v1/transaction`,
        payload
      );
      
      return response.data;
    } catch (error) {
      console.error('Error processing postpaid inquiry:', error);
      throw new Error('Failed to process postpaid inquiry');
    }
  }

  // Payment for postpaid services (after inquiry)
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

  // Check transaction status
  async checkTransactionStatus(refId: string, isPrepaid: boolean = true): Promise<TransactionResponse> {
    try {
      const payload: CheckTransactionStatusRequest = {
        ref_id: refId,
        commands: isPrepaid ? 'status-pasca' : 'status-pasca'
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
}

export const digiflazzService = new DigiflazzService();
export default digiflazzService;
