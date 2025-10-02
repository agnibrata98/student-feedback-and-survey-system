const StatusCode = require ('../../helper/StatusCode');
const ResultModel = require('../../models/aggregatedResult.model');
const ClassModel = require ('../../models/class.model');
const QuestionModel = require('../../models/question.model');
const ResponseModel = require('../../models/response.model');
const SurveyModel = require('../../models/survey.model');

class AdminController {
  async getAdminDashboard (req, res) {
    try {
      // 1. Most answered surveys (Top 3 by responses)
      const insights = await ResultModel.find()
        .sort({ totalResponded: -1 })
        .limit(3)
        .populate("surveyId", "title");

      // 2. Engagement leaderboard (per survey targetGroup/class)
      const leaderboard = await ResultModel.aggregate([
        {
          $lookup: {
            from: "surveys",
            localField: "surveyId",
            foreignField: "_id",
            as: "survey"
          }
        },
        { $unwind: "$survey" },
        {
          $group: {
            _id: "$survey.class_id", // group by class
            totalAssigned: { $sum: "$totalAssigned" },
            totalResponded: { $sum: "$totalResponded" }
          }
        },
        {
          $lookup: {
            from: "classes",
            localField: "_id",
            foreignField: "_id",
            as: "class"
          }
        },
        { $unwind: "$class" },
        {
          $project: {
            name: "$class.name",
            percent: { $round: [{ $multiply: [{ $divide: ["$totalResponded", "$totalAssigned"] }, 100] }, 0] }
          }
        }
      ]);


      // 3. Recent activities (latest student responses)
      const recent = await ResponseModel.find()
        .populate("survey_id", "title")
        .sort({ createdAt: -1 }) // use createdAt instead of submittedAt
        .limit(5);

      // 4. Total survey count
      const totalSurveyCount = await SurveyModel.countDocuments();
      // console.log({ insights, leaderboard, recent });

      res.render("admin-dashboard", {
        title: "Admin Dashboard",
        data: req.user,
        totalSurveyCount,
        insights,
        leaderboard,
        recent
      });
    } catch (error) {
      console.error ('Error rendering admin dashboard:', error);
      res.status (StatusCode.SERVER_ERROR).send ('Internal Server Error');
    }
  }

  async getAllClassesPage (req, res) {
    try {
      // 1. Aggregate survey counts per class
      const surveyStats = await SurveyModel.aggregate([
        {
          $group: {
            _id: "$class_id",
            count: { $sum: 1 }
          }
        }
      ]);

      // 2. Fetch all classes
      const classes = await ClassModel.find();

      // 3. Merge survey counts into classes
      const classSurveyCounts = classes.map(cls => {
        const stat = surveyStats.find(
          s => s._id?.toString() === cls._id.toString()
        );
        return {
          id: cls._id,
          name: cls.name,
          surveyCount: stat ? stat.count : 0
        };
      });

      // 4. Render EJS page
      res.render("classes", {
        title: "Admin Dashboard",
        data: req.user,
        classSurveyCounts
      });
    } catch (error) {
      console.error ('Error rendering admin dashboard:', error);
      res.status (StatusCode.SERVER_ERROR).send ('Internal Server Error');
    }
  }

  // async createClass (req, res) {
  //   try {
  //     const {name} = req.body;
  //     const newClass = await ClassModel.create ({
  //       name,
  //     });
  //     res.status (StatusCode.CREATED).json ({
  //       message: 'Class created successfully',
  //       success: true,
  //       class: newClass,
  //     });
  //   } catch (error) {
  //     console.error ('Error creating class:', error);
  //     res.status (StatusCode.SERVER_ERROR).send ('Internal Server Error');
  //   }
  // }

  async createClass (req, res) {
    try {
      const {name} = req.body;

      if (!name) {
        // If you are using connect-flash
        req.flash ('error', 'Class name is required');
        return res.redirect ('/classes');
      }

      await ClassModel.create ({name});

      // Success message (if flash is configured)
      req.flash ('success', 'Class created successfully');

      // Redirect back to the classes page
      res.redirect ('/classes');
    } catch (error) {
      console.error ('Error creating class:', error);
      res.status (StatusCode.SERVER_ERROR).send ('Internal Server Error');
    }
  }

