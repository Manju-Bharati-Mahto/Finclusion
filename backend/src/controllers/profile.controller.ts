import { Response } from 'express';
import { supabase } from '../config/supabaseClient';
import { Database } from '../types/database.types';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../utils/catchAsync';
import { AuthenticatedRequest } from '../types/auth.types';

type ProfilesTable = Database['public']['Tables']['profiles'];
type ProfileInsert = ProfilesTable['Insert'];
type ProfileUpdate = ProfilesTable['Update'];

export const getProfile = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { user } = req;
  if (!user) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      error: 'Not authenticated'
    });
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message
    });
  }

  return res.status(StatusCodes.OK).json({
    success: true,
    data: profile
  });
});

export const updateProfile = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { user } = req;
  if (!user) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      error: 'Not authenticated'
    });
  }

  const profileData: ProfileUpdate = req.body as ProfileUpdate;

  const { data: profile, error } = await supabase
    .from('profiles')
    .update(profileData)
    .eq('id', user.id)
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
    data: profile
  });
});

interface MulterRequest extends AuthenticatedRequest {
  file?: Express.Multer.File;
}

export const uploadProfileImage = catchAsync(async (req: MulterRequest, res: Response) => {
  const { user } = req;
  if (!user || !req.file) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      error: 'Invalid request'
    });
  }

  const file = req.file;
  const fileExt = file.originalname.split('.').pop();
  const fileName = `${user.id}-${Date.now()}.${fileExt}`;

  const { data: uploadData, error: uploadError } = await supabase
    .storage
    .from('profile-images')
    .upload(fileName, file.buffer, {
      contentType: file.mimetype
    });

  if (uploadError) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: uploadError.message
    });
  }

  const { data: publicUrl } = supabase
    .storage
    .from('profile-images')
    .getPublicUrl(fileName);

  const { data: profile, error: updateError } = await supabase
    .from('profiles')
    .update({ profileImage: publicUrl.publicUrl })
    .eq('id', user.id)
    .select()
    .single();

  if (updateError) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: updateError.message
    });
  }

  return res.status(StatusCodes.OK).json({
    success: true,
    data: {
      imageUrl: publicUrl.publicUrl,
      profile
    }
  });
});
