-- Helper functions for robust user profile creation
-- This can be run on the existing database to add the helper functions

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS public.cleanup_orphaned_profile(TEXT);
DROP FUNCTION IF EXISTS public.create_user_profile(UUID, TEXT, TEXT, TEXT);

-- Cleanup orphaned profile function (callable from auth service)
CREATE OR REPLACE FUNCTION public.cleanup_orphaned_profile(user_email TEXT)
RETURNS VOID AS $$
BEGIN
    -- Delete any orphaned profile with this email that doesn't have a corresponding auth user
    DELETE FROM public.user_profiles 
    WHERE email = user_email 
    AND NOT EXISTS (SELECT 1 FROM auth.users WHERE id = user_profiles.id);
    
    -- Log the cleanup
    RAISE LOG 'Cleaned up orphaned profile for email: %', user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Manual profile creation function (alternative to trigger)
CREATE OR REPLACE FUNCTION public.create_user_profile(
    p_user_id UUID,
    p_email TEXT,
    p_full_name TEXT DEFAULT NULL,
    p_encrypted_password TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    profile_exists BOOLEAN := FALSE;
BEGIN
    -- Check if profile already exists
    SELECT EXISTS(SELECT 1 FROM public.user_profiles WHERE id = p_user_id) INTO profile_exists;
    
    IF profile_exists THEN
        RAISE LOG 'Profile already exists for user %', p_user_id;
        RETURN TRUE;
    END IF;
    
    -- Verify auth user exists
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
        RAISE WARNING 'Auth user % does not exist, cannot create profile', p_user_id;
        RETURN FALSE;
    END IF;
    
    -- Create the profile
    BEGIN
        INSERT INTO public.user_profiles (
            id, 
            full_name, 
            email, 
            password_hash,
            account_status
        ) VALUES (
            p_user_id,
            COALESCE(p_full_name, split_part(p_email, '@', 1)),
            p_email,
            p_encrypted_password,
            'pending_verification'
        );
        
        -- Create related records if tables exist
        INSERT INTO public.user_preferences (user_id) VALUES (p_user_id) ON CONFLICT DO NOTHING;
        INSERT INTO public.user_verification (user_id, email_verified) VALUES (p_user_id, FALSE) ON CONFLICT DO NOTHING;
        INSERT INTO public.user_accounts (user_id, account_name, account_type, is_default) 
        VALUES (p_user_id, 'Cash', 'cash', TRUE) ON CONFLICT DO NOTHING;
        
        RAISE LOG 'Successfully created profile for user %', p_user_id;
        RETURN TRUE;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE WARNING 'Failed to create profile for user %: %', p_user_id, SQLERRM;
            RETURN FALSE;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.cleanup_orphaned_profile(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_profile(UUID, TEXT, TEXT, TEXT) TO authenticated;

-- Improve the existing trigger to be more resilient
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    max_retries INTEGER := 5;
    retry_count INTEGER := 0;
    retry_delay INTERVAL;
BEGIN
    -- Enhanced error handling with retries
    WHILE retry_count < max_retries LOOP
        BEGIN
            -- Verify the auth user still exists before creating profile
            IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = NEW.id) THEN
                RAISE WARNING 'Auth user % no longer exists, skipping profile creation', NEW.id;
                RETURN NEW;
            END IF;

            -- Check if profile already exists
            IF EXISTS (SELECT 1 FROM public.user_profiles WHERE id = NEW.id) THEN
                RAISE LOG 'Profile already exists for user %', NEW.id;
                RETURN NEW;
            END IF;

            -- Create user profile
            INSERT INTO public.user_profiles (
                id, 
                full_name, 
                email, 
                password_hash,
                account_status,
                created_at,
                updated_at
            ) VALUES (
                NEW.id,
                COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
                NEW.email,
                NEW.encrypted_password,
                CASE WHEN NEW.email_confirmed_at IS NULL THEN 'pending_verification' ELSE 'active' END,
                NOW(),
                NOW()
            );

            -- Create related records with error handling
            BEGIN
                INSERT INTO public.user_preferences (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
            EXCEPTION WHEN OTHERS THEN
                RAISE LOG 'Failed to create user_preferences for %: %', NEW.id, SQLERRM;
            END;

            BEGIN
                INSERT INTO public.user_verification (user_id, email_verified) VALUES (NEW.id, NEW.email_confirmed_at IS NOT NULL) ON CONFLICT DO NOTHING;
            EXCEPTION WHEN OTHERS THEN
                RAISE LOG 'Failed to create user_verification for %: %', NEW.id, SQLERRM;
            END;

            BEGIN
                INSERT INTO public.user_accounts (user_id, account_name, account_type, is_default) 
                VALUES (NEW.id, 'Cash', 'cash', TRUE) ON CONFLICT DO NOTHING;
            EXCEPTION WHEN OTHERS THEN
                RAISE LOG 'Failed to create user_accounts for %: %', NEW.id, SQLERRM;
            END;

            -- If we reach here, everything succeeded
            RAISE LOG 'Successfully created profile for user % on attempt %', NEW.id, retry_count + 1;
            RETURN NEW;

        EXCEPTION 
            WHEN unique_violation THEN
                RAISE LOG 'Profile already exists for user % (unique violation)', NEW.id;
                RETURN NEW;
            WHEN foreign_key_violation THEN
                retry_count := retry_count + 1;
                retry_delay := (retry_count * 100) * INTERVAL '1 millisecond';
                
                RAISE LOG 'Foreign key violation for user % on attempt %, retrying in %ms', NEW.id, retry_count, EXTRACT(epoch FROM retry_delay) * 1000;
                
                IF retry_count < max_retries THEN
                    PERFORM pg_sleep(EXTRACT(epoch FROM retry_delay));
                ELSE
                    RAISE WARNING 'Failed to create profile for user % after % attempts: %', NEW.id, max_retries, SQLERRM;
                    RETURN NEW; -- Don't fail the auth creation
                END IF;
            WHEN OTHERS THEN
                RAISE WARNING 'Unexpected error creating profile for user %: %', NEW.id, SQLERRM;
                RETURN NEW; -- Don't fail the auth creation
        END;
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger (idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();