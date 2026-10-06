require("dotenv").config();
const bcrypt = require("bcryptjs");
const { Prisma } = require("@prisma/client");
const prisma = require("../src/config/prisma");

function readConfiguration() {
    const email = process.env.SYSTEM_USER_EMAIL;
    const password = process.env.SYSTEM_USER_PASSWORD;
    const initialCapital = process.env.SYSTEM_INITIAL_CAPITAL;

    if (!email || !password || !initialCapital) {
        throw new Error(
            "SYSTEM_USER_EMAIL, SYSTEM_USER_PASSWORD and SYSTEM_INITIAL_CAPITAL are required"
        );
    }

    if (!/^\d{1,15}(?:\.\d{1,4})?$/.test(initialCapital)) {
        throw new Error("SYSTEM_INITIAL_CAPITAL must be a positive amount with at most 4 decimal places");
    }

    const capital = new Prisma.Decimal(initialCapital);
    if (!capital.isPositive()) {
        throw new Error("SYSTEM_INITIAL_CAPITAL must be greater than zero");
    }

    return { email, password, capital };
}

async function seedSystem() {
    const { email, password, capital } = readConfiguration();
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser && !existingUser.systemUser) {
        throw new Error("SYSTEM_USER_EMAIL belongs to a non-system user; refusing to promote the account");
    }

    const systemUser = existingUser || await prisma.user.create({
        data: {
            email,
            name: "Secure Ledger System",
            password: await bcrypt.hash(password, 10),
            systemUser: true
        }
    });

    await prisma.$transaction(async (tx) => {
        let fundingAccount = await tx.account.findFirst({
            where: { userId: systemUser.id, role: "SYSTEM_FUNDING" }
        });
        let capitalAccount = await tx.account.findFirst({
            where: { userId: systemUser.id, role: "SYSTEM_CAPITAL" }
        });

        fundingAccount ||= await tx.account.create({
            data: { userId: systemUser.id, role: "SYSTEM_FUNDING" }
        });
        capitalAccount ||= await tx.account.create({
            data: { userId: systemUser.id, role: "SYSTEM_CAPITAL" }
        });

        if (fundingAccount.status !== "ACTIVE" || capitalAccount.status !== "ACTIVE") {
            throw new Error("System funding and capital accounts must be ACTIVE");
        }

        const idempotencyKey = `system-capitalization:${systemUser.id}:v1`;
        const existingCapitalization = await tx.transaction.findUnique({
            where: { idempotencyKey }
        });

        if (existingCapitalization) {
            if (!new Prisma.Decimal(existingCapitalization.amount).equals(capital)) {
                throw new Error("Configured initial capital differs from the existing system capitalization");
            }
            if (existingCapitalization.status !== "COMPLETED") {
                throw new Error("Existing system capitalization is not completed; manual review is required");
            }
            return;
        }

        const transaction = await tx.transaction.create({
            data: {
                fromAccountId: capitalAccount.id,
                toAccountId: fundingAccount.id,
                amount: capital,
                idempotencyKey,
                status: "COMPLETED"
            }
        });

        await tx.ledger.createMany({
            data: [
                {
                    accountId: capitalAccount.id,
                    amount: capital,
                    transactionId: transaction.id,
                    type: "DEBIT"
                },
                {
                    accountId: fundingAccount.id,
                    amount: capital,
                    transactionId: transaction.id,
                    type: "CREDIT"
                }
            ]
        });
    });

    console.log("System user and funded system accounts are initialized.");
}

seedSystem()
    .catch((error) => {
        console.error("System initialization failed:", error.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
