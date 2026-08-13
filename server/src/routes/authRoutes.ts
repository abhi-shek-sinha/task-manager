import { Router } from 'express';
import { completeGmailOAuthSetup, googleAuth, loginUser, registerUser, resetPasswordWithOtp, sendOtp, startGmailOAuthSetup } from '../controllers/authController';

const router = Router();

router.post('/register', registerUser);
router.post('/login', loginUser);

router.post('/forgot-password/send-otp', sendOtp);
router.post('/forgot-password/reset', resetPasswordWithOtp);
router.post('/google', googleAuth);
router.get('/gmail/setup', startGmailOAuthSetup);
router.get('/gmail/callback', completeGmailOAuthSetup);

export default router;
