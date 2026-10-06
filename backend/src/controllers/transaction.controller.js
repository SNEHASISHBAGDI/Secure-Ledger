const prisma = require("../config/prisma");
const emailService = require("../services/email.service");
const { Prisma } = require("@prisma/client");

/**
 * Calculates net balance for an account derived from DEBIT and CREDIT ledger entries
 */
async function getAccountBalance(accountId, client = prisma) {
    const credits = await client.ledger.aggregate({
        where: { accountId: accountId, type: "CREDIT" },
        _sum: { amount: true }
    });

    const debits = await client.ledger.aggregate({
        where: { accountId: accountId, type: "DEBIT" },
        _sum: { amount: true }
    });

    return new Prisma.Decimal(credits._sum.amount || 0).minus(debits._sum.amount || 0);
}

function parseAmount(amount) {
    if ((typeof amount !== "number" && typeof amount !== "string") ||
        !/^\d{1,15}(?:\.\d{1,4})?$/.test(String(amount))) {
        return null;
    }

    const parsed = new Prisma.Decimal(String(amount));
    return parsed.isPositive() ? parsed : null;
}

/**
 * - Create a new transaction
 * THE 10-STEP TRANSFER FLOW
 */
async function createTransaction(req, res) {
    // 1. Validate request
    const { fromAccount, toAccount, amount, idempotencyKey } = req.body || {};

    if (!fromAccount || !toAccount || amount === undefined || amount === null ||
        typeof idempotencyKey !== "string" || !idempotencyKey.trim() ||
        idempotencyKey.length > 255) {
        return res.status(400).json({
            message: "FromAccount, toAccount, amount and a valid idempotencyKey are required"
        });
    }

    if (fromAccount === toAccount) {
        return res.status(400).json({ message: "FromAccount and toAccount must be different" });
    }

    const parsedAmount = parseAmount(amount);
    if (!parsedAmount) {
        return res.status(400).json({ message: "Amount must be positive and have at most 4 decimal places" });
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

        if (fromUserAccount.userId !== (req.user.id || req.user._id) ||
            fromUserAccount.role !== "CUSTOMER" ||
            toUserAccount.role !== "CUSTOMER") {
            return res.status(403).json({ message: "Transactions are only allowed between your customer accounts" });
        }

        // 4-9. Lock both accounts and execute the ledger flow atomically.
        let result;
        try {
            result = await prisma.$transaction(async (tx) => {
                await tx.$queryRaw`
                    SELECT "id"
                    FROM "Account"
                    WHERE "id" IN (${fromAccount}, ${toAccount})
                    ORDER BY "id"
                    FOR UPDATE
                `;

                const lockedAccounts = await tx.account.findMany({
                    where: { id: { in: [fromAccount, toAccount] } }
                });
                const lockedFromAccount = lockedAccounts.find((account) => account.id === fromAccount);
                const lockedToAccount = lockedAccounts.find((account) => account.id === toAccount);

                const existingTx = await tx.transaction.findUnique({
                    where: { idempotencyKey }
                });

                if (existingTx) {
                    if (existingTx.fromAccountId !== fromAccount ||
                        existingTx.toAccountId !== toAccount ||
                        !new Prisma.Decimal(existingTx.amount).equals(parsedAmount)) {
                        return { conflict: true };
                    }
                    if (existingTx.status === "COMPLETED") {
                        return { transaction: existingTx, duplicate: true };
                    }
                    if (existingTx.status === "PENDING") {
                        return { pending: true };
                    }
                    return { conflict: true };
                }

                if (!lockedFromAccount || !lockedToAccount ||
                    lockedFromAccount.status !== "ACTIVE" ||
                    lockedToAccount.status !== "ACTIVE") {
                    return { inactiveAccounts: true };
                }
                if (lockedFromAccount.userId !== (req.user.id || req.user._id) ||
                    lockedFromAccount.role !== "CUSTOMER" ||
                    lockedToAccount.role !== "CUSTOMER") {
                    return { unauthorizedAccounts: true };
                }

                const balance = await getAccountBalance(fromAccount, tx);
                if (balance.lessThan(parsedAmount)) {
                    return { insufficientBalance: balance };
                }

                const createdTx = await tx.transaction.create({
                    data: {
                        fromAccountId: fromAccount,
                        toAccountId: toAccount,
                        amount: parsedAmount,
                        idempotencyKey: idempotencyKey,
                        status: "PENDING"
                    }
                });

                // 6. Create DEBIT ledger entry
                await tx.ledger.create({
                    data: {
                        accountId: fromAccount,
                        amount: parsedAmount,
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
                        amount: parsedAmount,
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
            if (error.code === "P2002") {
                return res.status(409).json({
                    message: "Transaction with this idempotency key already exists"
                });
            }
            console.error("Prisma Transaction Execution Error:", error);
            return res.status(500).json({ message: "Transaction could not be processed" });
        }

        if (result.conflict) {
            return res.status(409).json({
                message: "Idempotency key was already used for a different or non-retryable transaction"
            });
        }
        if (result.pending) {
            return res.status(409).json({ message: "Transaction with this idempotency key is still processing" });
        }
        if (result.inactiveAccounts) {
            return res.status(400).json({
                message: "Both fromAccount and toAccount must be ACTIVE to process transaction"
            });
        }
        if (result.unauthorizedAccounts) {
            return res.status(403).json({ message: "Transactions are only allowed between your customer accounts" });
        }
        if (result.insufficientBalance) {
            return res.status(400).json({
                message: `Insufficient balance. Current balance is ${result.insufficientBalance.toString()}. Requested amount is ${parsedAmount.toString()}`
            });
        }

        // 10. Send email notification
        if (!result.duplicate && emailService && typeof emailService.sendTransactionEmail === "function") {
            try {
                await emailService.sendTransactionEmail(req.user.email, req.user.name, amount, toAccount);
            } catch (emailErr) {
                console.error("Failed to send transaction notification email:", emailErr);
            }
        }

        const transaction = result.transaction;
        const formattedTransaction = {
            ...transaction,
            _id: transaction.id,
            fromAccount: transaction.fromAccountId || transaction.fromAccount,
            toAccount: transaction.toAccountId || transaction.toAccount
        };

        return res.status(result.duplicate ? 200 : 201).json({
            message: result.duplicate ? "Transaction already processed" : "Transaction completed successfully",
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
    const { toAccount, amount, idempotencyKey } = req.body || {};

    if (!toAccount || amount === undefined || amount === null || !idempotencyKey ||
        typeof idempotencyKey !== "string" || !idempotencyKey.trim() || idempotencyKey.length > 255) {
        return res.status(400).json({
            message: "toAccount, amount and idempotencyKey are required"
        });
    }

    const parsedAmount = parseAmount(amount);
    if (!parsedAmount) {
        return res.status(400).json({ message: "Amount must be positive and have at most 4 decimal places" });
    }

    try {
        const userId = req.user.id || req.user._id;

        const toUserAccount = await prisma.account.findUnique({
            where: { id: toAccount },
            include: { user: true }
        });

        if (!toUserAccount || toUserAccount.role !== "CUSTOMER" ||
            toUserAccount.user.systemUser || toUserAccount.status !== "ACTIVE") {
            return res.status(400).json({
                message: "Target account must be an ACTIVE customer account"
            });
        }

        const fromUserAccount = await prisma.account.findFirst({
            where: { userId, role: "SYSTEM_FUNDING" }
        });

        if (!fromUserAccount) {
            return res.status(400).json({
                message: "System funding account not found"
            });
        }

        if (fromUserAccount.status !== "ACTIVE") {
            return res.status(400).json({ message: "System funding account is not ACTIVE" });
        }

        const result = await prisma.$transaction(async (tx) => {
            await tx.$queryRaw`
                SELECT "id"
                FROM "Account"
                WHERE "id" IN (${fromUserAccount.id}, ${toAccount})
                ORDER BY "id"
                FOR UPDATE
            `;

            const lockedAccounts = await tx.account.findMany({
                where: { id: { in: [fromUserAccount.id, toAccount] } },
                include: { user: true }
            });
            const lockedFundingAccount = lockedAccounts.find((account) => account.id === fromUserAccount.id);
            const lockedTargetAccount = lockedAccounts.find((account) => account.id === toAccount);

            if (!lockedFundingAccount || lockedFundingAccount.status !== "ACTIVE") {
                return { inactiveFundingAccount: true };
            }
            if (!lockedTargetAccount || lockedTargetAccount.status !== "ACTIVE" ||
                lockedTargetAccount.role !== "CUSTOMER" || lockedTargetAccount.user.systemUser) {
                return { inactiveTargetAccount: true };
            }

            const existingTx = await tx.transaction.findUnique({
                where: { idempotencyKey }
            });

            if (existingTx) {
                if (existingTx.fromAccountId !== fromUserAccount.id ||
                    existingTx.toAccountId !== toAccount ||
                    !new Prisma.Decimal(existingTx.amount).equals(parsedAmount)) {
                    return { conflict: true };
                }

                if (existingTx.status === "COMPLETED") {
                    return { transaction: existingTx, duplicate: true };
                }
                return { pending: true };
            }

            const balance = await getAccountBalance(fromUserAccount.id, tx);
            if (balance.lessThan(parsedAmount)) {
                return { insufficientBalance: balance };
            }

            const createdTx = await tx.transaction.create({
                data: {
                    fromAccountId: fromUserAccount.id,
                    toAccountId: toAccount,
                    amount: parsedAmount,
                    idempotencyKey: idempotencyKey,
                    status: "PENDING"
                }
            });

            await tx.ledger.create({
                data: {
                    accountId: fromUserAccount.id,
                    amount: parsedAmount,
                    transactionId: createdTx.id,
                    type: "DEBIT"
                }
            });

            await tx.ledger.create({
                data: {
                    accountId: toAccount,
                    amount: parsedAmount,
                    transactionId: createdTx.id,
                    type: "CREDIT"
                }
            });

            const updatedTx = await tx.transaction.update({
                where: { id: createdTx.id },
                data: { status: "COMPLETED" }
            });

            return { transaction: updatedTx };
        });

        if (result.conflict) {
            return res.status(409).json({ message: "Idempotency key was already used for a different transaction" });
        }
        if (result.pending) {
            return res.status(409).json({ message: "Transaction with this idempotency key is not completed" });
        }
        if (result.inactiveFundingAccount) {
            return res.status(400).json({ message: "System funding account is not ACTIVE" });
        }
        if (result.inactiveTargetAccount) {
            return res.status(400).json({
                message: "Target account must be an ACTIVE customer account"
            });
        }
        if (result.insufficientBalance) {
            return res.status(400).json({
                message: `Insufficient system funding balance. Current balance is ${result.insufficientBalance.toString()}. Requested amount is ${parsedAmount.toString()}`
            });
        }

        const transaction = result.transaction;
        const formattedTransaction = {
            ...transaction,
            _id: transaction.id,
            fromAccount: transaction.fromAccountId || transaction.fromAccount,
            toAccount: transaction.toAccountId || transaction.toAccount
        };

        return res.status(result.duplicate ? 200 : 201).json({
            message: result.duplicate ? "Transaction already processed" : "Initial funds transaction completed successfully",
            transaction: formattedTransaction
        });

    } catch (err) {
        if (err.code === 'P2023') {
            return res.status(400).json({ message: "Invalid toAccount" });
        }
        if (err.code === 'P2002') {
            return res.status(409).json({ message: "Transaction with this idempotency key already exists" });
        }
        console.error("Error in createInitialFundsTransaction:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
}

module.exports = {
    createTransaction,
    createInitialFundsTransaction
};