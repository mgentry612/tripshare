var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  // res.render('index', { title: 'Express' });
  res.json({'list_name': 'my shopping list'});
  console.log('test');
});

module.exports = router;
