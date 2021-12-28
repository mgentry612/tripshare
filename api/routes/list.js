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
 * Create a new list
 */
 router.post('/', async (req, res, next) => {
  const user = req.user;
  const params = req.body;

  let transaction;
  try {
    transaction = await sequelize.transaction();
    const list = await sequelize.query('INSERT INTO list (name, description, store) VALUES (:name, :description, :store) RETURNING *', {
      replacements: {
        name: params.name,
        description: params.description,
        store: params.store,
      },
      transaction,
    });
    
    await sequelize.query('INSERT INTO user_list (list_id, user_id, is_owner) VALUES (:list_id, :user_id, true)', {
      replacements: {
        list_id: list[0][0].id,
        user_id: user.id,
      },
      transaction,
    });
    
    await transaction.commit();

    res.json({'status': 200, list: list[0][0]});
  } catch (error) {
    if (transaction) {
      await transaction.rollback();
    }
    
    throw error;
  }

});

/**
 * Create a new list
 */
 router.put('/:list_id', async (req, res, next) => {
  const user = req.user;
  const params = req.params;
  const body = req.body;

  try {
    const lists = await sequelize.query(`
      SELECT *
      FROM user_list
      WHERE user_id = :user_id
        AND list_id = :list_id
        AND is_owner IS true`, {
      replacements: {
        user_id: user.id,
        list_id: params.list_id,
      },
    });

    if (lists[0].length) {
      await sequelize.query(`
        UPDATE list SET
          name = :name,
          description = :description,
          store = :store
        WHERE id = :list_id`, {
        replacements: {
          name: body.name,
          description: body.description,
          store: body.store,
          list_id: params.list_id,
        },
      });
      res.json({'status': 200});
    } else {
      // Return error, user doesn't have permission to change this list
      res.json({'status': 403});
    }
  } catch (error) {
    throw error;
  }

});

/**
 * Add user to a list as a member
 */
router.post('/:list_id/join/', async (req, res, next) => {
  const user = req.user;
  const params = req.params;

  try {
    const lists = await sequelize.query(`
      SELECT *
      FROM user_list
      WHERE user_id = :user_id and list_id=:list_id`, {
      replacements: {
        user_id: user.id,
        list_id: params.list_id,
      },
    });

    if (!lists[0].length) {
      await sequelize.query('INSERT INTO user_list (list_id, user_id, is_owner) VALUES (:list_id, :user_id, false)', {
        replacements: {
          list_id: params.list_id,
          user_id: user.id,
        },
      });
  
      res.json({'status': 200});
    } else {
      // Return error, user doesn't have permission to change this list
      res.json({'status': 400});
    }
  } catch (error) {
    
    throw error;
  }

});

/**
 * Retrieve all lists of requester
 * TODO: can we remove this with the other ones below? /id/owner, id/member
 */
router.get('/:list_id/items', async (req, res, next) => {
  console.log('get');
  const user = req.user;
  const params = req.params;
  const items = await sequelize.query(`
    SELECT
      item.id,
      item.item_name
    FROM item
    LEFT JOIN user_list ON user_list.list_id = item.list_id
    LEFT JOIN "user" u ON user_list.user_id = u.id
    WHERE 
      item.list_id = :list_id AND
      u.id = :user_id
    ORDER BY item_name
    `, {
    replacements: {
      user_id: user.id,
      list_id: params.list_id,
    },
  });
  console.log(items);
  res.json({'status': 200, items: items[0]});
});

/**
 * Add item to a list
 */
 router.post('/items', async (req, res, next) => {
  const user = req.user;
  const params = req.body;

  try {

    const lists = await sequelize.query(`
      SELECT *
      FROM user_list
      WHERE user_id = :user_id and list_id=:list_id`, {
      replacements: {
        user_id: user.id,
        list_id: params.list_id,
      },
    });

    if (lists[0].length) {
      await sequelize.query('INSERT INTO item (item_name, list_id) VALUES (:item_name, :list_id)', {
        replacements: {
          item_name: params.item_name,
          list_id: params.list_id,
        },
      });
      res.json({'status': 200});
    } else {
      // Return error, user doesn't have permission to change this list
      res.json({'status': 403});
    }

  } catch (error) {
    
    throw error;
  }

});

