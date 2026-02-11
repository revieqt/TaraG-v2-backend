import express from 'express';
import { 
  register, 
  login, 
  sendEmailVerification, 
  verifyEmail,
  passwordReset,
  changePassword,
  refreshAccessToken
} from './auth.controller';
import { authMiddleware } from '../../middleware/authMiddleware';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/send-verification', sendEmailVerification);
router.post('/verify-email', verifyEmail);
router.post('/reset-password', passwordReset);
router.post('/change-password', authMiddleware, changePassword);
router.post('/refresh', refreshAccessToken);

export default router;
