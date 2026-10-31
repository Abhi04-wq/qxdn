import crypto from 'crypto';
import User from '../models/User.js';
import { generateToken } from '../middleware/authMiddleware.js';
import { sendVerificationOtp, sendPasswordResetOtp } from '../utils/mailer.js';

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const OTP_LENGTH = 6;
const OTP_TTL_MINUTES = 10;
const RESEND_COOLDOWN_SECONDS = 60;

const buildPublicUser = (user) => ({
  _id: user._id,
  email: user.email,
  role: user.role,
  status: user.status || 'ACTIVE',
  banReason: user.banReason || null,
  bannedAt: user.bannedAt || null,
  referralCode: user.referralCode,
  sponsorCode: user.sponsorCode,
  isEmailVerified: user.isEmailVerified,
  staking: user.staking,
  createdAt: user.createdAt,
});

const issueOtp = (user) => {
  const otp = crypto.randomInt(0, 10 ** OTP_LENGTH).toString().padStart(OTP_LENGTH, '0');
  user.emailVerificationToken = crypto.createHash('sha256').update(otp).digest('hex');
  user.emailVerificationExpires = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
  user.isEmailVerified = false;
  return { user, otp };
};

const isValidOtpEntry = (user) =>
  user.emailVerificationToken && user.emailVerificationExpires > new Date();

