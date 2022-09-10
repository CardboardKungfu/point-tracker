const express = require('express');
const router = express.Router();

const transactController = require('../controllers/transactController');

// Render homepage with user data
router.get('/', transactController.transaction_list);

router.get('/add_transaction', transactController.add_transaction_get);

router.post('/add_transaction', transactController.add_transaction_post);

router.get('/spend', transactController.spend_get);

router.post('/spend', transactController.spend_post);

router.get('/points_balance', transactController.points_balance_get);

module.exports = router;
