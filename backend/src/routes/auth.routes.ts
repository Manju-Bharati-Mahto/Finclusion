import express from 'express';
import * as authController from '../controllers/auth.controller';

const router = express.Router();

// These routes are public (no auth required)
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);

export default router;
