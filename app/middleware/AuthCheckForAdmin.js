const jwt = require ('jsonwebtoken');
const StatusCode = require('../helper/StatusCode');

const authAdmin = (req, res, next) => {
  try {
    // 1. Get token from cookies
    const token = req.cookies.adminToken  || req?.body?.token||req?.query?.token||req?.headers['x-access-token']||req?.headers['authorization'];
    if (!token) {
        return res.status(StatusCode.UNAUTHORIZED).json({
            status: false,
            message: "Access Denied. No Token Provided",
        });
    }

    // 2. Verify token
    const decoded = jwt.verify (
      token,
      process.env.JWT_SECRET || 'your_jwt_secret_key'
    );

    // 3. Check role (admin)
    if (decoded.role !== 'admin') {
      return res.status (StatusCode.FORBIDDEN).json ({
        success: false,
        message: 'Access denied: Admins only'
      });
    }

    // Check role (student)
    // if(decoded.role !== 'student') {
    //     return res.status (StatusCode.FORBIDDEN).send ('Access denied: Students only');
    // }

    // 4. Attach user data
    req.user = decoded;
    next ();
  } catch (err) {
    console.error (err);
    return res.redirect ('/login'); // if invalid or expired token
  }
};

module.exports = authAdmin;
