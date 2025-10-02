const mongoose = require ('mongoose');

const otpSchema = new mongoose.Schema (
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true,
    },
    otp_code: {
      type: String,
      required: true,
    },
    expires_at: {
      type: Date,
      required: true,
    },
  },
  {timestamps: true}
);

const OtpModel = mongoose.model ('otp', otpSchema);

module.exports = OtpModel;
