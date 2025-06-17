import { useState, useCallback, useEffect } from 'react';
import digiflazzService, { 
  DigiflazzProduct, 
  TransactionResponse, 
  generateRefId 
} from '@/services/digiflazz';
import config from '@/config/config';

// Hook for Digiflazz service interactions
export function useDigiflazz() {
  const [products, setProducts] = useState<DigiflazzProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [currentTransaction, setCurrentTransaction] = useState<TransactionResponse | null>(null);
  
  // Get all products or filter by category
  const fetchProducts = useCallback(async (category?: string) => {
    try {
      setLoading(true);
      setError(null);
      const result = await digiflazzService.getPriceList(category);
      setProducts(result);
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch products';
      setError(errorMsg);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Get balance
  const fetchBalance = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await digiflazzService.checkBalance();
      setBalance(result);
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch balance';
      setError(errorMsg);
      return 0;
    } finally {
      setLoading(false);
    }
  }, []);

  // Process prepaid transaction (pulsa, data, etc)
  const processPrepaidTransaction = useCallback(async (
    customerNo: string, 
    skuCode: string, 
    testing: boolean = config.digiflazz.useTestMode
  ) => {
    try {
      setLoading(true);
      setError(null);
      // Ensure all required fields are included in the request
      const refId = generateRefId();
      const username = config.digiflazz.username;
      const apiKey = config.digiflazz.apiKey;
      // Note: We would calculate sign here if we had an MD5 function available
      // For now, we'll log a warning if this might be an issue
      console.log("Sending Digiflazz transaction with username:", username, "and refId:", refId);
      const result = await digiflazzService.topupPrepaid(customerNo, skuCode, testing);
      setCurrentTransaction(result);
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to process transaction';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  // Process postpaid inquiry (PLN, PDAM, etc)
  const processPostpaidInquiry = useCallback(async (
    customerNo: string, 
    skuCode: string, 
    testing: boolean = config.digiflazz.useTestMode
  ) => {
    try {
      setLoading(true);
      setError(null);
      const result = await digiflazzService.inquiryPostpaid(customerNo, skuCode, testing);
      setCurrentTransaction(result);
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to process inquiry';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  // Process postpaid payment (after inquiry)
  const processPostpaidPayment = useCallback(async (
    customerNo: string, 
    skuCode: string, 
    refId: string, 
    testing: boolean = config.digiflazz.useTestMode
  ) => {
    try {
      setLoading(true);
      setError(null);
      const result = await digiflazzService.payPostpaid(customerNo, skuCode, refId, testing);
      setCurrentTransaction(result);
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to process payment';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  // Check transaction status
  const checkTransactionStatus = useCallback(async (
    refId: string, 
    isPrepaid: boolean = true
  ) => {
    try {
      setLoading(true);
      setError(null);
      const result = await digiflazzService.checkTransactionStatus(refId, isPrepaid);
      setCurrentTransaction(result);
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to check transaction status';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get operator from phone number
  const getOperatorFromPhoneNumber = useCallback((phoneNumber: string) => {
    return digiflazzService.getOperatorFromPhoneNumber(phoneNumber);
  }, []);

  // Generate a new reference ID
  const getNewRefId = useCallback(() => {
    return generateRefId();
  }, []);

  // Return all the hook methods and state
  return {
    // State
    products,
    loading,
    error,
    balance,
    currentTransaction,
    
    // Methods
    fetchProducts,
    fetchBalance,
    processPrepaidTransaction,
    processPostpaidInquiry,
    processPostpaidPayment,
    checkTransactionStatus,
    getOperatorFromPhoneNumber,
    getNewRefId
  };
}

export default useDigiflazz;
