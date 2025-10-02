const StatusCode = require ('../../helper/StatusCode');
const UserModel = require ('../../models/user.model');
const hashedPassword = require ('../../helper/HashPassword');
const bcrypt = require ('bcryptjs');
const jwt = require ('jsonwebtoken');
const OtpModel = require ('../../models/otp.model');
const generateOtp = require ('../../helper/GenerateOtp');
const sendEmail = require ('../../helper/SendEmail');

class AuthController {
  async getWelcome (req, res) {
    try {
      res.status (StatusCode.OK).json ({
        message: `Welcome to the student dashboard ${req.user.name}!`,
        user: req.user,
      });
    } catch (error) {
      console.error ('Error in getWelcome:', error);
      res
        .status (StatusCode.SERVER_ERROR)
        .json ({error: 'Internal Server Error'});
    }
  }

  async registerUser (req, res) {
    try {
      const {name, email, password, class_id} = req.body;
      // Validate input
      if (!name || !email || !password || !class_id) {
        return res
          .status (StatusCode.BAD_REQUEST)
          .json ({message: 'All Fields Are Required'});
      }

      // Check if user already exists
      const existingUser = await UserModel.findOne ({email});
      if (existingUser) {
        return res
          .status (StatusCode.BAD_REQUEST)
          .json ({message: 'User Already Exists'});
      }

      // Hash the password
      const encryptedPassword = await hashedPassword (password);

      // Create a new user
      const newUser = new UserModel ({
        name,
        email,
        password: encryptedPassword,
        class_id,
      });

      // Save the user to the database
      const data = await newUser.save ();

      res.status (StatusCode.CREATED).json ({
        message: 'User Successfully Registered',
        data: data,
      });
    } catch (error) {
      console.error ('Error registering user:', error);
      res
        .status (StatusCode.SERVER_ERROR)
        .json ({error: 'Internal Server Error'});
    }
  }

