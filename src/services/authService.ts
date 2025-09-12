// Enhanced Authentication Service for Supabase Integration
import { supabase } from './supabaseClient';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  full_name?: string;
}

export interface AuthResponse {
  success: boolean;
  user?: AuthUser;
  token?: string;
  error?: string;
}

class AuthService {
  // Login with Supabase
  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data.user && data.session) {
        // Get user profile from our custom table
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        const user: AuthUser = {
          id: data.user.id,
          email: data.user.email!,
          name: profile?.full_name || profile?.name || data.user.user_metadata?.name,
          full_name: profile?.full_name || profile?.name || data.user.user_metadata?.full_name,
        };

        return {
          success: true,
          user,
          token: data.session.access_token,
        };
      }

      return {
        success: false,
        error: 'No user data received',
      };
    } catch (error: any) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error.message || 'Login failed',
      };
    }
  }

  // Register with Supabase
  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            name: name,
          }
        }
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        // Check if email confirmation is required
        if (!data.session) {
          return {
            success: false,
            error: 'Please check your email to verify your account before logging in.',
          };
        }

        const user: AuthUser = {
          id: data.user.id,
          email: data.user.email!,
          name: name,
          full_name: name,
        };

        return {
          success: true,
          user,
          token: data.session?.access_token,
        };
      }

      return {
        success: false,
        error: 'Registration failed - no user data received',
      };
    } catch (error: any) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: error.message || 'Registration failed',
      };
    }
  }

  // Logout with Supabase
  async logout(): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Logout error:', error);
        // Even if Supabase logout fails, we should clear local data
      }

      // Clear all local storage
      this.clearLocalStorage();
      
      return { success: true };
    } catch (error: any) {
      console.error('Logout error:', error);
      // Clear local storage even if logout fails
      this.clearLocalStorage();
      return { 
        success: true, // Return success even if API fails, since we cleared local data
        error: error.message 
      };
    }
  }

  // Clear all local storage data
  private clearLocalStorage(): void {
    const keysToRemove = [
      'token',
      'userData',
      'currentUser',
      'userProfile',
      'transactions',
      'customCategories',
      'reminders',
      'monthlyBudget',
      'cartItems',
      'paidRemindersHistory',
      'profileData',
      'sb-hyakzfaxrfsistgwlzln-auth-token', // Supabase auth token
    ];

    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });

    // Also clear session storage
    sessionStorage.clear();
  }

  // Get current user session
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return null;

      // Get user profile from our custom table
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      return {
        id: user.id,
        email: user.email!,
        name: profile?.full_name || profile?.name || user.user_metadata?.name,
        full_name: profile?.full_name || profile?.name || user.user_metadata?.full_name,
      };
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  // Check if user is logged in
  async isLoggedIn(): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return !!session;
    } catch (error) {
      console.error('Session check error:', error);
      return false;
    }
  }

  // Listen to auth state changes
  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      
      if (session?.user) {
        const user = await this.getCurrentUser();
        callback(user);
      } else {
        callback(null);
      }
    });
  }
}

export const authService = new AuthService();
export default authService;