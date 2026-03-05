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
      quiz_answers: {
        Row: {
          created_at: string
          id: string
          is_correct: boolean
          question_id: string
          response_id: string
          selected_answer: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_correct?: boolean
          question_id: string
          response_id: string
          selected_answer: string
        }
        Update: {
          created_at?: string
          id?: string
          is_correct?: boolean
          question_id?: string
          response_id?: string
          selected_answer?: string
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
            foreignKeyName: "quiz_answers_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: false
            referencedRelation: "quiz_responses"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          category: string
          correct_answer: string
          created_at: string
          id: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          question: string
        }
        Insert: {
          category: string
          correct_answer: string
          created_at?: string
          id?: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          question: string
        }
        Update: {
          category?: string
          correct_answer?: string
          created_at?: string
          id?: string
          option_a?: string
          option_b?: string
          option_c?: string
          option_d?: string
          question?: string
        }
        Relationships: []
      }
      quiz_responses: {
        Row: {
          category: string
          id: string
          participant_name: string
          score: number | null
          submitted_at: string
          tab_switches: number | null
          total_questions: number | null
        }
        Insert: {
          category: string
          id?: string
          participant_name: string
          score?: number | null
          submitted_at?: string
          tab_switches?: number | null
          total_questions?: number | null
        }
        Update: {
          category?: string
          id?: string
          participant_name?: string
          score?: number | null
          submitted_at?: string
          tab_switches?: number | null
          total_questions?: number | null
        }
        Relationships: []
      }
      quiz_settings: {
        Row: {
          category: string
          created_at: string
          duration_minutes: number | null
          id: string
          is_active: boolean | null
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          updated_at?: string
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
