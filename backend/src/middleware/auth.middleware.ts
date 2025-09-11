import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabaseClient';
import { StatusCodes } from 'http-status-codes';
import { AuthenticatedRequest } from '../types/auth.types';

export const auth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        error: 'No token provided'
      });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        error: 'Invalid token'
      });
    }

    req.user = {
      id: user.id,
      email: user.email!,
      name: user.user_metadata?.name
    };

    next();
  } catch (error: any) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      error: error.message
    });
  }
};
