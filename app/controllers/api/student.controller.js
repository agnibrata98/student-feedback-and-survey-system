const mongoose = require ('mongoose');
const SurveyModel = require ('../../models/survey.model');
const UserModel = require ('../../models/user.model');
const StatusCode = require ('../../helper/StatusCode');
const ResponseModel = require ('../../models/response.model');

class StudentController {
  async getAssignedSurveys (req, res) {
    try {
      // req.user should have student info after login (from JWT/session)
      const studentId = req.user._id;
      const studentClassId = req.user.class_id;

      //   console.log (studentId, 'student id');
      //   console.log (studentClassId, 'class id');

      // Get student details (to know their class)
      const student = await UserModel.findById (studentId);

      if (!student) {
        return res.status (StatusCode.NOT_FOUND).json ({
          success: false,
          message: 'Student not found',
        });
      }

      if (!studentClassId) {
        return res.status (StatusCode.NOT_FOUND).json ({
          success: false,
          message: 'Student class not found',
        });
      }

      // Use aggregation to get the student info and assigned surveys in one pipeline
      // Aggregate surveys for this student's class
      const surveys = await SurveyModel.aggregate ([
        {
          $match: {
            class_id: new mongoose.Types.ObjectId (studentClassId), // only this class
            is_active: true, // only active surveys
          },
        },
        {
          $sort: {createdAt: -1}, // latest first
        },
        {
          $project: {
            _id: 1,
            title: 1,
            description: 1,
            created_by: 1,
            class_id: 1,
            is_completed: 1,
            is_active: 1,
            createdAt: 1,
            updatedAt: 1,
          },
        },
      ]);

      if (!surveys || surveys.length === 0) {
        return res.status (StatusCode.NOT_FOUND).json ({
          success: false,
          message: 'No Surveys found',
        });
      }

      return res.status (StatusCode.OK).json ({
        success: true,
        message: 'All Surveys Are Retrived Successfully',
        length: surveys.length,
        surveys,
      });
    } catch (error) {
      console.error ('Error fetching assigned surveys:', error);
      return res.status (StatusCode.SERVER_ERROR).json ({
        success: false,
        message: 'Server error while fetching surveys',
      });
    }
  }

  async getSurveyDetailsAndQuestions (req, res) {
    try {
      const surveyId = req.params.id;
      // console.log (req.user.name, 'user name');

      if (!mongoose.Types.ObjectId.isValid (surveyId)) {
        return res.status (StatusCode.BAD_REQUEST).json ({
          success: false,
          message: 'Invalid survey ID',
        });
      }

      // Aggregation: fetch survey + its questions
      const surveyDetails = await SurveyModel.aggregate ([
        {
          $match: {
            _id: new mongoose.Types.ObjectId (surveyId),
            class_id: new mongoose.Types.ObjectId (req.user.class_id), // 👈 check student's class
            is_active: true,
          },
        },
        {
          $lookup: {
            from: 'questions', // collection name
            localField: '_id', // survey._id
            foreignField: 'survey_id', // question.survey_id
            as: 'questions',
          },
        },
        {
          $project: {
            _id: 1,
            title: 1,
            description: 1,
            created_by: 1,
            class_id: 1,
            is_active: 1,
            createdAt: 1,
            updatedAt: 1,
            questions: {
              _id: 1,
              question_text: 1,
              order: 1,
            },
          },
        },
        {$sort: {'questions.order': 1}}, // optional: sort by order field
      ]);

      if (!surveyDetails || surveyDetails.length === 0) {
        return res.status (404).json ({
          success: false,
          message: 'Survey not found',
        });
      }

      return res.status (StatusCode.OK).json ({
        success: true,
        message: 'Survey details retrieved successfully',
        length: surveyDetails[0].questions.length,
        survey: surveyDetails[0],
      });
    } catch (error) {
      console.error ('Error fetching survey details:', error);
      return res.status (StatusCode.SERVER_ERROR).json ({
        success: false,
        message: 'Server error while fetching survey details',
      });
    }
  }

  async submitSurveyAnswers (req, res) {
    try {
      const student_id = req.user._id || req.user.id;
      const {survey_id, answers} = req.body;

      // Prevent duplicate submission
      const alreadySubmitted = await ResponseModel.findOne ({
        survey_id,
        student_id,
      });
      if (alreadySubmitted) {
        return res.status (StatusCode.BAD_REQUEST).json ({
          success: false,
          message: 'You have already submitted this survey',
        });
      }

      // Map answers to schema format
      const formattedAnswers = answers.map (a => ({
        question_id: a.question_id,
        answer_text: a.answer, // convert "answer" → "answer_text"
      }));

      // Create response
      const response = new ResponseModel ({
        survey_id,
        student_id,
        answers: formattedAnswers, // [{ questionId, answer }]
      });

      await response.save ();

      //  Mark survey as completed
      await SurveyModel.findByIdAndUpdate (survey_id, {is_completed: true});

      return res.status (StatusCode.CREATED).json ({
        success: true,
        message: 'Survey submitted successfully',
      });
    } catch (error) {
      console.error ('Error submitting survey answers:', error);
      return res.status (StatusCode.SERVER_ERROR).json ({
        success: false,
        message: 'Server error while submitting answers',
      });
    }
  }

  async getAttemptedSurveys (req, res) {
    try {
      const studentId = new mongoose.Types.ObjectId (req.user._id);
      const studentClass = new mongoose.Types.ObjectId (req.user.class_id);

      const result = await SurveyModel.aggregate ([
        {$match: {class_id: studentClass}},

        {
          $lookup: {
            from: 'responses',
            let: {surveyId: '$_id'},
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      {$eq: ['$survey_id', '$$surveyId']},
                      {$eq: ['$student_id', studentId]}, // both ObjectId now
                    ],
                  },
                },
              },
            ],
            as: 'studentResponses',
          },
        },

        {
          $addFields: {
            attempted: {
              $cond: [{$gt: [{$size: '$studentResponses'}, 0]}, 1, 0],
            },
          },
        },

        {
          $group: {
            _id: null,
            totalAssigned: {$sum: 1},
            totalAttempted: {$sum: '$attempted'},
          },
        },

        {
          $addFields: {
            participationRate: {
              $cond: [
                {$eq: ['$totalAssigned', 0]},
                0,
                {
                  $multiply: [
                    {$divide: ['$totalAttempted', '$totalAssigned']},
                    100,
                  ],
                },
              ],
            },
          },
        },
      ]);

      const stats = result[0] || {
        totalAssigned: 0,
        totalAttempted: 0,
        participationRate: 0,
      };

      return res.status (StatusCode.OK).json ({
        success: true,
        student: req.user.name,
        class: req.user.class_id,
        totalAssigned: stats.totalAssigned,
        totalAttempted: stats.totalAttempted,
        participationRate: `${stats.participationRate.toFixed (2)}%`,
      });
    } catch (error) {
      console.error ('Error fetching attempted surveys:', error);
      return res
        .status (StatusCode.SERVER_ERROR)
        .json ({success: false, message: 'Internal Server Error'});
    }
  }
}

module.exports = new StudentController ();
