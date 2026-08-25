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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: string | null
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: string | null
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: string | null
        }
        Relationships: []
      }
      attempts: {
        Row: {
          chapter_id: string | null
          correct: number
          created_at: string
          id: string
          label: string
          mode: string
          per_question: Json
          seconds: number
          subject_id: string
          test_id: string | null
          total: number
          unanswered: number
          user_id: string
        }
        Insert: {
          chapter_id?: string | null
          correct: number
          created_at?: string
          id?: string
          label: string
          mode: string
          per_question?: Json
          seconds?: number
          subject_id: string
          test_id?: string | null
          total: number
          unanswered?: number
          user_id: string
        }
        Update: {
          chapter_id?: string | null
          correct?: number
          created_at?: string
          id?: string
          label?: string
          mode?: string
          per_question?: Json
          seconds?: number
          subject_id?: string
          test_id?: string | null
          total?: number
          unanswered?: number
          user_id?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          actor_name: string | null
          created_at: string
          details: Json
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          details?: Json
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          details?: Json
          id?: string
        }
        Relationships: []
      }
      bookmarks: {
        Row: {
          created_at: string
          question_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          question_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          question_id?: string
          user_id?: string
        }
        Relationships: []
      }
      chapter_progress: {
        Row: {
          chapter_id: string
          completed_at: string
          user_id: string
        }
        Insert: {
          chapter_id: string
          completed_at?: string
          user_id: string
        }
        Update: {
          chapter_id?: string
          completed_at?: string
          user_id?: string
        }
        Relationships: []
      }
      error_logs: {
        Row: {
          created_at: string
          id: string
          kind: string
          message: string
          route: string | null
          stack: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          kind?: string
          message: string
          route?: string | null
          stack?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          message?: string
          route?: string | null
          stack?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      import_batches: {
        Row: {
          created_at: string
          created_by: string | null
          duplicates: number
          filename: string
          id: string
          imported: number
          invalid: number
          total_rows: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          duplicates?: number
          filename: string
          id?: string
          imported?: number
          invalid?: number
          total_rows?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          duplicates?: number
          filename?: string
          id?: string
          imported?: number
          invalid?: number
          total_rows?: number
        }
        Relationships: []
      }
      mock_tests: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          difficulty: string
          duration_minutes: number
          id: string
          published: boolean
          question_count: number
          subject_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty?: string
          duration_minutes?: number
          id?: string
          published?: boolean
          question_count?: number
          subject_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty?: string
          duration_minutes?: number
          id?: string
          published?: boolean
          question_count?: number
          subject_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      ncert_solutions: {
        Row: {
          answer: Json
          chapter_id: string
          content_hash: string
          created_at: string
          created_by: string | null
          id: string
          question: string
          status: string
          subject_id: string
          updated_at: string
        }
        Insert: {
          answer?: Json
          chapter_id: string
          content_hash: string
          created_at?: string
          created_by?: string | null
          id?: string
          question: string
          status?: string
          subject_id: string
          updated_at?: string
        }
        Update: {
          answer?: Json
          chapter_id?: string
          content_hash?: string
          created_at?: string
          created_by?: string | null
          id?: string
          question?: string
          status?: string
          subject_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      plans: {
        Row: {
          active: boolean
          created_at: string
          duration_days: number
          features: Json
          id: string
          name: string
          price_paise: number
          sort: number
          tagline: string | null
          tier: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          duration_days: number
          features?: Json
          id: string
          name: string
          price_paise: number
          sort?: number
          tagline?: string | null
          tier?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          duration_days?: number
          features?: Json
          id?: string
          name?: string
          price_paise?: number
          sort?: number
          tagline?: string | null
          tier?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          daily_goal: number
          id: string
          last_study_date: string | null
          name: string
          recovery_answer_hash: string | null
          recovery_question: string | null
          streak: number
          today_count: number
          today_date: string | null
          updated_at: string
          username: string | null
          xp: number
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          daily_goal?: number
          id: string
          last_study_date?: string | null
          name?: string
          recovery_answer_hash?: string | null
          recovery_question?: string | null
          streak?: number
          today_count?: number
          today_date?: string | null
          updated_at?: string
          username?: string | null
          xp?: number
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          daily_goal?: number
          id?: string
          last_study_date?: string | null
          name?: string
          recovery_answer_hash?: string | null
          recovery_question?: string | null
          streak?: number
          today_count?: number
          today_date?: string | null
          updated_at?: string
          username?: string | null
          xp?: number
        }
        Relationships: []
      }
      questions: {
        Row: {
          chapter_id: string
          content_hash: string
          correct_index: number
          created_at: string
          created_by: string | null
          difficulty: string
          explanation: string | null
          id: string
          options: Json
          question: string
          source: string | null
          status: string
          subject_id: string
          updated_at: string
        }
        Insert: {
          chapter_id: string
          content_hash: string
          correct_index?: number
          created_at?: string
          created_by?: string | null
          difficulty?: string
          explanation?: string | null
          id?: string
          options?: Json
          question: string
          source?: string | null
          status?: string
          subject_id: string
          updated_at?: string
        }
        Update: {
          chapter_id?: string
          content_hash?: string
          correct_index?: number
          created_at?: string
          created_by?: string | null
          difficulty?: string
          explanation?: string | null
          id?: string
          options?: Json
          question?: string
          source?: string | null
          status?: string
          subject_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      secure_settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value: string
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: string
        }
        Relationships: []
      }
      study_models: {
        Row: {
          chapter: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_premium: boolean
          kind: string
          poster_url: string | null
          published: boolean
          sort: number
          src_url: string
          subject: string
          tags: Json
          title: string
          updated_at: string
        }
        Insert: {
          chapter?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_premium?: boolean
          kind?: string
          poster_url?: string | null
          published?: boolean
          sort?: number
          src_url: string
          subject?: string
          tags?: Json
          title: string
          updated_at?: string
        }
        Update: {
          chapter?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_premium?: boolean
          kind?: string
          poster_url?: string | null
          published?: boolean
          sort?: number
          src_url?: string
          subject?: string
          tags?: Json
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          amount_paise: number
          created_at: string
          expires_at: string | null
          id: string
          plan_id: string
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          starts_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_paise?: number
          created_at?: string
          expires_at?: string | null
          id?: string
          plan_id: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          starts_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_paise?: number
          created_at?: string
          expires_at?: string | null
          id?: string
          plan_id?: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          starts_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          earned_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          earned_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          earned_at?: string
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
          role: Database["public"]["Enums"]["app_role"]
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
      bootstrap_profile: {
        Args: {
          _name?: string
          _recovery_answer_hash?: string
          _recovery_question?: string
          _username?: string
        }
        Returns: undefined
      }
      claim_owner: { Args: never; Returns: boolean }
      get_leaderboard: {
        Args: { _limit?: number }
        Returns: {
          accuracy: number
          avatar_url: string
          name: string
          streak: number
          tests: number
          user_id: string
          xp: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      my_entitlement: {
        Args: never
        Returns: {
          expires_at: string
          plan_id: string
          tier: string
        }[]
      }
      owner_exists: { Args: never; Returns: boolean }
      payments_ready: { Args: never; Returns: boolean }
      reset_password_with_answer: {
        Args: { _answer_hash: string; _new_password: string; _username: string }
        Returns: boolean
      }
      secure_setting_keys: {
        Args: never
        Returns: {
          key: string
          updated_at: string
        }[]
      }
      set_secure_setting: {
        Args: { _key: string; _value: string }
        Returns: boolean
      }
      username_available: { Args: { _username: string }; Returns: boolean }
      verified_users: {
        Args: never
        Returns: {
          user_id: string
        }[]
      }
    }
    Enums: {
      app_role: "owner" | "admin" | "student"
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
      app_role: ["owner", "admin", "student"],
    },
  },
} as const
