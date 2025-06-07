import React, { createContext, useContext, useState, ReactNode } from 'react';
import { TransactionResponse } from '@/services/digiflazz';

// Define custom transaction type for our app
export interface Transaction {
  id: string;
  type: string;
  subtype?: string;
  amount: number;
  date: string;
  description: string;
  status: string;
  details?: Record<string, any>;
}

// Define the transaction context interface
interface TransactionContextType {
  transactionHistory: Transaction[];
  addTransaction: (transaction: Transaction) => void;
  clearTransactions: () => void;
  getTransactionById: (id: string) => Transaction | undefined;
}

// Create the context with default values
const TransactionContext = createContext<TransactionContextType>({
  transactionHistory: [],
  addTransaction: () => {},
  clearTransactions: () => {},
  getTransactionById: () => undefined,
});

// Props for the provider component
interface TransactionProviderProps {
  children: ReactNode;
}

// Provider component
export const TransactionProvider: React.FC<TransactionProviderProps> = ({ children }) => {
  const [transactionHistory, setTransactionHistory] = useState<Transaction[]>([]);

  // Add a transaction to history
  const addTransaction = (transaction: Transaction) => {
    setTransactionHistory(prevHistory => [transaction, ...prevHistory]);
    
    // Store in localStorage for persistence across page refreshes
    try {
      const existingData = localStorage.getItem('jpcDigi_transactions');
      const transactions = existingData ? JSON.parse(existingData) : [];
      transactions.unshift(transaction);
      
      // Limit to 100 transactions to prevent localStorage from growing too large
      if (transactions.length > 100) {
        transactions.pop();
      }
      
      localStorage.setItem('jpcDigi_transactions', JSON.stringify(transactions));
    } catch (error) {
      console.error('Error storing transaction in localStorage:', error);
    }
  };

  // Clear all transactions
  const clearTransactions = () => {
    setTransactionHistory([]);
    localStorage.removeItem('jpcDigi_transactions');
  };

  // Get a transaction by its ID
  const getTransactionById = (id: string): Transaction | undefined => {
    return transactionHistory.find(transaction => transaction.id === id);
  };

  // Load transactions from localStorage on initial render
  React.useEffect(() => {
    try {
      const storedTransactions = localStorage.getItem('jpcDigi_transactions');
      if (storedTransactions) {
        setTransactionHistory(JSON.parse(storedTransactions));
      }
    } catch (error) {
      console.error('Error loading transactions from localStorage:', error);
    }
  }, []);

  return (
    <TransactionContext.Provider
      value={{
        transactionHistory,
        addTransaction,
        clearTransactions,
        getTransactionById,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};

// Custom hook for easier context consumption
export const useTransaction = () => useContext(TransactionContext);

export default TransactionContext;
