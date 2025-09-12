const mongoose = require ('mongoose');

const questionSchema = new mongoose.Schema (
  {
    survey_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'survey',
      required: true,
    },
    question_text: {
      type: String,
      required: true,
      trim: true,
    },
    order: {
      type: Number,
      required: true,
    },
  },
  {timestamps: true}
);

const QuestionModel = mongoose.model ('question', questionSchema);

module.exports = QuestionModel;
