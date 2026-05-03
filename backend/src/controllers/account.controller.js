const accountModel = require("../models/account.model");


async function createAccountController(req, res) {

    const user = req.user;

    const account = await accountModel.create({
        user: user._id
    })

    res.status(201).json({
        account
    })

}

async function getUserAccountsController(req, res) {

    const accounts = await accountModel.find({ user: req.user._id });

    res.status(200).json({
        accounts
    })
}

async function getAccountBalanceController(req, res) {
    const { accountId } = req.params;

    const account = await accountModel.findOne({
        _id: accountId,
        user: req.user._id
    })

    if (!account) {
        return res.status(404).json({
            message: "Account not found"
        })
    }

    const balance = await account.getBalance();

    res.status(200).json({
        accountId: account._id,
        balance: balance
    })
}    

//Recent Transactions.(It fetches the last 5 ledger entries for the account.)

const ledgerModel = require("../models/ledger.model");

// ... your existing functions ...

async function getAccountActivityController(req, res) {
    const { accountId } = req.params;

    // Fetch the last 5 ledger entries for this account, newest first
    const activity = await ledgerModel.find({ account: accountId })
        .sort({ createdAt: -1 })
        .limit(5);

    res.status(200).json({ activity });
}


module.exports = {
    createAccountController,
    getUserAccountsController,
    getAccountBalanceController,
    getAccountActivityController // <-- Don't forget to export it!
}