  async getAllClasses (req, res) {
    try {
      const classes = await ClassModel.find ();
      if (!classes) {
        return res.status (StatusCode.NOT_FOUND).json ({
          message: 'No classes found',
          success: false,
        });
      }
      res.status (StatusCode.OK).json ({
        message: 'Classes retrieved successfully',
        success: true,
        length: classes.length,
        classes,
      });
    } catch (error) {
      console.error ('Error retrieving classes:', error);
      res.status (StatusCode.SERVER_ERROR).send ('Internal Server Error');
    }
  }

  async getSurveysByClass(req, res) {
    try {
      const { classId } = req.params;

      // 1. Find class details
      const cls = await ClassModel.findById(classId);
      if (!cls) {
        return res.status(404).send("Class not found");
      }

      // 2. Fetch surveys for that class
      const surveys = await SurveyModel.find({ class_id: classId });

      // 3. Render EJS
      res.render("surveys", {
        title: `Surveys for ${cls.name}`,
        data: req.user,
        className: cls.name,
        surveys
      });
    } catch (error) {
      console.error("Error fetching surveys by class:", error);
      res.status(500).send("Internal Server Error");
    }
  }

  async getCreateSurveyPage(req, res) {
    try {
      // 2. Fetch all classes
      const classes = await ClassModel.find();
      res.render("create-survey", {
        title: 'Create Survey',
        data: req.user,
        classes
      });
    } catch (error) {
      console.error("Error fetching surveys by class:", error);
      res.status(500).send("Internal Server Error");
    }
  }

  async createSurvey(req, res) {
    try {
      const { title, description, class_id, questions } = req.body;
      const created_by = req.user._id; // Assuming admin is logged in and middleware sets req.user

      if (!title || !class_id || !questions || questions.length === 0) {
        return res.status(400).json({ status: false, message: "Missing required fields" });
      }

      // 1. Create survey
      const survey = await SurveyModel.create({
        title,
        description,
        created_by,
        class_id,
      });

      // 2. Prepare questions with survey_id reference
      const questionsToInsert = questions.map(q => ({
        survey_id: survey._id,
        question_text: q.question_text,
        order: q.order,
      }));

      // 3. Insert questions
      await QuestionModel.insertMany(questionsToInsert);

      return res.status(201).json({ status: true, message: "Survey created successfully", surveyId: survey._id });
    } catch (error) {
      console.error("Create Survey Error:", error);
      return res.status(500).json({ status: false, message: "Server Error" });
    }
  }

  async getEditSurveyPage(req, res) {
    try {
      res.render("edit-survey", {
        title: 'Edit Survey',
        data: req.user,
        // className: cls.name,
        // surveys
      });
    } catch (error) {
      console.error("Create Survey Error:", error);
      return res.status(500).json({ status: false, message: "Server Error" });
    }
  }

  async deleteSurvey(req, res) {
    try {
      const { surveyId } = req.params;

      // 1. Check if survey exists
      const survey = await SurveyModel.findById(surveyId);
      if (!survey) {
        req.flash('error', 'Survey not found');
        return res.redirect('/classes'); // back to classes list page
      }

      // 2. Delete all questions for this survey
      await QuestionModel.deleteMany({ survey_id: surveyId });

      // 3. Delete the survey itself
      await SurveyModel.findByIdAndDelete(surveyId);

      req.flash('success', 'Survey and related questions deleted successfully');
      return res.redirect('/classes'); // redirect back to list
    } catch (error) {
      console.error("Delete survey error:", error);
      req.flash('error', 'Internal Server Error');
      return res.redirect('/classes');
    }
  }

  // for admin logout
  async logoutAdmin (req, res) {
    try {
      res.clearCookie ('adminToken', {
        path: '/',
        sameSite: 'Strict',
      });
      req.flash ('success', 'Admin logged out.');
      return res.redirect ('http://localhost:5173/login');
    } catch (e) {
      console.error ('Admin Logout Error:', e);
      req.flash ('error', 'Logout failed.');
      return res.redirect ('/login');
    }
  }
}

module.exports = new AdminController ();
