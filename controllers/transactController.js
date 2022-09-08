function loadTransactions() {
    /* Load transactions "DB" into JSON object */
    const fs = require('fs');

    // Using readFileSync is a blocking operation, but it's needed to ensure all transactions are loaded before routing
    let transJSON = fs.readFileSync('./database/transactions.json');
    let transactions = JSON.parse(transJSON);
    return transactions.transactions;
}

exports.transaction_list = (req, res) => {
    let transactions = loadTransactions();

    let balance = 0;
    transactions.forEach(transaction => {
        balance += transaction.points;
    }); 
    console.log(balance);
    // The JSON data has 'transactions' as the label of an array of transactions. 
    // Returning transactions.transactions sends an array of JSON objects downstream
    res.render('index', { title: 'Fetch Rewards Points Portal', transaction_list: transactions, points_balance: balance });
}
