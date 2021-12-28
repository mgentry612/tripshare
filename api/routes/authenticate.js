var express = require('express');
var router = express.Router();
var bcrypt = require('bcrypt');
const { Sequelize } = require('sequelize');

/**
 * Database connection initialization
 */
const sequelize = new Sequelize('postgres://postgres:postgres@tripshare_db:5432/postgres');
(async () => {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
})();

cryptPassword = function(password, callback) {
    bcrypt.genSalt(10, function(err, salt) {
        if (err) 
            return callback(err);

        bcrypt.hash(password, salt, function(err, hash) {
            return callback(err, hash);
        });
    });
};

comparePassword = function(plainPass, hashword, callback) {
    bcrypt.compare(plainPass, hashword, function(err, isPasswordMatch) {   
        return err == null ?
            callback(null, isPasswordMatch) :
            callback(err);
    });
};

// Routes

/**
 * Retrieve lists by user id
 */
router.post('/', async (req, res, next) => {
    console.log('post');
    const params = req.params;
    const lists = await sequelize.query('SELECT password FROM user where email = :email', {
        replacements: {
            email: params.email,
        },
    });
    console.log(lists);
    res.json({'status': 200, list: lists[0]});
});


module.exports = router;
