export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '14.5';
  };
  public: {
    Tables: {
      driver_preferences: {
        Row: {
          created_at: string;
          default_navigation_app: string;
          driver_id: string;
          first_ride_summary_enabled: boolean;
          first_ride_summary_lead_time_minutes: number;
          notifications_enabled: boolean;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          default_navigation_app?: string;
          driver_id: string;
          first_ride_summary_enabled?: boolean;
          first_ride_summary_lead_time_minutes?: number;
          notifications_enabled?: boolean;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          default_navigation_app?: string;
          driver_id?: string;
          first_ride_summary_enabled?: boolean;
          first_ride_summary_lead_time_minutes?: number;
          notifications_enabled?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'driver_preferences_driver_id_fkey';
            columns: ['driver_id'];
            isOneToOne: true;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          full_name: string | null;
          id: string;
          is_admin: boolean;
          phone: string | null;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          full_name?: string | null;
          id: string;
          is_admin?: boolean;
          phone?: string | null;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          full_name?: string | null;
          id?: string;
          is_admin?: boolean;
          phone?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      ride_audit_log: {
        Row: {
          action: string;
          actor_user_id: string | null;
          created_at: string;
          driver_id: string | null;
          entity_type: string;
          id: string;
          new_data: Json | null;
          notes: string | null;
          old_data: Json | null;
          trip_group_id: string | null;
          trip_leg_id: string | null;
          trip_occurrence_id: string | null;
        };
        Insert: {
          action: string;
          actor_user_id?: string | null;
          created_at?: string;
          driver_id?: string | null;
          entity_type: string;
          id?: string;
          new_data?: Json | null;
          notes?: string | null;
          old_data?: Json | null;
          trip_group_id?: string | null;
          trip_leg_id?: string | null;
          trip_occurrence_id?: string | null;
        };
        Update: {
          action?: string;
          actor_user_id?: string | null;
          created_at?: string;
          driver_id?: string | null;
          entity_type?: string;
          id?: string;
          new_data?: Json | null;
          notes?: string | null;
          old_data?: Json | null;
          trip_group_id?: string | null;
          trip_leg_id?: string | null;
          trip_occurrence_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'ride_audit_log_actor_user_id_fkey';
            columns: ['actor_user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ride_audit_log_driver_id_fkey';
            columns: ['driver_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ride_audit_log_trip_group_id_fkey';
            columns: ['trip_group_id'];
            isOneToOne: false;
            referencedRelation: 'trip_groups';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ride_audit_log_trip_leg_id_fkey';
            columns: ['trip_leg_id'];
            isOneToOne: false;
            referencedRelation: 'trip_legs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'ride_audit_log_trip_occurrence_id_fkey';
            columns: ['trip_occurrence_id'];
            isOneToOne: false;
            referencedRelation: 'trip_occurrences';
            referencedColumns: ['id'];
          },
        ];
      };
      trip_groups: {
        Row: {
          created_at: string;
          driver_id: string;
          id: string;
          notes: string;
          pay_amount: number;
          phone: string | null;
          recurrence_days: number[];
          recurrence_type: string;
          rider_name: string;
          trip_type: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          driver_id: string;
          id?: string;
          notes?: string;
          pay_amount?: number;
          phone?: string | null;
          recurrence_days?: number[];
          recurrence_type?: string;
          rider_name: string;
          trip_type: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          driver_id?: string;
          id?: string;
          notes?: string;
          pay_amount?: number;
          phone?: string | null;
          recurrence_days?: number[];
          recurrence_type?: string;
          rider_name?: string;
          trip_type?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'trip_groups_driver_id_fkey';
            columns: ['driver_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      trip_legs: {
        Row: {
          created_at: string;
          dropoff_address: string;
          id: string;
          leg_type: string;
          pickup_address: string;
          pickup_time: string;
          status: string;
          trip_occurrence_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          dropoff_address: string;
          id?: string;
          leg_type: string;
          pickup_address: string;
          pickup_time: string;
          status?: string;
          trip_occurrence_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          dropoff_address?: string;
          id?: string;
          leg_type?: string;
          pickup_address?: string;
          pickup_time?: string;
          status?: string;
          trip_occurrence_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'trip_legs_trip_occurrence_id_fkey';
            columns: ['trip_occurrence_id'];
            isOneToOne: false;
            referencedRelation: 'trip_occurrences';
            referencedColumns: ['id'];
          },
        ];
      };
      trip_occurrences: {
        Row: {
          canceled_at: string | null;
          cancellation_reason: string | null;
          completed_at: string | null;
          picked_up_at: string | null;
          created_at: string;
          id: string;
          override_pay_amount: number | null;
          service_date: string;
          status: string;
          status_changed_at: string;
          trip_group_id: string;
          updated_at: string;
          verification_meta: Json;
          verification_note: string | null;
        };
        Insert: {
          canceled_at?: string | null;
          cancellation_reason?: string | null;
          completed_at?: string | null;
          picked_up_at?: string | null;
          created_at?: string;
          id?: string;
          override_pay_amount?: number | null;
          service_date: string;
          status?: string;
          status_changed_at?: string;
          trip_group_id: string;
          updated_at?: string;
          verification_meta?: Json;
          verification_note?: string | null;
        };
        Update: {
          canceled_at?: string | null;
          cancellation_reason?: string | null;
          completed_at?: string | null;
          picked_up_at?: string | null;
          created_at?: string;
          id?: string;
          override_pay_amount?: number | null;
          service_date?: string;
          status?: string;
          status_changed_at?: string;
          trip_group_id?: string;
          updated_at?: string;
          verification_meta?: Json;
          verification_note?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'trip_occurrences_trip_group_id_fkey';
            columns: ['trip_group_id'];
            isOneToOne: false;
            referencedRelation: 'trip_groups';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      admin_driver_stats: {
        Args: {
          report_date?: string;
        };
        Returns: {
          active_riders: number;
          canceled_rides_week: number;
          completed_rides_week: number;
          created_at: string;
          driver_id: string;
          dropoffs_week: number;
          email: string | null;
          full_name: string | null;
          is_admin: boolean;
          last_activity_at: string | null;
          next_pickup_at: string | null;
          rides_today: number;
          total_trip_groups: number;
          upcoming_rides: number;
        }[];
      };
      current_user_is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;
type DefaultSchema = DatabaseWithoutInternals['public'];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends { Row: infer R }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends { Insert: infer I }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends { Update: infer U }
      ? U
      : never
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
