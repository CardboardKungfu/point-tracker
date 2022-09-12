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

function sortByTimestampOldFirst(arr) {
    arr = arr.sort((a,b) => {
        return (a.timestamp < b.timestamp) ? -1 : ((a.timestamp > b.timestamp) ? 1 : 0);
    });
    return arr;
}

exports.transaction_list = (req, res) => {
    let transObj = loadTransactions();
    res.status(200).send({ transactions: transObj });
}

exports.add_transaction_post = (req, res) => {
    let balance = loadBalance();
    let errorsArr = [];

    if(!req.body.point_amount) {
        errorsArr.push({ "msg": "Point amount must be specified" });
    }
    if(req.body.point_amount <= 0) {
        errorsArr.push({ "msg": "Point amount must not be 0 or below" });
    }
    if(req.body.point_amount > balance) {
        errorsArr.push({ "msg": "Point amount must not exceed balance" });
    }
    if(!req.body.payer_name) {
        errorsArr.push({ "msg": "Payer name must be specified" });
    }
    if(!req.body.trans_date) {
        errorsArr.push({ "msg": "Date must be specified: use format YYYY-MM-DD" });
    }
    if(!req.body.trans_time) {
        errorsArr.push({ "msg": "Time must be specified: use format HH:MM" });
    }
    
    if(errorsArr.length > 0) {
        res.status(400).send({errors: errorsArr});
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
        res.status(200).send(transObj.transactions);
    }
}

exports.spend_post = (req, res) => {

    let errorsArr = [];
    
    let balance = loadBalance();
    let spendAmt = req.body.point_amount;

    if(!spendAmt) {
        errorsArr.push({ "msg": "Point amount must be specified" });
    }
    if(spendAmt && spendAmt > balance) {
        errorsArr.push({ "msg": "Spend amount exceeds current balance" });
    }
    if(spendAmt && spendAmt <= 0) {
        errorsArr.push({ "msg": "Spend amount must not be 0 or below" });
    }
    if(errorsArr.length > 0) {
        // Send 400 response along with errors array
        res.status(400).send({errors: errorsArr});
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
                spendArr.push({
                    "payer": transaction.payer,
                    "points": transaction.points
                });
                spendAmt -= transaction.points;
                // return true acts like a continue statement when using .every()
                return true;
            }
            
            // If spend amount < the transaction amount, split transaction into two objects: the spent amount and remaining amount.
            // Place the spent object in the spent array and replace the remaining amount in the new transaction array.
            if(spendAmt < transaction.points) {
                let tmpTransObj = JSON.parse(JSON.stringify(transaction));

                tmpTransObj.points = tmpTransObj.points - spendAmt;

                spendArr.push({
                    "payer": tmpTransObj.payer,
                    "points": parseInt(spendAmt)
                });
                newTransArr.push(tmpTransObj);
                
                // All points have now been spent
                spendAmt = 0;
                return true;
            }           
        });
        // Update db with new values
        saveTransactionAndSpent(newTransArr, spendArr);
        res.status(200).send({ spendArr: spendArr });
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
    res.status(200).send(payerBalanceObj);
}
