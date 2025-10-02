const jwt = require('jsonwebtoken');
const StatusCode = require('../helper/StatusCode');

const authStudent = (req, res, next) => {
  try {
    // 1. Get token from various sources
    let token = req.cookies?.studentToken 
              || req.body?.token
              || req.query?.token
              || req.headers['x-access-token']
              || req.headers['authorization'];

    // 2. If token is missing
    if (!token || token === 'null' || token === 'undefined' || token.trim() === '') {
      return res.status(StatusCode.UNAUTHORIZED).json({
        status: false,
        message: "Access Denied. No Token Provided"
      });
    }

    // 3. Handle "Bearer <token>" format
    if (token.startsWith('Bearer ')) {
      token = token.slice(7, token.length).trimLeft();
    }

    // 4. Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your_jwt_secret_key'
    );

    // 5. Enforce student role
    if (decoded.role !== 'student') {
      return res.status(StatusCode.FORBIDDEN).json({
        success: false,
        message: 'Access denied: Students only'
      });
    }

    // 6. Attach decoded user data
    req.user = decoded;
    next();

  } catch (err) {
    console.error("Auth Error:", err.message);
    return res.status(StatusCode.UNAUTHORIZED).json({
      status: false,
      message: "Access Denied. Invalid or expired token"
    });
  }
};

module.exports = authStudent;
