require ('dotenv').config ();
const express = require ('express');
const db = require ('./app/config/db');
const app = express ();
const session = require('express-session');
const cookieParser = require('cookie-parser')
const flash = require('connect-flash');
const cors = require ('cors');
const authApiRoutes = require ('./app/routers/api/auth.routes');
const StudentApiRoutes = require ('./app/routers/api/student.routes');
const ejsAdminRoutes = require('./app/routers/ejs/admin.routes');
const path = require ('path');

// middleware setup
app.use(cors({
  origin: "http://localhost:5173", // your Next.js origins
  credentials: true,  // allow cookies
}));  // to allow cross-origin requests
app.use (express.urlencoded ({extended: true}));    // to parse URL-encoded bodies
app.use (express.json ());  // to parse JSON bodies

app.use(cookieParser());    // to parse cookies


// session middleware
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { 
        maxAge: 1000 * 60 * 60 * 24 // 24 hours
     } 
}));

// flash middleware
app.use(flash());

// view engine setup
app.set ('view engine', 'ejs');
app.set ('views', 'views');

// serve static files
app.use (express.static (__dirname + '/public'));

// serve uploaded images
app.use ('/uploads', express.static (path.join (__dirname, 'uploads')));

// EJS admin dashboard routes
app.use ("/", ejsAdminRoutes);

// API routes for authentication
app.use ('/api/auth', authApiRoutes);

// API routes for student operations
app.use ('/api/students', StudentApiRoutes);


// 404 handler
// app.use ((req, res) => {
//   res.status (404).render ('404');
// });

// start the server
app.listen (process.env.PORT || 8000, async () => {
  await db.connectDb ();
  console.log ('Server running on port ' + (process.env.PORT || 8000) + '...');
});
