export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      board_game_details: {
        Row: {
          bgg_id: number | null
          expansion_of_id: string | null
          game_catalog_id: string
          max_players: number | null
          min_players: number | null
          playing_time_min: number | null
          raw_bgg: Json | null
          thumbnail_url: string | null
          year_published: number | null
        }
        Insert: {
          bgg_id?: number | null
          expansion_of_id?: string | null
          game_catalog_id: string
          max_players?: number | null
          min_players?: number | null
          playing_time_min?: number | null
          raw_bgg?: Json | null
          thumbnail_url?: string | null
          year_published?: number | null
        }
        Update: {
          bgg_id?: number | null
          expansion_of_id?: string | null
          game_catalog_id?: string
          max_players?: number | null
          min_players?: number | null
          playing_time_min?: number | null
          raw_bgg?: Json | null
          thumbnail_url?: string | null
          year_published?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "board_game_details_expansion_of_id_fkey"
            columns: ["expansion_of_id"]
            isOneToOne: false
            referencedRelation: "game_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "board_game_details_game_catalog_id_fkey"
            columns: ["game_catalog_id"]
            isOneToOne: true
            referencedRelation: "game_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      board_game_scores: {
        Row: {
          id: string
          is_winner: boolean | null
          participant_id: string | null
          profile_id: string | null
          rank: number | null
          score: number | null
          session_id: string
        }
        Insert: {
          id?: string
          is_winner?: boolean | null
          participant_id?: string | null
          profile_id?: string | null
          rank?: number | null
          score?: number | null
          session_id: string
        }
        Update: {
          id?: string
          is_winner?: boolean | null
          participant_id?: string | null
          profile_id?: string | null
          rank?: number | null
          score?: number | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "board_game_scores_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "board_game_scores_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "board_game_scores_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "play_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      desired_games: {
        Row: {
          bgg_id: number | null
          booking_url: string | null
          city: string | null
          company: string | null
          created_at: string
          created_by: string
          game_catalog_id: string | null
          id: string
          notes: string | null
          priority: number | null
          status: Database["public"]["Enums"]["desired_game_status"]
          title: string
          type: Database["public"]["Enums"]["game_type"]
          updated_at: string
          venue: string | null
        }
        Insert: {
          bgg_id?: number | null
          booking_url?: string | null
          city?: string | null
          company?: string | null
          created_at?: string
          created_by: string
          game_catalog_id?: string | null
          id?: string
          notes?: string | null
          priority?: number | null
          status?: Database["public"]["Enums"]["desired_game_status"]
          title: string
          type: Database["public"]["Enums"]["game_type"]
          updated_at?: string
          venue?: string | null
        }
        Update: {
          bgg_id?: number | null
          booking_url?: string | null
          city?: string | null
          company?: string | null
          created_at?: string
          created_by?: string
          game_catalog_id?: string | null
          id?: string
          notes?: string | null
          priority?: number | null
          status?: Database["public"]["Enums"]["desired_game_status"]
          title?: string
          type?: Database["public"]["Enums"]["game_type"]
          updated_at?: string
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "desired_games_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "desired_games_game_catalog_id_fkey"
            columns: ["game_catalog_id"]
            isOneToOne: false
            referencedRelation: "game_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      escape_room_details: {
        Row: {
          city: string | null
          company: string | null
          game_catalog_id: string
          room_name: string | null
          venue: string | null
        }
        Insert: {
          city?: string | null
          company?: string | null
          game_catalog_id: string
          room_name?: string | null
          venue?: string | null
        }
        Update: {
          city?: string | null
          company?: string | null
          game_catalog_id?: string
          room_name?: string | null
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "escape_room_details_game_catalog_id_fkey"
            columns: ["game_catalog_id"]
            isOneToOne: true
            referencedRelation: "game_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      escape_session_details: {
        Row: {
          clues_used: number | null
          escaped: boolean | null
          price: number | null
          price_currency: string
          session_id: string
          time_result: string | null
          time_seconds: number | null
        }
        Insert: {
          clues_used?: number | null
          escaped?: boolean | null
          price?: number | null
          price_currency?: string
          session_id: string
          time_result?: string | null
          time_seconds?: number | null
        }
        Update: {
          clues_used?: number | null
          escaped?: boolean | null
          price?: number | null
          price_currency?: string
          session_id?: string
          time_result?: string | null
          time_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "escape_session_details_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "play_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      game_catalog: {
        Row: {
          created_at: string
          created_by: string
          id: string
          slug: string | null
          source: string | null
          source_external_id: string | null
          title: string
          type: Database["public"]["Enums"]["game_type"]
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          slug?: string | null
          source?: string | null
          source_external_id?: string | null
          title: string
          type: Database["public"]["Enums"]["game_type"]
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          slug?: string | null
          source?: string | null
          source_external_id?: string | null
          title?: string
          type?: Database["public"]["Enums"]["game_type"]
        }
        Relationships: [
          {
            foreignKeyName: "game_catalog_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      participant_aliases: {
        Row: {
          alias: string
          id: string
          participant_id: string
          source: string | null
        }
        Insert: {
          alias: string
          id?: string
          participant_id: string
          source?: string | null
        }
        Update: {
          alias?: string
          id?: string
          participant_id?: string
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "participant_aliases_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      participants: {
        Row: {
          color: string | null
          created_at: string
          display_name: string
          id: string
          owner_id: string
          profile_id: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          display_name: string
          id?: string
          owner_id: string
          profile_id?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string
          display_name?: string
          id?: string
          owner_id?: string
          profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "participants_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participants_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      play_sessions: {
        Row: {
          created_at: string
          created_by: string
          duration_ms: number
          ended_at: string | null
          game_catalog_id: string
          id: string
          is_paused: boolean
          last_started_at: string | null
          notes: string | null
          outcome: Database["public"]["Enums"]["session_outcome"] | null
          played_at: string
          source: string | null
          source_hash: string | null
          source_raw: Json | null
          status: Database["public"]["Enums"]["session_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          duration_ms?: number
          ended_at?: string | null
          game_catalog_id: string
          id?: string
          is_paused?: boolean
          last_started_at?: string | null
          notes?: string | null
          outcome?: Database["public"]["Enums"]["session_outcome"] | null
          played_at: string
          source?: string | null
          source_hash?: string | null
          source_raw?: Json | null
          status?: Database["public"]["Enums"]["session_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          duration_ms?: number
          ended_at?: string | null
          game_catalog_id?: string
          id?: string
          is_paused?: boolean
          last_started_at?: string | null
          notes?: string | null
          outcome?: Database["public"]["Enums"]["session_outcome"] | null
          played_at?: string
          source?: string | null
          source_hash?: string | null
          source_raw?: Json | null
          status?: Database["public"]["Enums"]["session_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "play_sessions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "play_sessions_game_catalog_id_fkey"
            columns: ["game_catalog_id"]
            isOneToOne: false
            referencedRelation: "game_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name: string
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      session_messages: {
        Row: {
          author_profile_id: string
          content: string
          created_at: string
          id: string
          session_id: string
        }
        Insert: {
          author_profile_id: string
          content: string
          created_at?: string
          id?: string
          session_id: string
        }
        Update: {
          author_profile_id?: string
          content?: string
          created_at?: string
          id?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_messages_author_profile_id_fkey"
            columns: ["author_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "play_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_participants: {
        Row: {
          id: string
          participant_id: string | null
          profile_id: string | null
          session_id: string
        }
        Insert: {
          id?: string
          participant_id?: string | null
          profile_id?: string | null
          session_id: string
        }
        Update: {
          id?: string
          participant_id?: string | null
          profile_id?: string | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_participants_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_participants_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_participants_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "play_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      desired_game_status: "active" | "played" | "dropped"
      game_type: "board_game" | "escape_room"
      import_source: "google_sheets" | "google_drive" | "manual"
      import_status: "pending" | "running" | "completed" | "failed"
      photo_source: "upload" | "google_drive" | "import"
      session_outcome:
        | "win"
        | "loss"
        | "draw"
        | "unknown"
        | "escaped"
        | "failed"
      session_status: "planned" | "in_progress" | "completed" | "abandoned"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      desired_game_status: ["active", "played", "dropped"],
      game_type: ["board_game", "escape_room"],
      import_source: ["google_sheets", "google_drive", "manual"],
      import_status: ["pending", "running", "completed", "failed"],
      photo_source: ["upload", "google_drive", "import"],
      session_outcome: ["win", "loss", "draw", "unknown", "escaped", "failed"],
      session_status: ["planned", "in_progress", "completed", "abandoned"],
    },
  },
} as const

