const prisma = require("../config/prisma");
const { Prisma } = require("@prisma/client");

/**
 * - Create Account Controller
 * - POST /api/account
 */
async function createAccountController(req, res) {
    try {
        const userId = req.user.id || req.user._id;

        const account = await prisma.account.create({
            data: {
                userId: userId
            }
        });

        res.status(201).json({
            account: {
                ...account,
                _id: account.id
            }
        });
    } catch (error) {
        console.error("Error creating account:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

/**
 * - Get User Accounts Controller
 * - GET /api/account
 */
async function getUserAccountsController(req, res) {
    try {
        const userId = req.user.id || req.user._id;

        const accounts = await prisma.account.findMany({
            where: { userId: userId }
        });

        const formattedAccounts = accounts.map(acc => ({
            ...acc,
            _id: acc.id
        }));

        res.status(200).json({
            accounts: formattedAccounts
        });
    } catch (error) {
        console.error("Error fetching user accounts:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

/**
 * - Get Account Balance Controller
 * - GET /api/account/:accountId/balance
 */
async function getAccountBalanceController(req, res) {
    const { accountId } = req.params;
    const userId = req.user.id || req.user._id;

    try {
        const account = await prisma.account.findFirst({
            where: {
                id: accountId,
                userId: userId
            }
        });

        if (!account) {
            return res.status(404).json({
                message: "Account not found"
            });
        }

        const [credits, debits] = await Promise.all([
            prisma.ledger.aggregate({
                _sum: { amount: true },
                where: { accountId: account.id, type: "CREDIT" }
            }),
            prisma.ledger.aggregate({
                _sum: { amount: true },
                where: { accountId: account.id, type: "DEBIT" }
            })
        ]);
        const balance = credits._sum.amount || debits._sum.amount
            ? new Prisma.Decimal(credits._sum.amount || 0).minus(debits._sum.amount || 0)
            : 0;

        res.status(200).json({
            accountId: account.id,
            _id: account.id,
            balance: balance
        });
    } catch (error) {
        // Handle malformed/invalid UUID strings gracefully
        if (error.code === 'P2023') {
            return res.status(404).json({ message: "Account not found" });
        }
        console.error("Error fetching account balance:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

/**
 * - Recent Activity Controller
 * - GET /api/account/:accountId/activity
 * - Fetches the last 5 ledger entries for the account
 */
async function getAccountActivityController(req, res) {
    const { accountId } = req.params;
    const userId = req.user.id || req.user._id;

    try {
        const account = await prisma.account.findFirst({
            where: { id: accountId, userId }
        });

        if (!account) {
            return res.status(404).json({ message: "Account not found" });
        }

        const activity = await prisma.ledger.findMany({
            where: { accountId: accountId },
            orderBy: { createdAt: 'desc' },
            take: 5
        });

        const formattedActivity = activity.map(item => ({
            ...item,
            _id: item.id
        }));

        res.status(200).json({ activity: formattedActivity });
    } catch (error) {
        if (error.code === 'P2023') {
            return res.status(404).json({ message: "Account not found" });
        }
        console.error("Error fetching account activity:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

module.exports = {
    createAccountController,
    getUserAccountsController,
    getAccountBalanceController,
    getAccountActivityController
};