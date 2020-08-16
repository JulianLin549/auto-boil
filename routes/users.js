if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const smtpTransport = require('../config/smtp');
const { v4: uuidv4 } = require('uuid');


//User model
const User = require('../models/User')
// Login Page
router.get('/login', (req, res) => res.render('login'));

//Register Page
router.get('/register', (req, res) => res.render('register'));


/* ========================= 
    SIGN UP EMAIL VERIFY 
============================*/

//Register Handle with email sent
router.post('/register', async (req, res) => {

    const { name, email, password, password2 } = req.body;

    let errors = [];
    // Check required fields
    if (!name || !email || !password || !password2) {
        errors.push({ msg: 'Please fill in all fields' });
    }
    // Check password match
    if (password !== password2) {
        errors.push({ msg: 'Passwords do not match' });
    }

    //Check pass length
    if (password.length < 6) {
        errors.push({ msg: 'Password should be at least 6 characters' })
    }
    //if there is a issue, rerender the register form and flash errors
    //we also want to keep what the user typed in last time
    if (errors.length > 0) {
        //things below is ES6 syntax, errors, name equals to error: error, name: name
        res.render('register', { errors, name, email, password, password2 })

    } else {
        //valid imformation  and password
        //User.findOne will return a promise
        //will give us a user, check the user
        try {
            let user = await User.findOne({ email: email });
            //if user already exist
            //render register again with previously typed in information
            if (user) {
                errors.push({ msg: 'Email is already registered' });
                res.render('register', { errors, name, email, password, password2 })
            } else {

                //Hash Password using bcrypt
                //generate salt using bcrypt
                const salt = await bcrypt.genSalt(process.env.BCRYPT_WORK_FACTOR);
                const hash = await bcrypt.hash(password, salt);

                //jwt data, key, expire after
                //put hashed password inside jwt for verification
                const token = jwt.sign({ name, email, password: hash }, process.env.JWT_ACC_ACTIVATE, { expiresIn: process.env.JWT_EXPIRE_IN })

                //sending confirmation mail
                let url = `${process.env.CLIENT_URL}/users/activate/${token}`;

                //sending mail
                const mail_data = {
                    //from: 'noreply@hello.com',
                    to: email,
                    subject: "Please confirm your Email account",
                    html: `
                        <h2> Plaease click on given link to activate your accoutnt:</h2>
                        <div style="word-break:break-all">
                        <h3>activate link:
                        <p > ${url}</p>
                        </div>
                        `
                };

                let response = await smtpTransport.sendMail(mail_data, (error, response) => {
                    if (error) {
                        console.log(error);
                        return res.send({
                            error: err.message
                        })
                    }
                    console.log('verification email sent')
                    req.flash('success_msg', `A verification link has been sent to your email account:
                     ${email}, Please click on the link to verify your email.`);
                    res.redirect('/users/login');
                });

            }
        } catch (err) {
            console.log(err)
        }
    }
})

//verifation email through jwt token
router.get('/activate/:token', async (req, res) => {
    const token = req.params.token;
    console.log(token);
    if (token) {
        //jwt token contain name, email, and hashed password
        try {
            let decodedToken = await jwt.verify(token, process.env.JWT_ACC_ACTIVATE);
            const { name, email, password } = decodedToken;
            //find if email already in db
            let user = await User.findOne({ email });
            if (user) {
                console.log("User already exist!");
                req.flash('error_msg', 'User already exist!');
                res.redirect('/users/register');
            }
            //create new user
            let newUser = new User({ name, email, password, isActivated: true, uuid: uuidv4() });
            try {
                await newUser.save();
                console.log("Signup success!");
                req.flash('success_msg', 'Signup success!');
                res.redirect('/users/login');

            } catch (error) {
                console.log("Error in signup while account activation: ", err);
                req.flash('error_msg', 'Error in signup while account activation, please try again later.');
                res.redirect('/users/login');
            }

        } catch (error) {
            console.log('Incorrect or Expire link')
            req.flash('error_msg', 'Incorrect or Expire link');
            res.redirect('/users/login');
        }

    } else {
        req.flash('error_msg', 'Something went wrong :(');
        res.redirect('/users/login');
    }
})


/* ========================= 
           LOG IN 
============================*/

//Login Handle
router.post('/login', (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/dashboard',
        failureRedirect: '/users/login',
        failureFlash: true
    })(req, res, next);
});


/* ========================= 
           LOG OUT
============================*/

