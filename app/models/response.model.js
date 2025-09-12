const mongoose = require ('mongoose');

const responseSchema = new mongoose.Schema (
  {
    survey_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'survey',
      required: true,
    },
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true,
    },
    answers: [
      {
        question_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'question',
          required: true,
        },
        answer_text: {
          type: String,
          required: true,
          trim: true,
        },
      },
    ],
  },
  {timestamps: true}
);

const ResponseModel = mongoose.model ('response', responseSchema);

module.exports = ResponseModel;
