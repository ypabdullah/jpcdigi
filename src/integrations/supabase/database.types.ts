
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      addresses: {
        Row: {
          id: string
          user_id: string
          name: string
          street: string
          city: string
          state: string
          zip: string
          country: string
          is_default: boolean
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          street: string
          city: string
          state: string
          zip: string
          country: string
          is_default?: boolean
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          street?: string
          city?: string
          state?: string
          zip?: string
          country?: string
          is_default?: boolean
          created_at?: string | null
        }
      }
      profiles: {
        Row: {
          id: string
          name: string | null
          email: string | null
          role: string | null
          created_at: string | null
        }
        Insert: {
          id: string
          name?: string | null
          email?: string | null
          role?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string | null
          email?: string | null
          role?: string | null
          created_at?: string | null
        }
      }
      orders: {
        Row: {
          id: string
          user_id: string
          date: string | null
          status: string | null
          total: number
          shipping_address_id: string | null
          payment_method: string | null
          tracking_number: string | null
          delivery_status: string | null
          courier_id: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          date?: string | null
          status?: string | null
          total: number
          shipping_address_id?: string | null
          payment_method?: string | null
          tracking_number?: string | null
          delivery_status?: string | null
          courier_id?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          date?: string | null
          status?: string | null
          total?: number
          shipping_address_id?: string | null
          payment_method?: string | null
          tracking_number?: string | null
          delivery_status?: string | null
          courier_id?: string | null
          created_at?: string | null
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          product_name: string
          quantity: number
          price: number
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          product_name: string
          quantity: number
          price: number
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          product_name?: string
          quantity?: number
          price?: number
        }
      }
      shipping_methods: {
        Row: {
          id: string
          name: string
          carrier: string
          cost: number
          estimated_days: number
          active: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          carrier: string
          cost: number
          estimated_days: number
          active?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          carrier?: string
          cost?: number
          estimated_days?: number
          active?: boolean | null
          created_at?: string | null
        }
      }
      coal_inventory_transactions: {
        Row: {
          id: string
          transaction_date: string
          transaction_type: string
          quantity_kg: number
          source_destination: string
          vehicle_info: string | null
          driver_name: string | null
          price_per_kg: number | null
          total_amount: number | null
          quality_grade: string | null
          moisture_content: number | null
          notes: string | null
          created_by: string
          created_at: string
          document_reference: string | null
        }
        Insert: {
          id?: string
          transaction_date: string
          transaction_type: string
          quantity_kg: number
          source_destination: string
          vehicle_info?: string | null
          driver_name?: string | null
          price_per_kg?: number | null
          total_amount?: number | null
          quality_grade?: string | null
          moisture_content?: number | null
          notes?: string | null
          created_by: string
          created_at?: string
          document_reference?: string | null
        }
        Update: {
          id?: string
          transaction_date?: string
          transaction_type?: string
          quantity_kg?: number
          source_destination?: string
          vehicle_info?: string | null
          driver_name?: string | null
          price_per_kg?: number | null
          total_amount?: number | null
          quality_grade?: string | null
          moisture_content?: number | null
          notes?: string | null
          created_by?: string
          created_at?: string
          document_reference?: string | null
        }
      }
      coal_inventory_summary: {
        Row: {
          id: string
          total_incoming_kg: number
          total_outgoing_kg: number
          current_stock_kg: number
          average_price_per_kg: number
          last_transaction_date: string
          stock_value: number
          premium_stock_kg: number
          standard_stock_kg: number
          economy_stock_kg: number
        }
        Insert: {
          id?: string
          total_incoming_kg: number
          total_outgoing_kg: number
          current_stock_kg: number
          average_price_per_kg: number
          last_transaction_date: string
          stock_value: number
          premium_stock_kg: number
          standard_stock_kg: number
          economy_stock_kg: number
        }
        Update: {
          id?: string
          total_incoming_kg?: number
          total_outgoing_kg?: number
          current_stock_kg?: number
          average_price_per_kg?: number
          last_transaction_date?: string
          stock_value?: number
          premium_stock_kg?: number
          standard_stock_kg?: number
          economy_stock_kg?: number
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper type for Supabase functions
export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
      Database["public"]["Views"])
  ? (Database["public"]["Tables"] &
      Database["public"]["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never;

// Export the Database type
export type DbSchema = Database;
