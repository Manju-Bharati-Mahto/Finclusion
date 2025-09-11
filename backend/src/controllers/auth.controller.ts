import { Request, Response } from 'express';
import { supabase } from '../config/supabaseClient';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../utils/catchAsync';

export const register = catchAsync(async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  const { data: { user }, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name
      }
    }
  });

  if (signUpError) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      error: signUpError.message
    });
  }

  // Create a profile for the user
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: user!.id,
      name,
      email,
      profileCompleted: false
    });

  if (profileError) {
    // Delete the user if profile creation fails
    await supabase.auth.admin.deleteUser(user!.id);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: profileError.message
    });
  }

  // Create default categories for the user
  const defaultCategories = [
    { name: 'Food', type: 'expense', color: '#FF7D7D', icon: 'food', user_id: user!.id },
    { name: 'Shopping', type: 'expense', color: '#8B5CF6', icon: 'shopping', user_id: user!.id },
    { name: 'Fun', type: 'expense', color: '#F59E0B', icon: 'movie', user_id: user!.id },
    { name: 'Transport', type: 'expense', color: '#10B981', icon: 'car', user_id: user!.id },
    { name: 'Utilities', type: 'expense', color: '#3B82F6', icon: 'bolt', user_id: user!.id },
    { name: 'Medical', type: 'expense', color: '#EC4899', icon: 'hospital', user_id: user!.id },
    { name: 'Education', type: 'expense', color: '#06B6D4', icon: 'book', user_id: user!.id },
    { name: 'Income', type: 'income', color: '#00BF63', icon: 'cash', user_id: user!.id }
  ];

  const { error: categoriesError } = await supabase
    .from('categories')
    .insert(defaultCategories);

  if (categoriesError) {
    // Log the error but don't fail the registration
    console.error('Error creating default categories:', categoriesError);
  }

  // Get a session for the user
  const { data: { session }, error: sessionError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (sessionError) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: sessionError.message
    });
  }

  return res.status(StatusCodes.CREATED).json({
    success: true,
    token: session?.access_token,
    user: {
      id: user!.id,
      name,
      email,
      profileCompleted: false
    }
  });
});

export const login = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const { data: { session }, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      error: error.message
    });
  }

  if (!session) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      error: 'Session not found'
    });
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  return res.status(StatusCodes.OK).json({
    success: true,
    token: session.access_token,
    user: {
      id: session.user.id,
      name: profile?.name || session.user.user_metadata?.name,
      email: session.user.email!,
      profileCompleted: profile?.profileCompleted || false,
      panId: profile?.panId,
      dateOfBirth: profile?.dateOfBirth
    }
  });
});

export const logout = catchAsync(async (req: Request, res: Response) => {
  const { error } = await supabase.auth.signOut();

  if (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message
    });
  }

  return res.status(StatusCodes.OK).json({
    success: true,
    message: 'Logged out successfully'
  });
});
