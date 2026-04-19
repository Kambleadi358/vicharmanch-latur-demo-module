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
      account_expenses: {
        Row: {
          account_id: string
          amount: number
          created_at: string
          id: string
          item: string
        }
        Insert: {
          account_id: string
          amount: number
          created_at?: string
          id?: string
          item: string
        }
        Update: {
          account_id?: string
          amount?: number
          created_at?: string
          id?: string
          item?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_expenses_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "yearly_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      competition_entries: {
        Row: {
          category: string
          competition_id: string
          created_at: string
          entry_code: string
          id: string
          image_path: string
          image_url: string
          participant_name: string
        }
        Insert: {
          category: string
          competition_id: string
          created_at?: string
          entry_code: string
          id?: string
          image_path: string
          image_url: string
          participant_name: string
        }
        Update: {
          category?: string
          competition_id?: string
          created_at?: string
          entry_code?: string
          id?: string
          image_path?: string
          image_url?: string
          participant_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "competition_entries_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
        ]
      }
      competitions: {
        Row: {
          created_at: string
          id: string
          is_visible: boolean
          name: string
          program_id: string
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_visible?: boolean
          name: string
          program_id: string
          status?: string
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_visible?: boolean
          name?: string
          program_id?: string
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "competitions_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      home_donations: {
        Row: {
          assigned_amount: number
          created_at: string
          home_id: string
          id: string
          notes: string | null
          paid_amount: number
          payment_date: string | null
          updated_at: string
          year: string
        }
        Insert: {
          assigned_amount?: number
          created_at?: string
          home_id: string
          id?: string
          notes?: string | null
          paid_amount?: number
          payment_date?: string | null
          updated_at?: string
          year: string
        }
        Update: {
          assigned_amount?: number
          created_at?: string
          home_id?: string
          id?: string
          notes?: string | null
          paid_amount?: number
          payment_date?: string | null
          updated_at?: string
          year?: string
        }
        Relationships: [
          {
            foreignKeyName: "home_donations_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
        ]
      }
      homes: {
        Row: {
          address: string | null
          contact_person: string | null
          contact_phone: string | null
          created_at: string
          home_name: string | null
          home_number: number
          id: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string
          home_name?: string | null
          home_number: number
          id?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string
          home_name?: string | null
          home_number?: number
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      judge_scores: {
        Row: {
          category: string
          competition_id: string
          created_at: string
          entry_id: string
          id: string
          is_submitted: boolean
          judge_id: string
          marks: number
          updated_at: string
        }
        Insert: {
          category: string
          competition_id: string
          created_at?: string
          entry_id: string
          id?: string
          is_submitted?: boolean
          judge_id: string
          marks: number
          updated_at?: string
        }
        Update: {
          category?: string
          competition_id?: string
          created_at?: string
          entry_id?: string
          id?: string
          is_submitted?: boolean
          judge_id?: string
          marks?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "judge_scores_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "judge_scores_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "competition_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "judge_scores_judge_id_fkey"
            columns: ["judge_id"]
            isOneToOne: false
            referencedRelation: "judges"
            referencedColumns: ["id"]
          },
        ]
      }
      judge_sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          judge_id: string
          token: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          judge_id: string
          token: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          judge_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "judge_sessions_judge_id_fkey"
            columns: ["judge_id"]
            isOneToOne: false
            referencedRelation: "judges"
            referencedColumns: ["id"]
          },
        ]
      }
      judges: {
        Row: {
          created_at: string
          display_name: string
          id: string
          is_active: boolean
          judge_code: string
          password_hash: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name: string
          id?: string
          is_active?: boolean
          judge_code: string
          password_hash: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          is_active?: boolean
          judge_code?: string
          password_hash?: string
          updated_at?: string
        }
        Relationships: []
      }
      notices: {
        Row: {
          created_at: string
          date: string
          description: string | null
          id: string
          is_new: boolean | null
          is_visible: boolean | null
          notice_type: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          description?: string | null
          id?: string
          is_new?: boolean | null
          is_visible?: boolean | null
          notice_type?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          is_new?: boolean | null
          is_visible?: boolean | null
          notice_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      prize_allocations: {
        Row: {
          created_at: string
          group_name: string
          id: string
          prize_item_id: string
          program_id: string
          rank: string
          winner_name: string
        }
        Insert: {
          created_at?: string
          group_name: string
          id?: string
          prize_item_id: string
          program_id: string
          rank: string
          winner_name: string
        }
        Update: {
          created_at?: string
          group_name?: string
          id?: string
          prize_item_id?: string
          program_id?: string
          rank?: string
          winner_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "prize_allocations_prize_item_id_fkey"
            columns: ["prize_item_id"]
            isOneToOne: false
            referencedRelation: "prize_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prize_allocations_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      prize_items: {
        Row: {
          created_at: string
          id: string
          item_name: string
          quantity: number
        }
        Insert: {
          created_at?: string
          id?: string
          item_name: string
          quantity?: number
        }
        Update: {
          created_at?: string
          id?: string
          item_name?: string
          quantity?: number
        }
        Relationships: []
      }
      program_winners: {
        Row: {
          category: string
          created_at: string
          first_place: string | null
          id: string
          program_id: string
          second_place: string | null
          show_on_ui: boolean
          third_place: string | null
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          first_place?: string | null
          id?: string
          program_id: string
          second_place?: string | null
          show_on_ui?: boolean
          third_place?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          first_place?: string | null
          id?: string
          program_id?: string
          second_place?: string | null
          show_on_ui?: boolean
          third_place?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_winners_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      programs: {
        Row: {
          created_at: string
          date: string
          description: string | null
          id: string
          is_visible: boolean | null
          location: string | null
          name: string
          status: string
          time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          description?: string | null
          id?: string
          is_visible?: boolean | null
          location?: string | null
          name: string
          status?: string
          time: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          is_visible?: boolean | null
          location?: string | null
          name?: string
          status?: string
          time?: string
          updated_at?: string
        }
        Relationships: []
      }
      public_votes: {
        Row: {
          category: string
          competition_id: string
          created_at: string
          device_fingerprint: string
          first_entry_id: string | null
          id: string
          second_entry_id: string | null
          third_entry_id: string | null
          voter_phone: string
        }
        Insert: {
          category: string
          competition_id: string
          created_at?: string
          device_fingerprint: string
          first_entry_id?: string | null
          id?: string
          second_entry_id?: string | null
          third_entry_id?: string | null
          voter_phone: string
        }
        Update: {
          category?: string
          competition_id?: string
          created_at?: string
          device_fingerprint?: string
          first_entry_id?: string | null
          id?: string
          second_entry_id?: string | null
          third_entry_id?: string | null
          voter_phone?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_votes_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_votes_first_entry_id_fkey"
            columns: ["first_entry_id"]
            isOneToOne: false
            referencedRelation: "competition_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_votes_second_entry_id_fkey"
            columns: ["second_entry_id"]
            isOneToOne: false
            referencedRelation: "competition_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_votes_third_entry_id_fkey"
            columns: ["third_entry_id"]
            isOneToOne: false
            referencedRelation: "competition_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_answers: {
        Row: {
          answered_at: string
          id: string
          is_correct: boolean
          question_id: string
          selected_option: string | null
          session_id: string
          time_spent_seconds: number
          updated_at: string
        }
        Insert: {
          answered_at?: string
          id?: string
          is_correct?: boolean
          question_id: string
          selected_option?: string | null
          session_id: string
          time_spent_seconds?: number
          updated_at?: string
        }
        Update: {
          answered_at?: string
          id?: string
          is_correct?: boolean
          question_id?: string
          selected_option?: string | null
          session_id?: string
          time_spent_seconds?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_answers_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "quiz_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_cheating_logs: {
        Row: {
          created_at: string
          details: Json | null
          event_type: string
          id: string
          session_id: string
        }
        Insert: {
          created_at?: string
          details?: Json | null
          event_type: string
          id?: string
          session_id: string
        }
        Update: {
          created_at?: string
          details?: Json | null
          event_type?: string
          id?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_cheating_logs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "quiz_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_config: {
        Row: {
          created_at: string
          description: string | null
          duration_seconds: number
          id: string
          publish_answer_key: boolean
          scheduled_start: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_seconds?: number
          id?: string
          publish_answer_key?: boolean
          scheduled_start?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_seconds?: number
          id?: string
          publish_answer_key?: boolean
          scheduled_start?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      quiz_questions: {
        Row: {
          correct_answer: string
          created_at: string
          display_order: number
          id: string
          marks: number
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          question: string
          updated_at: string
        }
        Insert: {
          correct_answer: string
          created_at?: string
          display_order?: number
          id?: string
          marks?: number
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          question: string
          updated_at?: string
        }
        Update: {
          correct_answer?: string
          created_at?: string
          display_order?: number
          id?: string
          marks?: number
          option_a?: string
          option_b?: string
          option_c?: string
          option_d?: string
          question?: string
          updated_at?: string
        }
        Relationships: []
      }
      quiz_sessions: {
        Row: {
          created_at: string
          current_index: number
          dob: string
          duration_seconds: number
          end_time: string | null
          id: string
          ip_address: string | null
          option_orders: Json
          participant_name: string
          paste_attempts: number
          question_order: Json
          risk_level: string
          risk_reasons: Json
          score: number
          start_time: string
          status: string
          tab_switches: number
          time_taken_seconds: number | null
          total_marks: number
          total_questions: number
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          current_index?: number
          dob: string
          duration_seconds?: number
          end_time?: string | null
          id?: string
          ip_address?: string | null
          option_orders?: Json
          participant_name: string
          paste_attempts?: number
          question_order?: Json
          risk_level?: string
          risk_reasons?: Json
          score?: number
          start_time?: string
          status?: string
          tab_switches?: number
          time_taken_seconds?: number | null
          total_marks?: number
          total_questions?: number
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          current_index?: number
          dob?: string
          duration_seconds?: number
          end_time?: string | null
          id?: string
          ip_address?: string | null
          option_orders?: Json
          participant_name?: string
          paste_attempts?: number
          question_order?: Json
          risk_level?: string
          risk_reasons?: Json
          score?: number
          start_time?: string
          status?: string
          tab_switches?: number
          time_taken_seconds?: number | null
          total_marks?: number
          total_questions?: number
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          created_at: string
          id: string
          setting_key: string
          setting_value: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          setting_key: string
          setting_value: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          setting_key?: string
          setting_value?: string
          updated_at?: string
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
      yearly_accounts: {
        Row: {
          created_at: string
          id: string
          is_visible: boolean | null
          total_expense: number | null
          total_income: number | null
          updated_at: string
          year: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_visible?: boolean | null
          total_expense?: number | null
          total_income?: number | null
          updated_at?: string
          year: string
        }
        Update: {
          created_at?: string
          id?: string
          is_visible?: boolean | null
          total_expense?: number | null
          total_income?: number | null
          updated_at?: string
          year?: string
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
      next_entry_code: {
        Args: { _category: string; _competition_id: string }
        Returns: string
      }
      next_judge_code: { Args: never; Returns: string }
      recalculate_quiz_scores: { Args: never; Returns: undefined }
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
