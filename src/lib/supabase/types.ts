export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'categories_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      goals: {
        Row: {
          amount: number | null;
          created_at: string;
          deadline_at: string;
          id: string;
          status: string | null;
          user_id: string;
        };
        Insert: {
          amount?: number | null;
          created_at?: string;
          deadline_at?: string;
          id?: string;
          status?: string | null;
          user_id: string;
        };
        Update: {
          amount?: number | null;
          created_at?: string;
          deadline_at?: string;
          id?: string;
          status?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'goals_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      plan_items: {
        Row: {
          amount: number;
          category_id: string | null;
          created_at: string;
          id: string;
          name: string;
          plan_id: string;
          tags: string[] | null;
        };
        Insert: {
          amount: number;
          category_id?: string | null;
          created_at?: string;
          id?: string;
          name: string;
          plan_id: string;
          tags?: string[] | null;
        };
        Update: {
          amount?: number;
          category_id?: string | null;
          created_at?: string;
          id?: string;
          name?: string;
          plan_id?: string;
          tags?: string[] | null;
        };
        Relationships: [
          {
            foreignKeyName: 'plan_items_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'plan_items_plan_id_fkey';
            columns: ['plan_id'];
            isOneToOne: false;
            referencedRelation: 'plans';
            referencedColumns: ['id'];
          },
        ];
      };
      plans: {
        Row: {
          created_at: string;
          end_date: string;
          id: string;
          name: string;
          start_date: string;
          total_income: number;
          total_spent: number;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          end_date: string;
          id?: string;
          name: string;
          start_date: string;
          total_income: number;
          total_spent: number;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          end_date?: string;
          id?: string;
          name?: string;
          start_date?: string;
          total_income?: number;
          total_spent?: number;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'plans_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      reports: {
        Row: {
          content: string | null;
          created_at: string;
          id: string;
          user_id: string;
        };
        Insert: {
          content?: string | null;
          created_at?: string;
          id?: string;
          user_id: string;
        };
        Update: {
          content?: string | null;
          created_at?: string;
          id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'reports_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      tags: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'tags_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      template_items: {
        Row: {
          amount: number;
          category_id: string | null;
          created_at: string;
          id: string;
          name: string;
          tags: string[] | null;
          template_id: string;
        };
        Insert: {
          amount: number;
          category_id?: string | null;
          created_at?: string;
          id?: string;
          name: string;
          tags?: string[] | null;
          template_id: string;
        };
        Update: {
          amount?: number;
          category_id?: string | null;
          created_at?: string;
          id?: string;
          name?: string;
          tags?: string[] | null;
          template_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'template_items_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'template_items_template_id_fkey';
            columns: ['template_id'];
            isOneToOne: false;
            referencedRelation: 'templates';
            referencedColumns: ['id'];
          },
        ];
      };
      templates: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'templates_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      users: {
        Row: {
          avatar: string | null;
          created_at: string;
          email: string;
          id: string;
          name: string;
          updated_at: string | null;
        };
        Insert: {
          avatar?: string | null;
          created_at?: string;
          email: string;
          id?: string;
          name: string;
          updated_at?: string | null;
        };
        Update: {
          avatar?: string | null;
          created_at?: string;
          email?: string;
          id?: string;
          name?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type PublicSchema = Database[Extract<keyof Database, 'public'>];

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema['Tables'] & PublicSchema['Views'])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'] &
        Database[PublicTableNameOrOptions['schema']]['Views'])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions['schema']]['Tables'] &
      Database[PublicTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema['Tables'] & PublicSchema['Views'])
    ? (PublicSchema['Tables'] & PublicSchema['Views'])[PublicTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  PublicTableNameOrOptions extends keyof PublicSchema['Tables'] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
    ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends keyof PublicSchema['Tables'] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
    ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;
