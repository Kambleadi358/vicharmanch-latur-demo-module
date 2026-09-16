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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      account_expenses: {
        Row: {
          account_id: string
          amount: number
          archived_year: string | null
          created_at: string
          id: string
          is_archived: boolean
          item: string
        }
        Insert: {
          account_id: string
          amount: number
          archived_year?: string | null
          created_at?: string
          id?: string
          is_archived?: boolean
          item: string
        }
        Update: {
          account_id?: string
          amount?: number
          archived_year?: string | null
          created_at?: string
          id?: string
          is_archived?: boolean
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
      admin_activity_logs: {
        Row: {
          action: string
          actor_email: string | null
          actor_user_id: string | null
          archived_year: string | null
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
          ip: string | null
          is_archived: boolean
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_user_id?: string | null
          archived_year?: string | null
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip?: string | null
          is_archived?: boolean
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_user_id?: string | null
          archived_year?: string | null
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip?: string | null
          is_archived?: boolean
          user_agent?: string | null
        }
        Relationships: []
      }
      admin_security_questions: {
        Row: {
          a1_hash: string
          a2_hash: string
          a3_hash: string
          created_at: string
          q1: string
          q2: string
          q3: string
          updated_at: string
          user_id: string
        }
        Insert: {
          a1_hash: string
          a2_hash: string
          a3_hash: string
          created_at?: string
          q1: string
          q2: string
          q3: string
          updated_at?: string
          user_id: string
        }
        Update: {
          a1_hash?: string
          a2_hash?: string
          a3_hash?: string
          created_at?: string
          q1?: string
          q2?: string
          q3?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      annual_reports: {
        Row: {
          created_at: string
          id: string
          pdf_path: string | null
          pdf_url: string | null
          remark: string | null
          title: string
          total_expense: number
          total_jama: number
          updated_at: string
          year: string
        }
        Insert: {
          created_at?: string
          id?: string
          pdf_path?: string | null
          pdf_url?: string | null
          remark?: string | null
          title: string
          total_expense?: number
          total_jama?: number
          updated_at?: string
          year: string
        }
        Update: {
          created_at?: string
          id?: string
          pdf_path?: string | null
          pdf_url?: string | null
          remark?: string | null
          title?: string
          total_expense?: number
          total_jama?: number
          updated_at?: string
          year?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          section: string
          updated_at: string
          value: Json | null
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          section: string
          updated_at?: string
          value?: Json | null
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          section?: string
          updated_at?: string
          value?: Json | null
        }
        Relationships: []
      }
      archives: {
        Row: {
          archive_date: string
          created_at: string
          created_by: string | null
          created_by_email: string | null
          id: string
          pdf_path: string | null
          remark: string
          summary: Json
          year: string
          zip_path: string | null
        }
        Insert: {
          archive_date?: string
          created_at?: string
          created_by?: string | null
          created_by_email?: string | null
          id?: string
          pdf_path?: string | null
          remark: string
          summary?: Json
          year: string
          zip_path?: string | null
        }
        Update: {
          archive_date?: string
          created_at?: string
          created_by?: string | null
          created_by_email?: string | null
          id?: string
          pdf_path?: string | null
          remark?: string
          summary?: Json
          year?: string
          zip_path?: string | null
        }
        Relationships: []
      }
      competition_entries: {
        Row: {
          archived_year: string | null
          category: string
          competition_id: string
          created_at: string
          entry_code: string
          id: string
          image_path: string
          image_url: string
          is_archived: boolean
          participant_name: string
        }
        Insert: {
          archived_year?: string | null
          category: string
          competition_id: string
          created_at?: string
          entry_code: string
          id?: string
          image_path: string
          image_url: string
          is_archived?: boolean
          participant_name: string
        }
        Update: {
          archived_year?: string | null
          category?: string
          competition_id?: string
          created_at?: string
          entry_code?: string
          id?: string
          image_path?: string
          image_url?: string
          is_archived?: boolean
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
      constitution_article_categories: {
        Row: {
          article_id: string
          category_id: string
        }
        Insert: {
          article_id: string
          category_id: string
        }
        Update: {
          article_id?: string
          category_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "constitution_article_categories_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "constitution_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "constitution_article_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "constitution_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      constitution_articles: {
        Row: {
          article_number: string
          created_at: string
          difficulty: string
          display_order: number
          id: string
          is_active: boolean
          keywords: string[]
          official_text_en: string | null
          official_text_mr: string | null
          part_id: string | null
          real_life_example_en: string | null
          real_life_example_mr: string | null
          simple_explanation_en: string | null
          simple_explanation_mr: string | null
          sort_key: number
          title_en: string | null
          title_mr: string
          updated_at: string
        }
        Insert: {
          article_number: string
          created_at?: string
          difficulty?: string
          display_order?: number
          id?: string
          is_active?: boolean
          keywords?: string[]
          official_text_en?: string | null
          official_text_mr?: string | null
          part_id?: string | null
          real_life_example_en?: string | null
          real_life_example_mr?: string | null
          simple_explanation_en?: string | null
          simple_explanation_mr?: string | null
          sort_key?: number
          title_en?: string | null
          title_mr: string
          updated_at?: string
        }
        Update: {
          article_number?: string
          created_at?: string
          difficulty?: string
          display_order?: number
          id?: string
          is_active?: boolean
          keywords?: string[]
          official_text_en?: string | null
          official_text_mr?: string | null
          part_id?: string | null
          real_life_example_en?: string | null
          real_life_example_mr?: string | null
          simple_explanation_en?: string | null
          simple_explanation_mr?: string | null
          sort_key?: number
          title_en?: string | null
          title_mr?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "constitution_articles_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "constitution_parts"
            referencedColumns: ["id"]
          },
        ]
      }
      constitution_categories: {
        Row: {
          created_at: string
          display_order: number
          icon: string | null
          id: string
          is_active: boolean
          kind: string
          name_en: string | null
          name_mr: string
          slug: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          icon?: string | null
          id?: string
          is_active?: boolean
          kind?: string
          name_en?: string | null
          name_mr: string
          slug: string
        }
        Update: {
          created_at?: string
          display_order?: number
          icon?: string | null
          id?: string
          is_active?: boolean
          kind?: string
          name_en?: string | null
          name_mr?: string
          slug?: string
        }
        Relationships: []
      }
      constitution_events: {
        Row: {
          article_id: string | null
          category_slug: string | null
          created_at: string
          event_type: string
          id: string
          matched_count: number
          query_text: string | null
        }
        Insert: {
          article_id?: string | null
          category_slug?: string | null
          created_at?: string
          event_type: string
          id?: string
          matched_count?: number
          query_text?: string | null
        }
        Update: {
          article_id?: string | null
          category_slug?: string | null
          created_at?: string
          event_type?: string
          id?: string
          matched_count?: number
          query_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "constitution_events_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "constitution_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      constitution_learning_content: {
        Row: {
          body_en: string | null
          body_mr: string
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          slug: string
          title_en: string | null
          title_mr: string
          updated_at: string
        }
        Insert: {
          body_en?: string | null
          body_mr: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          slug: string
          title_en?: string | null
          title_mr: string
          updated_at?: string
        }
        Update: {
          body_en?: string | null
          body_mr?: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          slug?: string
          title_en?: string | null
          title_mr?: string
          updated_at?: string
        }
        Relationships: []
      }
      constitution_parts: {
        Row: {
          created_at: string
          description_en: string | null
          description_mr: string | null
          display_order: number
          id: string
          is_active: boolean
          name_en: string | null
          name_mr: string
          part_code: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description_en?: string | null
          description_mr?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          name_en?: string | null
          name_mr: string
          part_code: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description_en?: string | null
          description_mr?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          name_en?: string | null
          name_mr?: string
          part_code?: string
          updated_at?: string
        }
        Relationships: []
      }
      constitution_related_articles: {
        Row: {
          article_id: string
          related_article_id: string
        }
        Insert: {
          article_id: string
          related_article_id: string
        }
        Update: {
          article_id?: string
          related_article_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "constitution_related_articles_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "constitution_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "constitution_related_articles_related_article_id_fkey"
            columns: ["related_article_id"]
            isOneToOne: false
            referencedRelation: "constitution_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      donation_payments: {
        Row: {
          amount: number
          archived_year: string | null
          created_at: string
          household_id: string
          id: string
          is_archived: boolean
          payment_date: string
          payment_mode: Database["public"]["Enums"]["payment_mode"]
          remark: string | null
          updated_at: string
          year: string
        }
        Insert: {
          amount: number
          archived_year?: string | null
          created_at?: string
          household_id: string
          id?: string
          is_archived?: boolean
          payment_date?: string
          payment_mode?: Database["public"]["Enums"]["payment_mode"]
          remark?: string | null
          updated_at?: string
          year: string
        }
        Update: {
          amount?: number
          archived_year?: string | null
          created_at?: string
          household_id?: string
          id?: string
          is_archived?: boolean
          payment_date?: string
          payment_mode?: Database["public"]["Enums"]["payment_mode"]
          remark?: string | null
          updated_at?: string
          year?: string
        }
        Relationships: [
          {
            foreignKeyName: "donation_payments_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "household_donation_summary"
            referencedColumns: ["household_id"]
          },
          {
            foreignKeyName: "donation_payments_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      failed_participation_searches: {
        Row: {
          competition_id: string | null
          competition_name: string | null
          created_at: string
          entered_name: string
          id: string
          user_agent: string | null
        }
        Insert: {
          competition_id?: string | null
          competition_name?: string | null
          created_at?: string
          entered_name: string
          id?: string
          user_agent?: string | null
        }
        Update: {
          competition_id?: string | null
          competition_name?: string | null
          created_at?: string
          entered_name?: string
          id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "failed_participation_searches_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
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
      household_members: {
        Row: {
          archived_year: string | null
          created_at: string
          education_level: Database["public"]["Enums"]["education_level"]
          gender: Database["public"]["Enums"]["gender_type"]
          household_id: string
          id: string
          is_archived: boolean
          is_head: boolean
          name: string
          updated_at: string
        }
        Insert: {
          archived_year?: string | null
          created_at?: string
          education_level?: Database["public"]["Enums"]["education_level"]
          gender: Database["public"]["Enums"]["gender_type"]
          household_id: string
          id?: string
          is_archived?: boolean
          is_head?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          archived_year?: string | null
          created_at?: string
          education_level?: Database["public"]["Enums"]["education_level"]
          gender?: Database["public"]["Enums"]["gender_type"]
          household_id?: string
          id?: string
          is_archived?: boolean
          is_head?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "household_members_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "household_donation_summary"
            referencedColumns: ["household_id"]
          },
          {
            foreignKeyName: "household_members_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      household_year_assignments: {
        Row: {
          assigned_amount: number
          created_at: string
          household_id: string
          id: string
          updated_at: string
          year: string
        }
        Insert: {
          assigned_amount?: number
          created_at?: string
          household_id: string
          id?: string
          updated_at?: string
          year: string
        }
        Update: {
          assigned_amount?: number
          created_at?: string
          household_id?: string
          id?: string
          updated_at?: string
          year?: string
        }
        Relationships: [
          {
            foreignKeyName: "household_year_assignments_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "household_donation_summary"
            referencedColumns: ["household_id"]
          },
          {
            foreignKeyName: "household_year_assignments_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      households: {
        Row: {
          active_year: string
          address: string | null
          archived_year: string | null
          created_at: string
          head_gender: Database["public"]["Enums"]["gender_type"]
          head_name: string
          house_code: number
          id: string
          is_archived: boolean
          mobile: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          active_year?: string
          address?: string | null
          archived_year?: string | null
          created_at?: string
          head_gender: Database["public"]["Enums"]["gender_type"]
          head_name: string
          house_code?: number
          id?: string
          is_archived?: boolean
          mobile: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          active_year?: string
          address?: string | null
          archived_year?: string | null
          created_at?: string
          head_gender?: Database["public"]["Enums"]["gender_type"]
          head_name?: string
          house_code?: number
          id?: string
          is_archived?: boolean
          mobile?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      judge_passwords: {
        Row: {
          created_at: string
          judge_id: string
          plain_password: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          judge_id: string
          plain_password: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          judge_id?: string
          plain_password?: string
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
          competition_id: string | null
          created_at: string
          display_name: string
          id: string
          is_active: boolean
          judge_code: string
          password_hash: string
          updated_at: string
        }
        Insert: {
          competition_id?: string | null
          created_at?: string
          display_name: string
          id?: string
          is_active?: boolean
          judge_code: string
          password_hash: string
          updated_at?: string
        }
        Update: {
          competition_id?: string | null
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
      ledger_expenses: {
        Row: {
          amount: number
          archived_year: string | null
          created_at: string
          id: string
          is_archived: boolean
          title: string
          updated_at: string
          year: string
        }
        Insert: {
          amount?: number
          archived_year?: string | null
          created_at?: string
          id?: string
          is_archived?: boolean
          title: string
          updated_at?: string
          year: string
        }
        Update: {
          amount?: number
          archived_year?: string | null
          created_at?: string
          id?: string
          is_archived?: boolean
          title?: string
          updated_at?: string
          year?: string
        }
        Relationships: []
      }
      notices: {
        Row: {
          archived_year: string | null
          created_at: string
          date: string
          description: string | null
          id: string
          is_archived: boolean
          is_new: boolean | null
          is_visible: boolean | null
          notice_type: string
          title: string
          updated_at: string
        }
        Insert: {
          archived_year?: string | null
          created_at?: string
          date: string
          description?: string | null
          id?: string
          is_archived?: boolean
          is_new?: boolean | null
          is_visible?: boolean | null
          notice_type?: string
          title: string
          updated_at?: string
        }
        Update: {
          archived_year?: string | null
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          is_archived?: boolean
          is_new?: boolean | null
          is_visible?: boolean | null
          notice_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          category: string
          created_at: string
          created_by: string | null
          id: string
          is_archived: boolean
          link: string | null
          title: string
        }
        Insert: {
          body: string
          category?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_archived?: boolean
          link?: string | null
          title: string
        }
        Update: {
          body?: string
          category?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_archived?: boolean
          link?: string | null
          title?: string
        }
        Relationships: []
      }
      participants: {
        Row: {
          archived_year: string | null
          category: string
          competition_id: string
          created_at: string
          household_member_id: string | null
          id: string
          is_archived: boolean
          name: string
          updated_at: string
        }
        Insert: {
          archived_year?: string | null
          category: string
          competition_id: string
          created_at?: string
          household_member_id?: string | null
          id?: string
          is_archived?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          archived_year?: string | null
          category?: string
          competition_id?: string
          created_at?: string
          household_member_id?: string | null
          id?: string
          is_archived?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "participants_household_member_id_fkey"
            columns: ["household_member_id"]
            isOneToOne: false
            referencedRelation: "household_members"
            referencedColumns: ["id"]
          },
        ]
      }
      participation_songs: {
        Row: {
          archived_year: string | null
          created_at: string
          file_path: string
          id: string
          is_archived: boolean
          mime: string | null
          original_filename: string
          participant_id: string
          size_bytes: number | null
        }
        Insert: {
          archived_year?: string | null
          created_at?: string
          file_path: string
          id?: string
          is_archived?: boolean
          mime?: string | null
          original_filename: string
          participant_id: string
          size_bytes?: number | null
        }
        Update: {
          archived_year?: string | null
          created_at?: string
          file_path?: string
          id?: string
          is_archived?: boolean
          mime?: string | null
          original_filename?: string
          participant_id?: string
          size_bytes?: number | null
        }
        Relationships: []
      }
      prize_allocations: {
        Row: {
          archived_year: string | null
          created_at: string
          group_name: string
          id: string
          is_archived: boolean
          prize_item_id: string
          program_id: string
          rank: string
          winner_name: string
        }
        Insert: {
          archived_year?: string | null
          created_at?: string
          group_name: string
          id?: string
          is_archived?: boolean
          prize_item_id: string
          program_id: string
          rank: string
          winner_name: string
        }
        Update: {
          archived_year?: string | null
          created_at?: string
          group_name?: string
          id?: string
          is_archived?: boolean
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
          archived_year: string | null
          created_at: string
          date: string
          description: string | null
          id: string
          is_archived: boolean
          is_visible: boolean | null
          location: string | null
          name: string
          status: string
          time: string
          updated_at: string
        }
        Insert: {
          archived_year?: string | null
          created_at?: string
          date: string
          description?: string | null
          id?: string
          is_archived?: boolean
          is_visible?: boolean | null
          location?: string | null
          name: string
          status?: string
          time: string
          updated_at?: string
        }
        Update: {
          archived_year?: string | null
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          is_archived?: boolean
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
          entry_id: string | null
          first_entry_id: string | null
          id: string
          second_entry_id: string | null
          third_entry_id: string | null
          voter_name: string | null
          voter_phone: string
        }
        Insert: {
          category: string
          competition_id: string
          created_at?: string
          device_fingerprint: string
          entry_id?: string | null
          first_entry_id?: string | null
          id?: string
          second_entry_id?: string | null
          third_entry_id?: string | null
          voter_name?: string | null
          voter_phone: string
        }
        Update: {
          category?: string
          competition_id?: string
          created_at?: string
          device_fingerprint?: string
          entry_id?: string | null
          first_entry_id?: string | null
          id?: string
          second_entry_id?: string | null
          third_entry_id?: string | null
          voter_name?: string | null
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
            foreignKeyName: "public_votes_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "competition_entries"
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
      push_subscriptions: {
        Row: {
          created_at: string
          device_fingerprint: string | null
          id: string
          last_seen_at: string
          platform: string | null
          token: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          device_fingerprint?: string | null
          id?: string
          last_seen_at?: string
          platform?: string | null
          token: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          device_fingerprint?: string | null
          id?: string
          last_seen_at?: string
          platform?: string | null
          token?: string
          user_agent?: string | null
        }
        Relationships: []
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
          category_slug: string | null
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
          category_slug?: string | null
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
          category_slug?: string | null
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
          archived_year: string | null
          created_at: string
          current_index: number
          dob: string
          duration_seconds: number
          end_time: string | null
          id: string
          ip_address: string | null
          is_archived: boolean
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
          archived_year?: string | null
          created_at?: string
          current_index?: number
          dob: string
          duration_seconds?: number
          end_time?: string | null
          id?: string
          ip_address?: string | null
          is_archived?: boolean
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
          archived_year?: string | null
          created_at?: string
          current_index?: number
          dob?: string
          duration_seconds?: number
          end_time?: string | null
          id?: string
          ip_address?: string | null
          is_archived?: boolean
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
      suggestions: {
        Row: {
          admin_response: string | null
          archived_year: string | null
          category: Database["public"]["Enums"]["suggestion_category"]
          created_at: string
          id: string
          is_anonymous: boolean
          is_archived: boolean
          message: string
          mobile: string | null
          name: string
          resolved_at: string | null
          status: Database["public"]["Enums"]["suggestion_status"]
          updated_at: string
        }
        Insert: {
          admin_response?: string | null
          archived_year?: string | null
          category?: Database["public"]["Enums"]["suggestion_category"]
          created_at?: string
          id?: string
          is_anonymous?: boolean
          is_archived?: boolean
          message: string
          mobile?: string | null
          name: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["suggestion_status"]
          updated_at?: string
        }
        Update: {
          admin_response?: string | null
          archived_year?: string | null
          category?: Database["public"]["Enums"]["suggestion_category"]
          created_at?: string
          id?: string
          is_anonymous?: boolean
          is_archived?: boolean
          message?: string
          mobile?: string | null
          name?: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["suggestion_status"]
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
      household_donation_summary: {
        Row: {
          assigned_amount: number | null
          head_name: string | null
          house_code: number | null
          household_id: string | null
          mobile: string | null
          paid_amount: number | null
          remaining_amount: number | null
          status: string | null
          year: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      clear_all_participation: { Args: never; Returns: Json }
      get_vote_tally: {
        Args: { _competition_id: string }
        Returns: {
          category: string
          entry_code: string
          entry_id: string
          votes: number
        }[]
      }
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
      promote_education_levels: { Args: never; Returns: number }
      recalculate_quiz_scores: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "user"
      education_level:
        | "school_not_eligible"
        | "balwadi"
        | "class_1"
        | "class_2"
        | "class_3"
        | "class_4"
        | "class_5"
        | "class_6"
        | "class_7"
        | "class_8"
        | "class_9"
        | "class_10"
        | "class_11"
        | "class_12"
        | "diploma"
        | "degree"
        | "other"
      gender_type: "male" | "female" | "other"
      payment_mode: "cash" | "online"
      suggestion_category: "suggestion" | "complaint" | "feedback" | "other"
      suggestion_status: "new" | "accepted" | "rejected" | "resolved"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      education_level: [
        "school_not_eligible",
        "balwadi",
        "class_1",
        "class_2",
        "class_3",
        "class_4",
        "class_5",
        "class_6",
        "class_7",
        "class_8",
        "class_9",
        "class_10",
        "class_11",
        "class_12",
        "diploma",
        "degree",
        "other",
      ],
      gender_type: ["male", "female", "other"],
      payment_mode: ["cash", "online"],
      suggestion_category: ["suggestion", "complaint", "feedback", "other"],
      suggestion_status: ["new", "accepted", "rejected", "resolved"],
    },
  },
} as const
