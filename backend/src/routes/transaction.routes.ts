import express from 'express';
import { auth } from '../middleware/auth.middleware';
import * as transactionController from '../controllers/transaction.controller';

const router = express.Router();

// All routes require authentication
router.use(auth);

router.route('/')
  .get(transactionController.getTransactions)
  .post(transactionController.createTransaction);

router.route('/:id')
  .put(transactionController.updateTransaction)
  .delete(transactionController.deleteTransaction);

router.get('/monthly', transactionController.getMonthlyTransactions);
router.get('/by-category', transactionController.getTransactionsByCategory);

export default router;
