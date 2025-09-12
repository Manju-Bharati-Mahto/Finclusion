-- Supabase Authentication Configuration
-- Run this AFTER the main schema to configure authentication properly

-- ========================================
-- AUTHENTICATION SETTINGS
-- ========================================

-- Enable email confirmation (you'll also need to configure this in Supabase Dashboard)
-- Go to Authentication > Settings in Supabase Dashboard and:
-- 1. Enable "Enable email confirmations"
-- 2. Set "Site URL" to your app URL (https://manju-bharati-mahto.github.io/FINCLUSION/)
-- 3. Configure email templates

-- ========================================
-- ADDITIONAL AUTHENTICATION FUNCTIONS
-- ========================================

-- Function to clean up orphaned profiles (when auth.users exists but profile creation failed)
CREATE OR REPLACE FUNCTION public.cleanup_orphaned_profile(user_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    auth_user_id UUID;
    profile_exists BOOLEAN;
BEGIN
    -- Check if user exists in auth.users
    SELECT id INTO auth_user_id
    FROM auth.users
    WHERE email = user_email;
    
    IF auth_user_id IS NULL THEN
        RETURN FALSE; -- No auth user exists
    END IF;
    
    -- Check if profile exists
    SELECT EXISTS(SELECT 1 FROM public.user_profiles WHERE id = auth_user_id) INTO profile_exists;
    
    IF NOT profile_exists THEN
        -- Profile doesn't exist but auth user does - this is fine
        RETURN TRUE;
    END IF;
    
    -- Check if there's a conflicting profile with same email but different ID
    IF EXISTS(
        SELECT 1 FROM public.user_profiles 
        WHERE email = user_email AND id != auth_user_id
    ) THEN
        -- Remove the conflicting profile (orphaned)
        DELETE FROM public.user_profiles 
        WHERE email = user_email AND id != auth_user_id;
        
        RETURN TRUE;
    END IF;
    
    RETURN TRUE; -- Everything is consistent
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user profile with authentication status
CREATE OR REPLACE FUNCTION public.get_user_profile(user_uuid UUID DEFAULT auth.uid())
RETURNS TABLE (
    id UUID,
    full_name TEXT,
    email TEXT,
    username TEXT,
    phone_number TEXT,
    profile_image_url TEXT,
    account_status TEXT,
    email_verified BOOLEAN,
    created_at TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    login_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.id,
        up.full_name,
        up.email,
        up.username,
        up.phone_number,
        up.profile_image_url,
        up.account_status,
        uv.email_verified,
        up.created_at,
        up.last_login_at,
        up.login_count
    FROM public.user_profiles up
    LEFT JOIN public.user_verification uv ON up.id = uv.user_id
    WHERE up.id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can login (email verified and account active)
CREATE OR REPLACE FUNCTION public.can_user_login(user_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_record RECORD;
BEGIN
    SELECT 
        up.account_status,
        uv.email_verified
    INTO user_record
    FROM public.user_profiles up
    LEFT JOIN public.user_verification uv ON up.id = uv.user_id
    WHERE up.email = user_email;
    
    IF user_record IS NULL THEN
        RETURN FALSE;
    END IF;
    
    RETURN (
        user_record.account_status = 'active' AND 
        user_record.email_verified = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to resend email verification
CREATE OR REPLACE FUNCTION public.resend_email_verification(user_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_id UUID;
BEGIN
    -- Get user ID
    SELECT au.id INTO user_id
    FROM auth.users au
    WHERE au.email = user_email;
    
    IF user_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Update verification token (this would typically trigger an email)
    UPDATE public.user_verification
    SET 
        verification_token = gen_random_uuid()::TEXT,
        verification_token_expires = NOW() + INTERVAL '24 hours',
        updated_at = NOW()
    WHERE user_id = user_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- ADMIN FUNCTIONS (FOR DEBUGGING)
-- ========================================

-- Function to view all users with their authentication status (ADMIN ONLY)
CREATE OR REPLACE FUNCTION public.admin_get_all_users()
RETURNS TABLE (
    id UUID,
    full_name TEXT,
    email TEXT,
    password_hash TEXT,
    account_status TEXT,
    email_verified BOOLEAN,
    email_verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    login_count INTEGER,
    auth_created_at TIMESTAMPTZ,
    auth_email_confirmed_at TIMESTAMPTZ
) AS $$
BEGIN
    -- This function should only be accessible to service role or admin users
    IF auth.role() != 'service_role' THEN
        RAISE EXCEPTION 'Access denied: Admin function only';
    END IF;
    
    RETURN QUERY
    SELECT 
        up.id,
        up.full_name,
        up.email,
        up.password_hash,
        up.account_status,
        uv.email_verified,
        uv.email_verified_at,
        up.created_at,
        up.last_login_at,
        up.login_count,
        au.created_at as auth_created_at,
        au.email_confirmed_at as auth_email_confirmed_at
    FROM public.user_profiles up
    LEFT JOIN public.user_verification uv ON up.id = uv.user_id
    LEFT JOIN auth.users au ON up.id = au.id
    ORDER BY up.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- RLS POLICY UPDATES FOR AUTHENTICATION
-- ========================================

-- Update RLS policy for user_profiles to allow service role access
DROP POLICY IF EXISTS "Enable insert for service role and matching users" ON public.user_profiles;
CREATE POLICY "Enable insert for service role and matching users" ON public.user_profiles
    FOR INSERT WITH CHECK (
        auth.uid() = id OR 
        auth.role() = 'service_role' OR
        auth.uid() IS NULL
    );

-- Add policy for service role to view all profiles (for admin functions)
DROP POLICY IF EXISTS "Service role can view all profiles" ON public.user_profiles;
CREATE POLICY "Service role can view all profiles" ON public.user_profiles
    FOR SELECT USING (auth.role() = 'service_role');

-- ========================================
-- GRANT PERMISSIONS FOR NEW FUNCTIONS
-- ========================================

GRANT EXECUTE ON FUNCTION public.cleanup_orphaned_profile(TEXT) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_profile(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.can_user_login(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.resend_email_verification(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_all_users() TO service_role;

-- ========================================
-- DATA PERSISTENCE & LOGOUT BEHAVIOR
-- ========================================

/*
IMPORTANT: USER DATA PERSISTENCE

When users log out from the application:
✅ PRESERVED IN DATABASE:
- User profiles (name, email, preferences, etc.)
- All financial transactions 
- Custom categories and budgets
- Bill reminders and savings goals
- Account balances and payment history
- Login statistics and verification status

❌ CLEARED FROM CLIENT:
- Auth session tokens (Supabase JWT)
- Local storage cache (transactions, categories, etc.)
- Session storage (temporary UI state)
- Browser cookies related to authentication

🔄 ON NEXT LOGIN:
- User data is automatically reloaded from database
- All transactions, categories, and settings are restored
- User picks up exactly where they left off
- No data loss occurs during logout/login cycle

This ensures data security while preserving user information.
*/

-- ========================================
-- EXAMPLE USAGE COMMENTS
-- ========================================

/*
USAGE EXAMPLES:

1. Check if user can login:
SELECT public.can_user_login('user@example.com');

2. Get user profile:
SELECT * FROM public.get_user_profile();

3. Admin view all users (service role only):
SELECT * FROM public.admin_get_all_users();

4. Resend email verification:
SELECT public.resend_email_verification('user@example.com');

5. Cleanup orphaned profile (if registration fails):
SELECT public.cleanup_orphaned_profile('user@example.com');

FRONTEND INTEGRATION:

1. Registration Flow:
   - Use Supabase signUp() function
   - User will receive email verification
   - Profile will be created with 'pending_verification' status
   - Password hash will be stored in user_profiles table

2. Email Verification:
   - User clicks email link
   - Supabase confirms email
   - Trigger updates account_status to 'active'
   - User can now login

3. Login Flow:
   - Use Supabase signIn() function
   - Check can_user_login() before allowing access
   - Login count and last_login_at automatically updated

4. View User Data:
   - Use get_user_profile() to get complete user info
   - Includes verification status and login stats
*/