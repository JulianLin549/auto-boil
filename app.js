if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}
const express = require('express');
//const expressLayouts = require('express-ejs-layouts');
const mongoose = require('mongoose');
const flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport');
const settings = require("./settings");


const app = express();

//path
app.use('/public/images/', express.static('./public/images'));

//Passport config
require('./config/passport')(passport);

//connect DB
require("./db/connectDB");

//config email
require("./config/smtp");

//EJS
app.set('view engine', 'ejs');


//BodyParser
app.use(express.urlencoded({ extended: false }));

//Express Session
app.use(session({
    cookieName: "session",
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    duration: settings.SESSION_DURATION,
    activeDuration: settings.SESSION_EXTENSION_DURATION,
    cookie: {
        httpOnly: true,
        ephemeral: settings.SESSION_EPHEMERAL_COOKIES,
        secure: settings.SESSION_SECURE_COOKIES,
    },
}));

//Passport Middleware init local strategy
app.use(passport.initialize());
app.use(passport.session());

//Connect flash
app.use(flash());

//Global variable
//used to flash message
//can call the success_msg and error_msg from anywhere
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error'); //msg from passport.js will put error in req.flash('error)
    next();
});

//Routes
//pertain the route from the index
app.use('/', require('./routes/index'))
app.use('/users', require('./routes/users'))


const PORT = process.env.PORT || 3000;

app.listen(PORT, console.log(`Server started on port ${PORT}`))