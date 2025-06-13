export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      categories: {
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
      goals: {
        Row: {
          amount: number | null
          created_at: string
          deadline_at: string
          id: string
          status: string | null
          user_id: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          deadline_at?: string
          id?: string
          status?: string | null
          user_id: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          deadline_at?: string
          id?: string
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      plan_items: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string
          id: string
          name: string
          plan_id: string
          tags: string[] | null
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string
          id?: string
          name: string
          plan_id: string
          tags?: string[] | null
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string
          id?: string
          name?: string
          plan_id?: string
          tags?: string[] | null
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
      plans: {
        Row: {
          created_at: string
          end_date: string
          id: string
          name: string
          start_date: string
          total_income: number
          total_spent: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          name: string
          start_date: string
          total_income: number
          total_spent: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          name?: string
          start_date?: string
          total_income?: number
          total_spent?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          content: string | null
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      template_categories: {
        Row: {
          amount: number
          category_id: string
          created_at: string | null
          id: string
          template_id: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          category_id: string
          created_at?: string | null
          id?: string
          template_id: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          category_id?: string
          created_at?: string | null
          id?: string
          template_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'template_categories_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'template_categories_template_id_fkey'
            columns: ['template_id']
            isOneToOne: false
            referencedRelation: 'templates'
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
            referencedRelation: 'templates'
            referencedColumns: ['id']
          },
        ]
      }
      templates: {
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
      [_ in never]: never
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