// @route   POST /api/auth/register-with-referral
// @desc    Sponsor-based registration -> OTP email -> verify before login
export const registerWithReferral = async (req, res, next) => {
  try {
    const { email, password, sponsorCode } = req.body;

    if (!email || !password || !sponsorCode) {
      return res.status(400).json({
        success: false,
        message: 'Email, password and sponsor code are required',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }

    const sponsor = await User.findOne({ referralCode: sponsorCode.trim().toUpperCase() });
    if (!sponsor) {
      return res.status(400).json({ success: false, message: 'Invalid sponsor code' });
    }

    if (sponsor.status === 'BANNED' || sponsor.status === 'SUSPENDED') {
      return res.status(400).json({
        success: false,
        message: 'This sponsor referral code is currently deactivated due to account suspension.',
      });
    }

    const normalizedEmail = normalizeEmail(email);
    const existing = await User.findOne({ email: normalizedEmail });

    if (existing && existing.isEmailVerified) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists' });
    }

    let user;
    let otp;
    if (existing) {
      existing.password = password;
      existing.sponsorCode = sponsor.referralCode;
      ({ user, otp } = issueOtp(existing));
      await existing.save();
    } else {
      const fresh = new User({
        email: normalizedEmail,
        password,
        sponsorCode: sponsor.referralCode,
        role: 'member',
      });
      ({ user, otp } = issueOtp(fresh));
      await fresh.save();
    }

    let deliveryStatus;
    try {
      deliveryStatus = await sendVerificationOtp(user.email, otp);
    } catch {
      return res.status(502).json({
        success: false,
        message: 'Failed to send the verification email. Please try again in a moment.',
      });
    }

    res.status(201).json({
      success: true,
      message:
        deliveryStatus === 'sent'
          ? `A 6-digit verification code has been sent to ${user.email}.`
          : 'SMTP is not configured - the verification code is printed on the server terminal (dev mode).',
      data: { email: user.email, delivery: deliveryStatus },
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/auth/verify-otp
// @desc    Verify the emailed OTP and activate the account
export const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP code are required' });
    }

    const user = await User.findOne({ email: normalizeEmail(email) });

    if (!user) {
      return res.status(400).json({ success: false, message: 'No account found with this email' });
    }

    if (user.isEmailVerified) {
      return res.status(200).json({ success: true, message: 'Email already verified. You can log in.' });
    }

    if (!isValidOtpEntry(user)) {
      return res.status(400).json({
        success: false,
        message: 'Code expired or not found. Please register again or request a new code.',
      });
    }

    const hashed = crypto.createHash('sha256').update(String(otp).trim()).digest('hex');
    if (hashed !== user.emailVerificationToken) {
      return res.status(400).json({ success: false, message: 'Invalid OTP code' });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully. You can now log in.',
      data: { email: user.email },
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/auth/resend-otp
// @desc    Re-issue a fresh OTP to an unverified account
export const resendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    let user = await User.findOne({ email: normalizeEmail(email) });

    if (!user) {
      return res.status(400).json({ success: false, message: 'No account found with this email' });
    }

    if (user.isEmailVerified) {
      return res.status(200).json({ success: true, message: 'Email already verified. You can log in.' });
    }

    if (isValidOtpEntry(user)) {
      const remaining = Math.ceil((user.emailVerificationExpires - Date.now()) / 1000);
      const waited = OTP_TTL_MINUTES * 60 - remaining;
      if (waited < RESEND_COOLDOWN_SECONDS) {
        return res.status(429).json({
          success: false,
          message: `Please wait ${RESEND_COOLDOWN_SECONDS - waited}s before requesting a new code`,
        });
      }
    }

    const { otp } = issueOtp(user);
    await user.save();

    let deliveryStatus;
    try {
      deliveryStatus = await sendVerificationOtp(user.email, otp);
    } catch {
      return res.status(502).json({
        success: false,
        message: 'Failed to resend the verification code. Please try again in a moment.',
      });
    }

    res.status(200).json({
      success: true,
      message:
        deliveryStatus === 'sent'
          ? `A new verification code has been sent to ${user.email}.`
          : 'SMTP is not configured - the verification code is printed on the server terminal (dev mode).',
      data: { email: user.email, delivery: deliveryStatus },
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/auth/member-login  (alias: /api/auth/login)
// @desc    Member JWT login - blocked until email is verified
export const memberLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: normalizeEmail(email) }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (user.role === 'admin') {
      return res.status(403).json({ success: false, message: 'Admins must sign in via the admin portal' });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before logging in. Check your inbox for the verification code.',
        data: { email: user.email, isEmailVerified: false },
      });
    }

    res.status(200).json({
      success: true,
      data: { ...buildPublicUser(user), token: generateToken(user._id) },
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/auth/admin-login
// @desc    Admin JWT login - enforcing role === 'admin' and supporting env-configured admin credentials
export const adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const normalizedEmail = normalizeEmail(email);
    const envAdminEmail = (process.env.ADMIN_EMAIL || process.env.ADMIN_USER_ID || 'admin@qndx.io').trim().toLowerCase();
    const envAdminPassword = process.env.ADMIN_PASSWORD;

    // If logging in with the env-defined admin credentials, ensure DB is in sync
    if (normalizedEmail === envAdminEmail && envAdminPassword && password === envAdminPassword) {
      let envAdmin = await User.findOne({ email: normalizedEmail }).select('+password');
      if (!envAdmin) {
        envAdmin = await User.create({
          email: envAdminEmail,
          password: envAdminPassword,
          role: 'admin',
          isEmailVerified: true,
        });
      } else {
        const matches = await envAdmin.matchPassword(password);
        if (!matches || envAdmin.role !== 'admin') {
          envAdmin.password = envAdminPassword;
          envAdmin.role = 'admin';
          envAdmin.isEmailVerified = true;
          await envAdmin.save();
        }
      }
    }

    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user || user.role !== 'admin' || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
    }

    res.status(200).json({
      success: true,
      data: { ...buildPublicUser(user), token: generateToken(user._id) },
    });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/auth/register
// @desc    Legacy invite-based registration (dev/back-compat, auto-verified)
export const register = async (req, res, next) => {
  try {
    const { email, password, inviteCode, sponsorCode } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const inviteRequired = process.env.DISABLE_INVITE_REQUIREMENT !== 'true';
    if (inviteRequired && inviteCode !== process.env.MASTER_INVITE_CODE) {
      return res.status(403).json({ success: false, message: 'Invalid or missing invite code' });
    }

    const normalizedEmail = normalizeEmail(email);

    if (await User.findOne({ email: normalizedEmail })) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists' });
    }

    let sponsor = null;
    if (sponsorCode) {
      sponsor = await User.findOne({ referralCode: sponsorCode.trim().toUpperCase() });
      if (!sponsor) {
        return res.status(400).json({ success: false, message: 'Invalid sponsor code' });
      }
    }

    const user = await User.create({
      email: normalizedEmail,
      password,
      sponsorCode: sponsor ? sponsor.referralCode : null,
      isEmailVerified: true, // legacy/dev flow skips email verification
    });

    res.status(201).json({
      success: true,
      data: { ...buildPublicUser(user), token: generateToken(user._id) },
    });
  } catch (error) {
    next(error);
  }
};

// @route   GET /api/auth/me
// @desc    Fetch logged-in user (protected)
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, data: buildPublicUser(user) });
  } catch (error) {
    next(error);
  }
};

