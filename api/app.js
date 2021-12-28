var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');
const passport = require('passport');
require('./auth/auth');
// var bodyParser = require('body-parser');

// var indexRouter = require('./routes/index');
var listRouter = require('./routes/list');
// var userRouter = require('./routes/user');

var app = express();
app.use(cors({
  origin: true,
  credentials: true,
  methods: 'GET,PUT,POST,DELETE',
}))
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

const routes = require('./routes/routes');
// const secureRoute = require('./routes/secure-routes');


// view engine setup
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'jade');


// app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
// TODO: cookie vs. bearer
// https://www.passportjs.org/packages/passport-jwt/
// app.use('/user', passport.authenticate('jwt-cookiecombo', { session: false }), secureRoute);
// TODO: csrf tokens: https://stackoverflow.com/questions/37582444/jwt-vs-cookies-for-token-based-authentication
// app.use('/user', passport.authenticate('jwt', { session: false }), secureRoute);
// app.use('/', indexRouter);
// app.use('/list', listRouter);
app.use('/list', passport.authenticate('jwt', { session: false }), listRouter);
// app.use('/user', userRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  console.log(err);

  // render the error page
  res.status(err.status || 500);
  return res.json({
      success: false,
  });
  // res.render('error');
});

module.exports = app;
