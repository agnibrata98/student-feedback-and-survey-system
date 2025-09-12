const StatusCode = require("../../helper/StatusCode");

class AdminController {
    async getAdminDashboard(req, res) {
        try {
            res.render("admin-dashboard", { title: "Admin Dashboard" });
        } catch (error) {
            console.error("Error rendering admin dashboard:", error);
            res.status(StatusCode).send("Internal Server Error");
        }
    }
}

module.exports = new AdminController();
