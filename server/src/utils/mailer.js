import nodemailer from 'nodemailer';

/**
 * SMTP mailer (Nodemailer).
 * Requires SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS in .env (Gmail App Password).
 * Throws on any send failure so the API can surface a proper error to the client.
 */

let transporter = null;

const isMailConfigured = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const getTransporter = () => {
  if (!transporter) {
    if (!isMailConfigured()) {
      throw new Error('SMTP not configured (SMTP_HOST/SMTP_USER/SMTP_PASS missing in .env)');
    }
    const port = Number(process.env.SMTP_PORT || 587);
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
};

// @returns 'sent' when SMTP delivery succeeded
export const sendVerificationOtp = async (email, otp) => {
  if (!isMailConfigured()) {
    console.log(`[dev] SMTP not configured - OTP for ${email}: ${otp} (valid 10 minutes)`);
    return 'dev-fallback';
  }

  try {
    await getTransporter().sendMail({
      from: `${process.env.MAIL_FROM_NAME || 'QNDX Staking'} <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'QNDX Verification Code',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;border-radius:12px;border:1px solid #e2e8f0;text-align:center;">
          <h2 style="color:#0f172a;">QNDX Email Verification</h2>
          <p style="color:#334155;">Use this one-time code to verify your email. It expires in 10 minutes.</p>
          <div style="margin:24px auto;font-size:32px;font-weight:bold;letter-spacing:10px;color:#06b6d4;">${otp}</div>
          <p style="color:#94a3b8;font-size:12px;">If you did not request this, you can safely ignore this email.</p>
        </div>
      `,
    });
    return 'sent';
  } catch (error) {
    console.error(`SMTP send failed for ${email}: ${error.message}`);
    throw error;
  }
};

// @desc Send OTP verification email for withdrawal authorization
export const sendWithdrawalOtp = async (email, otp, amount, destinationAddress) => {
  if (!isMailConfigured()) {
    console.log(`[dev] SMTP not configured - Withdrawal OTP for ${email}: ${otp} (Amount: ${amount} USDT, Dest: ${destinationAddress})`);
    return 'dev-fallback';
  }

  try {
    await getTransporter().sendMail({
      from: `${process.env.MAIL_FROM_NAME || 'QNDX Staking'} <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Security Alert: Authorization Code for QNDX Withdrawal',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:28px;border-radius:12px;border:1px solid #334155;background:#0f172a;color:#f8fafc;">
          <div style="text-align:center;margin-bottom:20px;">
            <h2 style="color:#38bdf8;margin:0;">QNDX Withdrawal Authorization</h2>
            <p style="color:#94a3b8;font-size:13px;margin-top:6px;">Two-factor authentication required for payout dispatch</p>
          </div>
          <div style="background:#1e293b;padding:16px;border-radius:8px;margin-bottom:20px;font-size:13px;color:#cbd5e1;">
            <p style="margin:4px 0;"><strong>Withdrawal Gross:</strong> ${amount} USDT</p>
            <p style="margin:4px 0;"><strong>Destination (BEP-20):</strong> <span style="font-family:monospace;color:#38bdf8;">${destinationAddress}</span></p>
          </div>
          <div style="text-align:center;margin:24px 0;">
            <p style="color:#e2e8f0;font-size:14px;margin-bottom:8px;">Your 6-Digit One-Time Password (OTP):</p>
            <div style="font-size:36px;font-weight:bold;letter-spacing:12px;color:#38bdf8;padding:12px 20px;background:#0284c715;border:1px dashed #0284c7;border-radius:8px;display:inline-block;">
              ${otp}
            </div>
            <p style="color:#ef4444;font-size:12px;margin-top:10px;">⚠️ Valid for 10 minutes. Never share this code with anyone.</p>
          </div>
          <p style="color:#64748b;font-size:12px;text-align:center;margin-top:24px;border-top:1px solid #334155;padding-top:16px;">
            If you did NOT request this withdrawal, please secure your account immediately and contact QNDX Support.
          </p>
        </div>
      `,
    });
    return 'sent';
  } catch (error) {
    console.error(`Withdrawal OTP send failed for ${email}: ${error.message}`);
    throw error;
  }
};

// @desc Send OTP verification email for Password Reset
export const sendPasswordResetOtp = async (email, otp) => {
  if (!isMailConfigured()) {
    console.log(`[dev] SMTP not configured - Password Reset OTP for ${email}: ${otp} (valid 10 minutes)`);
    return 'dev-fallback';
  }

  try {
    await getTransporter().sendMail({
      from: `${process.env.MAIL_FROM_NAME || 'QNDX Staking'} <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Security Alert: QNDX Password Reset Code',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:28px;border-radius:12px;border:1px solid #164336;background:#091512;color:#f8fafc;">
          <div style="text-align:center;margin-bottom:20px;">
            <h2 style="color:#34D399;margin:0;">QNDX Password Reset Request</h2>
            <p style="color:#94a3b8;font-size:13px;margin-top:6px;">One-Time Security Verification Code</p>
          </div>
          <div style="background:#07241C;border:1px solid #1E493B;padding:16px;border-radius:8px;margin-bottom:20px;font-size:13px;color:#cbd5e1;text-align:center;">
            <p style="margin:0;">We received a request to reset the password for your account: <strong style="color:#34D399;">${email}</strong></p>
          </div>
          <div style="text-align:center;margin:24px 0;">
            <p style="color:#e2e8f0;font-size:14px;margin-bottom:8px;">Your 6-Digit Password Reset OTP:</p>
            <div style="font-size:36px;font-weight:bold;letter-spacing:12px;color:#34D399;padding:12px 20px;background:#05966915;border:1px dashed #10B981;border-radius:8px;display:inline-block;">
              ${otp}
            </div>
            <p style="color:#f43f5e;font-size:12px;margin-top:10px;">⚠️ Valid for 10 minutes. Never share this code with anyone.</p>
          </div>
          <p style="color:#64748b;font-size:12px;text-align:center;margin-top:24px;border-top:1px solid #1E493B;padding-top:16px;">
            If you did not initiate this request, your account may be at risk. Contact QNDX Support immediately.
          </p>
        </div>
      `,
    });
    return 'sent';
  } catch (error) {
    console.error(`Password reset OTP send failed for ${email}: ${error.message}`);
    throw error;
  }
};
