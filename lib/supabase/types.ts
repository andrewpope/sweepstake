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
      allocations: {
        Row: {
          drawn_at: string
          entry_id: string
          id: string
          revealed_at: string | null
          team_id: string
        }
        Insert: {
          drawn_at?: string
          entry_id: string
          id?: string
          revealed_at?: string | null
          team_id: string
        }
        Update: {
          drawn_at?: string
          entry_id?: string
          id?: string
          revealed_at?: string | null
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "allocations_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: true
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "allocations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      entries: {
        Row: {
          created_at: string
          entry_number: number
          id: string
          paid_at: string | null
          paid_method: Database["public"]["Enums"]["paid_method"] | null
          participant_id: string
          payment_ref: string | null
          sweepstake_id: string
        }
        Insert: {
          created_at?: string
          entry_number: number
          id?: string
          paid_at?: string | null
          paid_method?: Database["public"]["Enums"]["paid_method"] | null
          participant_id: string
          payment_ref?: string | null
          sweepstake_id: string
        }
        Update: {
          created_at?: string
          entry_number?: number
          id?: string
          paid_at?: string | null
          paid_method?: Database["public"]["Enums"]["paid_method"] | null
          participant_id?: string
          payment_ref?: string | null
          sweepstake_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entries_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entries_sweepstake_id_fkey"
            columns: ["sweepstake_id"]
            isOneToOne: false
            referencedRelation: "sweepstakes"
            referencedColumns: ["id"]
          },
        ]
      }
      invites: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          max_uses: number | null
          sweepstake_id: string
          token: string
          used_count: number
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          sweepstake_id: string
          token: string
          used_count?: number
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          sweepstake_id?: string
          token?: string
          used_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "invites_sweepstake_id_fkey"
            columns: ["sweepstake_id"]
            isOneToOne: false
            referencedRelation: "sweepstakes"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          away_score: number | null
          away_team_id: string
          external_id: string | null
          home_score: number | null
          home_team_id: string
          id: string
          kickoff_at: string
          manual_override: boolean
          source: string | null
          stage: Database["public"]["Enums"]["match_stage"]
          status: Database["public"]["Enums"]["match_status"]
          synced_at: string | null
        }
        Insert: {
          away_score?: number | null
          away_team_id: string
          external_id?: string | null
          home_score?: number | null
          home_team_id: string
          id?: string
          kickoff_at: string
          manual_override?: boolean
          source?: string | null
          stage: Database["public"]["Enums"]["match_stage"]
          status?: Database["public"]["Enums"]["match_status"]
          synced_at?: string | null
        }
        Update: {
          away_score?: number | null
          away_team_id?: string
          external_id?: string | null
          home_score?: number | null
          home_team_id?: string
          id?: string
          kickoff_at?: string
          manual_override?: boolean
          source?: string | null
          stage?: Database["public"]["Enums"]["match_stage"]
          status?: Database["public"]["Enums"]["match_status"]
          synced_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      participants: {
        Row: {
          created_at: string
          display_name: string
          id: string
          sweepstake_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name: string
          id?: string
          sweepstake_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          sweepstake_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "participants_sweepstake_id_fkey"
            columns: ["sweepstake_id"]
            isOneToOne: false
            referencedRelation: "sweepstakes"
            referencedColumns: ["id"]
          },
        ]
      }
      sweepstakes: {
        Row: {
          created_at: string
          draw_at: string | null
          draw_seed: string | null
          entry_price_cents: number
          id: string
          max_entries_per_participant: number
          name: string
          organiser_id: string
          prize_split: Json
          registration_closes_at: string | null
          reveals_unlock_at: string | null
          status: Database["public"]["Enums"]["sweepstake_status"]
        }
        Insert: {
          created_at?: string
          draw_at?: string | null
          draw_seed?: string | null
          entry_price_cents?: number
          id?: string
          max_entries_per_participant?: number
          name: string
          organiser_id: string
          prize_split?: Json
          registration_closes_at?: string | null
          reveals_unlock_at?: string | null
          status?: Database["public"]["Enums"]["sweepstake_status"]
        }
        Update: {
          created_at?: string
          draw_at?: string | null
          draw_seed?: string | null
          entry_price_cents?: number
          id?: string
          max_entries_per_participant?: number
          name?: string
          organiser_id?: string
          prize_split?: Json
          registration_closes_at?: string | null
          reveals_unlock_at?: string | null
          status?: Database["public"]["Enums"]["sweepstake_status"]
        }
        Relationships: []
      }
      sync_runs: {
        Row: {
          error: string | null
          finished_at: string | null
          id: string
          matches_updated: number
          started_at: string
        }
        Insert: {
          error?: string | null
          finished_at?: string | null
          id?: string
          matches_updated?: number
          started_at?: string
        }
        Update: {
          error?: string | null
          finished_at?: string | null
          id?: string
          matches_updated?: number
          started_at?: string
        }
        Relationships: []
      }
      teams: {
        Row: {
          code: string
          eliminated_at: string | null
          final_position:
            | Database["public"]["Enums"]["team_final_position"]
            | null
          group_goal_diff: number
          group_goals_for: number
          group_name: string
          group_points: number
          id: string
          name: string
          seed: number | null
        }
        Insert: {
          code: string
          eliminated_at?: string | null
          final_position?:
            | Database["public"]["Enums"]["team_final_position"]
            | null
          group_goal_diff?: number
          group_goals_for?: number
          group_name: string
          group_points?: number
          id?: string
          name: string
          seed?: number | null
        }
        Update: {
          code?: string
          eliminated_at?: string | null
          final_position?:
            | Database["public"]["Enums"]["team_final_position"]
            | null
          group_goal_diff?: number
          group_goals_for?: number
          group_name?: string
          group_points?: number
          id?: string
          name?: string
          seed?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_invite_by_token: {
        Args: { p_token: string }
        Returns: {
          expires_at: string
          invite_id: string
          max_uses: number
          sweepstake_id: string
          sweepstake_name: string
          used_count: number
        }[]
      }
      is_pool_member: { Args: { p_pool_id: string }; Returns: boolean }
      is_pool_organiser: { Args: { p_pool_id: string }; Returns: boolean }
      join_pool_via_invite: {
        Args: { p_display_name: string; p_token: string }
        Returns: string
      }
      run_pool_draw: {
        Args: { p_allocations: Json; p_pool_id: string; p_seed: string }
        Returns: undefined
      }
    }
    Enums: {
      match_stage:
        | "group"
        | "round_of_32"
        | "round_of_16"
        | "quarter_final"
        | "semi_final"
        | "third_place_playoff"
        | "final"
      match_status:
        | "NS"
        | "1H"
        | "HT"
        | "2H"
        | "ET"
        | "P"
        | "AET"
        | "PEN"
        | "FT"
        | "PST"
        | "CANC"
      paid_method: "cash" | "tikkie" | "other"
      sweepstake_status: "draft" | "open" | "drawing" | "drawn" | "completed"
      team_final_position:
        | "group_stage"
        | "round_of_32"
        | "round_of_16"
        | "quarter_final"
        | "fourth"
        | "third"
        | "runner_up"
        | "champion"
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
      match_stage: [
        "group",
        "round_of_32",
        "round_of_16",
        "quarter_final",
        "semi_final",
        "third_place_playoff",
        "final",
      ],
      match_status: [
        "NS",
        "1H",
        "HT",
        "2H",
        "ET",
        "P",
        "AET",
        "PEN",
        "FT",
        "PST",
        "CANC",
      ],
      paid_method: ["cash", "tikkie", "other"],
      sweepstake_status: ["draft", "open", "drawing", "drawn", "completed"],
      team_final_position: [
        "group_stage",
        "round_of_32",
        "round_of_16",
        "quarter_final",
        "fourth",
        "third",
        "runner_up",
        "champion",
      ],
    },
  },
} as const

