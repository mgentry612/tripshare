const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const constants = require('../config/constants');

const router = express.Router();

module.exports = router;

router.post(
  '/signup',
  passport.authenticate('signup', { session: false }),
  async (req, res, next) => {
    console.log('signup success');
    res.json({
      success: true,
    });
  }
);

router.post(
  '/login',
  passport.authenticate('login', { session: false }),
  (req, res) => {
    jwt.sign({ user: req.user }, constants.JWT_SECRET, (err, token) => {
        if (err) return res.json(err);
        return res.json({
            success: true,
            token,
        });
    });
  }
);
