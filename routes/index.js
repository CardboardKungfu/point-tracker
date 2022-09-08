const express = require('express');
const router = express.Router();

const transactController = require('../controllers/transactController');

// Render homepage with user data
router.get('/', transactController.transaction_list);

router.get('/add_transaction', function(req, res) {
  res.send('NOT IMPLEMENTED: Add a Transaction');
});

router.get('/spend', function(req, res) {
  res.send('NOT IMPLEMENTED: Spend Points');
});

module.exports = router;
