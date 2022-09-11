const fs = require('fs');
const { DateTime } = require("luxon");

function loadTransactions() {
    /* Load transactions "DB" into JSON object */    

    let transJSON = fs.readFileSync('./database/transactions.json');
    return JSON.parse(transJSON);
}

function saveTransaction(newTransObj, payerNameArr=null) {
    let transJSON = loadTransactions();
    
    let transArr = transJSON.transactions;
    transArr.push(newTransObj);
    transJSON.transactions = transArr;

    if(payerNameArr !== null) {
        transJSON.payer_names = payerNameArr;
    }
    
    fs.writeFileSync('./database/transactions.json', JSON.stringify(transJSON));
}

function saveTransactionAndSpent(newTransArr, newSpentArr) {
    let transJSON = loadTransactions();
    
    transJSON.transactions = newTransArr;

    let spentArr = transJSON.spent_points;
    transJSON.spent_points = spentArr.concat(newSpentArr);
    
    fs.writeFileSync('./database/transactions.json', JSON.stringify(transJSON));
}

function loadBalance() {
    let transObj = loadTransactions();
    let transactions = transObj.transactions;
    let balance = 0;
    if(transactions.length != 0) {
        transactions.forEach(transaction => balance += transaction.points); 
    }
    return balance;
}

function loadPayerNamesArr() {
    let transObj = loadTransactions();
    return transObj.payer_names;
}

function sortByTimestampOldFirst(arr) {
    arr = arr.sort((a,b) => {
        return (a.timestamp < b.timestamp) ? -1 : ((a.timestamp > b.timestamp) ? 1 : 0);
    });
    return arr;
}

exports.transaction_list = (req, res) => {
    let transObj = loadTransactions();
    let transactions = sortByTimestampOldFirst(transObj.transactions);
    let spentPoints = sortByTimestampOldFirst(transObj.spent_points);

    res.render('index', { title: 'Points Portal Home', transaction_list: transactions, points_list: spentPoints });
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
            "payer": req.body.payer_name.toUpperCase(),
            "points": parseInt(req.body.point_amount),
            "timestamp": timestamp
        }

        // Check to see if user created new name
        let tmpTransObj = loadTransactions();
        let payerNamesArr = tmpTransObj.payer_names;
        
        console.log(req.body);
        
        if(!payerNamesArr.includes(req.body.payer_name.toUpperCase())) {
            payerNamesArr.push(req.body.payer_name.toUpperCase());
            // Save transaction to db with new payer name
            saveTransaction(newTransaction, payerNamesArr);
        } else {
            // Save transaction to db without a new payer name
            saveTransaction(newTransaction);
        }

        // Load updated db and render home page
        let transObj = loadTransactions();
        let transactions = transObj.transactions;
        let spentPoints = transObj.spent_points;
        let balance = loadBalance();
        res.render('index', { title: 'Points Portal Home', transaction_list: transactions, points_list: spentPoints, points_balance: balance });
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
        let transJSON = loadTransactions();
        let transArr = transJSON.transactions;
        
        transArr = sortByTimestampOldFirst(transArr);
        
        let spendArr = [];
        let newTransArr = [];

        // Compare oldest transaction point amount against the amount to be spent. 
        transArr.every(transaction => {
            // Once spend amount is empty, add the remaining transactions to new array to be added to the db later
            if(spendAmt == 0) {
                newTransArr.push(transaction);
                return true;
            }

            // If spend amount >= the transaction amount, add to spend array and reduce points
            if(spendAmt >= transaction.points) {
                spendArr.push(transaction);
                spendAmt -= transaction.points;
                // return true acts like a continue statement when using .every()
                return true;
            }
            
            // If spend amount < the transaction amount, split transaction into two objects: the spent amount and remaining amount.
            // Place the spent object in the spent array and replace the remaining amount in the new transaction array.
            if(spendAmt < transaction.points) {
                let tmpSpendObj = JSON.parse(JSON.stringify(transaction));
                let tmpTransObj = JSON.parse(JSON.stringify(transaction));

                tmpSpendObj.points = parseInt(spendAmt);
                tmpTransObj.points = tmpTransObj.points - spendAmt;

                spendArr.push(tmpSpendObj);
                newTransArr.push(tmpTransObj);
                
                // All points have now been spent
                spendAmt = 0;
                return true;
            }           
        });
        // Update db with new values
        saveTransactionAndSpent(newTransArr, spendArr);
        balance = loadBalance();
        res.render('spend', { title: 'Spend Points', balance: balance, spendMsg: "Points Spent Successfully", spendArr: spendArr });
    }
}

exports.points_balance_get = (req, res) => {
    let payerBalanceObj = {};
    let transJSON = loadTransactions();
    let balance = 0;
    let transArr = transJSON.transactions;
    transArr.forEach(trans => {
        balance += trans.points;
        if(trans.payer in payerBalanceObj) {
            payerBalanceObj[trans.payer] += trans.points
        } else {
            payerBalanceObj[trans.payer] = trans.points;
        }
    });
    res.render('points_balance', { title: "Points Balance", balance: balance, payerBalance: payerBalanceObj });
}
