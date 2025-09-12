// Test script to check if the auth service improvements work
import { supabase } from './src/services/supabaseClient';

async function testAuthService() {
  console.log('Testing auth service improvements...');
  
  try {
    // Test if we can call the cleanup function
    const { data, error } = await supabase.rpc('cleanup_orphaned_profile', { 
      user_email: 'test@example.com' 
    });
    
    if (error) {
      console.log('cleanup_orphaned_profile not available yet:', error.message);
    } else {
      console.log('✅ cleanup_orphaned_profile function is available');
    }
  } catch (err) {
    console.log('❌ Error testing cleanup function:', err);
  }
  
  try {
    // Test if we can call the create profile function
    const { data, error } = await supabase.rpc('create_user_profile', {
      p_user_id: '00000000-0000-0000-0000-000000000000',
      p_email: 'test@example.com',
      p_full_name: 'Test User'
    });
    
    if (error) {
      console.log('create_user_profile not available yet:', error.message);
    } else {
      console.log('✅ create_user_profile function is available');
    }
  } catch (err) {
    console.log('❌ Error testing create profile function:', err);
  }
}

testAuthService();