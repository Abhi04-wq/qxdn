import { Router } from 'express';
import { register, registerWithReferral, verifyOtp, resendOtp, memberLogin, adminLogin, getMe } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/register', register);
router.post('/register-with-referral', registerWithReferral);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.post('/member-login', memberLogin);
router.post('/login', memberLogin); // back-compat alias
router.post('/admin-login', adminLogin);
router.get('/me', protect, getMe);

export default router;
