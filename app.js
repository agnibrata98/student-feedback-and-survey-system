require ('dotenv').config ();
const express = require ('express');
const db = require ('./app/config/db');
const app = express ();
const session = require('express-session');
const cookieParser = require('cookie-parser')
const flash = require('connect-flash');
const cors = require ('cors');
const apiRoutes = require ('./app/routers/api/api.routes');
const ejsRoutes = require('./app/routers/ejs/admin.routes');
const path = require ('path');

// middleware setup
app.use (cors());   // to allow cross-origin requests
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
app.use (ejsRoutes);

// API routes
app.use ('/api', apiRoutes);

// 404 handler
// app.use ((req, res) => {
//   res.status (404).render ('404');
// });

// start the server
app.listen (process.env.PORT || 8000, async () => {
  await db.connectDb ();
  console.log ('Server running on port ' + (process.env.PORT || 8000) + '...');
});
