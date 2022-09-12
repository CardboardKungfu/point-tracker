# Fetch Rewards Backend Engineering Assignment

## Public Web Address
Here is the link for my project: [Public Web Address](https://quiet-bayou-08037.herokuapp.com/)

## Technologies Used
- Node.js
- Express.js
- Heroku

## Website Overview
The requirements for this assignment are detailed in the [Fetch Rewards Coding Exercise - Backend Software Engineering](https://fetch-hiring.s3.us-east-1.amazonaws.com/points.pdf) pdf document. This document outlines three main tasks:

1. Add transactions for a specific payer and date.
2. Spend points using the rules above and return a list of { "payer": <string>, "points": <integer> } for each call.
3. Return all payer point balances

Each route is as follows:
- http://localhost:3000
    - Returns entire transaction.json database
- http://localhost:3000/add_transaction
    - post using the format `{
            "payer_name": "Unilever",
            "point_amount": 600,
            "trans_date": "2022-09-12",
            "trans_time": "14:17"
        }`
    - Returns array of transactions
- http://localhost:3000/spend
    - post using the format `{
            "point_amount": 250
        }`
    - Returns array reduced transaction amounts
- http://localhost:3000/points_balance

### Database
For this assignment, the requirements stated that storing items in memory was acceptable. So instead of creating a proper database, I used a simple JSON file to store any persistent data. 

### Primary Logic
The database contains three keys: "transactions", "spent_points", and "payer_names". My logic for storing transactions and spent points is as follows:

The user doesn't care how points are spent, but we do for accounting purposes. Therefore, whenever a transaction is added through the add_transaction route, that transaction is stored under "transactions". When a user spends points, the oldest transaction that can cover that point amount is removed from "transactions" and placed in "spent_points". If there are more points leftover, the next oldest transaction is considered. If there are leftover points that cannot count towards an entire transaction, the transaction is "split" into two. The transaction is copied, the points are reduced by the requisite amount, that copy is placed under "spent_points", and then the original transaction's points are also reduced by the required amount. Using this process, a current transaction (and thus current balance) and spent points history are maintained an easily accessible.

## Running in Development
To run this website in development:

1. Checkout the branch `dev`
2. Run the command `npm install` in your terminal to install all the necessary dependencies.
3. Run the script `npm run start`
4. Open a web browser and navigate to `http://localhost:3000/`
