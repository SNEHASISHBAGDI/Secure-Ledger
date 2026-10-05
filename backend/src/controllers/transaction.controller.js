const prisma = require("../config/prisma");
const emailService = require("../services/email.service");

/**
 * Calculates net balance for an account derived from DEBIT and CREDIT ledger entries
 */
async function getAccountBalance(accountId) {
    const credits = await prisma.ledger.aggregate({
        where: { accountId: accountId, type: "CREDIT" },
        _sum: { amount: true }
    });

    const debits = await prisma.ledger.aggregate({
        where: { accountId: accountId, type: "DEBIT" },
        _sum: { amount: true }
    });

    const creditSum = Number(credits._sum.amount || 0);
    const debitSum = Number(debits._sum.amount || 0);

    return creditSum - debitSum;
}

/**
 * - Create a new transaction
 * THE 10-STEP TRANSFER FLOW
 */
async function createTransaction(req, res) {
    // 1. Validate request
    const { fromAccount, toAccount, amount, idempotencyKey } = req.body;

    if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({
            message: "FromAccount, toAccount, amount and idempotencyKey are required"
        });
    }

    try {
        const fromUserAccount = await prisma.account.findUnique({
            where: { id: fromAccount }
        });

        const toUserAccount = await prisma.account.findUnique({
            where: { id: toAccount }
        });

        if (!fromUserAccount || !toUserAccount) {
            return res.status(400).json({
                message: "Invalid fromAccount or toAccount"
            });
        }

        // 2. Validate idempotency key
        const existingTx = await prisma.transaction.findUnique({
            where: { idempotencyKey: idempotencyKey }
        });

        if (existingTx) {
            const formattedTx = {
                ...existingTx,
                _id: existingTx.id,
                fromAccount: existingTx.fromAccountId || existingTx.fromAccount,
                toAccount: existingTx.toAccountId || existingTx.toAccount
            };

            if (existingTx.status === "COMPLETED") {
                return res.status(200).json({
                    message: "Transaction already processed",
                    transaction: formattedTx
                });
            }

            if (existingTx.status === "PENDING") {
                return res.status(200).json({
                    message: "Transaction is still processing"
                });
            }

            if (existingTx.status === "FAILED") {
                return res.status(500).json({
                    message: "Transaction processing failed, please retry"
                });
            }

            if (existingTx.status === "REVERSED") {
                return res.status(500).json({
                    message: "Transaction was reversed, please retry"
                });
            }
        }

        // 3. Check account status
        if (fromUserAccount.status !== "ACTIVE" || toUserAccount.status !== "ACTIVE") {
            return res.status(400).json({
                message: "Both fromAccount and toAccount must be ACTIVE to process transaction"
            });
        }

        // 4. Derive sender balance from ledger
        const balance = await getAccountBalance(fromAccount);

        if (balance < amount) {
            return res.status(400).json({
                message: `Insufficient balance. Current balance is ${balance}. Requested amount is ${amount}`
            });
        }

        // 5-9. Execute double-entry ledger flow inside an interactive transaction
        let transaction;
        try {
            transaction = await prisma.$transaction(async (tx) => {
                // 5. Create transaction (PENDING)
                const createdTx = await tx.transaction.create({
                    data: {
                        fromAccountId: fromAccount,
                        toAccountId: toAccount,
                        amount: Number(amount),
                        idempotencyKey: idempotencyKey,
                        status: "PENDING"
                    }
                });

                // 6. Create DEBIT ledger entry
                await tx.ledger.create({
                    data: {
                        accountId: fromAccount,
                        amount: Number(amount),
                        transactionId: createdTx.id,
                        type: "DEBIT"
                    }
                });

                // Simulated delay from original flow
                await new Promise((resolve) => setTimeout(resolve, 15 * 1000));

                // 7. Create CREDIT ledger entry
                await tx.ledger.create({
                    data: {
                        accountId: toAccount,
                        amount: Number(amount),
                        transactionId: createdTx.id,
                        type: "CREDIT"
                    }
                });

                // 8. Mark transaction COMPLETED
                const updatedTx = await tx.transaction.update({
                    where: { id: createdTx.id },
                    data: { status: "COMPLETED" }
                });

                return updatedTx;
            }, {
                timeout: 25000 // Accommodate 15s simulated delay
            });
        } catch (error) {
            console.error("Prisma Transaction Execution Error:", error);
            return res.status(400).json({
                message: "Transaction is Pending due to some issue, please retry after sometime"
            });
        }

        // 10. Send email notification
        if (emailService && typeof emailService.sendTransactionEmail === "function") {
            try {
                await emailService.sendTransactionEmail(req.user.email, req.user.name, amount, toAccount);
            } catch (emailErr) {
                console.error("Failed to send transaction notification email:", emailErr);
            }
        }

        const formattedTransaction = {
            ...transaction,
            _id: transaction.id,
            fromAccount: transaction.fromAccountId || transaction.fromAccount,
            toAccount: transaction.toAccountId || transaction.toAccount
        };

        return res.status(201).json({
            message: "Transaction completed successfully",
            transaction: formattedTransaction
        });

    } catch (err) {
        if (err.code === 'P2023') { // Invalid UUID code
            return res.status(400).json({ message: "Invalid fromAccount or toAccount" });
        }
        console.error("Error in createTransaction:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
}

/**
 * - Create Initial Funds Transaction (System User -> User Account)
 */
async function createInitialFundsTransaction(req, res) {
    const { toAccount, amount, idempotencyKey } = req.body;

    if (!toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({
            message: "toAccount, amount and idempotencyKey are required"
        });
    }

    try {
        const userId = req.user.id || req.user._id;

        const toUserAccount = await prisma.account.findUnique({
            where: { id: toAccount }
        });

        if (!toUserAccount) {
            return res.status(400).json({
                message: "Invalid toAccount"
            });
        }

        const fromUserAccount = await prisma.account.findFirst({
            where: { userId: userId }
        });

        if (!fromUserAccount) {
            return res.status(400).json({
                message: "System user account not found"
            });
        }

        const transaction = await prisma.$transaction(async (tx) => {
            const createdTx = await tx.transaction.create({
                data: {
                    fromAccountId: fromUserAccount.id,
                    toAccountId: toAccount,
                    amount: Number(amount),
                    idempotencyKey: idempotencyKey,
                    status: "PENDING"
                }
            });

            await tx.ledger.create({
                data: {
                    accountId: fromUserAccount.id,
                    amount: Number(amount),
                    transactionId: createdTx.id,
                    type: "DEBIT"
                }
            });

            await tx.ledger.create({
                data: {
                    accountId: toAccount,
                    amount: Number(amount),
                    transactionId: createdTx.id,
                    type: "CREDIT"
                }
            });

            const updatedTx = await tx.transaction.update({
                where: { id: createdTx.id },
                data: { status: "COMPLETED" }
            });

            return updatedTx;
        });

        const formattedTransaction = {
            ...transaction,
            _id: transaction.id,
            fromAccount: transaction.fromAccountId || transaction.fromAccount,
            toAccount: transaction.toAccountId || transaction.toAccount
        };

        return res.status(201).json({
            message: "Initial funds transaction completed successfully",
            transaction: formattedTransaction
        });

    } catch (err) {
        if (err.code === 'P2023') {
            return res.status(400).json({ message: "Invalid toAccount" });
        }
        console.error("Error in createInitialFundsTransaction:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
}

module.exports = {
    createTransaction,
    createInitialFundsTransaction
};