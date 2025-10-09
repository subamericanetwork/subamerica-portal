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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      artists: {
        Row: {
          bio_long: string | null
          bio_short: string | null
          brand: Json | null
          created_at: string | null
          display_name: string
          email: string
          id: string
          pronouns: string | null
          scene: string | null
          slug: string
          socials: Json | null
          tz: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bio_long?: string | null
          bio_short?: string | null
          brand?: Json | null
          created_at?: string | null
          display_name: string
          email: string
          id?: string
          pronouns?: string | null
          scene?: string | null
          slug: string
          socials?: Json | null
          tz?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bio_long?: string | null
          bio_short?: string | null
          brand?: Json | null
          created_at?: string | null
          display_name?: string
          email?: string
          id?: string
          pronouns?: string | null
          scene?: string | null
          slug?: string
          socials?: Json | null
          tz?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      audit: {
        Row: {
          action: string | null
          actor_id: string | null
          created_at: string | null
          diff: Json | null
          entity: string | null
          entity_id: string | null
          id: string
        }
        Insert: {
          action?: string | null
          actor_id?: string | null
          created_at?: string | null
          diff?: Json | null
          entity?: string | null
          entity_id?: string | null
          id?: string
        }
        Update: {
          action?: string | null
          actor_id?: string | null
          created_at?: string | null
          diff?: Json | null
          entity?: string | null
          entity_id?: string | null
          id?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          artist_id: string
          created_at: string | null
          duration: number | null
          geo: Json | null
          id: string
          livestream_source: string | null
          poster_url: string | null
          starts_at: string
          ticket_url: string | null
          title: string
          updated_at: string | null
          venue: string | null
        }
        Insert: {
          artist_id: string
          created_at?: string | null
          duration?: number | null
          geo?: Json | null
          id?: string
          livestream_source?: string | null
          poster_url?: string | null
          starts_at: string
          ticket_url?: string | null
          title: string
          updated_at?: string | null
          venue?: string | null
        }
        Update: {
          artist_id?: string
          created_at?: string | null
          duration?: number | null
          geo?: Json | null
          id?: string
          livestream_source?: string | null
          poster_url?: string | null
          starts_at?: string
          ticket_url?: string | null
          title?: string
          updated_at?: string | null
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          artist_id: string
          created_at: string | null
          heartland_link: string | null
          id: string
          mode: Database["public"]["Enums"]["pay_mode"] | null
          paypal_link: string | null
          updated_at: string | null
        }
        Insert: {
          artist_id: string
          created_at?: string | null
          heartland_link?: string | null
          id?: string
          mode?: Database["public"]["Enums"]["pay_mode"] | null
          paypal_link?: string | null
          updated_at?: string | null
        }
        Update: {
          artist_id?: string
          created_at?: string | null
          heartland_link?: string | null
          id?: string
          mode?: Database["public"]["Enums"]["pay_mode"] | null
          paypal_link?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: true
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
        ]
      }
      port_settings: {
        Row: {
          artist_id: string
          commenting: string | null
          created_at: string | null
          go_live_at: string | null
          id: string
          max_products: number | null
          pixels: Json | null
          publish_status: Database["public"]["Enums"]["publish_status"] | null
          seo: Json | null
          updated_at: string | null
        }
        Insert: {
          artist_id: string
          commenting?: string | null
          created_at?: string | null
          go_live_at?: string | null
          id?: string
          max_products?: number | null
          pixels?: Json | null
          publish_status?: Database["public"]["Enums"]["publish_status"] | null
          seo?: Json | null
          updated_at?: string | null
        }
        Update: {
          artist_id?: string
          commenting?: string | null
          created_at?: string | null
          go_live_at?: string | null
          id?: string
          max_products?: number | null
          pixels?: Json | null
          publish_status?: Database["public"]["Enums"]["publish_status"] | null
          seo?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "port_settings_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: true
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          artist_id: string
          created_at: string | null
          fulfillment: string | null
          id: string
          images: Json | null
          inventory: string | null
          is_surface: boolean | null
          pitch: string | null
          price: number | null
          sku: string | null
          title: string
          type: string
          updated_at: string | null
          variants: Json | null
        }
        Insert: {
          artist_id: string
          created_at?: string | null
          fulfillment?: string | null
          id?: string
          images?: Json | null
          inventory?: string | null
          is_surface?: boolean | null
          pitch?: string | null
          price?: number | null
          sku?: string | null
          title: string
          type: string
          updated_at?: string | null
          variants?: Json | null
        }
        Update: {
          artist_id?: string
          created_at?: string | null
          fulfillment?: string | null
          id?: string
          images?: Json | null
          inventory?: string | null
          is_surface?: boolean | null
          pitch?: string | null
          price?: number | null
          sku?: string | null
          title?: string
          type?: string
          updated_at?: string | null
          variants?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "products_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
        ]
      }
      qr_settings: {
        Row: {
          artist_id: string
          created_at: string | null
          default_action: string | null
          fallback_action: string | null
          id: string
          updated_at: string | null
          utm_template: string | null
        }
        Insert: {
          artist_id: string
          created_at?: string | null
          default_action?: string | null
          fallback_action?: string | null
          id?: string
          updated_at?: string | null
          utm_template?: string | null
        }
        Update: {
          artist_id?: string
          created_at?: string | null
          default_action?: string | null
          fallback_action?: string | null
          id?: string
          updated_at?: string | null
          utm_template?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qr_settings_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: true
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          artist_id: string
          captions_url: string | null
          created_at: string | null
          duration: number | null
          explicit: boolean | null
          id: string
          is_featured: boolean | null
          kind: Database["public"]["Enums"]["video_kind"]
          provider: string | null
          provider_id: string | null
          published_at: string | null
          source: string | null
          status: Database["public"]["Enums"]["video_status"] | null
          tags: string[] | null
          thumb_url: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          artist_id: string
          captions_url?: string | null
          created_at?: string | null
          duration?: number | null
          explicit?: boolean | null
          id?: string
          is_featured?: boolean | null
          kind: Database["public"]["Enums"]["video_kind"]
          provider?: string | null
          provider_id?: string | null
          published_at?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["video_status"] | null
          tags?: string[] | null
          thumb_url?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          artist_id?: string
          captions_url?: string | null
          created_at?: string | null
          duration?: number | null
          explicit?: boolean | null
          id?: string
          is_featured?: boolean | null
          kind?: Database["public"]["Enums"]["video_kind"]
          provider?: string | null
          provider_id?: string | null
          published_at?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["video_status"] | null
          tags?: string[] | null
          thumb_url?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "videos_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
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
      pay_mode: "heartland_hosted" | "woo_heartland"
      publish_status: "draft" | "pending" | "scheduled" | "published"
      video_kind:
        | "music_video"
        | "performance_clip"
        | "poem"
        | "short_film"
        | "audio_only"
      video_status: "uploading" | "processing" | "ready" | "failed"
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
      pay_mode: ["heartland_hosted", "woo_heartland"],
      publish_status: ["draft", "pending", "scheduled", "published"],
      video_kind: [
        "music_video",
        "performance_clip",
        "poem",
        "short_film",
        "audio_only",
      ],
      video_status: ["uploading", "processing", "ready", "failed"],
    },
  },
} as const
