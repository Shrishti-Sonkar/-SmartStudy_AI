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
      analytics_summary: {
        Row: {
          avg_hallucination_score: number
          cache_hits: number
          created_at: string
          date: string
          escalations: number
          id: string
          llm1_usage: number
          llm2_usage: number
          llm3_usage: number
          total_cost_saved_percentage: number
          total_queries: number
          updated_at: string
        }
        Insert: {
          avg_hallucination_score?: number
          cache_hits?: number
          created_at?: string
          date: string
          escalations?: number
          id?: string
          llm1_usage?: number
          llm2_usage?: number
          llm3_usage?: number
          total_cost_saved_percentage?: number
          total_queries?: number
          updated_at?: string
        }
        Update: {
          avg_hallucination_score?: number
          cache_hits?: number
          created_at?: string
          date?: string
          escalations?: number
          id?: string
          llm1_usage?: number
          llm2_usage?: number
          llm3_usage?: number
          total_cost_saved_percentage?: number
          total_queries?: number
          updated_at?: string
        }
        Relationships: []
      }
      human_feedback: {
        Row: {
          answer: string
          created_at: string
          decision: string
          id: string
          query_log_id: string | null
          question: string
          risk_level: string
          trust_score: number
        }
        Insert: {
          answer: string
          created_at?: string
          decision: string
          id?: string
          query_log_id?: string | null
          question: string
          risk_level: string
          trust_score?: number
        }
        Update: {
          answer?: string
          created_at?: string
          decision?: string
          id?: string
          query_log_id?: string | null
          question?: string
          risk_level?: string
          trust_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "human_feedback_query_log_id_fkey"
            columns: ["query_log_id"]
            isOneToOne: false
            referencedRelation: "query_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      query_logs: {
        Row: {
          answer: string
          cache_hit: boolean
          confidence_score: number | null
          context_completeness_score: number | null
          cost_saved_percentage: number
          created_at: string
          hallucination_score: number
          id: string
          model_tier: string
          model_used: string
          question: string
          response_time_ms: number | null
          risk_level: string | null
          routing_reason: string | null
          trust_score: number | null
          was_escalated: boolean
        }
        Insert: {
          answer: string
          cache_hit?: boolean
          confidence_score?: number | null
          context_completeness_score?: number | null
          cost_saved_percentage?: number
          created_at?: string
          hallucination_score?: number
          id?: string
          model_tier: string
          model_used: string
          question: string
          response_time_ms?: number | null
          risk_level?: string | null
          routing_reason?: string | null
          trust_score?: number | null
          was_escalated?: boolean
        }
        Update: {
          answer?: string
          cache_hit?: boolean
          confidence_score?: number | null
          context_completeness_score?: number | null
          cost_saved_percentage?: number
          created_at?: string
          hallucination_score?: number
          id?: string
          model_tier?: string
          model_used?: string
          question?: string
          response_time_ms?: number | null
          risk_level?: string | null
          routing_reason?: string | null
          trust_score?: number | null
          was_escalated?: boolean
        }
        Relationships: []
      }
      questions_cache: {
        Row: {
          answer: string
          created_at: string
          hallucination_score: number
          id: string
          model_tier: string
          model_used: string
          override_count: number | null
          question: string
          question_embedding: string | null
          trust_penalty: number | null
        }
        Insert: {
          answer: string
          created_at?: string
          hallucination_score?: number
          id?: string
          model_tier: string
          model_used: string
          override_count?: number | null
          question: string
          question_embedding?: string | null
          trust_penalty?: number | null
        }
        Update: {
          answer?: string
          created_at?: string
          hallucination_score?: number
          id?: string
          model_tier?: string
          model_used?: string
          override_count?: number | null
          question?: string
          question_embedding?: string | null
          trust_penalty?: number | null
        }
        Relationships: []
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
