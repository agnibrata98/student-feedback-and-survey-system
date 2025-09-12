const mongoose = require ('mongoose');

const surveySchema = new mongoose.Schema (
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true,
    },
    class_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'class',
      required: true,
    },
  },
  {timestamps: true}
);

const SurveyModel = mongoose.model ('survey', surveySchema);

module.exports = SurveyModel;
