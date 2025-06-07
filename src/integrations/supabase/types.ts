export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      addresses: {
        Row: {
          city: string
          country: string
          created_at: string | null
          id: string
          is_default: boolean | null
          name: string
          state: string
          street: string
          user_id: string
          zip: string
        }
        Insert: {
          city: string
          country: string
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          state: string
          street: string
          user_id: string
          zip: string
        }
        Update: {
          city?: string
          country?: string
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          state?: string
          street?: string
          user_id?: string
          zip?: string
        }
        Relationships: [
          {
            foreignKeyName: "addresses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string | null
          id: string
          image: string | null
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          image?: string | null
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          image?: string | null
          name?: string
        }
        Relationships: []
      }
      chat_sessions: {
        Row: {
          admin_id: string | null
          created_at: string | null
          customer_id: string | null
          id: string
          last_message_at: string | null
          status: Database["public"]["Enums"]["chat_session_status_type"] | null
          topic: string | null
          updated_at: string | null
        }
        Insert: {
          admin_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          id?: string
          last_message_at?: string | null
          status?:
            | Database["public"]["Enums"]["chat_session_status_type"]
            | null
          topic?: string | null
          updated_at?: string | null
        }
        Update: {
          admin_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          id?: string
          last_message_at?: string | null
          status?:
            | Database["public"]["Enums"]["chat_session_status_type"]
            | null
          topic?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_sessions_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_sessions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      couriers: {
        Row: {
          created_at: string | null
          current_location: string | null
          first_name: string
          id: string
          last_name: string
          license_plate: string | null
          phone: string
          status: Database["public"]["Enums"]["courier_status_type"] | null
          user_id: string
          vehicle_type: string | null
        }
        Insert: {
          created_at?: string | null
          current_location?: string | null
          first_name: string
          id?: string
          last_name: string
          license_plate?: string | null
          phone: string
          status?: Database["public"]["Enums"]["courier_status_type"] | null
          user_id: string
          vehicle_type?: string | null
        }
        Update: {
          created_at?: string | null
          current_location?: string | null
          first_name?: string
          id?: string
          last_name?: string
          license_plate?: string | null
          phone?: string
          status?: Database["public"]["Enums"]["courier_status_type"] | null
          user_id?: string
          vehicle_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "couriers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_transactions: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          notes: string | null
          product_id: string
          quantity: number
          transaction_type: Database["public"]["Enums"]["inventory_transaction_type"]
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          product_id: string
          quantity: number
          transaction_type: Database["public"]["Enums"]["inventory_transaction_type"]
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          product_id?: string
          quantity?: number
          transaction_type?: Database["public"]["Enums"]["inventory_transaction_type"]
        }
        Relationships: [
          {
            foreignKeyName: "inventory_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          order_info: Json | null
          read_by_admin: boolean | null
          read_by_customer: boolean | null
          sender_id: string
          sender_type: Database["public"]["Enums"]["message_sender_type"]
          session_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          order_info?: Json | null
          read_by_admin?: boolean | null
          read_by_customer?: boolean | null
          sender_id: string
          sender_type: Database["public"]["Enums"]["message_sender_type"]
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          order_info?: Json | null
          read_by_admin?: boolean | null
          read_by_customer?: boolean | null
          sender_id?: string
          sender_type?: Database["public"]["Enums"]["message_sender_type"]
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          order_id: string
          price: number
          product_id: string
          product_name: string
          quantity: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_id: string
          price: number
          product_id: string
          product_name: string
          quantity: number
        }
        Update: {
          created_at?: string | null
          id?: string
          order_id?: string
          price?: number
          product_id?: string
          product_name?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          courier_id: string | null
          created_at: string | null
          date: string
          delivery_status:
            | Database["public"]["Enums"]["delivery_status_type"]
            | null
          id: string
          payment_details: string | null
          payment_method: string | null
          shipping_address_id: string | null
          shipping_method_id: string | null
          status: Database["public"]["Enums"]["order_status_type"] | null
          total: number
          tracking_number: string | null
          user_id: string
        }
        Insert: {
          courier_id?: string | null
          created_at?: string | null
          date?: string
          delivery_status?:
            | Database["public"]["Enums"]["delivery_status_type"]
            | null
          id?: string
          payment_details?: string | null
          payment_method?: string | null
          shipping_address_id?: string | null
          shipping_method_id?: string | null
          status?: Database["public"]["Enums"]["order_status_type"] | null
          total: number
          tracking_number?: string | null
          user_id: string
        }
        Update: {
          courier_id?: string | null
          created_at?: string | null
          date?: string
          delivery_status?:
            | Database["public"]["Enums"]["delivery_status_type"]
            | null
          id?: string
          payment_details?: string | null
          payment_method?: string | null
          shipping_address_id?: string | null
          shipping_method_id?: string | null
          status?: Database["public"]["Enums"]["order_status_type"] | null
          total?: number
          tracking_number?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_courier_id_fkey"
            columns: ["courier_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_shipping_address_id_fkey"
            columns: ["shipping_address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_shipping_method_id_fkey"
            columns: ["shipping_method_id"]
            isOneToOne: false
            referencedRelation: "shipping_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string | null
          created_at: string | null
          description: string | null
          discount: number | null
          featured: boolean | null
          id: string
          images: string[] | null
          in_stock: boolean | null
          name: string
          origin: string | null
          price: number
          rating: number | null
          review_count: number | null
          seller: string | null
          specifications: Json | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          discount?: number | null
          featured?: boolean | null
          id?: string
          images?: string[] | null
          in_stock?: boolean | null
          name: string
          origin?: string | null
          price: number
          rating?: number | null
          review_count?: number | null
          seller?: string | null
          specifications?: Json | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          discount?: number | null
          featured?: boolean | null
          id?: string
          images?: string[] | null
          in_stock?: boolean | null
          name?: string
          origin?: string | null
          price?: number
          rating?: number | null
          review_count?: number | null
          seller?: string | null
          specifications?: Json | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          name: string | null
          phone: string | null
          role: Database["public"]["Enums"]["app_role"] | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id: string
          name?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
        }
        Relationships: []
      }
      shipping_methods: {
        Row: {
          active: boolean | null
          carrier: string
          cost: number
          created_at: string | null
          estimated_days: number | null
          id: string
          name: string
        }
        Insert: {
          active?: boolean | null
          carrier: string
          cost: number
          created_at?: string | null
          estimated_days?: number | null
          id?: string
          name: string
        }
        Update: {
          active?: boolean | null
          carrier?: string
          cost?: number
          created_at?: string | null
          estimated_days?: number | null
          id?: string
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_my_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_my_uid: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_courier: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_manager: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "customer" | "manager" | "courier"
      chat_session_status_type:
        | "open"
        | "pending"
        | "active"
        | "closed"
        | "resolved"
      courier_status_type: "available" | "busy" | "offline"
      delivery_status_type:
        | "pending"
        | "assigned"
        | "picked_up"
        | "delivered"
        | "failed"
      inventory_transaction_type: "restock" | "sale" | "return" | "adjustment"
      message_sender_type: "customer" | "admin"
      order_status_type:
        | "pending"
        | "processing"
        | "shipped"
        | "delivered"
        | "canceled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "customer", "manager", "courier"],
      chat_session_status_type: [
        "open",
        "pending",
        "active",
        "closed",
        "resolved",
      ],
      courier_status_type: ["available", "busy", "offline"],
      delivery_status_type: [
        "pending",
        "assigned",
        "picked_up",
        "delivered",
        "failed",
      ],
      inventory_transaction_type: ["restock", "sale", "return", "adjustment"],
      message_sender_type: ["customer", "admin"],
      order_status_type: [
        "pending",
        "processing",
        "shipped",
        "delivered",
        "canceled",
      ],
    },
  },
} as const
