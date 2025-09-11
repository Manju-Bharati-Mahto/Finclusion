import express from 'express';
import { auth } from '../middleware/auth.middleware';
import * as categoryController from '../controllers/category.controller';

const router = express.Router();

// All routes require authentication
router.use(auth);

router.route('/')
  .get(categoryController.getCategories)
  .post(categoryController.createCategory);

router.route('/:id')
  .put(categoryController.updateCategory)
  .delete(categoryController.deleteCategory);

router.get('/stats', categoryController.getCategoryStats);

export default router;
