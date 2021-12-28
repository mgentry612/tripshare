// https://www.digitalocean.com/community/tutorials/api-authentication-with-json-web-tokensjwt-and-passport
const passport = require('passport');
const localStrategy = require('passport-local').Strategy;
// const UserModel = require('../model/model');
const JWTstrategy = require('passport-jwt').Strategy;
// const JwtCookieComboStrategy = require('passport-jwt-cookiecombo');
const ExtractJWT = require('passport-jwt').ExtractJwt;
const constants = require('../config/constants');
var crypto = require('crypto');
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('postgres://postgres:postgres@tripshare_db:5432/postgres');
(async () => {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
})();


passport.use(
    'signup',
    new localStrategy(
        {
            usernameField: 'email',
            passwordField: 'password'
        },
        async (email, password, done) => {
            try {
                console.log(email);
                console.log(password);

                // Creating a unique salt for a particular user 
                const salt = crypto.randomBytes(16).toString('hex');
                // Hashing user's salt and password with 1000 iterations, 
                const hash = crypto.pbkdf2Sync(password, salt,  
                1000, 64, `sha512`).toString(`hex`);

                // TODO: move to data layer
                const user = await sequelize.query('INSERT INTO "user" (email, password, salt) VALUES (:email, :password, :salt) RETURNING id, email', {
                    replacements: {
                        email,
                        password: hash,
                        salt,
                    },
                });
                return done(null, user[0][0]);
            } catch (error) {
                done(error);
            }
        }
    )
);

passport.use(
    'login',
    new localStrategy(
        {
            usernameField: 'email',
            passwordField: 'password',
            session: false,
        },
        async (email, password, done) => {
            try {
                console.log(email);
                // TODO retrieve user from database
                //   const user = await UserModel.findOne({ email });
                let user = await sequelize.query('SELECT id, email, password, salt FROM "user" WHERE email=:email', {
                    replacements: {
                        email,
                    },
                });
                console.log(user);
                user = user[0][0];
                if (user) {
                    const hash = crypto.pbkdf2Sync(password, user.salt, 1000, 64, `sha512`).toString(`hex`);
                    if (hash === user.password) {
                        console.log('successful login');
                        return done(null, user);
                    } else {
                        console.log('Incorrect password');
                        return done(null, false, { message: 'Incorrect password' });
                    }
                } else {
                    return done(null, false, { message: 'User not found' });
                }
            } catch (error) {
                console.log('email2')
                return done(error);
            }
        }
    )
);

passport.use(
    new JWTstrategy(
        {
            secretOrKey: constants.JWT_SECRET,
            jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken()
        },
        async (payload, done) => {
            console.log(payload);
            try {
                return done(null, payload.user);
            } catch (error) {
                done(error);
            }
        }
    )
);