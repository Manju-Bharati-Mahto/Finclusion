// Database schema definition
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          email: string;
          panId?: string;
          dateOfBirth?: string;
          profileImage?: string;
          profileCompleted: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Database['public']['Tables']['profiles']['Row'], 'id'>>;
      };
      categories: {
        Row: {
          id: string;
          name: string;
          type: 'income' | 'expense';
          color?: string;
          icon?: string;
          budget?: number;
          user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Insert: Omit<Database['public']['Tables']['categories']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Database['public']['Tables']['categories']['Row'], 'id'>>;
      };
      transactions: {
        Row: {
          id: string;
          type: 'income' | 'expense';
          amount: number;
          category_id: string;
          description: string;
          date: string;
          user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Insert: Omit<Database['public']['Tables']['transactions']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Database['public']['Tables']['transactions']['Row'], 'id'>>;
      };
    };
  };
}

export type Tables = Database['public']['Tables'];
export type Profiles = Tables['profiles']['Row'];
export type Categories = Tables['categories']['Row'];
export type Transactions = Tables['transactions']['Row'];

// Helper types for Supabase
export interface CategoryWithStats extends Categories {
  total?: number;
  count?: number;
  percentageOfBudget?: number | null;
  transactions?: Transactions[];
}

export interface MonthlyTransactionSummary {
  transactions: Transactions[];
  summary: {
    income: number;
    expense: number;
    balance: number;
  };
}

export interface UserProfile extends Profiles {
  id: string;
  name: string;
  email: string;
  profileCompleted: boolean;
  panId?: string;
  dateOfBirth?: string;
  profileImage?: string;
}