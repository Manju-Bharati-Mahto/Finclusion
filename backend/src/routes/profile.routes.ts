import express from 'express';
import { auth } from '../middleware/auth.middleware';
import * as profileController from '../controllers/profile.controller';
import multer from 'multer';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// All routes require authentication
router.use(auth);

router.route('/')
  .get(profileController.getProfile)
  .put(profileController.updateProfile);

router.post('/upload', upload.single('image'), profileController.uploadProfileImage);

export default router;
