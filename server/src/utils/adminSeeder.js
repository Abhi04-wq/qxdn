import User from '../models/User.js';

/**
 * Ensures the administrator account defined in environment variables exists
 * and stays in sync (role, verification status, and password).
 */
export const ensureAdminFromEnv = async () => {
  const adminEmail = (process.env.ADMIN_EMAIL || process.env.ADMIN_USER_ID || 'admin@qndx.io').trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || 'AdminPass123';

  if (!adminEmail || !adminPassword) return;

  try {
    let admin = await User.findOne({ email: adminEmail }).select('+password');

    if (!admin) {
      admin = await User.create({
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
        isEmailVerified: true,
      });
      console.log(`[Startup] Admin created from env: ${adminEmail} (Referral: ${admin.referralCode})`);
    } else {
      let modified = false;

      if (admin.role !== 'admin') {
        admin.role = 'admin';
        modified = true;
      }
      if (!admin.isEmailVerified) {
        admin.isEmailVerified = true;
        modified = true;
      }

      const isMatch = await admin.matchPassword(adminPassword);
      if (!isMatch) {
        admin.password = adminPassword;
        modified = true;
        console.log(`[Startup] Admin password synced from env for ${adminEmail}`);
      }

      if (modified) {
        await admin.save();
      }
    }
  } catch (err) {
    console.error('[Startup] Failed to sync admin from env:', err.message);
  }
};

export default ensureAdminFromEnv;