/**
 * Remove item from a list
 */
router.delete('/items/:item_id', async (req, res, next) => {
  const user = req.user;
  const params = req.params;

  try {

    const lists = await sequelize.query(`
      SELECT *
      FROM item
      JOIN user_list ON item.list_id = user_list.list_id
      WHERE item.id = :item_id and 
      user_list.user_id=:user_id`, {
      replacements: {
        user_id: user.id,
        item_id: params.item_id,
      },
    });

    if (lists[0].length) {
      await sequelize.query('DELETE FROM item WHERE id=:item_id ', {
        replacements: {
          item_id: params.item_id,
        },
      });
      res.json({'status': 200});
    } else {
      // Return error, user doesn't have permission to delete this item
      res.json({'status': 403});
    }

  } catch (error) {
    
    throw error;
  }

});

/**
 * Set status of list to complete
 */
router.put('/:list_id/status', async (req, res, next) => {
  const user = req.user;
  const params = req.params;

  try {

    const lists = await sequelize.query(`
      SELECT *
      FROM user_list
      WHERE user_id = :user_id and list_id=:list_id`, {
      replacements: {
        user_id: user.id,
        list_id: params.list_id,
      },
    });

    if (lists[0].length) {
      await sequelize.query(`UPDATE list SET status='complete' WHERE id=:list_id `, {
        replacements: {
          list_id: params.list_id,
        },
      });
      res.json({'status': 200});
    } else {
      // Return error, user doesn't have permission to delete this item
      res.json({'status': 403});
    }
  } catch (error) {
    
    throw error;
  }

});

/**
 * Delete List
 */
router.delete('/:list_id', async (req, res, next) => {
  const user = req.user;
  const params = req.params;

  try {

    const lists = await sequelize.query(`
      SELECT *
      FROM user_list
      WHERE user_id = :user_id and list_id=:list_id`, {
      replacements: {
        user_id: user.id,
        list_id: params.list_id,
      },
    });

    if (lists[0].length) {
      await sequelize.query('DELETE FROM list WHERE id=:list_id ', {
        replacements: {
          list_id: params.list_id,
        },
      });
      res.json({'status': 200});
    } else {
      // Return error, user doesn't have permission to delete this item
      res.json({'status': 403});
    }
  } catch (error) {
    
    throw error;
  }

});

/**
 * Retrieve all lists of requester
 * TODO: can we remove this with the other ones below? /id/owner, id/member
 */
router.get('/', async (req, res, next) => {
  const user = req.user;
  console.log(req);
  const lists = await sequelize.query(`
    SELECT
      list.id,
      list.name,
      list.description,
      list.store
    FROM list
    JOIN user_list ON user_list.list_id = list.id
    JOIN "user" u ON user_list.user_id = u.id
    WHERE u.id = :user_id
      AND list.status != 'complete'`, {
    replacements: {
      user_id: user.id,
    },
  });
  res.json({'status': 200, lists: lists[0]});
});

/**
 * Retrieve all lists that requester is not currently a member of
 * TODO: can we remove this with the other ones below? /id/owner, id/member
 */
router.get('/joinable/only', async (req, res, next) => {
  const user = req.user;
  const lists = await sequelize.query(`
    SELECT
      list.id,
      list.name,
      list.description,
      list.store
    FROM user_list
    JOIN list ON list.id = user_list.list_id
    WHERE
      list_id NOT IN
        (SELECT list_id FROM user_list WHERE user_id = :user_id)
      AND list.status != 'complete'`, {
    replacements: {
      user_id: user.id,
    },
  });
  res.json({'status': 200, lists: lists[0]});
});

/**
 * Retrieve list by id
 */
