var express = require('express');
var router = express.Router();
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


// Routes

/**
 * Retrieve lists by user id
 */
router.get('/:user_id/list', async (req, res, next) => {
  console.log('get');
  const params = req.params;
  const lists = await sequelize.query('SELECT * FROM list', {
    // replacements: {
    //   id: params.user_id,
    // },
  });
  console.log(lists);
  res.json({'status': 200, list: lists[0]});
});

module.exports = router;
