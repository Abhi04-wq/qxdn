import mongoose from 'mongoose';

const otpVerificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    code: {
      type: String,
      required: [true, 'OTP code is required'],
      trim: true,
    },
    action: {
      type: String,
      enum: ['WITHDRAWAL'],
      default: 'WITHDRAWAL',
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // Automatically remove document when expiresAt has passed
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

otpVerificationSchema.index({ userId: 1, action: 1, createdAt: -1 });

const OtpVerification = mongoose.model('OtpVerification', otpVerificationSchema);

export default OtpVerification;