router.get('/:id', async (req, res, next) => {
  const params = req.params;
  const list = await sequelize.query('SELECT * FROM list WHERE id = :id', {
    replacements: {
      id: params.id,
    },
  });
  res.json({'status': 200, list: list[0][0]});
});

/**
 * Retrieve list by id as an owner
 */
router.get('/:id/owner', async (req, res, next) => {
  // TODO: make sure user is owner of list they are requesting
  const params = req.params;
  const lists = await sequelize.query(`
    SELECT *
    FROM list
    JOIN user_list ON user_list.list_id = list.id
    JOIN "user" u ON user_list.user_id = u.id
    WHERE u.id = :user_id`, {
    replacements: {
      id: params.id,
    },
  });
  res.json({'status': 200, list: list[0][0]});
});

/**
 * Retrieve list by id as a member
 */
router.get('/:id/member', async (req, res, next) => {
  // TODO: make sure user is member of list they are requesting
  const params = req.params;
  const lists = await sequelize.query(`
  SELECT *
  FROM list
  JOIN user_list ON user_list.list_id = list.id
  JOIN "user" u ON user_list.user_id = u.id
  WHERE u.id = :user_id`, {
    replacements: {
      id: params.id,
    },
  });
  res.json({'status': 200, list: list[0][0]});
});

/**
 * Add comment to a list
 */
 router.post('/:list_id/comment', async (req, res, next) => {
  const user = req.user;
  const params = req.params;
  const body = req.body;

  try {
    const lists = await sequelize.query(`
      SELECT *
      FROM user_list
      WHERE user_id = :user_id and list_id=:list_id`, {
      replacements: {
        user_id: user.id,
        list_id: params.list_id,
      },
    });

    if (lists[0].length) {
      await sequelize.query('INSERT INTO comment (user_id, list_id, comment) VALUES (:user_id, :list_id, :comment)', {
        replacements: {
          user_id: user.id,
          list_id: params.list_id,
          comment: body.comment,
        },
      });
      res.json({'status': 200});
    } else {
      // Return error, user doesn't have permission to change this list
      res.json({'status': 403});
    }

  } catch (error) {
    
    throw error;
  }

});

/**
 * Retrieve all comments of a list
 */
router.get('/:list_id/comment', async (req, res, next) => {
  const user = req.user;
  const params = req.params;

  try {
    const lists = await sequelize.query(`
      SELECT *
      FROM user_list
      WHERE user_id = :user_id and list_id=:list_id`, {
      replacements: {
        user_id: user.id,
        list_id: params.list_id,
      },
    });

    if (lists[0].length) {
      const comments = await sequelize.query(`
        SELECT
          comment.comment,
          comment.id,
          u.email,
          u.id as user_id,
          comment.created_at
        FROM comment
        JOIN "user" u ON comment.user_id = u.id
        WHERE comment.list_id = :list_id
        ORDER BY created_at ASC`, {
        replacements: {
          list_id: params.list_id,
        },
      });
      res.json({'status': 200, comments: comments[0]});
    } else {
      // Return error, user doesn't have permission to change this list
      res.json({'status': 403});
    }

  } catch (error) {
    throw error;
  }
});

/**
 * Delete a comment from a list
 */
router.delete('/comment/:comment_id', async (req, res, next) => {
  const user = req.user;
  const params = req.params;

  try {

    const comments = await sequelize.query(`
      SELECT *
      FROM comment
      JOIN user_list ON comment.list_id = user_list.list_id
      WHERE comment.id = :comment_id and 
      user_list.user_id=:user_id`, {
      replacements: {
        user_id: user.id,
        comment_id: params.comment_id,
      },
    });

    if (comments[0].length) {
      await sequelize.query('DELETE FROM comment WHERE id=:comment_id ', {
        replacements: {
          comment_id: params.comment_id,
        },
      });
      res.json({'status': 200});
    } else {
      // Return error, user doesn't have permission to delete this item
      res.json({'status': 403});
    }

  } catch (error) {
    
    throw error;
  }

});

module.exports = router;