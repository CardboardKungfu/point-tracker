const fs = require('fs');
const { DateTime } = require("luxon");

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
    let errorsArr = [];

    if(!req.body.trans_date) {
        errorsArr.push({ "msg": "Please input valid date" });
    }
    if(!req.body.trans_time) {
        errorsArr.push({ "msg": "Please input valid time" });
    }
    if(req.body.point_amount <= 0) {
        errorsArr.push({ "msg": "Point amount must not be negative or 0" });
    }
    if(req.body.point_amount > balance) {
        errorsArr.push({ "msg": "Point amount must not exceed balance" });
    }
    
    if(errorsArr.length > 0) {
        let payerArr = loadPayerNamesArr();
        res.render('add_transaction', { title: 'Add Transaction', payerArr: payerArr, balance: balance, errors: errorsArr});
    } else {
        let timestamp = DateTime.fromISO(req.body.trans_date + 'T' + req.body.trans_time, {zone: 'America/Chicago'});
        timestamp = timestamp.toISO().split('.')[0] + 'Z';
        let newTransaction = {
            "payer": req.body.payer_name,
            "points": parseInt(req.body.point_amount),
            "timestamp": timestamp
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
    let balance = loadBalance();
    let spendAmt = req.body.point_amount;

    if(spendAmt > balance) {
        res.render('spend', { title: 'Spend Points', balance: balance, error: "Spend amount cannot exceed balance" });
    } else {
        let transObj = loadTransactions();
        let transactions = transObj.transactions;
        transactions.forEach(transaction => {
            
        });
    }
}

exports.points_balance_get = (req, res) => {
    let balance = loadBalance();
    res.render('points_balance', { title: "Points Balance", balance: balance });
}

exports.points_balance_post = (req, res) => {

}
