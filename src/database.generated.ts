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
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: number
          role: string
          session_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: number
          role: string
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: number
          role?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          billing_day: number | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          currency: string
          id: string
          legal_name: string | null
          monthly_fee: number | null
          name: string
          next_invoice_date: string | null
          notes: string | null
          onboarding_status: string
          plan: string
          status: string
          updated_at: string
        }
        Insert: {
          billing_day?: number | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          currency?: string
          id?: string
          legal_name?: string | null
          monthly_fee?: number | null
          name: string
          next_invoice_date?: string | null
          notes?: string | null
          onboarding_status?: string
          plan?: string
          status?: string
          updated_at?: string
        }
        Update: {
          billing_day?: number | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          currency?: string
          id?: string
          legal_name?: string | null
          monthly_fee?: number | null
          name?: string
          next_invoice_date?: string | null
          notes?: string | null
          onboarding_status?: string
          plan?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      contact_notes: {
        Row: {
          author_email: string
          body: string
          contact_id: string
          created_at: string
          id: number
        }
        Insert: {
          author_email: string
          body: string
          contact_id: string
          created_at?: string
          id?: number
        }
        Update: {
          author_email?: string
          body?: string
          contact_id?: string
          created_at?: string
          id?: number
        }
        Relationships: [
          {
            foreignKeyName: "contact_notes_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          city: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          next_follow_up: string | null
          phone: string | null
          site_id: string
          source: string
          stage: string
          updated_at: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          next_follow_up?: string | null
          phone?: string | null
          site_id?: string
          source?: string
          stage?: string
          updated_at?: string
        }
        Update: {
          city?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          next_follow_up?: string | null
          phone?: string | null
          site_id?: string
          source?: string
          stage?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      intake_files: {
        Row: {
          category: string
          created_at: string
          error_message: string | null
          id: string
          mime_type: string
          original_name: string
          request_id: string
          size_bytes: number
          status: string
          storage_path: string
          stored_at: string | null
          uploaded_at: string | null
        }
        Insert: {
          category: string
          created_at?: string
          error_message?: string | null
          id?: string
          mime_type: string
          original_name: string
          request_id: string
          size_bytes: number
          status?: string
          storage_path: string
          stored_at?: string | null
          uploaded_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          error_message?: string | null
          id?: string
          mime_type?: string
          original_name?: string
          request_id?: string
          size_bytes?: number
          status?: string
          storage_path?: string
          stored_at?: string | null
          uploaded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "intake_files_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "intake_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      intake_requests: {
        Row: {
          answers: Json
          created_at: string
          created_by: string
          expires_at: string
          id: string
          provisional_name: string
          revoked_at: string | null
          site_id: string | null
          slug: string
          status: string
          submitted_at: string | null
          token_hash: string
          updated_at: string
        }
        Insert: {
          answers?: Json
          created_at?: string
          created_by: string
          expires_at?: string
          id?: string
          provisional_name: string
          revoked_at?: string | null
          site_id?: string | null
          slug: string
          status?: string
          submitted_at?: string | null
          token_hash: string
          updated_at?: string
        }
        Update: {
          answers?: Json
          created_at?: string
          created_by?: string
          expires_at?: string
          id?: string
          provisional_name?: string
          revoked_at?: string | null
          site_id?: string | null
          slug?: string
          status?: string
          submitted_at?: string | null
          token_hash?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "intake_requests_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          created_at: string
          email: string
          id: string
          site_id: string
          source: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          site_id?: string
          source?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          site_id?: string
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_events: {
        Row: {
          changed_by: string | null
          created_at: string
          from_status: string | null
          id: number
          order_id: string
          to_status: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          from_status?: string | null
          id?: number
          order_id: string
          to_status: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          from_status?: string | null
          id?: number
          order_id?: string
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_status_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders_cod"
            referencedColumns: ["id"]
          },
        ]
      }
      orders_cod: {
        Row: {
          address: string
          city: string
          contact_id: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string
          product_id: string | null
          site_id: string
          status: string
          total_price: number
          updated_at: string
        }
        Insert: {
          address: string
          city: string
          contact_id?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          phone: string
          product_id?: string | null
          site_id?: string
          status?: string
          total_price: number
          updated_at?: string
        }
        Update: {
          address?: string
          city?: string
          contact_id?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string
          product_id?: string | null
          site_id?: string
          status?: string
          total_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_cod_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_cod_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "site_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_cod_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_admins: {
        Row: {
          created_at: string
          display_name: string | null
          email: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string
        }
        Relationships: []
      }
      site_api_keys: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          key_hash: string
          label: string | null
          last_used_at: string | null
          prefix: string
          revoked_at: string | null
          site_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          key_hash: string
          label?: string | null
          last_used_at?: string | null
          prefix: string
          revoked_at?: string | null
          site_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          key_hash?: string
          label?: string | null
          last_used_at?: string | null
          prefix?: string
          revoked_at?: string | null
          site_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_api_keys_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      site_channels: {
        Row: {
          chat_enabled: boolean
          site_id: string
          updated_at: string
          voice_enabled: boolean
          whatsapp_enabled: boolean
          whatsapp_message: string | null
          whatsapp_phone: string | null
        }
        Insert: {
          chat_enabled?: boolean
          site_id: string
          updated_at?: string
          voice_enabled?: boolean
          whatsapp_enabled?: boolean
          whatsapp_message?: string | null
          whatsapp_phone?: string | null
        }
        Update: {
          chat_enabled?: boolean
          site_id?: string
          updated_at?: string
          voice_enabled?: boolean
          whatsapp_enabled?: boolean
          whatsapp_message?: string | null
          whatsapp_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_channels_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: true
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      site_members: {
        Row: {
          created_at: string
          display_name: string | null
          email: string
          role: string
          site_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email: string
          role?: string
          site_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string
          role?: string
          site_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_members_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      site_products: {
        Row: {
          created_at: string
          currency: string
          id: string
          is_active: boolean
          name: string
          price: number
          site_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          name: string
          price: number
          site_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          site_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_products_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      sites: {
        Row: {
          brand_color: string | null
          client_id: string
          created_at: string
          id: string
          integration_notes: string | null
          is_active: boolean
          logo_url: string | null
          name: string
          primary_domain: string | null
          production_url: string | null
          repository_url: string | null
          slug: string
          updated_at: string
          vercel_project: string | null
        }
        Insert: {
          brand_color?: string | null
          client_id: string
          created_at?: string
          id?: string
          integration_notes?: string | null
          is_active?: boolean
          logo_url?: string | null
          name: string
          primary_domain?: string | null
          production_url?: string | null
          repository_url?: string | null
          slug: string
          updated_at?: string
          vercel_project?: string | null
        }
        Update: {
          brand_color?: string | null
          client_id?: string
          created_at?: string
          id?: string
          integration_notes?: string | null
          is_active?: boolean
          logo_url?: string | null
          name?: string
          primary_domain?: string | null
          production_url?: string | null
          repository_url?: string | null
          slug?: string
          updated_at?: string
          vercel_project?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sites_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      order_city_stats: {
        Row: {
          cancelled: number | null
          city: string | null
          city_key: string | null
          delivered: number | null
          delivered_value: number | null
          in_progress: number | null
          orders: number | null
          site_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_cod_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      order_daily_stats: {
        Row: {
          cancelled: number | null
          day: string | null
          delivered: number | null
          delivered_value: number | null
          in_progress: number | null
          orders: number | null
          site_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_cod_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
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
    Enums: {},
  },
} as const
