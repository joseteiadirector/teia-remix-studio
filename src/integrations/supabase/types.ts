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
      brands: {
        Row: {
          competitors: string[] | null
          created_at: string
          description: string | null
          domain: string | null
          id: string
          keywords: string[] | null
          logo_url: string | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          competitors?: string[] | null
          created_at?: string
          description?: string | null
          domain?: string | null
          id?: string
          keywords?: string[] | null
          logo_url?: string | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          competitors?: string[] | null
          created_at?: string
          description?: string | null
          domain?: string | null
          id?: string
          keywords?: string[] | null
          logo_url?: string | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      geo_pillars_monthly: {
        Row: {
          authority: number | null
          brand_id: string
          consistency: number | null
          created_at: string
          id: string
          month: string
          sentiment: number | null
          visibility: number | null
        }
        Insert: {
          authority?: number | null
          brand_id: string
          consistency?: number | null
          created_at?: string
          id?: string
          month: string
          sentiment?: number | null
          visibility?: number | null
        }
        Update: {
          authority?: number | null
          brand_id?: string
          consistency?: number | null
          created_at?: string
          id?: string
          month?: string
          sentiment?: number | null
          visibility?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "geo_pillars_monthly_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      geo_scores: {
        Row: {
          brand_id: string
          breakdown: Json | null
          calculated_at: string
          cpi: number | null
          created_at: string
          id: string
          score: number
        }
        Insert: {
          brand_id: string
          breakdown?: Json | null
          calculated_at?: string
          cpi?: number | null
          created_at?: string
          id?: string
          score?: number
        }
        Update: {
          brand_id?: string
          breakdown?: Json | null
          calculated_at?: string
          cpi?: number | null
          created_at?: string
          id?: string
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "geo_scores_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      igo_metrics_history: {
        Row: {
          brand_id: string
          cpi: number | null
          created_at: string
          gap: number | null
          ice: number | null
          id: string
          recorded_at: string
          stability: number | null
        }
        Insert: {
          brand_id: string
          cpi?: number | null
          created_at?: string
          gap?: number | null
          ice?: number | null
          id?: string
          recorded_at?: string
          stability?: number | null
        }
        Update: {
          brand_id?: string
          cpi?: number | null
          created_at?: string
          gap?: number | null
          ice?: number | null
          id?: string
          recorded_at?: string
          stability?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "igo_metrics_history_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      mentions_llm: {
        Row: {
          answer_excerpt: string | null
          brand_id: string
          collected_at: string
          competitors_mentioned: string[] | null
          confidence: number | null
          created_at: string
          full_response: string | null
          id: string
          mentioned: boolean
          position: number | null
          provider: string
          query: string
        }
        Insert: {
          answer_excerpt?: string | null
          brand_id: string
          collected_at?: string
          competitors_mentioned?: string[] | null
          confidence?: number | null
          created_at?: string
          full_response?: string | null
          id?: string
          mentioned?: boolean
          position?: number | null
          provider: string
          query: string
        }
        Update: {
          answer_excerpt?: string | null
          brand_id?: string
          collected_at?: string
          competitors_mentioned?: string[] | null
          confidence?: number | null
          created_at?: string
          full_response?: string | null
          id?: string
          mentioned?: boolean
          position?: number | null
          provider?: string
          query?: string
        }
        Relationships: [
          {
            foreignKeyName: "mentions_llm_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      url_analyses: {
        Row: {
          checklist: Json | null
          created_at: string
          geo_score: number
          id: string
          metadata: Json | null
          seo_score: number
          updated_at: string
          url: string
        }
        Insert: {
          checklist?: Json | null
          created_at?: string
          geo_score?: number
          id?: string
          metadata?: Json | null
          seo_score?: number
          updated_at?: string
          url: string
        }
        Update: {
          checklist?: Json | null
          created_at?: string
          geo_score?: number
          id?: string
          metadata?: Json | null
          seo_score?: number
          updated_at?: string
          url?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
    },
  },
} as const
