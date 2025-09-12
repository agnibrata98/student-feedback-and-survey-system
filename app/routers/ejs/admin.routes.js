const express = require ('express');
const adminController = require ('../../controllers/ejs/admin.controller');
const router = express.Router ();

router.get ('/admin-dashboard', adminController.getAdminDashboard);

module.exports = router;
