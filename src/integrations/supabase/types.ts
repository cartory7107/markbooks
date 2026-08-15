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
      admin_tool_edits: {
        Row: {
          action: string
          created_at: string
          id: string
          original_name: string | null
          tool_data: Json
          updated_at: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          original_name?: string | null
          tool_data?: Json
          updated_at?: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          original_name?: string | null
          tool_data?: Json
          updated_at?: string
        }
        Relationships: []
      }
      advertisements: {
        Row: {
          created_at: string
          description: string
          email: string
          full_name: string
          id: string
          payment_method: string
          payment_status: string
          placement: string
          status: Database["public"]["Enums"]["review_status"]
          telegram: string | null
          title: string
          tool_name: string
          updated_at: string
          website_url: string
          whatsapp: string | null
        }
        Insert: {
          created_at?: string
          description: string
          email: string
          full_name: string
          id?: string
          payment_method?: string
          payment_status?: string
          placement: string
          status?: Database["public"]["Enums"]["review_status"]
          telegram?: string | null
          title: string
          tool_name: string
          updated_at?: string
          website_url: string
          whatsapp?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          email?: string
          full_name?: string
          id?: string
          payment_method?: string
          payment_status?: string
          placement?: string
          status?: Database["public"]["Enums"]["review_status"]
          telegram?: string | null
          title?: string
          tool_name?: string
          updated_at?: string
          website_url?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      ai_tools: {
        Row: {
          category_ids: string[]
          cons: Json
          created_at: string
          date_added: string
          discovery_source: string | null
          favicon_url: string | null
          features: Json
          has_free_plan: boolean
          id: string
          is_featured: boolean
          is_trending: boolean
          languages: string[]
          logo_url: string | null
          name: string
          official_url: string | null
          overview: string | null
          platforms: string[]
          popularity_score: number
          pricing_model: string
          pros: Json
          short_description: string
          similar_tool_ids: string[]
          slug: string
          status: Database["public"]["Enums"]["review_status"]
          updated_at: string
          use_cases: Json
          verification_notes: string | null
        }
        Insert: {
          category_ids?: string[]
          cons?: Json
          created_at?: string
          date_added?: string
          discovery_source?: string | null
          favicon_url?: string | null
          features?: Json
          has_free_plan?: boolean
          id?: string
          is_featured?: boolean
          is_trending?: boolean
          languages?: string[]
          logo_url?: string | null
          name: string
          official_url?: string | null
          overview?: string | null
          platforms?: string[]
          popularity_score?: number
          pricing_model?: string
          pros?: Json
          short_description?: string
          similar_tool_ids?: string[]
          slug: string
          status?: Database["public"]["Enums"]["review_status"]
          updated_at?: string
          use_cases?: Json
          verification_notes?: string | null
        }
        Update: {
          category_ids?: string[]
          cons?: Json
          created_at?: string
          date_added?: string
          discovery_source?: string | null
          favicon_url?: string | null
          features?: Json
          has_free_plan?: boolean
          id?: string
          is_featured?: boolean
          is_trending?: boolean
          languages?: string[]
          logo_url?: string | null
          name?: string
          official_url?: string | null
          overview?: string | null
          platforms?: string[]
          popularity_score?: number
          pricing_model?: string
          pros?: Json
          short_description?: string
          similar_tool_ids?: string[]
          slug?: string
          status?: Database["public"]["Enums"]["review_status"]
          updated_at?: string
          use_cases?: Json
          verification_notes?: string | null
        }
        Relationships: []
      }
      blog_authors: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string | null
          id: string
          linkedin_url: string | null
          name: string
          role_title: string | null
          slug: string
          twitter_url: string | null
          updated_at: string
          user_id: string | null
          website_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          id?: string
          linkedin_url?: string | null
          name: string
          role_title?: string | null
          slug: string
          twitter_url?: string | null
          updated_at?: string
          user_id?: string | null
          website_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          id?: string
          linkedin_url?: string | null
          name?: string
          role_title?: string | null
          slug?: string
          twitter_url?: string | null
          updated_at?: string
          user_id?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      blog_categories: {
        Row: {
          created_at: string
          description: string | null
          emoji: string | null
          faq: Json
          id: string
          intro: string | null
          meta_description: string | null
          meta_title: string | null
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          emoji?: string | null
          faq?: Json
          id?: string
          intro?: string | null
          meta_description?: string | null
          meta_title?: string | null
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          emoji?: string | null
          faq?: Json
          id?: string
          intro?: string | null
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      blog_post_revisions: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          post_id: string
          snapshot: Json
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          post_id: string
          snapshot: Json
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          post_id?: string
          snapshot?: Json
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_revisions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          ai_generated: boolean
          ai_model: string | null
          author_id: string | null
          canonical_url: string | null
          category_id: string | null
          content_html: string | null
          content_md: string
          created_at: string
          created_by: string | null
          excerpt: string | null
          faq: Json
          featured_image_alt: string | null
          featured_image_url: string | null
          id: string
          is_featured: boolean
          is_trending: boolean
          keywords: string[]
          meta_description: string | null
          meta_title: string | null
          og_description: string | null
          og_image_url: string | null
          og_title: string | null
          published_at: string | null
          reading_minutes: number
          rejection_reason: string | null
          related_post_slugs: string[]
          related_tool_slugs: string[]
          reviewed_by: string | null
          scheduled_at: string | null
          slug: string
          status: Database["public"]["Enums"]["blog_post_status"]
          tags: string[]
          title: string
          toc: Json
          twitter_card: string
          updated_at: string
          view_count: number
          word_count: number
        }
        Insert: {
          ai_generated?: boolean
          ai_model?: string | null
          author_id?: string | null
          canonical_url?: string | null
          category_id?: string | null
          content_html?: string | null
          content_md?: string
          created_at?: string
          created_by?: string | null
          excerpt?: string | null
          faq?: Json
          featured_image_alt?: string | null
          featured_image_url?: string | null
          id?: string
          is_featured?: boolean
          is_trending?: boolean
          keywords?: string[]
          meta_description?: string | null
          meta_title?: string | null
          og_description?: string | null
          og_image_url?: string | null
          og_title?: string | null
          published_at?: string | null
          reading_minutes?: number
          rejection_reason?: string | null
          related_post_slugs?: string[]
          related_tool_slugs?: string[]
          reviewed_by?: string | null
          scheduled_at?: string | null
          slug: string
          status?: Database["public"]["Enums"]["blog_post_status"]
          tags?: string[]
          title: string
          toc?: Json
          twitter_card?: string
          updated_at?: string
          view_count?: number
          word_count?: number
        }
        Update: {
          ai_generated?: boolean
          ai_model?: string | null
          author_id?: string | null
          canonical_url?: string | null
          category_id?: string | null
          content_html?: string | null
          content_md?: string
          created_at?: string
          created_by?: string | null
          excerpt?: string | null
          faq?: Json
          featured_image_alt?: string | null
          featured_image_url?: string | null
          id?: string
          is_featured?: boolean
          is_trending?: boolean
          keywords?: string[]
          meta_description?: string | null
          meta_title?: string | null
          og_description?: string | null
          og_image_url?: string | null
          og_title?: string | null
          published_at?: string | null
          reading_minutes?: number
          rejection_reason?: string | null
          related_post_slugs?: string[]
          related_tool_slugs?: string[]
          reviewed_by?: string | null
          scheduled_at?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["blog_post_status"]
          tags?: string[]
          title?: string
          toc?: Json
          twitter_card?: string
          updated_at?: string
          view_count?: number
          word_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "blog_authors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          name: string
          slug: string
          tool_count: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          slug: string
          tool_count?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          slug?: string
          tool_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      link_audit_results: {
        Row: {
          checked_at: string
          domain: string | null
          domain_changed: boolean
          error_type: string | null
          final_url: string | null
          https_valid: boolean | null
          id: string
          link_health: Database["public"]["Enums"]["link_health"]
          redirect_detected: boolean
          response_ms: number | null
          run_id: string | null
          security_reasons: string[]
          security_status: string
          status_code: number | null
          tool_name: string
          tool_slug: string
          url: string
        }
        Insert: {
          checked_at?: string
          domain?: string | null
          domain_changed?: boolean
          error_type?: string | null
          final_url?: string | null
          https_valid?: boolean | null
          id?: string
          link_health?: Database["public"]["Enums"]["link_health"]
          redirect_detected?: boolean
          response_ms?: number | null
          run_id?: string | null
          security_reasons?: string[]
          security_status?: string
          status_code?: number | null
          tool_name?: string
          tool_slug: string
          url: string
        }
        Update: {
          checked_at?: string
          domain?: string | null
          domain_changed?: boolean
          error_type?: string | null
          final_url?: string | null
          https_valid?: boolean | null
          id?: string
          link_health?: Database["public"]["Enums"]["link_health"]
          redirect_detected?: boolean
          response_ms?: number | null
          run_id?: string | null
          security_reasons?: string[]
          security_status?: string
          status_code?: number | null
          tool_name?: string
          tool_slug?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "link_audit_results_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "link_audit_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      link_audit_runs: {
        Row: {
          broken: number
          checked: number
          created_at: string
          finished_at: string | null
          id: string
          insecure: number
          notes: string | null
          quarantined: number
          redirected: number
          started_at: string
          status: string
          trigger_source: string
          working: number
        }
        Insert: {
          broken?: number
          checked?: number
          created_at?: string
          finished_at?: string | null
          id?: string
          insecure?: number
          notes?: string | null
          quarantined?: number
          redirected?: number
          started_at?: string
          status?: string
          trigger_source?: string
          working?: number
        }
        Update: {
          broken?: number
          checked?: number
          created_at?: string
          finished_at?: string | null
          id?: string
          insecure?: number
          notes?: string | null
          quarantined?: number
          redirected?: number
          started_at?: string
          status?: string
          trigger_source?: string
          working?: number
        }
        Relationships: []
      }
      tool_discoveries: {
        Row: {
          candidate_url: string | null
          confidence_score: number
          created_at: string
          extracted_data: Json
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          source_type: string
          source_url: string
          status: Database["public"]["Enums"]["review_status"]
          tool_name: string
          updated_at: string
        }
        Insert: {
          candidate_url?: string | null
          confidence_score?: number
          created_at?: string
          extracted_data?: Json
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_type: string
          source_url: string
          status?: Database["public"]["Enums"]["review_status"]
          tool_name: string
          updated_at?: string
        }
        Update: {
          candidate_url?: string | null
          confidence_score?: number
          created_at?: string
          extracted_data?: Json
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_type?: string
          source_url?: string
          status?: Database["public"]["Enums"]["review_status"]
          tool_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      tool_logos: {
        Row: {
          attempts: number
          byte_size: number | null
          content_hash: string | null
          content_type: string | null
          created_at: string
          domain: string
          error: string | null
          id: string
          logo_updated_at: string | null
          public_url: string | null
          source: string | null
          status: string
          storage_path: string | null
          updated_at: string
        }
        Insert: {
          attempts?: number
          byte_size?: number | null
          content_hash?: string | null
          content_type?: string | null
          created_at?: string
          domain: string
          error?: string | null
          id?: string
          logo_updated_at?: string | null
          public_url?: string | null
          source?: string | null
          status?: string
          storage_path?: string | null
          updated_at?: string
        }
        Update: {
          attempts?: number
          byte_size?: number | null
          content_hash?: string | null
          content_type?: string | null
          created_at?: string
          domain?: string
          error?: string | null
          id?: string
          logo_updated_at?: string | null
          public_url?: string | null
          source?: string | null
          status?: string
          storage_path?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      tool_submissions: {
        Row: {
          admin_notes: string | null
          category: string
          created_at: string
          decline_reason: string | null
          description: string
          full_description: string | null
          id: string
          linked_tool_id: string | null
          logo_url: string | null
          pricing: string
          status: string
          submitter_email: string | null
          submitter_name: string | null
          submitter_user_id: string | null
          tags: string[]
          tool_name: string
          tool_url: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          category?: string
          created_at?: string
          decline_reason?: string | null
          description: string
          full_description?: string | null
          id?: string
          linked_tool_id?: string | null
          logo_url?: string | null
          pricing?: string
          status?: string
          submitter_email?: string | null
          submitter_name?: string | null
          submitter_user_id?: string | null
          tags?: string[]
          tool_name: string
          tool_url: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          category?: string
          created_at?: string
          decline_reason?: string | null
          description?: string
          full_description?: string | null
          id?: string
          linked_tool_id?: string | null
          logo_url?: string | null
          pricing?: string
          status?: string
          submitter_email?: string | null
          submitter_name?: string | null
          submitter_user_id?: string | null
          tags?: string[]
          tool_name?: string
          tool_url?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tool_submissions_linked_tool_id_fkey"
            columns: ["linked_tool_id"]
            isOneToOne: false
            referencedRelation: "ai_tools"
            referencedColumns: ["id"]
          },
        ]
      }
      tool_verifications: {
        Row: {
          consecutive_failures: number
          created_at: string
          domain: string | null
          final_url: string | null
          http_status: number | null
          https_valid: boolean | null
          id: string
          last_checked_at: string | null
          last_error: string | null
          level: Database["public"]["Enums"]["verification_level"]
          link_health: Database["public"]["Enums"]["link_health"]
          next_check_at: string | null
          public_notes: string | null
          quarantined: boolean
          redirect_target: string | null
          response_ms: number | null
          security_reasons: string[]
          security_status: string
          tool_name: string
          tool_slug: string
          updated_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          consecutive_failures?: number
          created_at?: string
          domain?: string | null
          final_url?: string | null
          http_status?: number | null
          https_valid?: boolean | null
          id?: string
          last_checked_at?: string | null
          last_error?: string | null
          level?: Database["public"]["Enums"]["verification_level"]
          link_health?: Database["public"]["Enums"]["link_health"]
          next_check_at?: string | null
          public_notes?: string | null
          quarantined?: boolean
          redirect_target?: string | null
          response_ms?: number | null
          security_reasons?: string[]
          security_status?: string
          tool_name?: string
          tool_slug: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          consecutive_failures?: number
          created_at?: string
          domain?: string | null
          final_url?: string | null
          http_status?: number | null
          https_valid?: boolean | null
          id?: string
          last_checked_at?: string | null
          last_error?: string | null
          level?: Database["public"]["Enums"]["verification_level"]
          link_health?: Database["public"]["Enums"]["link_health"]
          next_check_at?: string | null
          public_notes?: string | null
          quarantined?: boolean
          redirect_target?: string | null
          response_ms?: number | null
          security_reasons?: string[]
          security_status?: string
          tool_name?: string
          tool_slug?: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
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
      [_ in never]: never
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      blog_post_status:
        | "draft"
        | "pending_review"
        | "scheduled"
        | "published"
        | "archived"
        | "rejected"
      link_health: "unknown" | "working" | "redirected" | "broken" | "insecure"
      review_status: "pending" | "approved" | "rejected"
      verification_level:
        | "unverified"
        | "auto_checked"
        | "human_verified"
        | "flagged"
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
      app_role: ["admin", "moderator", "user"],
      blog_post_status: [
        "draft",
        "pending_review",
        "scheduled",
        "published",
        "archived",
        "rejected",
      ],
      link_health: ["unknown", "working", "redirected", "broken", "insecure"],
      review_status: ["pending", "approved", "rejected"],
      verification_level: [
        "unverified",
        "auto_checked",
        "human_verified",
        "flagged",
      ],
    },
  },
} as const
