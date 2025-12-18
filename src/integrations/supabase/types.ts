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
      alert_configs: {
        Row: {
          brand_id: string
          condition: string
          created_at: string
          enabled: boolean | null
          id: string
          metric: string
          notify_email: boolean | null
          threshold: number
        }
        Insert: {
          brand_id: string
          condition: string
          created_at?: string
          enabled?: boolean | null
          id?: string
          metric: string
          notify_email?: boolean | null
          threshold: number
        }
        Update: {
          brand_id?: string
          condition?: string
          created_at?: string
          enabled?: boolean | null
          id?: string
          metric?: string
          notify_email?: boolean | null
          threshold?: number
        }
        Relationships: [
          {
            foreignKeyName: "alert_configs_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      alerts_history: {
        Row: {
          acknowledged: boolean | null
          brand_id: string
          config_id: string | null
          id: string
          message: string
          severity: string | null
          triggered_at: string
        }
        Insert: {
          acknowledged?: boolean | null
          brand_id: string
          config_id?: string | null
          id?: string
          message: string
          severity?: string | null
          triggered_at?: string
        }
        Update: {
          acknowledged?: boolean | null
          brand_id?: string
          config_id?: string | null
          id?: string
          message?: string
          severity?: string | null
          triggered_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_history_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_history_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "alert_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      automation_configs: {
        Row: {
          brand_id: string
          config: Json | null
          created_at: string
          enabled: boolean | null
          id: string
          name: string
          type: string
          updated_at: string
        }
        Insert: {
          brand_id: string
          config?: Json | null
          created_at?: string
          enabled?: boolean | null
          id?: string
          name: string
          type: string
          updated_at?: string
        }
        Update: {
          brand_id?: string
          config?: Json | null
          created_at?: string
          enabled?: boolean | null
          id?: string
          name?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_configs_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_jobs: {
        Row: {
          completed_at: string | null
          config_id: string
          created_at: string
          id: string
          result: Json | null
          started_at: string | null
          status: string | null
        }
        Insert: {
          completed_at?: string | null
          config_id: string
          created_at?: string
          id?: string
          result?: Json | null
          started_at?: string | null
          status?: string | null
        }
        Update: {
          completed_at?: string | null
          config_id?: string
          created_at?: string
          id?: string
          result?: Json | null
          started_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_jobs_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "automation_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_documents: {
        Row: {
          brand_id: string
          content: string | null
          created_at: string
          file_type: string | null
          file_url: string | null
          id: string
          name: string
        }
        Insert: {
          brand_id: string
          content?: string | null
          created_at?: string
          file_type?: string | null
          file_url?: string | null
          id?: string
          name: string
        }
        Update: {
          brand_id?: string
          content?: string | null
          created_at?: string
          file_type?: string | null
          file_url?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_documents_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
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
      chat_conversations: {
        Row: {
          brand_id: string
          created_at: string
          id: string
          title: string | null
          updated_at: string
        }
        Insert: {
          brand_id: string
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_conversations_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      competitor_comparisons: {
        Row: {
          brand_id: string
          compared_at: string
          comparison_data: Json | null
          competitor_domain: string | null
          competitor_name: string
          geo_score: number | null
          id: string
          seo_score: number | null
        }
        Insert: {
          brand_id: string
          compared_at?: string
          comparison_data?: Json | null
          competitor_domain?: string | null
          competitor_name: string
          geo_score?: number | null
          id?: string
          seo_score?: number | null
        }
        Update: {
          brand_id?: string
          compared_at?: string
          comparison_data?: Json | null
          competitor_domain?: string | null
          competitor_name?: string
          geo_score?: number | null
          id?: string
          seo_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "competitor_comparisons_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      document_chunks: {
        Row: {
          content: string
          created_at: string
          document_id: string
          id: string
          metadata: Json | null
        }
        Insert: {
          content: string
          created_at?: string
          document_id: string
          id?: string
          metadata?: Json | null
        }
        Update: {
          content?: string
          created_at?: string
          document_id?: string
          id?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "document_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "brand_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_reports: {
        Row: {
          brand_id: string
          created_at: string
          data: Json | null
          id: string
          pdf_url: string | null
          title: string
          type: string
        }
        Insert: {
          brand_id: string
          created_at?: string
          data?: Json | null
          id?: string
          pdf_url?: string | null
          title: string
          type: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          data?: Json | null
          id?: string
          pdf_url?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_reports_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
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
      gsc_queries: {
        Row: {
          brand_id: string
          clicks: number | null
          created_at: string
          ctr: number | null
          date: string
          id: string
          impressions: number | null
          position: number | null
          query: string
        }
        Insert: {
          brand_id: string
          clicks?: number | null
          created_at?: string
          ctr?: number | null
          date: string
          id?: string
          impressions?: number | null
          position?: number | null
          query: string
        }
        Update: {
          brand_id?: string
          clicks?: number | null
          created_at?: string
          ctr?: number | null
          date?: string
          id?: string
          impressions?: number | null
          position?: number | null
          query?: string
        }
        Relationships: [
          {
            foreignKeyName: "gsc_queries_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      hallucination_detections: {
        Row: {
          brand_id: string
          confidence: number | null
          details: string | null
          detected: boolean | null
          detected_at: string
          execution_id: string | null
          id: string
        }
        Insert: {
          brand_id: string
          confidence?: number | null
          details?: string | null
          detected?: boolean | null
          detected_at?: string
          execution_id?: string | null
          id?: string
        }
        Update: {
          brand_id?: string
          confidence?: number | null
          details?: string | null
          detected?: boolean | null
          detected_at?: string
          execution_id?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hallucination_detections_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hallucination_detections_execution_id_fkey"
            columns: ["execution_id"]
            isOneToOne: false
            referencedRelation: "nucleus_executions"
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
      llm_query_cache: {
        Row: {
          cached_at: string
          expires_at: string | null
          id: string
          provider: string
          query: string
          query_hash: string
          response: string | null
        }
        Insert: {
          cached_at?: string
          expires_at?: string | null
          id?: string
          provider: string
          query: string
          query_hash: string
          response?: string | null
        }
        Update: {
          cached_at?: string
          expires_at?: string | null
          id?: string
          provider?: string
          query?: string
          query_hash?: string
          response?: string | null
        }
        Relationships: []
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
      nucleus_executions: {
        Row: {
          error_message: string | null
          executed_at: string
          id: string
          latency_ms: number | null
          provider: string
          query_id: string
          response: string | null
          success: boolean | null
          tokens_used: number | null
        }
        Insert: {
          error_message?: string | null
          executed_at?: string
          id?: string
          latency_ms?: number | null
          provider: string
          query_id: string
          response?: string | null
          success?: boolean | null
          tokens_used?: number | null
        }
        Update: {
          error_message?: string | null
          executed_at?: string
          id?: string
          latency_ms?: number | null
          provider?: string
          query_id?: string
          response?: string | null
          success?: boolean | null
          tokens_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "nucleus_executions_query_id_fkey"
            columns: ["query_id"]
            isOneToOne: false
            referencedRelation: "nucleus_queries"
            referencedColumns: ["id"]
          },
        ]
      }
      nucleus_queries: {
        Row: {
          brand_id: string
          created_at: string
          id: string
          query: string
          query_type: string | null
        }
        Insert: {
          brand_id: string
          created_at?: string
          id?: string
          query: string
          query_type?: string | null
        }
        Update: {
          brand_id?: string
          created_at?: string
          id?: string
          query?: string
          query_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nucleus_queries_brand_id_fkey"
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
      recommendation_checklist: {
        Row: {
          brand_id: string
          category: string | null
          created_at: string
          description: string | null
          id: string
          priority: string | null
          status: string | null
          title: string
        }
        Insert: {
          brand_id: string
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          title: string
        }
        Update: {
          brand_id?: string
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "recommendation_checklist_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      scientific_reports: {
        Row: {
          abstract: string | null
          brand_id: string
          conclusions: string | null
          created_at: string
          id: string
          methodology: string | null
          pdf_url: string | null
          results: Json | null
          title: string
        }
        Insert: {
          abstract?: string | null
          brand_id: string
          conclusions?: string | null
          created_at?: string
          id?: string
          methodology?: string | null
          pdf_url?: string | null
          results?: Json | null
          title: string
        }
        Update: {
          abstract?: string | null
          brand_id?: string
          conclusions?: string | null
          created_at?: string
          id?: string
          methodology?: string | null
          pdf_url?: string | null
          results?: Json | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "scientific_reports_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_metrics_daily: {
        Row: {
          brand_id: string
          clicks: number | null
          created_at: string
          ctr: number | null
          date: string
          id: string
          impressions: number | null
          position: number | null
        }
        Insert: {
          brand_id: string
          clicks?: number | null
          created_at?: string
          ctr?: number | null
          date: string
          id?: string
          impressions?: number | null
          position?: number | null
        }
        Update: {
          brand_id?: string
          clicks?: number | null
          created_at?: string
          ctr?: number | null
          date?: string
          id?: string
          impressions?: number | null
          position?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "seo_metrics_daily_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
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
      url_analysis_history: {
        Row: {
          analyzed_at: string
          brand_id: string | null
          geo_score: number | null
          id: string
          results: Json | null
          seo_score: number | null
          url: string
        }
        Insert: {
          analyzed_at?: string
          brand_id?: string | null
          geo_score?: number | null
          id?: string
          results?: Json | null
          seo_score?: number | null
          url: string
        }
        Update: {
          analyzed_at?: string
          brand_id?: string | null
          geo_score?: number | null
          id?: string
          results?: Json | null
          seo_score?: number | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "url_analysis_history_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
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