// @route   POST /api/auth/forgot-password
// @desc    Initiate password reset -> generates 6-digit OTP -> sends email
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address is required' });
    }

    const normalizedEmail = normalizeEmail(email);
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No registered account found with this email address.',
      });
    }

    // Generate 6 digit numeric OTP
    const otp = crypto.randomInt(0, 10 ** OTP_LENGTH).toString().padStart(OTP_LENGTH, '0');
    user.resetPasswordOtp = crypto.createHash('sha256').update(otp).digest('hex');
    user.resetPasswordExpires = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
    await user.save();

    let deliveryStatus;
    try {
      deliveryStatus = await sendPasswordResetOtp(user.email, otp);
    } catch (err) {
      return res.status(502).json({
        success: false,
        message: 'Failed to deliver the reset code email. Please verify SMTP configuration or try again in a moment.',
      });
    }

    return res.status(200).json({
      success: true,
      message: deliveryStatus === 'dev-fallback'
        ? `[DEV MODE] OTP generated: ${otp} (SMTP not configured in .env)`
        : `Password reset verification code has been sent to ${user.email}.`,
      deliveryStatus,
      devOtp: deliveryStatus === 'dev-fallback' ? otp : undefined,
    });
  } catch (err) {
    console.error('forgotPassword error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error processing password reset' });
  }
};

// @route   POST /api/auth/reset-password
// @desc    Verify OTP and update user password
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, OTP code, and new password are required.',
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long.',
      });
    }

    const normalizedEmail = normalizeEmail(email);
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'Account not found.' });
    }

    if (!user.resetPasswordOtp || !user.resetPasswordExpires) {
      return res.status(400).json({
        success: false,
        message: 'No pending password reset request found. Please request a new code.',
      });
    }

    if (user.resetPasswordExpires < new Date()) {
      user.resetPasswordOtp = null;
      user.resetPasswordExpires = null;
      await user.save();
      return res.status(400).json({
        success: false,
        message: 'The password reset code has expired. Please request a new one.',
      });
    }

    const hashedEnteredOtp = crypto.createHash('sha256').update(String(otp).trim()).digest('hex');
    if (hashedEnteredOtp !== user.resetPasswordOtp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code. Please check your email and try again.',
      });
    }

    // Set new password (Mongoose pre-save bcrypt hook handles hashing)
    user.password = newPassword;
    user.resetPasswordOtp = null;
    user.resetPasswordExpires = null;
    user.isEmailVerified = true;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password has been successfully reset! You can now log in with your new password.',
    });
  } catch (err) {
    console.error('resetPassword error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error resetting password' });
  }
};

// @route   POST /api/auth/change-password
// @desc    Change password with current password verification (Authenticated)
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required.',
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long.',
      });
    }

    const user = await User.findById(req.user.id || req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect current password.' });
    }

    user.password = newPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password successfully updated.',
    });
  } catch (err) {
    console.error('changePassword error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error updating password' });
  }
};