  async loginUser (req, res) {
    try {
      const {email, password} = req.body;
      if (!email || !password) {
        // req.flash ('error', 'All fields are required.');
        // return res.redirect ('/login');
        res.status (StatusCode.BAD_REQUEST).json ({
          message: 'All fields are required',
          success: false,
          // redirectUrl: 'http://localhost:5173/login',
        });
      }

      // Find user by email (can be user or admin)
      const user = await UserModel.findOne ({email});
      if (!user) {
        // req.flash ('error', 'Invalid credentials.');
        // return res.redirect ('/login');
        return res.status (StatusCode.UNAUTHORIZED).json ({
          message: 'User not found',
          success: false,
          // redirectUrl: 'http://localhost:5173/login',
        });
      }

      // Verify password
      const isMatch = await bcrypt.compare (password, user.password);
      if (!isMatch) {
        // req.flash ('error', 'Invalid email or password.');
        // return res.redirect ('/login');
        return res.status (StatusCode.UNAUTHORIZED).json ({
          message: 'Invalid Credentials',
          success: false,
          // redirectUrl: 'http://localhost:5173/login',
        });
      }

      // Create payload
      const payload = {
        _id: user._id,
        name: user.name,
        email: user.email,
        class_id: user.class_id || null,
        role: user.role, // role can be "user" or "admin"
      };

      const token = jwt.sign (
        payload,
        process.env.JWT_SECRET || 'your_jwt_secret_key',
        {
          expiresIn: '1h',
        }
      );

      // handle role based login and set cookies accordingly and redirect to respective dashboards
      if (user.role === 'admin') {
        // Store token in secure HTTP-only cookie for EJS
        res.clearCookie ('adminToken');
        res.cookie ('adminToken', token, {
          httpOnly: true,
          secure: false,
          sameSite: 'lax',
          path: '/',
          maxAge: 3600000,
        });

        // req.flash ('success', 'Admin login successful.');
        // return res.redirect ('/admin-dashboard');
        return res.json ({
          // redirectUrl: 'http://localhost:8000/admin-dashboard', // Node EJS dashboard
          message: 'Admin login successful',
          success: true,
          role: user.role,
          token,
        });
      } else {
        // Students (React)
        res.clearCookie ('studentToken');
        res.cookie ('studentToken', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: 'lax',
          path: '/',
          maxAge: 3600000,
        });

        // req.flash ('success', 'User login successful.');
        // return res.redirect ('/user-dashboard');
        return res.status (StatusCode.OK).json ({
          // redirectUrl: 'http://localhost:5173/student-dashboard', // React student dashboard
          message: 'Student login successful',
          success: true,
          role: user.role,
          token,
        });
      }
    } catch (error) {
      console.error ('Error logging in user:', error);
      res
        .status (StatusCode.SERVER_ERROR)
        .json ({error: 'Internal Server Error'});
    }
  }

  async forgotPassword (req, res) {
    try {
      const {email} = req.body;

      const user = await UserModel.findOne ({email});
      if (!user) {
        return res
          .status (StatusCode.BAD_REQUEST)
          .json ({message: 'User not found'});
      }

      // Generate OTP
      const code = generateOtp ();
      const expiresAt = new Date (Date.now () + 5 * 60 * 1000); // 5 minutes

      // Save OTP in DB
      await OtpModel.create ({
        user_id: user._id,
        otp_code: code,
        expires_at: expiresAt,
      });

      // Use helper
      const result = await sendEmail ({
        to: email,
        subject: 'Password Reset OTP',
        text: `Your OTP is ${code}. It expires in 5 minutes.`,
        html: `
          <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
            <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 10px; padding: 30px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
              <h2 style="color: #333333; text-align: center;">Password Reset OTP</h2>
              <p style="text-align: center; color: #555555;">Use the OTP below to reset your password. It expires in <strong>5 minutes</strong>.</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <span style="display: inline-block; background-color: #007bff; color: #ffffff; font-size: 32px; font-weight: bold; padding: 15px 25px; border-radius: 8px; letter-spacing: 4px;">
                  ${code}
                </span>
              </div>

              <p style="text-align: center; color: #888888; font-size: 14px;">
                If you didn't request a password reset, please ignore this email.
              </p>

              <hr style="border: none; border-top: 1px solid #eeeeee; margin: 20px 0;">

              <p style="text-align: center; color: #aaa; font-size: 12px;">
                &copy; ${new Date ().getFullYear ()} YourCompany. All rights reserved.
              </p>
            </div>
          </div>
        `,
      });

      res
        .status (StatusCode.OK)
        .json ({message: 'OTP sent to your email', otp: code});
    } catch (err) {
      console.error ('Forgot password error:', err);
      res.status (StatusCode.SERVER_ERROR).json ({message: 'Server error'});
    }
  }

  async verifyOtp (req, res) {
    try {
      const {email, otp} = req.body;

      const user = await UserModel.findOne ({email});
      if (!user) {
        return res
          .status (StatusCode.BAD_REQUEST)
          .json ({message: 'User not found'});
      }

      const otpRecord = await OtpModel.findOne ({
        user_id: user._id,
        otp_code: otp,
      });
      if (!otpRecord) {
        return res
          .status (StatusCode.BAD_REQUEST)
          .json ({message: 'Invalid OTP'});
      }

      if (otpRecord.expires_at < Date.now ()) {
        return res
          .status (StatusCode.BAD_REQUEST)
          .json ({message: 'OTP expired'});
      }

      // ✅ Success: OTP is valid
      // Option 1: delete OTP here
      // await Otp.deleteOne({ _id: otpRecord._id });

      // Option 2 (better): issue a temporary JWT just for resetting password
      const tempToken = jwt.sign (
        {id: user._id, email: user.email, action: 'reset-password'},
        process.env.JWT_SECRET,
        {expiresIn: '10m'} // valid only 10 minutes
      );

      res
        .status (StatusCode.OK)
        .json ({message: 'OTP verified successfully', tempToken});
    } catch (err) {
      console.error ('Verify OTP error:', err);
      res.status (StatusCode.SERVER_ERROR).json ({message: 'Server error'});
    }
  }

  async resetPassword (req, res) {
    try {
      const {tempToken, newPassword, confirmPassword} = req.body;

      if (newPassword !== confirmPassword) {
        return res
          .status (StatusCode.BAD_REQUEST)
          .json ({message: 'Passwords do not match'});
      }

      // Verify temp token
      let decoded;
      try {
        decoded = jwt.verify (tempToken, process.env.JWT_SECRET);
      } catch (err) {
        return res
          .status (StatusCode.BAD_REQUEST)
          .json ({message: 'Invalid or expired reset token'});
      }

      // Find user
      const user = await UserModel.findById (decoded.id);
      if (!user) {
        return res
          .status (StatusCode.BAD_REQUEST)
          .json ({message: 'User not found'});
      }

      // Hash new password
      const hashed = await hashedPassword (newPassword, 10);
      user.password = hashed;
      await user.save ();

      res.status (StatusCode.OK).json ({message: 'Password reset successful'});
    } catch (err) {
      console.error ('Reset password error:', err);
      res.status (StatusCode.SERVER_ERROR).json ({message: 'Server error'});
    }
  }
}

module.exports = new AuthController ();
