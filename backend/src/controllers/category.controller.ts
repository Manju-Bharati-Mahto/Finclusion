import { Response } from 'express';
import { supabase } from '../config/supabaseClient';
import { Database } from '../types/database.types';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../utils/catchAsync';
import { AuthenticatedRequest } from '../types/auth.types';

type CategoriesTable = Database['public']['Tables']['categories'];
type CategoryInsert = CategoriesTable['Insert'];
type CategoryUpdate = CategoriesTable['Update'];

export const getCategories = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { user } = req;
  if (!user) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      error: 'Not authenticated'
    });
  }

  const { data: categories, error } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', user.id)
    .order('name');

  if (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message
    });
  }

  return res.status(StatusCodes.OK).json({
    success: true,
    data: categories
  });
});

export const createCategory = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { user } = req;
  if (!user) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      error: 'Not authenticated'
    });
  }

  const categoryData: CategoryInsert = {
    ...req.body as Omit<CategoryInsert, 'user_id'>,
    user_id: user.id
  };

  // Check if category already exists for this user
  const { data: existingCategory } = await supabase
    .from('categories')
    .select()
    .eq('user_id', user.id)
    .eq('name', categoryData.name)
    .eq('type', categoryData.type)
    .maybeSingle();

  if (existingCategory) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      error: 'Category already exists'
    });
  }

  const { data: category, error } = await supabase
    .from('categories')
    .insert(categoryData)
    .select()
    .single();

  if (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message
    });
  }

  return res.status(StatusCodes.CREATED).json({
    success: true,
    data: category
  });
});

export const updateCategory = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { user } = req;
  const { id } = req.params;
  
  if (!user) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      error: 'Not authenticated'
    });
  }

  // Check if category exists and belongs to user
  const { data: existingCategory } = await supabase
    .from('categories')
    .select()
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!existingCategory) {
    return res.status(StatusCodes.NOT_FOUND).json({
      success: false,
      error: 'Category not found'
    });
  }

  const categoryData: CategoryUpdate = req.body as CategoryUpdate;

  const { data: category, error } = await supabase
    .from('categories')
    .update(categoryData)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message
    });
  }

  return res.status(StatusCodes.OK).json({
    success: true,
    data: category
  });
});

export const deleteCategory = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { user } = req;
  const { id } = req.params;
  
  if (!user) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      error: 'Not authenticated'
    });
  }

  // Check if category exists and belongs to user
  const { data: existingCategory } = await supabase
    .from('categories')
    .select()
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!existingCategory) {
    return res.status(StatusCodes.NOT_FOUND).json({
      success: false,
      error: 'Category not found'
    });
  }

  // Delete all transactions associated with this category first
  const { error: transactionError } = await supabase
    .from('transactions')
    .delete()
    .eq('category_id', id)
    .eq('user_id', user.id);

  if (transactionError) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: transactionError.message
    });
  }

  // Now delete the category
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message
    });
  }

  return res.status(StatusCodes.OK).json({
    success: true,
    data: { message: 'Category deleted successfully' }
  });
});

export const getCategoryStats = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { user } = req;
  const { startDate, endDate } = req.query;
  
  if (!user || !startDate || !endDate) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      error: 'Missing required parameters'
    });
  }

  // Get categories with their transactions in the date range
  const { data: categories, error } = await supabase
    .from('categories')
    .select(`
      *,
      transactions!inner (
        amount,
        date
      )
    `)
    .eq('user_id', user.id)
    .gte('transactions.date', startDate)
    .lte('transactions.date', endDate);

  if (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message
    });
  }

  // Calculate stats for each category
  const categoryStats = categories.map(category => {
    const transactions = category.transactions || [];
    const total = transactions.reduce((sum: number, trans: any) => sum + trans.amount, 0);
    const percentageOfBudget = category.budget ? (total / category.budget) * 100 : null;

    return {
      category: category.name,
      type: category.type,
      color: category.color,
      icon: category.icon,
      budget: category.budget,
      spent: total,
      percentageOfBudget,
      transactionCount: transactions.length
    };
  });

  return res.status(StatusCodes.OK).json({
    success: true,
    data: categoryStats
  });
});
