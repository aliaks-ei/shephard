export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      expense_categories: {
        Row: {
          color: string
          created_at: string
          id: string
          is_system: boolean
          name: string
          owner_id: string | null
          updated_at: string | null
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          is_system?: boolean
          name: string
          owner_id?: string | null
          updated_at?: string | null
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          is_system?: boolean
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
      can_access_template: {
        Args: { template_id: string; user_id: string }
        Returns: boolean
      }
      can_edit_template: {
        Args: { template_id: string; user_id: string }
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
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        Database[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      Database[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
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
  DefaultSchemaEnumNameOrOptions extends { schema: keyof Database },
  EnumName extends keyof Database[DefaultSchemaEnumNameOrOptions['schema']]['Enums'],
> = Database[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends { schema: keyof Database },
  CompositeTypeName extends
    keyof Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'],
> = Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]

export const Constants = {
  public: {
    Enums: {},
  },
} as const
