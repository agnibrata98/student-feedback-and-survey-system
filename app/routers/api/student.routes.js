const express = require('express');
const authController = require('../../controllers/api/auth.controller');
const studentController = require('../../controllers/api/student.controller');
const AuthCheckForStudent = require('../../middleware/AuthCheckForStudent');
const adminController = require('../../controllers/ejs/admin.controller');
const router = express.Router();

// for getting student profile
router.get('/', AuthCheckForStudent, authController.getWelcome);

// api for getting all classes
router.get ('/classes', adminController.getAllClasses);

// get assigned surveys
router.get('/surveys', AuthCheckForStudent, studentController.getAssignedSurveys);

// get survey details with all questions
router.get('/surveys/:id', AuthCheckForStudent, studentController.getSurveyDetailsAndQuestions);

// post method for answering survey questions
router.post("/surveys/:surveyId/submit", AuthCheckForStudent, studentController.submitSurveyAnswers);

// get method for attempted surveys of any student
router.get('/attempted-surveys', AuthCheckForStudent, studentController.getAttemptedSurveys);

module.exports = router;