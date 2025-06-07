// PPOB Data Models for Supabase Database
import type { Json } from './database.types';

export interface PPOBService {
  id: string; // UUID
  name: string;
  category: string;
  icon: string;
  color: string;
  icon_color: string;
  route: string;
  is_new: boolean;
  created_at: string | null;
}

export interface PPOBTransaction {
  id: string; // UUID
  user_id: string; // UUID, foreign key to profiles
  service_id: string; // UUID, foreign key to PPOB services
  amount: number;
  transaction_date: string;
  transaction_type: string; // e.g. 'payment', 'topup', 'transfer'
  status: string; // e.g. 'pending', 'completed', 'failed'
  reference_id: string | null;
  customer_id: string | null; // Customer number or identifier for the service
  details: Json | null; // JSONB for additional transaction details
  created_at: string | null;
}

export interface PPOBSavedCustomer {
  id: string; // UUID
  user_id: string; // UUID, foreign key to profiles
  service_id: string; // UUID, foreign key to PPOB services
  customer_id: string; // Customer number or identifier for the service
  customer_name: string | null;
  last_used: string | null;
  created_at: string | null;
}

export interface PPOBProduct {
  id: string; // UUID
  service_id: string; // UUID, foreign key to PPOB services
  name: string;
  description: string | null;
  price: number;
  original_price: number | null;
  discount: number | null;
  provider: string | null;
  sku: string | null; // Digiflazz SKU or other provider reference
  is_promo: boolean;
  details: Json | null; // JSONB for additional product details
  created_at: string | null;
  updated_at: string | null;
}

export interface PPOBBalance {
  id: string; // UUID
  user_id: string; // UUID, foreign key to profiles
  balance: number; // Current wallet balance
  last_updated: string | null;
  last_transaction_id: string | null; // UUID, reference to last transaction affecting balance
}
