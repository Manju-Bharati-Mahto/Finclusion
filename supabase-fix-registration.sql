-- Fix RLS Policy for Registration
-- Run this in your Supabase SQL Editor to fix the registration issue

-- Drop the existing restrictive policy for profiles
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Create a new policy that allows inserts during signup
CREATE POLICY "Enable insert for service role and matching users" ON public.profiles
    FOR INSERT WITH CHECK (
        auth.uid() = id OR 
        auth.role() = 'service_role' OR
        auth.uid() IS NULL
    );

-- Also update the trigger function to be more robust
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert profile with error handling
    INSERT INTO public.profiles (id, name, email)
    VALUES (
        NEW.id, 
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)), 
        NEW.email
    );
    
    -- Insert default categories with error handling
    INSERT INTO public.categories (user_id, name, type, color, icon) VALUES
    (NEW.id, 'Food', 'expense', '#FF7D7D', 'food'),
    (NEW.id, 'Shopping', 'expense', '#8B5CF6', 'shopping'),
    (NEW.id, 'Fun', 'expense', '#F59E0B', 'movie'),
    (NEW.id, 'Transport', 'expense', '#10B981', 'car'),
    (NEW.id, 'Utilities', 'expense', '#3B82F6', 'bolt'),
    (NEW.id, 'Medical', 'expense', '#EC4899', 'hospital'),
    (NEW.id, 'Education', 'expense', '#06B6D4', 'book'),
    (NEW.id, 'Income', 'income', '#00BF63', 'cash');
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail the signup
        RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;