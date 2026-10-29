import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';
import connectDB from '../config/db.js';

// Usage:
//   npm run seed                          -> admin + 5 demo members (referred by admin, email-verified)
//   npm run seed -- --members=10          -> admin + 10 members
//   npm run seed -- --email=you@x.com --password=SuperPass1 --members=0   -> only ensure admin

const parseArgs = () =>
  Object.fromEntries(
    process.argv.slice(2).map((a) => {
      const m = a.match(/^--([\w-]+)(?:=(.*))?$/);
      return [m?.[1] ?? a, m?.[2] ?? true];
    })
  );

const MEMBER_COUNT = 5;

const seed = async () => {
  const args = parseArgs();
  const adminEmail = (args.email || 'admin@qndx.io').toLowerCase();
  const adminPassword = args.password || 'AdminPass123';
  const memberCount = parseInt(args.members ?? MEMBER_COUNT, 10);

  await connectDB();

  // 1) Admin (idempotent) - pre-verified so admin-login works immediately
  let admin = await User.findOne({ email: adminEmail });
  if (admin) {
    console.log(`Admin exists: ${admin.email} (referralCode: ${admin.referralCode})`);
  } else {
    admin = await User.create({
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
      isEmailVerified: true,
    });
    console.log(`Admin created: ${admin.email} / ${adminPassword}`);
  }

  console.log(`\nAdmin referral code: ${admin.referralCode}`);
  console.log(
    `Invite link: ${(process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '')}/register?ref=${admin.referralCode}\n`
  );

  // 2) Demo members, all sponsored by the admin (pre-verified for demo logins)
  for (let i = 1; i <= memberCount; i++) {
    const email = `member${i}.qa@qndx.io`;
    if (await User.findOne({ email })) {
      console.log(`Member exists: ${email}`);
      continue;
    }
    const member = await User.create({
      email,
      password: 'MemberPass1',
      sponsorCode: admin.referralCode,
      isEmailVerified: true,
    });
    console.log(`Member created: ${member.email} (sponsored by ${admin.referralCode})`);
  }

  await mongoose.disconnect();
};

seed().catch((err) => {
  console.error(`Seed failed: ${err.message}`);
  process.exit(1);
});
