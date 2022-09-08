function loadTransactions() {
    /* Load transactions "DB" into JSON object */
    const fs = require('fs');

    // Using readFileSync is a blocking operation, but it's needed to ensure all transactions are loaded before routing
    let transJSON = fs.readFileSync('./database/transactions.json');
    return JSON.parse(transJSON);
}

exports.transaction_list = (req, res) => {
    let transObj = loadTransactions();
    let transactions = transObj.transaction;

    let balance = 0;
    transactions.forEach(transaction => {
        balance += transaction.points;
    }); 
    
    res.render('index', { title: 'Points Portal Home', transaction_list: transactions, points_balance: balance });
}

exports.add_transaction_get = (req, res) => {
    res.render('add_transaction', { title: 'Add Transaction' });
}

exports.add_transaction_post = (req, res) => {

}

exports.spend_get = (req, res) => {
    res.render('spend', { title: 'Spend Points' });
}

exports.spend_post = (req, res) => {
    
}