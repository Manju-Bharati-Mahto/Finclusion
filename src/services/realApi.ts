import api from './configureApi';

// Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export interface ProfileResponse {
  _id: string;
  name: string;
  email: string;
  panId?: string;
  dateOfBirth?: string;
  profileImage?: string;
  token: string;
}

export type AuthResponse = ApiResponse<ProfileResponse>;

export interface ProfileData {
  name?: string;
  email?: string;
  panId?: string;
  dateOfBirth?: string;
  profileImage?: string;
}

export interface Category {
  _id: string;
  name: string;
  type: 'income' | 'expense';
  color?: string;
  icon?: string;
}

export interface Transaction {
  _id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string;
}

// Auth Services
export const authAPI = {
  register: async (name: string, email: string, password: string): Promise<AuthResponse> => {
    try {
      return await api.post<ProfileResponse, AuthResponse>('/auth/register', { name, email, password });
    } catch (error) {
      console.error('Registration API error:', error);
      throw error;
    }
  },
  
  login: async (email: string, password: string): Promise<AuthResponse> => {
    try {
      return await api.post<ProfileResponse, AuthResponse>('/auth/login', { email, password });
    } catch (error) {
      console.error('Login API error:', error);
      throw error;
    }
  },
  
  getProfile: async (): Promise<AuthResponse> => {
    return await api.get<ProfileResponse, AuthResponse>('/auth/me');
  }
};

// Profile Services
export const profileAPI = {
  getProfile: async () => {
    return api.get('/profile');
  },
  
  updateProfile: async (profileData: ProfileData) => {
    return api.put('/profile', profileData);
  },
  
  uploadProfileImage: async (formData: FormData) => {
    return api.post('/profile/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }
};

// Transaction Services
export const transactionAPI = {
  getTransactions: async (filters = {}) => {
    return api.get('/transactions', { params: filters });
  },
  
  createTransaction: async (transaction: Omit<Transaction, '_id'>) => {
    return api.post('/transactions', transaction);
  },
  
  updateTransaction: async (id: string, transaction: Partial<Transaction>) => {
    return api.put(`/transactions/${id}`, transaction);
  },
  
  deleteTransaction: async (id: string) => {
    return api.delete(`/transactions/${id}`);
  },
  
  getMonthlyTransactions: async (year: number, month: number) => {
    return api.get(`/transactions/monthly/${year}/${month}`);
  }
};

// Category Services
export const categoryAPI = {
  getCategories: async (filters = {}) => {
    return api.get('/categories', { params: filters });
  },
  
  createCategory: async (category: Omit<Category, '_id'>) => {
    return api.post('/categories', category);
  },
  
  updateCategory: async (id: string, category: Partial<Category>) => {
    return api.put(`/categories/${id}`, category);
  },
  
  deleteCategory: async (id: string) => {
    return api.delete(`/categories/${id}`);
  }
}; 