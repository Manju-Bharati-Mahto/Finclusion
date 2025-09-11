import { Response } from 'express';
import { supabase } from '../config/supabaseClient';
import { Database } from '../types/database.types';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../utils/catchAsync';
import { AuthenticatedRequest } from '../types/auth.types';

type TransactionsTable = Database['public']['Tables']['transactions'];
type TransactionInsert = TransactionsTable['Insert'];
type TransactionUpdate = TransactionsTable['Update'];

export const getTransactions = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { user } = req;
  if (!user) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      error: 'Not authenticated'
    });
  }

  const { data: transactions, error } = await supabase
    .from('transactions')
    .select(`
      *,
      categories (
        name,
        type,
        color,
        icon
      )
    `)
    .eq('user_id', user.id)
    .order('date', { ascending: false });

  if (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message
    });
  }

  return res.status(StatusCodes.OK).json({
    success: true,
    data: transactions
  });
});

export const createTransaction = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { user } = req;
  if (!user) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      error: 'Not authenticated'
    });
  }

  const transactionData: TransactionInsert = {
    ...req.body as Omit<TransactionInsert, 'user_id'>,
    user_id: user.id
  };

  // Verify the category exists and belongs to the user
  const { data: category } = await supabase
    .from('categories')
    .select()
    .eq('id', transactionData.category_id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!category) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      error: 'Invalid category'
    });
  }

  const { data: transaction, error } = await supabase
    .from('transactions')
    .insert(transactionData)
    .select(`
      *,
      categories (
        name,
        type,
        color,
        icon
      )
    `)
    .single();

  if (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message
    });
  }

  return res.status(StatusCodes.CREATED).json({
    success: true,
    data: transaction
  });
});

export const updateTransaction = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { user } = req;
  const { id } = req.params;
  
  if (!user) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      error: 'Not authenticated'
    });
  }

  // Check if transaction exists and belongs to user
  const { data: existingTransaction } = await supabase
    .from('transactions')
    .select()
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!existingTransaction) {
    return res.status(StatusCodes.NOT_FOUND).json({
      success: false,
      error: 'Transaction not found'
    });
  }

  const transactionData: TransactionUpdate = req.body as TransactionUpdate;

  // If category is being updated, verify it exists and belongs to user
  if (transactionData.category_id) {
    const { data: category } = await supabase
      .from('categories')
      .select()
      .eq('id', transactionData.category_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!category) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: 'Invalid category'
      });
    }
  }

  const { data: transaction, error } = await supabase
    .from('transactions')
    .update(transactionData)
    .eq('id', id)
    .eq('user_id', user.id)
    .select(`
      *,
      categories (
        name,
        type,
        color,
        icon
      )
    `)
    .single();

  if (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message
    });
  }

  return res.status(StatusCodes.OK).json({
    success: true,
    data: transaction
  });
});

export const deleteTransaction = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { user } = req;
  const { id } = req.params;
  
  if (!user) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      error: 'Not authenticated'
    });
  }

  // Check if transaction exists and belongs to user
  const { data: existingTransaction } = await supabase
    .from('transactions')
    .select()
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!existingTransaction) {
    return res.status(StatusCodes.NOT_FOUND).json({
      success: false,
      error: 'Transaction not found'
    });
  }

  const { error } = await supabase
    .from('transactions')
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
    data: { message: 'Transaction deleted successfully' }
  });
});

export const getMonthlyTransactions = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { user } = req;
  const { year, month } = req.query;
  
  if (!user || !year || !month) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      error: 'Missing required parameters'
    });
  }

  const startDate = new Date(Number(year), Number(month) - 1, 1).toISOString();
  const endDate = new Date(Number(year), Number(month), 0).toISOString();

  // Get transactions for the specified month
  const { data: transactions, error } = await supabase
    .from('transactions')
    .select(`
      *,
      categories (
        name,
        type,
        color,
        icon
      )
    `)
    .eq('user_id', user.id)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false });

  if (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message
    });
  }

  // Calculate summary
  const summary = transactions.reduce((acc: any, curr: any) => {
    if (curr.type === 'income') {
      acc.income += curr.amount;
    } else {
      acc.expense += curr.amount;
    }
    return acc;
  }, { income: 0, expense: 0 });

  summary.balance = summary.income - summary.expense;

  return res.status(StatusCodes.OK).json({
    success: true,
    data: {
      transactions,
      summary
    }
  });
});

export const getTransactionsByCategory = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { user } = req;
  const { startDate, endDate } = req.query;
  
  if (!user || !startDate || !endDate) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      error: 'Missing required parameters'
    });
  }

  // Get all transactions grouped by category
  const { data: transactions, error } = await supabase
    .from('transactions')
    .select(`
      amount,
      categories (
        id,
        name,
        type,
        color,
        icon
      )
    `)
    .eq('user_id', user.id)
    .gte('date', startDate)
    .lte('date', endDate);

  if (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message
    });
  }

  // Group transactions by category
  const categoriesMap = transactions.reduce((acc: any, transaction: any) => {
    const category = transaction.categories;
    if (!acc[category.id]) {
      acc[category.id] = {
        _id: category.id,
        name: category.name,
        type: category.type,
        color: category.color,
        icon: category.icon,
        total: 0,
        count: 0,
        transactions: []
      };
    }
    
    acc[category.id].total += transaction.amount;
    acc[category.id].count += 1;
    acc[category.id].transactions.push(transaction);
    
    return acc;
  }, {});

  // Convert to array and sort by total
  const categoriesArray = Object.values(categoriesMap);
  categoriesArray.sort((a: any, b: any) => b.total - a.total);

  return res.status(StatusCodes.OK).json({
    success: true,
    data: categoriesArray
  });
});
