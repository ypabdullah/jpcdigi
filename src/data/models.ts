export interface Product {
  id: string;
  name: string;
  type: string;
  price: number;
  description: string;
  specifications: {
    [key: string]: string | number;
  } | any; // Updated to be more flexible with Json type from Supabase
  origin: string;
  seller: string;
  images: string[];
  rating: number;
  review_count?: number; // Match Supabase column name
  reviewCount?: number;  // For backward compatibility
  in_stock?: boolean;    // Match Supabase column name
  inStock?: boolean;     // For backward compatibility
  featured?: boolean;
  discount?: number;
  created_at?: string;   // Supabase timestamp
  updated_at?: string;   // Supabase timestamp
}

export interface Category {
  id: string;
  name: string;
  image: string;
  count: number;
}

export type SortOption = "price-asc" | "price-desc" | "rating" | "newest";

export interface FilterOptions {
  priceRange: [number, number];
  types: string[];
  origins: string[];
}

export interface Address {
  id: string;
  name: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  isDefault: boolean;
  phone?: string;   // Added phone property for customer contact
  user_id?: string; 
  created_at?: string; 
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  order_id?: string;
}

export interface Order {
  id: string;
  date: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'canceled';
  items?: OrderItem[];
  total: number;
  shippingAddress?: Address;
  paymentMethod?: string;
  trackingNumber?: string;
  shipping_address_id?: string;
  shipping_method_id?: string; // Add this field to match Supabase column
  user_id?: string;
  delivery_status?: 'pending' | 'assigned' | 'picked_up' | 'delivered' | 'failed';
  courier_id?: string;
  voucher_id?: string; // ID of applied voucher
  discount_amount?: number; // Amount of discount from voucher
}

export interface ShippingMethod {
  id: string;
  name: string;
  carrier: string;
  cost: number;
  estimated_days: number;
  active: boolean;
  created_at?: string;
}

export interface InventoryTransaction {
  id: string;
  product_id: string;
  quantity: number;
  transaction_type: 'restock' | 'sale' | 'return' | 'adjustment';
  notes?: string;
  created_by?: string;
  created_at?: string;
  product?: Product;
}

export interface CoalInventoryTransaction {
  id: string;
  transaction_date: string;
  transaction_type: 'incoming' | 'outgoing';
  quantity_kg: number;
  source_destination: string;
  vehicle_info?: string;
  driver_name?: string;
  price_per_kg?: number;
  total_amount?: number;
  quality_grade?: 'premium' | 'standard' | 'economy';
  moisture_content?: number;
  notes?: string;
  created_by: string;
  created_at?: string;
  document_reference?: string;
}

export interface CoalInventorySummary {
  total_incoming_kg: number;
  total_outgoing_kg: number;
  current_stock_kg: number;
  average_price_per_kg: number;
  last_transaction_date: string;
  stock_value: number;
  premium_stock_kg: number;
  standard_stock_kg: number;
  economy_stock_kg: number;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
}

export interface CompanyExpense {
  id: string;
  date: string;
  amount: number;
  description: string;
  category_id: string;
  category_name?: string;
  receipt_image_url?: string;
  paid_by?: string;
  payment_method?: string;
  status?: 'pending' | 'approved' | 'rejected';
  created_by: string;
  created_at?: string;
  updated_at?: string;
  document_reference?: string; // Referensi ke dokumen terkait (misalnya ID order)
  notes?: string; // Catatan tambahan
}

export interface Voucher {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_purchase?: number;
  max_discount?: number;
  start_date: string;
  end_date: string;
  usage_limit?: number;
  usage_count?: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  description?: string;
}

export interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  role: 'admin' | 'customer' | 'manager' | 'courier';
  phone?: string | null;
  fcm_token?: string | null;
  created_at?: string;
  last_token_update?: string;
  last_login?: string;
  device_info?: any;
  registration_complete?: boolean;
  full_name?: string | null; // Added for compatibility with existing code
}

export interface AnalyticsSummary {
  totalSales: number;
  orderCount: number;
  averageOrderValue: number;
  topProducts: {productId: string, productName: string, quantity: number}[];
  recentOrders: Order[];
}

export interface Courier {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  vehicle_type: string;
  license_plate: string;
  status: 'available' | 'busy' | 'offline';
  current_location?: string;
  created_at?: string;
}

export type PaymentMethodType = 'bank-transfer' | 'cod' | 'qris';

export interface BankAccount {
  bank: string;
  accountNumber: string;
  accountName: string;
}

export interface ChatSession {
  id: string;
  customer_id: string | null;
  admin_id: string | null;
  status: 'open' | 'pending' | 'active' | 'closed' | 'resolved';
  created_at: string;
  updated_at: string;
  last_message_at?: string | null;
  topic?: string | null;
}

export interface Message {
  id: string;
  session_id: string;
  sender_id: string;
  sender_type: 'customer' | 'admin';
  content: string;
  created_at: string;
  read_by_customer: boolean;
  read_by_admin: boolean;
  order_info?: { // Mirrored from ChatMessageProps for consistency in the app
    orderId: string;
    orderTotal: number;
  } | null;
  // Corresponds to order_info JSONB in DB.
  // The transformation from DB JSONB to this structure would happen in the application logic.
}
