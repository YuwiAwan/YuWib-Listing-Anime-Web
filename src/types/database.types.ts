// Tipe skema database Supabase — DI-GENERATE, JANGAN DIEDIT MANUAL.
// Regenerate setiap ada migration baru:
//   npx supabase gen types typescript --local > src/types/database.types.ts

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
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
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
      anime: {
        Row: {
          airing_status: string | null
          broadcast_day: string | null
          broadcast_time: string | null
          cached_at: string
          duration_min: number | null
          episodes: number | null
          genres: string[]
          image_url: string | null
          mal_id: number
          mal_score: number | null
          season: string | null
          title: string
          title_english: string | null
          type: string | null
          year: number | null
        }
        Insert: {
          airing_status?: string | null
          broadcast_day?: string | null
          broadcast_time?: string | null
          cached_at?: string
          duration_min?: number | null
          episodes?: number | null
          genres?: string[]
          image_url?: string | null
          mal_id: number
          mal_score?: number | null
          season?: string | null
          title: string
          title_english?: string | null
          type?: string | null
          year?: number | null
        }
        Update: {
          airing_status?: string | null
          broadcast_day?: string | null
          broadcast_time?: string | null
          cached_at?: string
          duration_min?: number | null
          episodes?: number | null
          genres?: string[]
          image_url?: string | null
          mal_id?: number
          mal_score?: number | null
          season?: string | null
          title?: string
          title_english?: string | null
          type?: string | null
          year?: number | null
        }
        Relationships: []
      }
      list_entries: {
        Row: {
          created_at: string
          episodes_watched: number
          finish_date: string | null
          id: string
          is_favorite: boolean
          mal_id: number
          notes: string | null
          rewatch_count: number
          score: number | null
          start_date: string | null
          status: Database["public"]["Enums"]["list_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          episodes_watched?: number
          finish_date?: string | null
          id?: string
          is_favorite?: boolean
          mal_id: number
          notes?: string | null
          rewatch_count?: number
          score?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["list_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          episodes_watched?: number
          finish_date?: string | null
          id?: string
          is_favorite?: boolean
          mal_id?: number
          notes?: string | null
          rewatch_count?: number
          score?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["list_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "list_entries_mal_id_fkey"
            columns: ["mal_id"]
            isOneToOne: false
            referencedRelation: "anime"
            referencedColumns: ["mal_id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          show_nsfw: boolean
          username: string
        }
        Insert: {
          created_at?: string
          id: string
          show_nsfw?: boolean
          username: string
        }
        Update: {
          created_at?: string
          id?: string
          show_nsfw?: boolean
          username?: string
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
      list_status:
        | "watching"
        | "completed"
        | "on_hold"
        | "dropped"
        | "plan_to_watch"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      list_status: [
        "watching",
        "completed",
        "on_hold",
        "dropped",
        "plan_to_watch",
      ],
    },
  },
} as const

