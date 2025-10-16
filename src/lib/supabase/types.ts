export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '12.2.12 (cd3cf9e)'
  }
  public: {
    Tables: {
      categories: {
        Row: {
          color: string
          created_at: string
          icon: string
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category_id: string
          created_at: string
          currency: string | null
          expense_date: string
          id: string
          name: string
          original_amount: number | null
          original_currency: string | null
          plan_id: string
          plan_item_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          category_id: string
          created_at?: string | null
          currency?: string | null
          expense_date?: string
          id?: string
          name: string
          original_amount?: number | null
          original_currency?: string | null
          plan_id: string
          plan_item_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          category_id?: string
          created_at?: string | null
          currency?: string | null
          expense_date?: string
          id?: string
          name?: string
          original_amount?: number | null
          original_currency?: string | null
          plan_id?: string
          plan_item_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'expenses_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'expenses_plan_id_fkey'
            columns: ['plan_id']
            isOneToOne: false
            referencedRelation: 'plans'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'expenses_plan_item_id_fkey'
            columns: ['plan_item_id']
            isOneToOne: false
            referencedRelation: 'plan_items'
            referencedColumns: ['id']
          },
        ]
      }
      plan_items: {
        Row: {
          amount: number
          category_id: string
          created_at: string
          id: string
          is_completed: boolean
          is_fixed_payment: boolean
          name: string
          plan_id: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          category_id: string
          created_at?: string | null
          id?: string
          is_completed?: boolean
          is_fixed_payment?: boolean
          name: string
          plan_id: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          category_id?: string
          created_at?: string | null
          id?: string
          is_completed?: boolean
          is_fixed_payment?: boolean
          name?: string
          plan_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'plan_items_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'plan_items_plan_id_fkey'
            columns: ['plan_id']
            isOneToOne: false
            referencedRelation: 'plans'
            referencedColumns: ['id']
          },
        ]
      }
      plan_shares: {
        Row: {
          created_at: string
          id: string
          permission_level: string
          plan_id: string
          shared_by_user_id: string
          shared_with_user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          permission_level: string
          plan_id: string
          shared_by_user_id: string
          shared_with_user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          permission_level?: string
          plan_id?: string
          shared_by_user_id?: string
          shared_with_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'plan_shares_plan_id_fkey'
            columns: ['plan_id']
            isOneToOne: false
            referencedRelation: 'plans'
            referencedColumns: ['id']
          },
        ]
      }
      plans: {
        Row: {
          created_at: string
          currency: string | null
          end_date: string
          id: string
          name: string
          owner_id: string
          start_date: string
          status: string
          template_id: string
          total: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          end_date: string
          id?: string
          name: string
          owner_id: string
          start_date: string
          status: string
          template_id: string
          total?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          end_date?: string
          id?: string
          name?: string
          owner_id?: string
          start_date?: string
          status?: string
          template_id?: string
          total?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'plans_template_id_fkey'
            columns: ['template_id']
            isOneToOne: false
            referencedRelation: 'templates'
            referencedColumns: ['id']
          },
        ]
      }
      template_items: {
        Row: {
          amount: number
          category_id: string
          created_at: string
          id: string
          is_fixed_payment: boolean
          name: string
          template_id: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          category_id: string
          created_at?: string | null
          id?: string
          is_fixed_payment?: boolean
          name: string
          template_id: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          category_id?: string
          created_at?: string | null
          id?: string
          is_fixed_payment?: boolean
          name?: string
          template_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'template_items_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'template_items_template_id_fkey'
            columns: ['template_id']
            isOneToOne: false
            referencedRelation: 'templates'
            referencedColumns: ['id']
          },
        ]
      }
      template_shares: {
        Row: {
          created_at: string
          id: string
          permission_level: string
          shared_by_user_id: string
          shared_with_user_id: string
          template_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          permission_level: string
          shared_by_user_id: string
          shared_with_user_id: string
          template_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          permission_level?: string
          shared_by_user_id?: string
          shared_with_user_id?: string
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'template_shares_template_id_fkey'
            columns: ['template_id']
            isOneToOne: false
            referencedRelation: 'templates'
            referencedColumns: ['id']
          },
        ]
      }
      templates: {
        Row: {
          created_at: string
          currency: string | null
          duration: string
          id: string
          name: string
          owner_id: string
          total: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          duration: string
          id?: string
          name: string
          owner_id: string
          total?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          duration?: string
          id?: string
          name?: string
          owner_id?: string
          total?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar: string | null
          created_at: string
          email: string
          id: string
          name: string
          preferences: Json | null
          updated_at: string | null
        }
        Insert: {
          avatar?: string | null
          created_at?: string
          email: string
          id: string
          name: string
          preferences?: Json | null
          updated_at?: string | null
        }
        Update: {
          avatar?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          preferences?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_plan_status: {
        Args: {
          p_current_status?: string
          p_end_date: string
          p_start_date: string
        }
        Returns: string
      }
      can_access_template: {
        Args: { template_id: string; user_id: string }
        Returns: boolean
      }
      can_edit_template: {
        Args: { template_id: string; user_id: string }
        Returns: boolean
      }
      check_excessive_sharing: {
        Args: { hours_window?: number; max_shares?: number; user_id: string }
        Returns: boolean
      }
      cleanup_audit_logs: {
        Args: { days_to_keep?: number }
        Returns: number
      }
      get_plan_expense_summary: {
        Args: { p_plan_id: string }
        Returns: {
          actual_amount: number
          category_id: string
          expense_count: number
          planned_amount: number
          remaining_amount: number
        }[]
      }
      get_plan_items_with_tracking: {
        Args: { p_plan_id: string }
        Returns: {
          amount: number
          category_id: string
          created_at: string
          expense_count: number
          id: string
          is_completed: boolean
          name: string
          plan_id: string
          remaining_amount: number
          spent_amount: number
          updated_at: string
        }[]
      }
      get_plan_items_with_tracking_by_category: {
        Args: { p_category_id: string; p_plan_id: string }
        Returns: {
          amount: number
          category_id: string
          created_at: string
          expense_count: number
          id: string
          is_completed: boolean
          name: string
          plan_id: string
          remaining_amount: number
          spent_amount: number
          updated_at: string
        }[]
      }
      get_plan_shared_users: {
        Args: { p_plan_id: string }
        Returns: {
          permission_level: string
          shared_at: string
          user_email: string
          user_id: string
          user_name: string
        }[]
      }
      get_template_shared_users: {
        Args: { p_template_id: string }
        Returns: {
          permission_level: string
          shared_at: string
          user_email: string
          user_id: string
          user_name: string
        }[]
      }
      get_user_accessible_plan_ids: {
        Args: { user_id: string }
        Returns: {
          plan_id: string
        }[]
      }
      get_user_activity_summary: {
        Args: { days_back?: number; user_id: string }
        Returns: {
          count: number
          last_activity: string
          operation: string
          table_name: string
        }[]
      }
      get_user_editable_plan_ids: {
        Args: { user_id: string }
        Returns: {
          plan_id: string
        }[]
      }
      is_template_owner: {
        Args: { template_id: string; user_id: string }
        Returns: boolean
      }
      search_users_for_sharing: {
        Args: { q: string }
        Returns: {
          email: string
          id: string
          name: string
        }[]
      }
      user_has_template_access: {
        Args: { template_id: string; user_id: string }
        Returns: boolean
      }
      user_owns_plan: {
        Args: { plan_id: string; user_id: string }
        Returns: boolean
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

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals },
  EnumName extends
    keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'] = never,
> = DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends
    keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'] = never,
> = DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]

export const Constants = {
  public: {
    Enums: {},
  },
} as const
