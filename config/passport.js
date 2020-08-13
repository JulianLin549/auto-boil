const LocalStrategy = require('passport-local').Strategy;
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

//Load User Model
const User = require('../models/User');

module.exports = (passport) => {

    //check login info
    const authenticateUser = async (email, password, done) => {

        try {
            //Match user
            console.log('Matching user...')
            const user = await User.findOne({ email: email });

            // if no user match, return done
            if (!user) {
                return done(null, false, { message: 'That email is not registered' });
            }

            try {
                if (await bcrypt.compare(password, user.password)) {
                    return done(null, user)
                } else {
                    return done(null, false, { message: 'Password incorrect' })
                }
            } catch (e) {
                return done(e)
            }
        } catch (err) {
            console.log(err)
        }
    }
    passport.use(new LocalStrategy({ usernameField: 'email' }, authenticateUser));

    passport.serializeUser((user, done) => {
        done(null, user.id);
    });
    passport.deserializeUser((id, done) => {
        User.findById(id, (err, user) => {
            done(err, user);
        });
    });


}