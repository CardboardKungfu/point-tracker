const express = require('express');
const router = express.Router();

const transactController = require('../controllers/transactController');

// Render homepage with user data
router.get('/', transactController.transaction_list);

router.get('/add_transaction', transactController.add_transaction);

router.get('/spend', transactController.spend);

module.exports = router;
