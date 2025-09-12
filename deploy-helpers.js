const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.qyzoqfghwjbrydagntok:7HaBoboomdGrOt9@aws-0-us-east-1.pooler.supabase.com:6543/postgres'
});

async function deployHelperFunctions() {
  try {
    console.log('Connecting to database...');
    await client.connect();
    
    // Deploy cleanup function
    const cleanupFunction = `
      CREATE OR REPLACE FUNCTION public.cleanup_orphaned_profile(user_email TEXT)
      RETURNS VOID AS $$
      BEGIN
          DELETE FROM public.user_profiles 
          WHERE email = user_email 
          AND NOT EXISTS (SELECT 1 FROM auth.users WHERE id = user_profiles.id);
          
          RAISE LOG 'Cleaned up orphaned profile for email: %', user_email;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;
    
    console.log('Creating cleanup_orphaned_profile function...');
    await client.query(cleanupFunction);
    console.log('✅ cleanup_orphaned_profile function created');
    
    // Deploy create profile function
    const createProfileFunction = `
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
          SELECT EXISTS(SELECT 1 FROM public.user_profiles WHERE id = p_user_id) INTO profile_exists;
          
          IF profile_exists THEN
              RAISE LOG 'Profile already exists for user %', p_user_id;
              RETURN TRUE;
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
              RAISE WARNING 'Auth user % does not exist, cannot create profile', p_user_id;
              RETURN FALSE;
          END IF;
          
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
              
              RAISE LOG 'Successfully created profile for user %', p_user_id;
              RETURN TRUE;
          EXCEPTION
              WHEN OTHERS THEN
                  RAISE WARNING 'Failed to create profile for user %: %', p_user_id, SQLERRM;
                  RETURN FALSE;
          END;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;
    
    console.log('Creating create_user_profile function...');
    await client.query(createProfileFunction);
    console.log('✅ create_user_profile function created');
    
    // Grant permissions
    console.log('Granting permissions...');
    await client.query('GRANT EXECUTE ON FUNCTION public.cleanup_orphaned_profile(TEXT) TO authenticated;');
    await client.query('GRANT EXECUTE ON FUNCTION public.create_user_profile(UUID, TEXT, TEXT, TEXT) TO authenticated;');
    console.log('✅ Permissions granted');
    
    console.log('🎉 Helper functions deployed successfully!');
    
  } catch (error) {
    console.error('Error deploying helper functions:', error.message);
    console.error('Full error:', error);
  } finally {
    await client.end();
  }
}

deployHelperFunctions();