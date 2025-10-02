const express = require ('express');
const adminController = require ('../../controllers/ejs/admin.controller');
const AuthCheckForAdmin = require ('../../middleware/AuthCheckForAdmin');
const router = express.Router ();


// for getting admin dashboard front page
router.get ('/admin-dashboard', AuthCheckForAdmin, adminController.getAdminDashboard);

// for getting all classes page 
router.get('/classes', AuthCheckForAdmin, adminController.getAllClassesPage);

// post method for creating a class
router.post ('/create-class', AuthCheckForAdmin, adminController.createClass);

// /surveys/:classId
router.get("/surveys/:classId", AuthCheckForAdmin, adminController.getSurveysByClass);

// get method for create survey page
router.get('/create-survey', AuthCheckForAdmin, adminController.getCreateSurveyPage);

// post method for create survey
router.post("/create-survey", AuthCheckForAdmin, adminController.createSurvey);

// get method for edit survey page
router.get('/survey/edit/:surveyId', AuthCheckForAdmin, adminController.getEditSurveyPage);

// DELETE survey
router.get('/survey/delete/:surveyId', adminController.deleteSurvey);

// get route for admin logout
router.get('/logout', adminController.logoutAdmin);

// // api for getting all classes
// router.get ('/api/classes', adminController.getAllClasses);

module.exports = router;
