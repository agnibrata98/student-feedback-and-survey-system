const mongoose = require ('mongoose');

const classSchema = new mongoose.Schema (
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
  },
  {timestamps: true}
);
const ClassModel = mongoose.model ('class', classSchema);

module.exports = ClassModel;