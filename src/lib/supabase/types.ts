export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '12.2.12 (cd3cf9e)'
  }
  public: {
    Tables: {
      expense_categories: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          name: string
          owner_id: string | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          name: string
          owner_id?: string | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          name?: string
          owner_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      expense_template_items: {
        Row: {
          amount: number
          category_id: string
          created_at: string | null
          id: string
          name: string
          template_id: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          category_id: string
          created_at?: string | null
          id?: string
          name: string
          template_id: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          category_id?: string
          created_at?: string | null
          id?: string
          name?: string
          template_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'expense_template_items_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'expense_categories'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'expense_template_items_template_id_fkey'
            columns: ['template_id']
            isOneToOne: false
            referencedRelation: 'expense_templates'
            referencedColumns: ['id']
          },
        ]
      }
      expense_templates: {
        Row: {
          created_at: string | null
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
      plan_items: {
        Row: {
          amount: number
          category_id: string
          created_at: string | null
          id: string
          name: string
          plan_id: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          category_id: string
          created_at?: string | null
          id?: string
          name: string
          plan_id: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          category_id?: string
          created_at?: string | null
          id?: string
          name?: string
          plan_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'plan_items_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'expense_categories'
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
          created_at: string | null
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
          created_at: string | null
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
            referencedRelation: 'expense_templates'
            referencedColumns: ['id']
          },
        ]
      }
      template_shares: {
        Row: {
          created_at: string | null
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
            referencedRelation: 'expense_templates'
            referencedColumns: ['id']
          },
        ]
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
      can_access_plan: {
        Args: { plan_id: string; user_id: string }
        Returns: boolean
      }
      can_access_template: {
        Args: { template_id: string; user_id: string }
        Returns: boolean
      }
      can_edit_plan: {
        Args: { plan_id: string; user_id: string }
        Returns: boolean
      }
      can_edit_template: {
        Args: { template_id: string; user_id: string }
        Returns: boolean
      }
      is_plan_owner: {
        Args: { plan_id: string; user_id: string }
        Returns: boolean
      }
      is_template_owner: {
        Args: { template_id: string; user_id: string }
        Returns: boolean
      }
      user_has_template_access: {
        Args: { template_id: string; user_id: string }
        Returns: boolean
      }
      get_template_shared_users: {
        Args: { p_template_id: string }
        Returns: {
          user_id: string
          user_name: string | null
          user_email: string
          permission_level: string
          shared_at: string | null
        }[]
      }
      get_plan_shared_users: {
        Args: { p_plan_id: string }
        Returns: {
          user_id: string
          user_name: string | null
          user_email: string
          permission_level: string
          shared_at: string | null
        }[]
      }
      search_users_for_sharing: {
        Args: { q: string }
        Returns: {
          id: string
          name: string | null
          email: string
        }[]
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
    keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'],
> = DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends
    keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'],
> = DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]

export const Constants = {
  public: {
    Enums: {},
  },
} as const
