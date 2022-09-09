const fs = require('fs');

function loadTransactions() {
    /* Load transactions "DB" into JSON object */    

    // Using readFileSync is a blocking operation, but it's needed to ensure all transactions are loaded before routing
    let transJSON = fs.readFileSync('./database/transactions.json');
    return JSON.parse(transJSON);
}

function saveTransaction(newTransObj) {
    let transJSON = loadTransactions();
    let transArr = transJSON.transactions;
    transArr.push(newTransObj);
    let newTransJSON = { "transactions": transArr };
    fs.writeFileSync('./database/transactions.json', JSON.stringify(newTransJSON));
}

function loadBalance() {
    let transObj = loadTransactions();
    let transactions = transObj.transactions;
    let balance = 0;
    transactions.forEach(transaction => balance += transaction.points); 
    return balance;
}

function loadPayerNamesArr() {
    let transObj = loadTransactions();
    let transactions = transObj.transactions;
    let payerArr = [];
    transactions.forEach(payerObj => {
        if(!payerArr.includes(payerObj.payer)) {
            payerArr.push(payerObj.payer);
        }
    });
    return payerArr;
}

exports.transaction_list = (req, res) => {
    let transObj = loadTransactions();
    let transactions = transObj.transactions;

    let balance = loadBalance();

    res.render('index', { title: 'Points Portal Home', transaction_list: transactions, points_balance: balance });
}

exports.add_transaction_get = (req, res) => {
    let payerArr = loadPayerNamesArr();
    let balance = loadBalance();

    res.render('add_transaction', { title: 'Add Transaction', payerArr: payerArr, balance: balance });
}

exports.add_transaction_post = (req, res) => {
    let balance = loadBalance();

    if(req.body.point_amount <= 0 || req.body.point_amount > balance) {
        let payerArr = loadPayerNamesArr();
        res.render('add_transaction', { title: 'Add Transaction', payerArr: payerArr, balance: balance, error: "Point amount must not be negative and must not exceed balance"});
    } else {
        let newTransaction = {
            "payer": req.body.payer_name,
            "points": parseInt(req.body.point_amount),
            "timestamp": new Date()
        }
        saveTransaction(newTransaction);
        let transObj = loadTransactions();
        let transactions = transObj.transactions;
        let balance = loadBalance();
        res.render('index', { title: 'Points Portal Home', transaction_list: transactions, points_balance: balance });
    }
    
};

exports.spend_get = (req, res) => {
    let balance = loadBalance();
    res.render('spend', { title: 'Spend Points', balance: balance });
}

exports.spend_post = (req, res) => {

}