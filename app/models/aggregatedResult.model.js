const mongoose = require ('mongoose');

const resultSchema = new mongoose.Schema (
  {
    surveyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'survey',
      required: true,
    },
    totalAssigned: {
      type: Number, // total students in that class
      required: true,
    },
    totalResponded: {
      type: Number, // number of students who submitted
      default: 0,
    },
    notResponded: {
      type: Number, // totalAssigned - totalResponded
      default: 0,
    },
  },
  {timestamps: true}
);

const ResultModel = mongoose.model ('result', resultSchema);

module.exports = ResultModel;
