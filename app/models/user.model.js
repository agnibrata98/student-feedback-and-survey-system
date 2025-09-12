const mongoose = require ('mongoose');

const userSchema = new mongoose.Schema (
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['student', 'admin'],
      default: 'student',
    },
    class_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'class',
      required: function () {
        return this.role === 'student';
      },
    },
  },
  {timestamps: true}
);

const UserModel = mongoose.model ('user', userSchema);

module.exports = UserModel;
