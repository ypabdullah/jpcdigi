import { supabase } from '@/integrations/supabase/client';
import { PPOBService, PPOBTransaction, PPOBSavedCustomer, PPOBProduct, PPOBBalance } from '@/integrations/supabase/ppob-types';

export const getPPOBServices = async (): Promise<PPOBService[]> => {
  try {
    const { data, error } = await supabase
      .from('ppob_services')
      .select('*')
      .order('created_at', { ascending: true });
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching PPOB services:', error);
    return [];
  }
};

export const getPPOBServiceById = async (id: string): Promise<PPOBService | null> => {
  try {
    const { data, error } = await supabase
      .from('ppob_services')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error fetching PPOB service with id ${id}:`, error);
    return null;
  }
};

export const getPPOBTransactions = async (userId: string): Promise<PPOBTransaction[]> => {
  try {
    const { data, error } = await supabase
      .from('ppob_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('transaction_date', { ascending: false });
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching PPOB transactions:', error);
    return [];
  }
};

export const createPPOBTransaction = async (transaction: Omit<PPOBTransaction, 'id' | 'created_at'>): Promise<PPOBTransaction | null> => {
  try {
    const { data, error } = await supabase
      .from('ppob_transactions')
      .insert([transaction])
      .select()
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating PPOB transaction:', error);
    return null;
  }
};

export const updatePPOBTransaction = async (id: string, updates: Partial<PPOBTransaction>): Promise<PPOBTransaction | null> => {
  try {
    const { data, error } = await supabase
      .from('ppob_transactions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error updating PPOB transaction with id ${id}:`, error);
    return null;
  }
};

export const getPPOBSavedCustomers = async (userId: string, serviceId?: string): Promise<PPOBSavedCustomer[]> => {
  try {
    let query = supabase
      .from('ppob_saved_customers')
      .select('*')
      .eq('user_id', userId);
      
    if (serviceId) {
      query = query.eq('service_id', serviceId);
    }
    
    const { data, error } = await query.order('last_used', { ascending: false });
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching PPOB saved customers:', error);
    return [];
  }
};

export const savePPOBCustomer = async (customer: Omit<PPOBSavedCustomer, 'id' | 'created_at'>): Promise<PPOBSavedCustomer | null> => {
  try {
    const { data, error } = await supabase
      .from('ppob_saved_customers')
      .insert([{
        ...customer,
        last_used: new Date().toISOString()
      }])
      .select()
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving PPOB customer:', error);
    return null;
  }
};

export const getPPOBProducts = async (serviceId: string): Promise<PPOBProduct[]> => {
  try {
    const { data, error } = await supabase
      .from('ppob_products')
      .select('*')
      .eq('service_id', serviceId)
      .order('price', { ascending: true });
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error(`Error fetching PPOB products for service ${serviceId}:`, error);
    return [];
  }
};

export const getPPOBBalance = async (userId: string): Promise<PPOBBalance | null> => {
  try {
    const { data, error } = await supabase
      .from('ppob_balances')
      .select('*')
      .eq('user_id', userId)
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error fetching PPOB balance for user ${userId}:`, error);
    return null;
  }
};

export const updatePPOBBalance = async (userId: string, balanceUpdate: number, transactionId?: string): Promise<PPOBBalance | null> => {
  try {
    // First get current balance
    const currentBalance = await getPPOBBalance(userId);
    const newBalance = currentBalance ? currentBalance.balance + balanceUpdate : balanceUpdate;
    
    const updateData: Partial<PPOBBalance> = {
      balance: newBalance,
      last_updated: new Date().toISOString()
    };
    
    if (transactionId) {
      updateData.last_transaction_id = transactionId;
    }
    
    const { data, error } = await supabase
      .from('ppob_balances')
      .upsert([
        {
          user_id: userId,
          ...updateData
        }
      ])
      .select()
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error updating PPOB balance for user ${userId}:`, error);
    return null;
  }
};
