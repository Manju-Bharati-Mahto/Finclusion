import { createClient } from '@supabase/supabase-js';

// For GitHub Pages deployment, we need to handle environment variables differently
// In a production environment, you would use a more secure method
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://hyakzfaxrfsistgwlzln.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5YWt6ZmF4cmZzaXN0Z3dsemxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2MjA0NzcsImV4cCI6MjA3MzE5NjQ3N30.CbwsLGKNppKwK7dTWsn6GXVGZEa1g-OKpDsZFKBQcDw';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);