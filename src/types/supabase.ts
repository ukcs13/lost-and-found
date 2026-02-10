export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          updated_at: string | null
          created_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          updated_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
          updated_at?: string | null
          created_at?: string
        }
      }
      items: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string
          type: 'lost' | 'found'
          category: string
          status: 'open' | 'resolved' | 'closed'
          location_name: string | null
          latitude: number | null
          longitude: number | null
          date_lost_found: string | null
          images: string[] | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description: string
          type: 'lost' | 'found'
          category: string
          status?: 'open' | 'resolved' | 'closed'
          location_name?: string | null
          latitude?: number | null
          longitude?: number | null
          date_lost_found?: string | null
          images?: string[] | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string
          type?: 'lost' | 'found'
          category?: string
          status?: 'open' | 'resolved' | 'closed'
          location_name?: string | null
          latitude?: number | null
          longitude?: number | null
          date_lost_found?: string | null
          images?: string[] | null
          created_at?: string
          updated_at?: string | null
        }
      }
      messages: {
        Row: {
          id: string
          sender_id: string
          receiver_id: string
          item_id: string
          content: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          sender_id: string
          receiver_id: string
          item_id: string
          content: string
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          sender_id?: string
          receiver_id?: string
          item_id?: string
          content?: string
          is_read?: boolean
          created_at?: string
        }
      }
    }
    Functions: {
      get_items_nearby: {
        Args: {
          lat: number
          long: number
          radius_km: number
        }
        Returns: Database['public']['Tables']['items']['Row'][]
      }
    }
  }
}
