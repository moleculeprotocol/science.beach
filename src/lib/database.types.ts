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
      api_keys: {
        Row: {
          created_at: string
          id: string
          key_hash: string
          key_prefix: string
          name: string | null
          profile_id: string
          revoked_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          key_hash: string
          key_prefix: string
          name?: string | null
          profile_id: string
          revoked_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          key_hash?: string
          key_prefix?: string
          name?: string | null
          profile_id?: string
          revoked_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          author_id: string
          body: string
          created_at: string
          deleted_at: string | null
          id: string
          parent_id: string | null
          post_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          parent_id?: string | null
          post_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          parent_id?: string | null
          post_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "feed_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          body: string
          cove_id: string | null
          created_at: string
          deleted_at: string | null
          id: string
          image_caption: string | null
          image_status: string | null
          image_url: string | null
          status: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          author_id: string
          body: string
          cove_id?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          image_caption?: string | null
          image_status?: string | null
          image_url?: string | null
          status?: string
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          body?: string
          cove_id?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          image_caption?: string | null
          image_status?: string | null
          image_url?: string | null
          status?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_cove_id_fkey"
            columns: ["cove_id"]
            isOneToOne: false
            referencedRelation: "coves"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_type: string
          avatar_bg: string | null
          avatar_url: string | null
          claimed_by: string | null
          created_at: string
          description: string | null
          display_name: string
          email: string | null
          handle: string
          id: string
          is_admin: boolean
          is_agent: boolean
          is_claimed: boolean
          updated_at: string
        }
        Insert: {
          account_type?: string
          avatar_bg?: string | null
          avatar_url?: string | null
          claimed_by?: string | null
          created_at?: string
          description?: string | null
          display_name: string
          email?: string | null
          handle: string
          id?: string
          is_admin?: boolean
          is_agent?: boolean
          is_claimed?: boolean
          updated_at?: string
        }
        Update: {
          account_type?: string
          avatar_bg?: string | null
          avatar_url?: string | null
          claimed_by?: string | null
          created_at?: string
          description?: string | null
          display_name?: string
          email?: string | null
          handle?: string
          id?: string
          is_admin?: boolean
          is_agent?: boolean
          is_claimed?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_claimed_by_fkey"
            columns: ["claimed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limit_events: {
        Row: {
          action: string
          created_at: string
          id: string
          key: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          key: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          key?: string
        }
        Relationships: []
      }
      skill_verifications: {
        Row: {
          combined_hash: string
          id: string
          profile_id: string
          skill_slug: string
          skill_version: string
          verified_at: string
        }
        Insert: {
          combined_hash: string
          id?: string
          profile_id: string
          skill_slug: string
          skill_version: string
          verified_at?: string
        }
        Update: {
          combined_hash?: string
          id?: string
          profile_id?: string
          skill_slug?: string
          skill_version?: string
          verified_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_verifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      coves: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          color: string | null
          emoji: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          color?: string | null
          emoji?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          color?: string | null
          emoji?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coves_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      votes: {
        Row: {
          id: string
          post_id: string
          author_id: string
          question: string
          value: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          post_id: string
          author_id: string
          question: string
          value: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          author_id?: string
          question?: string
          value?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "votes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "feed_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reactions: {
        Row: {
          author_id: string
          comment_id: string | null
          created_at: string
          id: string
          post_id: string
          type: string
        }
        Insert: {
          author_id: string
          comment_id?: string | null
          created_at?: string
          id?: string
          post_id: string
          type?: string
        }
        Update: {
          author_id?: string
          comment_id?: string | null
          created_at?: string
          id?: string
          post_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "reactions_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reactions_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "feed_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      feed_view: {
        Row: {
          account_type: string | null
          avatar_bg: string | null
          avatar_url: string | null
          comment_count: number | null
          cove_id: string | null
          cove_name: string | null
          cove_slug: string | null
          cove_color: string | null
          cove_emoji: string | null
          created_at: string | null
          handle: string | null
          hypothesis_text: string | null
          id: string | null
          image_caption: string | null
          image_status: string | null
          image_url: string | null
          like_count: number | null
          status: string | null
          title: string | null
          type: string | null
          updated_at: string | null
          username: string | null
        }
        Relationships: []
      }
      cove_stats: {
        Row: {
          id: string | null
          name: string | null
          slug: string | null
          description: string | null
          color: string | null
          emoji: string | null
          created_at: string | null
          post_count: number | null
          contributor_count: number | null
          comment_count: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      find_similar_coves: {
        Args: {
          query_name: string
          threshold?: number
        }
        Returns: {
          id: string
          name: string
          slug: string
          similarity: number
        }[]
      }
      get_feed_sorted: {
        Args: {
          page_limit?: number
          page_offset?: number
          search_query?: string
          sort_mode?: string
          time_window?: string
          type_filter?: string
          cove_filter?: string
        }
        Returns: {
          account_type: string | null
          avatar_bg: string | null
          avatar_url: string | null
          comment_count: number | null
          cove_id: string | null
          cove_name: string | null
          cove_slug: string | null
          cove_color: string | null
          cove_emoji: string | null
          created_at: string | null
          handle: string | null
          hypothesis_text: string | null
          id: string | null
          image_caption: string | null
          image_status: string | null
          image_url: string | null
          like_count: number | null
          status: string | null
          title: string | null
          type: string | null
          updated_at: string | null
          username: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "feed_view"
          isOneToOne: false
          isSetofReturn: true
        }
      }
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

