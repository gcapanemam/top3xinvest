export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_audit_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
        }
        Relationships: []
      }
      crypto_price_history: {
        Row: {
          cryptocurrency_id: string
          id: string
          price: number
          recorded_at: string
        }
        Insert: {
          cryptocurrency_id: string
          id?: string
          price: number
          recorded_at?: string
        }
        Update: {
          cryptocurrency_id?: string
          id?: string
          price?: number
          recorded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crypto_price_history_cryptocurrency_id_fkey"
            columns: ["cryptocurrency_id"]
            isOneToOne: false
            referencedRelation: "cryptocurrencies"
            referencedColumns: ["id"]
          },
        ]
      }
      cryptocurrencies: {
        Row: {
          created_at: string
          current_price: number
          icon_url: string | null
          id: string
          is_active: boolean
          name: string
          price_change_24h: number
          symbol: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_price?: number
          icon_url?: string | null
          id?: string
          is_active?: boolean
          name: string
          price_change_24h?: number
          symbol: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_price?: number
          icon_url?: string | null
          id?: string
          is_active?: boolean
          name?: string
          price_change_24h?: number
          symbol?: string
          updated_at?: string
        }
        Relationships: []
      }
      deposits: {
        Row: {
          admin_notes: string | null
          amount: number
          created_at: string
          id: string
          payment_proof_url: string | null
          processed_at: string | null
          processed_by: string | null
          status: Database["public"]["Enums"]["transaction_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          created_at?: string
          id?: string
          payment_proof_url?: string | null
          processed_at?: string | null
          processed_by?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          created_at?: string
          id?: string
          payment_proof_url?: string | null
          processed_at?: string | null
          processed_by?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      investments: {
        Row: {
          amount: number
          created_at: string
          id: string
          lock_until: string
          profit_accumulated: number
          robot_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          lock_until: string
          profit_accumulated?: number
          robot_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          lock_until?: string
          profit_accumulated?: number
          robot_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "investments_robot_id_fkey"
            columns: ["robot_id"]
            isOneToOne: false
            referencedRelation: "robots"
            referencedColumns: ["id"]
          },
        ]
      }
      mlm_settings: {
        Row: {
          commission_percentage: number
          id: string
          level: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          commission_percentage?: number
          id?: string
          level: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          commission_percentage?: number
          id?: string
          level?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_global: boolean
          is_read: boolean
          message: string
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_global?: boolean
          is_read?: boolean
          message: string
          title: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_global?: boolean
          is_read?: boolean
          message?: string
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          balance: number
          created_at: string
          full_name: string | null
          id: string
          is_blocked: boolean
          phone: string | null
          referral_code: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          balance?: number
          created_at?: string
          full_name?: string | null
          id?: string
          is_blocked?: boolean
          phone?: string | null
          referral_code?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          balance?: number
          created_at?: string
          full_name?: string | null
          id?: string
          is_blocked?: boolean
          phone?: string | null
          referral_code?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      referral_commissions: {
        Row: {
          amount: number
          created_at: string
          from_user_id: string
          id: string
          investment_id: string | null
          level: number
          percentage: number
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          from_user_id: string
          id?: string
          investment_id?: string | null
          level: number
          percentage: number
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          from_user_id?: string
          id?: string
          investment_id?: string | null
          level?: number
          percentage?: number
          user_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          level: number
          referral_code: string
          referrer_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          level?: number
          referral_code: string
          referrer_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          level?: number
          referral_code?: string
          referrer_id?: string
          user_id?: string
        }
        Relationships: []
      }
      robot_operations: {
        Row: {
          closed_at: string | null
          created_at: string
          cryptocurrency_symbol: string
          entry_price: number
          exit_price: number | null
          id: string
          operation_type: string
          profit_percentage: number | null
          robot_id: string
          status: string
        }
        Insert: {
          closed_at?: string | null
          created_at?: string
          cryptocurrency_symbol: string
          entry_price: number
          exit_price?: number | null
          id?: string
          operation_type: string
          profit_percentage?: number | null
          robot_id: string
          status?: string
        }
        Update: {
          closed_at?: string | null
          created_at?: string
          cryptocurrency_symbol?: string
          entry_price?: number
          exit_price?: number | null
          id?: string
          operation_type?: string
          profit_percentage?: number | null
          robot_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "robot_operations_robot_id_fkey"
            columns: ["robot_id"]
            isOneToOne: false
            referencedRelation: "robots"
            referencedColumns: ["id"]
          },
        ]
      }
      robots: {
        Row: {
          created_at: string
          cryptocurrency_id: string | null
          description: string | null
          id: string
          is_active: boolean
          lock_period_days: number
          max_investment: number | null
          min_investment: number
          name: string
          profit_percentage: number
          profit_period_days: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          cryptocurrency_id?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          lock_period_days?: number
          max_investment?: number | null
          min_investment?: number
          name: string
          profit_percentage: number
          profit_period_days?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          cryptocurrency_id?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          lock_period_days?: number
          max_investment?: number | null
          min_investment?: number
          name?: string
          profit_percentage?: number
          profit_period_days?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "robots_cryptocurrency_id_fkey"
            columns: ["cryptocurrency_id"]
            isOneToOne: false
            referencedRelation: "cryptocurrencies"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          reference_id: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          type?: Database["public"]["Enums"]["transaction_type"]
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      withdrawals: {
        Row: {
          admin_notes: string | null
          amount: number
          created_at: string
          id: string
          pix_key: string | null
          processed_at: string | null
          processed_by: string | null
          status: Database["public"]["Enums"]["transaction_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          created_at?: string
          id?: string
          pix_key?: string | null
          processed_at?: string | null
          processed_by?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          created_at?: string
          id?: string
          pix_key?: string | null
          processed_at?: string | null
          processed_by?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      credit_robot_profits: {
        Args: { p_profit_percentage: number; p_robot_id: string }
        Returns: number
      }
      distribute_investment_profit: {
        Args: { p_investment_id: string; p_profit_amount: number }
        Returns: boolean
      }
      get_network_stats: {
        Args: { target_user_id: string }
        Returns: {
          active_levels: number
          direct_members: number
          level_1_count: number
          level_1_volume: number
          level_2_count: number
          level_2_volume: number
          level_3_count: number
          level_3_volume: number
          level_4_count: number
          level_4_volume: number
          total_members: number
          total_volume: number
        }[]
      }
      get_network_tree: {
        Args: { root_user_id: string }
        Returns: {
          full_name: string
          level: number
          referral_code: string
          referrer_id: string
          total_invested: number
          user_id: string
        }[]
      }
      get_user_upline: {
        Args: { p_user_id: string }
        Returns: {
          level: number
          user_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      process_referral: {
        Args: { new_user_id: string; referrer_code: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      notification_type: "alert" | "info" | "promo" | "system"
      transaction_status:
        | "pending"
        | "approved"
        | "rejected"
        | "processing"
        | "completed"
      transaction_type:
        | "deposit"
        | "withdrawal"
        | "investment"
        | "profit"
        | "refund"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      notification_type: ["alert", "info", "promo", "system"],
      transaction_status: [
        "pending",
        "approved",
        "rejected",
        "processing",
        "completed",
      ],
      transaction_type: [
        "deposit",
        "withdrawal",
        "investment",
        "profit",
        "refund",
      ],
    },
  },
} as const
