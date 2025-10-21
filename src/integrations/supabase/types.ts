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
      admin_notification_preferences: {
        Row: {
          admin_id: string
          created_at: string | null
          email_address: string | null
          email_enabled: boolean | null
          id: string
          notify_artist_limit_reached: boolean | null
          notify_copyright_detected: boolean | null
          notify_playlist_approval: boolean | null
          notify_stream_flagged: boolean | null
          notify_tier_change: boolean | null
          phone_number: string | null
          sms_enabled: boolean | null
          updated_at: string | null
        }
        Insert: {
          admin_id: string
          created_at?: string | null
          email_address?: string | null
          email_enabled?: boolean | null
          id?: string
          notify_artist_limit_reached?: boolean | null
          notify_copyright_detected?: boolean | null
          notify_playlist_approval?: boolean | null
          notify_stream_flagged?: boolean | null
          notify_tier_change?: boolean | null
          phone_number?: string | null
          sms_enabled?: boolean | null
          updated_at?: string | null
        }
        Update: {
          admin_id?: string
          created_at?: string | null
          email_address?: string | null
          email_enabled?: boolean | null
          id?: string
          notify_artist_limit_reached?: boolean | null
          notify_copyright_detected?: boolean | null
          notify_playlist_approval?: boolean | null
          notify_stream_flagged?: boolean | null
          notify_tier_change?: boolean | null
          phone_number?: string | null
          sms_enabled?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      admin_notifications: {
        Row: {
          admin_id: string
          created_at: string | null
          email_sent: boolean | null
          id: string
          in_app_read: boolean | null
          message: string
          metadata: Json | null
          read_at: string | null
          sms_sent: boolean | null
          title: string
          type: string
        }
        Insert: {
          admin_id: string
          created_at?: string | null
          email_sent?: boolean | null
          id?: string
          in_app_read?: boolean | null
          message: string
          metadata?: Json | null
          read_at?: string | null
          sms_sent?: boolean | null
          title: string
          type: string
        }
        Update: {
          admin_id?: string
          created_at?: string | null
          email_sent?: boolean | null
          id?: string
          in_app_read?: boolean | null
          message?: string
          metadata?: Json | null
          read_at?: string | null
          sms_sent?: boolean | null
          title?: string
          type?: string
        }
        Relationships: []
      }
      artist_applications: {
        Row: {
          admin_notes: string | null
          appeal_reason: string | null
          appeal_reviewed_at: string | null
          appeal_reviewed_by: string | null
          appeal_status: string | null
          appealed_at: string | null
          artist_name: string
          bio: string | null
          created_at: string | null
          id: string
          portfolio_links: Json | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          scene: string | null
          slug: string
          status: string
          submitted_at: string | null
          updated_at: string | null
          user_id: string
          why_join: string
        }
        Insert: {
          admin_notes?: string | null
          appeal_reason?: string | null
          appeal_reviewed_at?: string | null
          appeal_reviewed_by?: string | null
          appeal_status?: string | null
          appealed_at?: string | null
          artist_name: string
          bio?: string | null
          created_at?: string | null
          id?: string
          portfolio_links?: Json | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          scene?: string | null
          slug: string
          status?: string
          submitted_at?: string | null
          updated_at?: string | null
          user_id: string
          why_join: string
        }
        Update: {
          admin_notes?: string | null
          appeal_reason?: string | null
          appeal_reviewed_at?: string | null
          appeal_reviewed_by?: string | null
          appeal_status?: string | null
          appealed_at?: string | null
          artist_name?: string
          bio?: string | null
          created_at?: string | null
          id?: string
          portfolio_links?: Json | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          scene?: string | null
          slug?: string
          status?: string
          submitted_at?: string | null
          updated_at?: string | null
          user_id?: string
          why_join?: string
        }
        Relationships: []
      }
      artist_faqs: {
        Row: {
          answer: string
          artist_id: string
          created_at: string
          display_order: number
          id: string
          is_visible: boolean
          question: string
          updated_at: string
        }
        Insert: {
          answer: string
          artist_id: string
          created_at?: string
          display_order?: number
          id?: string
          is_visible?: boolean
          question: string
          updated_at?: string
        }
        Update: {
          answer?: string
          artist_id?: string
          created_at?: string
          display_order?: number
          id?: string
          is_visible?: boolean
          question?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "artist_faqs_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
        ]
      }
      artist_posts: {
        Row: {
          artist_id: string
          caption: string | null
          created_at: string
          display_order: number
          id: string
          media_type: Database["public"]["Enums"]["media_type"]
          media_url: string
          moderated_by: string | null
          moderation_notes: string | null
          moderation_status: string | null
          publish_status: Database["public"]["Enums"]["post_publish_status"]
          title: string
          updated_at: string
        }
        Insert: {
          artist_id: string
          caption?: string | null
          created_at?: string
          display_order?: number
          id?: string
          media_type?: Database["public"]["Enums"]["media_type"]
          media_url: string
          moderated_by?: string | null
          moderation_notes?: string | null
          moderation_status?: string | null
          publish_status?: Database["public"]["Enums"]["post_publish_status"]
          title: string
          updated_at?: string
        }
        Update: {
          artist_id?: string
          caption?: string | null
          created_at?: string
          display_order?: number
          id?: string
          media_type?: Database["public"]["Enums"]["media_type"]
          media_url?: string
          moderated_by?: string | null
          moderation_notes?: string | null
          moderation_status?: string | null
          publish_status?: Database["public"]["Enums"]["post_publish_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "artist_posts_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
        ]
      }
      artist_social_stats: {
        Row: {
          artist_id: string
          created_at: string | null
          followers_count: number | null
          id: string
          is_visible: boolean | null
          last_updated: string | null
          metrics: Json | null
          platform: string
          profile_url: string | null
          show_stats: boolean | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          artist_id: string
          created_at?: string | null
          followers_count?: number | null
          id?: string
          is_visible?: boolean | null
          last_updated?: string | null
          metrics?: Json | null
          platform: string
          profile_url?: string | null
          show_stats?: boolean | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          artist_id?: string
          created_at?: string | null
          followers_count?: number | null
          id?: string
          is_visible?: boolean | null
          last_updated?: string | null
          metrics?: Json | null
          platform?: string
          profile_url?: string | null
          show_stats?: boolean | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "artist_social_stats_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
        ]
      }
      artist_verification_requests: {
        Row: {
          admin_review_notes: string | null
          admin_reviewed_at: string | null
          admin_reviewed_by: string | null
          artist_id: string
          created_at: string | null
          final_review_notes: string | null
          final_reviewed_at: string | null
          final_reviewed_by: string | null
          id: string
          notes: string | null
          rejection_reason: string | null
          requested_at: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string | null
          verification_evidence: Json | null
          verification_method: string | null
          verified_platforms: string[] | null
        }
        Insert: {
          admin_review_notes?: string | null
          admin_reviewed_at?: string | null
          admin_reviewed_by?: string | null
          artist_id: string
          created_at?: string | null
          final_review_notes?: string | null
          final_reviewed_at?: string | null
          final_reviewed_by?: string | null
          id?: string
          notes?: string | null
          rejection_reason?: string | null
          requested_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string | null
          verification_evidence?: Json | null
          verification_method?: string | null
          verified_platforms?: string[] | null
        }
        Update: {
          admin_review_notes?: string | null
          admin_reviewed_at?: string | null
          admin_reviewed_by?: string | null
          artist_id?: string
          created_at?: string | null
          final_review_notes?: string | null
          final_reviewed_at?: string | null
          final_reviewed_by?: string | null
          id?: string
          notes?: string | null
          rejection_reason?: string | null
          requested_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string | null
          verification_evidence?: Json | null
          verification_method?: string | null
          verified_platforms?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "artist_verification_requests_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
        ]
      }
      artists: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          bio_long: string | null
          bio_short: string | null
          brand: Json | null
          city: string | null
          country: string | null
          created_at: string | null
          display_name: string
          email: string
          id: string
          is_verified: boolean | null
          payout_paypal_email: string | null
          payout_primary_method: string | null
          payout_venmo_email: string | null
          payout_zelle_email: string | null
          postal_code: string | null
          pronouns: string | null
          scene: string | null
          slug: string
          socials: Json | null
          state: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_expires_at: string | null
          subscription_started_at: string | null
          subscription_tier:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          tz: string | null
          updated_at: string | null
          user_id: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          bio_long?: string | null
          bio_short?: string | null
          brand?: Json | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          display_name: string
          email: string
          id?: string
          is_verified?: boolean | null
          payout_paypal_email?: string | null
          payout_primary_method?: string | null
          payout_venmo_email?: string | null
          payout_zelle_email?: string | null
          postal_code?: string | null
          pronouns?: string | null
          scene?: string | null
          slug: string
          socials?: Json | null
          state?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_expires_at?: string | null
          subscription_started_at?: string | null
          subscription_tier?:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          tz?: string | null
          updated_at?: string | null
          user_id: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          bio_long?: string | null
          bio_short?: string | null
          brand?: Json | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          display_name?: string
          email?: string
          id?: string
          is_verified?: boolean | null
          payout_paypal_email?: string | null
          payout_primary_method?: string | null
          payout_venmo_email?: string | null
          payout_zelle_email?: string | null
          postal_code?: string | null
          pronouns?: string | null
          scene?: string | null
          slug?: string
          socials?: Json | null
          state?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_expires_at?: string | null
          subscription_started_at?: string | null
          subscription_tier?:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          tz?: string | null
          updated_at?: string | null
          user_id?: string
          verified_at?: string | null
          verified_by?: string | null
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
      content_moderation_queue: {
        Row: {
          action_type: string
          artist_id: string
          can_retract_until: string | null
          content_id: string
          content_preview: Json | null
          content_type: string
          created_at: string | null
          id: string
          moderation_notes: string | null
          priority: number | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          sla_due_at: string | null
          status: string
          submitted_at: string | null
          updated_at: string | null
        }
        Insert: {
          action_type: string
          artist_id: string
          can_retract_until?: string | null
          content_id: string
          content_preview?: Json | null
          content_type: string
          created_at?: string | null
          id?: string
          moderation_notes?: string | null
          priority?: number | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sla_due_at?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string | null
        }
        Update: {
          action_type?: string
          artist_id?: string
          can_retract_until?: string | null
          content_id?: string
          content_preview?: Json | null
          content_type?: string
          created_at?: string | null
          id?: string
          moderation_notes?: string | null
          priority?: number | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sla_due_at?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_moderation_queue_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
        ]
      }
      domain_verifications: {
        Row: {
          artist_id: string
          created_at: string | null
          dns_check_results: Json | null
          domain: string
          id: string
          last_checked_at: string | null
          updated_at: string | null
          verification_status: string | null
          verification_token: string
          verified_at: string | null
        }
        Insert: {
          artist_id: string
          created_at?: string | null
          dns_check_results?: Json | null
          domain: string
          id?: string
          last_checked_at?: string | null
          updated_at?: string | null
          verification_status?: string | null
          verification_token: string
          verified_at?: string | null
        }
        Update: {
          artist_id?: string
          created_at?: string | null
          dns_check_results?: Json | null
          domain?: string
          id?: string
          last_checked_at?: string | null
          updated_at?: string | null
          verification_status?: string | null
          verification_token?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "domain_verifications_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          approval_status: string | null
          approved_by: string | null
          artist_id: string
          created_at: string | null
          description: string | null
          duration: number | null
          geo: Json | null
          id: string
          livepush_stream_id: string | null
          livestream_source: string | null
          livestream_status: string | null
          moderated_by: string | null
          moderation_notes: string | null
          moderation_status: string | null
          multistream_destinations: Json | null
          poster_url: string | null
          qr_code_enabled: boolean | null
          qr_code_position: string | null
          rtmp_url: string | null
          starts_at: string
          stream_key: string | null
          stripe_price_id: string | null
          ticket_currency: string | null
          ticket_price: number | null
          ticket_type: string | null
          ticket_url: string | null
          title: string
          updated_at: string | null
          venue: string | null
        }
        Insert: {
          approval_status?: string | null
          approved_by?: string | null
          artist_id: string
          created_at?: string | null
          description?: string | null
          duration?: number | null
          geo?: Json | null
          id?: string
          livepush_stream_id?: string | null
          livestream_source?: string | null
          livestream_status?: string | null
          moderated_by?: string | null
          moderation_notes?: string | null
          moderation_status?: string | null
          multistream_destinations?: Json | null
          poster_url?: string | null
          qr_code_enabled?: boolean | null
          qr_code_position?: string | null
          rtmp_url?: string | null
          starts_at: string
          stream_key?: string | null
          stripe_price_id?: string | null
          ticket_currency?: string | null
          ticket_price?: number | null
          ticket_type?: string | null
          ticket_url?: string | null
          title: string
          updated_at?: string | null
          venue?: string | null
        }
        Update: {
          approval_status?: string | null
          approved_by?: string | null
          artist_id?: string
          created_at?: string | null
          description?: string | null
          duration?: number | null
          geo?: Json | null
          id?: string
          livepush_stream_id?: string | null
          livestream_source?: string | null
          livestream_status?: string | null
          moderated_by?: string | null
          moderation_notes?: string | null
          moderation_status?: string | null
          multistream_destinations?: Json | null
          poster_url?: string | null
          qr_code_enabled?: boolean | null
          qr_code_position?: string | null
          rtmp_url?: string | null
          starts_at?: string
          stream_key?: string | null
          stripe_price_id?: string | null
          ticket_currency?: string | null
          ticket_price?: number | null
          ticket_type?: string | null
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
      livepush_artist_permissions: {
        Row: {
          artist_id: string
          copyright_check_enabled: boolean | null
          created_at: string | null
          current_month_stream_hours: number | null
          id: string
          is_suspended: boolean | null
          is_trusted_artist: boolean | null
          last_stream_reset_at: string | null
          livepush_enabled: boolean | null
          livepush_stream_id: string | null
          max_concurrent_streams: number | null
          max_monthly_stream_hours: number | null
          max_multistream_destinations: number | null
          max_playlist_videos: number | null
          multistreaming_enabled: boolean | null
          playlist_streams_enabled: boolean | null
          requires_approval: boolean | null
          suspension_reason: string | null
          updated_at: string | null
        }
        Insert: {
          artist_id: string
          copyright_check_enabled?: boolean | null
          created_at?: string | null
          current_month_stream_hours?: number | null
          id?: string
          is_suspended?: boolean | null
          is_trusted_artist?: boolean | null
          last_stream_reset_at?: string | null
          livepush_enabled?: boolean | null
          livepush_stream_id?: string | null
          max_concurrent_streams?: number | null
          max_monthly_stream_hours?: number | null
          max_multistream_destinations?: number | null
          max_playlist_videos?: number | null
          multistreaming_enabled?: boolean | null
          playlist_streams_enabled?: boolean | null
          requires_approval?: boolean | null
          suspension_reason?: string | null
          updated_at?: string | null
        }
        Update: {
          artist_id?: string
          copyright_check_enabled?: boolean | null
          created_at?: string | null
          current_month_stream_hours?: number | null
          id?: string
          is_suspended?: boolean | null
          is_trusted_artist?: boolean | null
          last_stream_reset_at?: string | null
          livepush_enabled?: boolean | null
          livepush_stream_id?: string | null
          max_concurrent_streams?: number | null
          max_monthly_stream_hours?: number | null
          max_multistream_destinations?: number | null
          max_playlist_videos?: number | null
          multistreaming_enabled?: boolean | null
          playlist_streams_enabled?: boolean | null
          requires_approval?: boolean | null
          suspension_reason?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "livepush_artist_permissions_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: true
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
        ]
      }
      livepush_videos: {
        Row: {
          approval_notes: string | null
          approval_status: string | null
          approved_by: string | null
          artist_id: string
          copyright_details: Json | null
          copyright_detected: boolean | null
          created_at: string | null
          id: string
          last_synced_at: string | null
          livepush_id: string | null
          livepush_url: string | null
          sync_error: string | null
          sync_started_at: string | null
          sync_status: string | null
          updated_at: string | null
          video_id: string
        }
        Insert: {
          approval_notes?: string | null
          approval_status?: string | null
          approved_by?: string | null
          artist_id: string
          copyright_details?: Json | null
          copyright_detected?: boolean | null
          created_at?: string | null
          id?: string
          last_synced_at?: string | null
          livepush_id?: string | null
          livepush_url?: string | null
          sync_error?: string | null
          sync_started_at?: string | null
          sync_status?: string | null
          updated_at?: string | null
          video_id: string
        }
        Update: {
          approval_notes?: string | null
          approval_status?: string | null
          approved_by?: string | null
          artist_id?: string
          copyright_details?: Json | null
          copyright_detected?: boolean | null
          created_at?: string | null
          id?: string
          last_synced_at?: string | null
          livepush_id?: string | null
          livepush_url?: string | null
          sync_error?: string | null
          sync_started_at?: string | null
          sync_status?: string | null
          updated_at?: string | null
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "livepush_videos_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "livepush_videos_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: true
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      member_playlists: {
        Row: {
          content_type: string | null
          created_at: string
          description: string | null
          id: string
          is_public: boolean | null
          name: string
          updated_at: string
          user_id: string
          video_ids: string[] | null
        }
        Insert: {
          content_type?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          updated_at?: string
          user_id: string
          video_ids?: string[] | null
        }
        Update: {
          content_type?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          updated_at?: string
          user_id?: string
          video_ids?: string[] | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          admin_email_sent: boolean | null
          artist_id: string
          created_at: string
          customer_email: string
          customer_email_sent: boolean | null
          customer_name: string | null
          fulfillment_status: string
          id: string
          printify_product_id: string | null
          product_id: string | null
          product_name: string
          product_variant: string | null
          quantity: number
          shipping_carrier: string | null
          stripe_session_id: string
          total_amount: number
          tracking_number: string | null
        }
        Insert: {
          admin_email_sent?: boolean | null
          artist_id: string
          created_at?: string
          customer_email: string
          customer_email_sent?: boolean | null
          customer_name?: string | null
          fulfillment_status?: string
          id?: string
          printify_product_id?: string | null
          product_id?: string | null
          product_name: string
          product_variant?: string | null
          quantity?: number
          shipping_carrier?: string | null
          stripe_session_id: string
          total_amount: number
          tracking_number?: string | null
        }
        Update: {
          admin_email_sent?: boolean | null
          artist_id?: string
          created_at?: string
          customer_email?: string
          customer_email_sent?: boolean | null
          customer_name?: string | null
          fulfillment_status?: string
          id?: string
          printify_product_id?: string | null
          product_id?: string | null
          product_name?: string
          product_variant?: string | null
          quantity?: number
          shipping_carrier?: string | null
          stripe_session_id?: string
          total_amount?: number
          tracking_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      port_settings: {
        Row: {
          artist_id: string
          background_type: string | null
          background_value: string | null
          background_video_url: string | null
          commenting: string | null
          created_at: string | null
          custom_domain: string | null
          custom_domain_dns_instructions: Json | null
          custom_domain_verified: boolean | null
          custom_domain_verified_at: string | null
          go_live_at: string | null
          h1_color: string | null
          h2_color: string | null
          h3_color: string | null
          h4_color: string | null
          id: string
          max_products: number | null
          moderated_by: string | null
          moderation_notes: string | null
          moderation_status: string | null
          pixels: Json | null
          publish_requested_at: string | null
          publish_status: Database["public"]["Enums"]["publish_status"] | null
          published_at: string | null
          rejection_reason: string | null
          seo: Json | null
          text_lg_color: string | null
          text_md_color: string | null
          text_sm_color: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          artist_id: string
          background_type?: string | null
          background_value?: string | null
          background_video_url?: string | null
          commenting?: string | null
          created_at?: string | null
          custom_domain?: string | null
          custom_domain_dns_instructions?: Json | null
          custom_domain_verified?: boolean | null
          custom_domain_verified_at?: string | null
          go_live_at?: string | null
          h1_color?: string | null
          h2_color?: string | null
          h3_color?: string | null
          h4_color?: string | null
          id?: string
          max_products?: number | null
          moderated_by?: string | null
          moderation_notes?: string | null
          moderation_status?: string | null
          pixels?: Json | null
          publish_requested_at?: string | null
          publish_status?: Database["public"]["Enums"]["publish_status"] | null
          published_at?: string | null
          rejection_reason?: string | null
          seo?: Json | null
          text_lg_color?: string | null
          text_md_color?: string | null
          text_sm_color?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          artist_id?: string
          background_type?: string | null
          background_value?: string | null
          background_video_url?: string | null
          commenting?: string | null
          created_at?: string | null
          custom_domain?: string | null
          custom_domain_dns_instructions?: Json | null
          custom_domain_verified?: boolean | null
          custom_domain_verified_at?: string | null
          go_live_at?: string | null
          h1_color?: string | null
          h2_color?: string | null
          h3_color?: string | null
          h4_color?: string | null
          id?: string
          max_products?: number | null
          moderated_by?: string | null
          moderation_notes?: string | null
          moderation_status?: string | null
          pixels?: Json | null
          publish_requested_at?: string | null
          publish_status?: Database["public"]["Enums"]["publish_status"] | null
          published_at?: string | null
          rejection_reason?: string | null
          seo?: Json | null
          text_lg_color?: string | null
          text_md_color?: string | null
          text_sm_color?: string | null
          updated_at?: string | null
          user_id?: string | null
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
      printify_products: {
        Row: {
          created_at: string | null
          id: string
          print_provider_id: number | null
          printify_blueprint_id: string | null
          printify_product_id: string
          product_id: string
          shop_id: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          print_provider_id?: number | null
          printify_blueprint_id?: string | null
          printify_product_id: string
          product_id: string
          shop_id?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          print_provider_id?: number | null
          printify_blueprint_id?: string | null
          printify_product_id?: string
          product_id?: string
          shop_id?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "printify_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      production_managers: {
        Row: {
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          name: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          artist_id: string
          created_at: string | null
          currency: string | null
          description: string | null
          fulfillment: string | null
          id: string
          images: Json | null
          inventory: string | null
          is_surface: boolean | null
          link: string
          long_description: string | null
          moderated_by: string | null
          moderation_notes: string | null
          moderation_status: string | null
          payment_type: string | null
          pitch: string | null
          price: number | null
          sku: string | null
          stripe_price_id: string | null
          title: string
          type: string
          updated_at: string | null
          variants: Json | null
        }
        Insert: {
          artist_id: string
          created_at?: string | null
          currency?: string | null
          description?: string | null
          fulfillment?: string | null
          id?: string
          images?: Json | null
          inventory?: string | null
          is_surface?: boolean | null
          link?: string
          long_description?: string | null
          moderated_by?: string | null
          moderation_notes?: string | null
          moderation_status?: string | null
          payment_type?: string | null
          pitch?: string | null
          price?: number | null
          sku?: string | null
          stripe_price_id?: string | null
          title: string
          type: string
          updated_at?: string | null
          variants?: Json | null
        }
        Update: {
          artist_id?: string
          created_at?: string | null
          currency?: string | null
          description?: string | null
          fulfillment?: string | null
          id?: string
          images?: Json | null
          inventory?: string | null
          is_surface?: boolean | null
          link?: string
          long_description?: string | null
          moderated_by?: string | null
          moderation_notes?: string | null
          moderation_status?: string | null
          payment_type?: string | null
          pitch?: string | null
          price?: number | null
          sku?: string | null
          stripe_price_id?: string | null
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
      social_analytics: {
        Row: {
          artist_id: string
          comments: number | null
          created_at: string | null
          engagement_rate: number | null
          id: string
          impressions: number | null
          likes: number | null
          platform: string
          reach: number | null
          saves: number | null
          shares: number | null
          social_post_id: string
          synced_at: string | null
        }
        Insert: {
          artist_id: string
          comments?: number | null
          created_at?: string | null
          engagement_rate?: number | null
          id?: string
          impressions?: number | null
          likes?: number | null
          platform: string
          reach?: number | null
          saves?: number | null
          shares?: number | null
          social_post_id: string
          synced_at?: string | null
        }
        Update: {
          artist_id?: string
          comments?: number | null
          created_at?: string | null
          engagement_rate?: number | null
          id?: string
          impressions?: number | null
          likes?: number | null
          platform?: string
          reach?: number | null
          saves?: number | null
          shares?: number | null
          social_post_id?: string
          synced_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "social_analytics_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_analytics_social_post_id_fkey"
            columns: ["social_post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      social_connections: {
        Row: {
          access_token: string
          artist_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          last_synced_at: string | null
          platform: string
          platform_user_id: string
          platform_username: string | null
          refresh_token: string | null
          token_expires_at: string | null
          updated_at: string | null
        }
        Insert: {
          access_token: string
          artist_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_synced_at?: string | null
          platform: string
          platform_user_id: string
          platform_username?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
        }
        Update: {
          access_token?: string
          artist_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_synced_at?: string | null
          platform?: string
          platform_user_id?: string
          platform_username?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "social_connections_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
        ]
      }
      social_posts: {
        Row: {
          artist_id: string
          caption: string | null
          created_at: string | null
          id: string
          media_url: string | null
          permalink: string | null
          platform: string
          platform_post_id: string
          post_type: string | null
          posted_at: string | null
        }
        Insert: {
          artist_id: string
          caption?: string | null
          created_at?: string | null
          id?: string
          media_url?: string | null
          permalink?: string | null
          platform: string
          platform_post_id: string
          post_type?: string | null
          posted_at?: string | null
        }
        Update: {
          artist_id?: string
          caption?: string | null
          created_at?: string | null
          id?: string
          media_url?: string | null
          permalink?: string | null
          platform?: string
          platform_post_id?: string
          post_type?: string | null
          posted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "social_posts_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
        ]
      }
      stream_donations: {
        Row: {
          amount: number
          artist_id: string
          created_at: string | null
          donor_name: string | null
          event_id: string | null
          id: string
          message: string | null
          payment_method: string | null
          shown_on_stream: boolean | null
          stream_id: string | null
          transaction_id: string | null
        }
        Insert: {
          amount: number
          artist_id: string
          created_at?: string | null
          donor_name?: string | null
          event_id?: string | null
          id?: string
          message?: string | null
          payment_method?: string | null
          shown_on_stream?: boolean | null
          stream_id?: string | null
          transaction_id?: string | null
        }
        Update: {
          amount?: number
          artist_id?: string
          created_at?: string | null
          donor_name?: string | null
          event_id?: string | null
          id?: string
          message?: string | null
          payment_method?: string | null
          shown_on_stream?: boolean | null
          stream_id?: string | null
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stream_donations_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stream_donations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stream_donations_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "stream_playlists"
            referencedColumns: ["id"]
          },
        ]
      }
      stream_markers: {
        Row: {
          created_at: string | null
          event_id: string | null
          id: string
          label: string
          marker_type: string | null
          stream_id: string | null
          timestamp_seconds: number
        }
        Insert: {
          created_at?: string | null
          event_id?: string | null
          id?: string
          label: string
          marker_type?: string | null
          stream_id?: string | null
          timestamp_seconds: number
        }
        Update: {
          created_at?: string | null
          event_id?: string | null
          id?: string
          label?: string
          marker_type?: string | null
          stream_id?: string | null
          timestamp_seconds?: number
        }
        Relationships: [
          {
            foreignKeyName: "stream_markers_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stream_markers_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "stream_playlists"
            referencedColumns: ["id"]
          },
        ]
      }
      stream_playlists: {
        Row: {
          approval_notes: string | null
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          artist_id: string
          auto_start: boolean | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          livepush_stream_id: string | null
          loop_count: number | null
          loop_mode: string | null
          multistream_destinations: Json | null
          name: string
          qr_code_enabled: boolean | null
          qr_code_position: string | null
          qr_code_url: string | null
          rtmp_url: string | null
          scheduled_end_at: string | null
          scheduled_start_at: string | null
          shuffle: boolean | null
          status: string | null
          stream_key: string | null
          updated_at: string | null
          video_ids: string[]
          video_order: Json | null
          viewer_count: number | null
        }
        Insert: {
          approval_notes?: string | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          artist_id: string
          auto_start?: boolean | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          livepush_stream_id?: string | null
          loop_count?: number | null
          loop_mode?: string | null
          multistream_destinations?: Json | null
          name: string
          qr_code_enabled?: boolean | null
          qr_code_position?: string | null
          qr_code_url?: string | null
          rtmp_url?: string | null
          scheduled_end_at?: string | null
          scheduled_start_at?: string | null
          shuffle?: boolean | null
          status?: string | null
          stream_key?: string | null
          updated_at?: string | null
          video_ids: string[]
          video_order?: Json | null
          viewer_count?: number | null
        }
        Update: {
          approval_notes?: string | null
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          artist_id?: string
          auto_start?: boolean | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          livepush_stream_id?: string | null
          loop_count?: number | null
          loop_mode?: string | null
          multistream_destinations?: Json | null
          name?: string
          qr_code_enabled?: boolean | null
          qr_code_position?: string | null
          qr_code_url?: string | null
          rtmp_url?: string | null
          scheduled_end_at?: string | null
          scheduled_start_at?: string | null
          shuffle?: boolean | null
          status?: string | null
          stream_key?: string | null
          updated_at?: string | null
          video_ids?: string[]
          video_order?: Json | null
          viewer_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stream_playlists_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
        ]
      }
      stream_tracklists: {
        Row: {
          artist_name: string
          created_at: string | null
          duration_seconds: number | null
          event_id: string | null
          id: string
          label: string | null
          stream_id: string | null
          timestamp_seconds: number | null
          track_name: string
          track_number: number
        }
        Insert: {
          artist_name: string
          created_at?: string | null
          duration_seconds?: number | null
          event_id?: string | null
          id?: string
          label?: string | null
          stream_id?: string | null
          timestamp_seconds?: number | null
          track_name: string
          track_number: number
        }
        Update: {
          artist_name?: string
          created_at?: string | null
          duration_seconds?: number | null
          event_id?: string | null
          id?: string
          label?: string | null
          stream_id?: string | null
          timestamp_seconds?: number | null
          track_name?: string
          track_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "stream_tracklists_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stream_tracklists_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "stream_playlists"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_history: {
        Row: {
          action: string
          amount_paid: number | null
          artist_id: string
          changed_at: string | null
          changed_by: string | null
          id: string
          previous_tier: Database["public"]["Enums"]["subscription_tier"] | null
          stripe_invoice_id: string | null
          tier: Database["public"]["Enums"]["subscription_tier"]
        }
        Insert: {
          action: string
          amount_paid?: number | null
          artist_id: string
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          previous_tier?:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          stripe_invoice_id?: string | null
          tier: Database["public"]["Enums"]["subscription_tier"]
        }
        Update: {
          action?: string
          amount_paid?: number | null
          artist_id?: string
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          previous_tier?:
            | Database["public"]["Enums"]["subscription_tier"]
            | null
          stripe_invoice_id?: string | null
          tier?: Database["public"]["Enums"]["subscription_tier"]
        }
        Relationships: [
          {
            foreignKeyName: "subscription_history_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
        ]
      }
      tips: {
        Row: {
          admin_email_sent: boolean | null
          amount: number
          artist_id: string
          artist_name: string
          artist_share: number | null
          artist_slug: string
          created_at: string | null
          id: string
          payout_date: string | null
          payout_notes: string | null
          payout_reference: string | null
          payout_status: string | null
          stripe_session_id: string
          tipper_email: string
          tipper_email_sent: boolean | null
        }
        Insert: {
          admin_email_sent?: boolean | null
          amount: number
          artist_id: string
          artist_name: string
          artist_share?: number | null
          artist_slug: string
          created_at?: string | null
          id?: string
          payout_date?: string | null
          payout_notes?: string | null
          payout_reference?: string | null
          payout_status?: string | null
          stripe_session_id: string
          tipper_email: string
          tipper_email_sent?: boolean | null
        }
        Update: {
          admin_email_sent?: boolean | null
          amount?: number
          artist_id?: string
          artist_name?: string
          artist_share?: number | null
          artist_slug?: string
          created_at?: string | null
          id?: string
          payout_date?: string | null
          payout_notes?: string | null
          payout_reference?: string | null
          payout_status?: string | null
          stripe_session_id?: string
          tipper_email?: string
          tipper_email_sent?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "tips_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          display_name: string | null
          email: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          granted_at: string | null
          granted_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
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
          moderated_by: string | null
          moderation_notes: string | null
          moderation_status: string | null
          provider: string | null
          provider_id: string | null
          published_at: string | null
          source: string | null
          status: Database["public"]["Enums"]["video_status"] | null
          tags: string[] | null
          thumb_url: string | null
          title: string
          updated_at: string | null
          video_url: string | null
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
          moderated_by?: string | null
          moderation_notes?: string | null
          moderation_status?: string | null
          provider?: string | null
          provider_id?: string | null
          published_at?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["video_status"] | null
          tags?: string[] | null
          thumb_url?: string | null
          title: string
          updated_at?: string | null
          video_url?: string | null
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
          moderated_by?: string | null
          moderation_notes?: string | null
          moderation_status?: string | null
          provider?: string | null
          provider_id?: string | null
          published_at?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["video_status"] | null
          tags?: string[] | null
          thumb_url?: string | null
          title?: string
          updated_at?: string | null
          video_url?: string | null
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
      approve_artist_application: {
        Args: { admin_id: string; admin_notes?: string; application_id: string }
        Returns: Json
      }
      get_user_primary_role: {
        Args: { user_id_param: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_artist: {
        Args: { user_id_param: string }
        Returns: boolean
      }
      is_artist_owner: {
        Args: { _artist_id: string }
        Returns: boolean
      }
      should_auto_approve_content: {
        Args: { artist_id_param: string }
        Returns: boolean
      }
      within_retraction_window: {
        Args: { published_timestamp: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "artist"
        | "moderator"
        | "production_manager"
        | "fan"
        | "member"
      media_type: "image" | "video"
      pay_mode: "heartland_hosted" | "woo_heartland"
      post_publish_status: "draft" | "published" | "archived"
      publish_status: "draft" | "pending" | "scheduled" | "published"
      subscription_tier: "free" | "pro" | "premium"
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
      app_role: [
        "admin",
        "artist",
        "moderator",
        "production_manager",
        "fan",
        "member",
      ],
      media_type: ["image", "video"],
      pay_mode: ["heartland_hosted", "woo_heartland"],
      post_publish_status: ["draft", "published", "archived"],
      publish_status: ["draft", "pending", "scheduled", "published"],
      subscription_tier: ["free", "pro", "premium"],
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