//Logout Handle
router.get('/logout', (req, res) => {
    req.logout();
    req.flash('success_msg', 'You are logged out.');
    res.redirect('/users/login');
})

/* ========================= 
        RECOVER PWD
============================*/
router.get('/recover', (req, res) => {
    res.render('recover')
});

//recover pwd, jwt by user uuid
router.post('/recover', async (req, res) => {
    const email = req.body.email;
    console.log(email)
    //check if the email is in db or not
    try {
        let user = await User.findOne({ email: email });
        //if user exist, send email to reset pwd
        if (user) {
            //jwt user id to create url
            const token = jwt.sign({ uuid: user.uuid }, process.env.JWT_ACC_ACTIVATE, { expiresIn: process.env.JWT_EXPIRE_IN })

            //sending confirmation mail
            let url = `${process.env.CLIENT_URL}/users/recover/${token}`;

            //sending mail
            const mail_data = {
                //from: 'noreply@hello.com',
                to: email,
                subject: "Set new password.",
                html: `
                        <h2> Plaease click on given link to set new password:</h2>
                        <p> The link will expire after one hour. </p>
                        <div style="word-break:break-all">
                        <h3>activate link:
                        <p > ${url}</p>
                        </div>
                        `
            };

            let response = await smtpTransport.sendMail(mail_data, (error, response) => {
                if (error) {
                    console.log(error);
                    return res.send({
                        error: err.message
                    })
                }
                console.log('recover email sent')
                req.flash('success_msg', 'A new password link has been sent to your email Account. Please click on the link to set new password. The link will expire after one hour.');
                res.redirect('/users/login');
            });

        } else {
            req.flash('error_msg', 'Did not find user, please register.');
            res.redirect('register')
        }
    } catch {
        req.flash('error_msg', 'Something went wrong with the server. Please try again later.');
        res.redirect('login')
    }
});


router.get('/recover/:token', async (req, res) => {
    const token = req.params.token;
    console.log(token)
    if (token) {
        //jwt token contain user Id
        try {
            let decodedToken = await jwt.verify(token, process.env.JWT_ACC_ACTIVATE);
            const uuid = decodedToken.uuid;
            console.log(uuid)
            //find if userid already in db
            let user = await User.findOne({ uuid });
            if (user) {
                return res.render('newpassword', { uuid });
            }

        } catch (error) {
            console.log('Incorrect or Expire link');
            req.flash('error_msg', 'Incorrect or Expire link');
            res.redirect('/users/login');
        }

    } else {
        return res.send("something went wrong")
    }
})

router.post('/recover/:uuid', async (req, res) => {
    const uuid = req.params.uuid;
    const { password, password2 } = req.body
    let errors = [];
    // Check required fields
    if (!password || !password2) {
        errors.push({ msg: 'Please fill in all fields' });
    }
    // Check password match
    if (password !== password2) {
        errors.push({ msg: 'Passwords do not match' });
    }

    //Check pass length
    if (password.length < 6) {
        errors.push({ msg: 'Password should be at least 6 characters' })
    }
    //if there is a issue, rerender the register form and flash errors
    //we also want to keep what the user typed in last time
    if (errors.length > 0) {
        res.render('newpassword', { errors, password, password2, uuid })
    } else {
        console.log(uuid)
        try {
            //find if userid already in db
            let user = await User.findOne({ uuid });
            if (user) {

                //Hash Password using bcrypt
                //generate salt using bcrypt
                const salt = await bcrypt.genSalt(process.env.BCRYPT_WORK_FACTOR);
                const hash = await bcrypt.hash(password, salt);


                await User.updateOne({ _id: user._id }, { password: hash });
                console.log("password updated");

                //check if uuid is duplicate, if so, generate another uuid
                let flag = true;
                while (flag) {
                    let new_uuid = uuidv4();
                    let duplicate_uuid_user = await User.findOne({ uuid: new_uuid })
                    if (!duplicate_uuid_user) {
                        flag = false;
                        console.log("no duplicate")
                        await User.updateOne({ _id: user._id }, { uuid: new_uuid })
                    } else {
                        console.log("uuid already been taken!")
                        new_uuid = uuidv4()
                    }
                }

                req.flash('success_msg', 'Password updated success!');
                res.redirect('/users/login');
            }
        } catch (err) {
            req.flash('error_msg', 'Invalid user');
            res.redirect('/users/login');
        }
    }
});
module.exports = router;