const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');

function redactResponseBody(value, key = '') {
    if (/password|secret|token|cookie|authorization|connection.?string/i.test(key)) {
        return '[REDACTED]';
    }
    if (typeof value === 'string') {
        return value
            .replace(/postgres(?:ql)?:\/\/[^\s"'`]+/gi, '[REDACTED_DATABASE_URL]')
            .replace(/\bBearer\s+[^\s,;]+/gi, 'Bearer [REDACTED]')
            .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, '[REDACTED_JWT]');
    }
    if (Array.isArray(value)) {
        return value.map((item) => redactResponseBody(item));
    }
    if (value && typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value).map(([entryKey, entryValue]) => [
                entryKey,
                redactResponseBody(entryValue, entryKey)
            ])
        );
    }
    return value;
}

async function diagnoseHttpStatuses(responses, expectedStatuses, label) {
    const actualStatuses = responses.map((response) => response.status).sort((a, b) => a - b);
    const expected = [...expectedStatuses].sort((a, b) => a - b);
    if (JSON.stringify(actualStatuses) === JSON.stringify(expected)) return;

    for (const response of responses) {
        let body;
        try {
            const text = await response.clone().text();
            try {
                body = redactResponseBody(JSON.parse(text));
            } catch {
                body = redactResponseBody(text);
            }
        } catch (error) {
            body = `Unable to read response body: ${error instanceof Error ? error.message : 'unknown error'}`;
        }
        console.error(`[${label}] unexpected HTTP response`, {
            status: response.status,
            body
        });
    }
}

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
let safeTestDatabase = false;

if (testDatabaseUrl) {
    try {
        const databaseName = decodeURIComponent(new URL(testDatabaseUrl).pathname.slice(1));
        safeTestDatabase =
            /(^|[_-])test([_-]|$)/i.test(databaseName) &&
            testDatabaseUrl !== process.env.DATABASE_URL;
    } catch {
        safeTestDatabase = false;
    }
}

const skipReason = safeTestDatabase
    ? false
    : 'Set TEST_DATABASE_URL to a separate PostgreSQL database whose name contains "test".';

test('PostgreSQL account and transfer integration', { skip: skipReason }, async (t) => {
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL = testDatabaseUrl;
    process.env.JWT_SECRET = crypto.randomUUID();

    const prisma = require('../src/config/prisma');
    const app = require('../src/app');
    const emailService = require('../src/services/email.service');
    emailService.sendRegistrationEmail = async () => {};
    emailService.sendTransactionEmail = async () => {};

    const users = [];
    const accounts = [];
    const server = app.listen(0);
    await new Promise((resolve, reject) => {
        server.once('listening', resolve);
        server.once('error', reject);
    });

    const baseUrl = `http://127.0.0.1:${server.address().port}`;
    const request = (path, token, body, method = 'GET') => fetch(`${baseUrl}${path}`, {
        method,
        headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(body ? { 'Content-Type': 'application/json' } : {})
        },
        ...(body ? { body: JSON.stringify(body) } : {})
    });

    const createUserAccount = async (label, options = {}) => {
        const user = await prisma.user.create({
            data: {
                email: `${label}_${crypto.randomUUID()}@example.test`,
                name: label,
                password: 'integration-test-only',
                systemUser: options.systemUser || false
            }
        });
        users.push(user);

        const account = options.noAccount
            ? null
            : await prisma.account.create({
                data: {
                    userId: user.id,
                    role: options.role || 'CUSTOMER',
                    currency: options.currency || 'INR'
                }
            });
        if (account) accounts.push(account);

        return {
            user,
            account,
            token: require('jsonwebtoken').sign({ userId: user.id }, process.env.JWT_SECRET)
        };
    };

    const createOpeningCredit = async (fundingAccount, destination, amount) => {
        await prisma.$transaction(async (tx) => {
            const transaction = await tx.transaction.create({
                data: {
                    fromAccountId: fundingAccount.id,
                    toAccountId: destination.id,
                    amount,
                    idempotencyKey: crypto.randomUUID(),
                    status: 'COMPLETED'
                }
            });

            await tx.ledger.createMany({
                data: [
                    {
                        accountId: fundingAccount.id,
                        amount,
                        transactionId: transaction.id,
                        type: 'DEBIT'
                    },
                    {
                        accountId: destination.id,
                        amount,
                        transactionId: transaction.id,
                        type: 'CREDIT'
                    }
                ]
            });
        });
    };

    const getBalance = async (accountId, token) => {
        const response = await request(`/api/accounts/balance/${accountId}`, token);
        await diagnoseHttpStatuses([response], [200], 'get account balance');
        assert.equal(response.status, 200);
        const data = await response.json();
        return Number(data.balance);
    };

    let triggerFunction;
    let triggerName;

    try {
        await prisma.$connect();

        const funding = await createUserAccount('funding', {
            systemUser: true,
            role: 'SYSTEM_FUNDING'
        });
        const sender = await createUserAccount('sender');
        const recipient = await createUserAccount('recipient');
        const concurrentSender = await createUserAccount('concurrent-sender');
        const emptyUser = await createUserAccount('empty-user', { noAccount: true });
        const unsupportedCurrencyAccount = await createUserAccount('usd-recipient', {
            currency: 'USD'
        });

        await createOpeningCredit(funding.account, sender.account, 1000);
        await createOpeningCredit(funding.account, recipient.account, 500);
        await createOpeningCredit(funding.account, concurrentSender.account, 500);

        await t.test('CORS allows the configured frontend and answers preflight without wildcard access', async () => {
            const allowedResponse = await fetch(`${baseUrl}/api/accounts`, {
                method: 'OPTIONS',
                headers: {
                    Origin: 'https://atomicedger-1.onrender.com',
                    'Access-Control-Request-Method': 'GET',
                    'Access-Control-Request-Headers': 'authorization'
                }
            });
            await diagnoseHttpStatuses([allowedResponse], [204], 'allowed CORS preflight');
            assert.equal(allowedResponse.status, 204);
            assert.equal(
                allowedResponse.headers.get('access-control-allow-origin'),
                'https://atomicedger-1.onrender.com'
            );
            assert.equal(allowedResponse.headers.get('access-control-allow-credentials'), 'true');

            const rejectedResponse = await fetch(`${baseUrl}/api/accounts`, {
                method: 'OPTIONS',
                headers: {
                    Origin: 'https://unapproved.example',
                    'Access-Control-Request-Method': 'GET'
                }
            });
            assert.equal(rejectedResponse.headers.get('access-control-allow-origin'), null);
        });

        await t.test('account list is scoped to active customer accounts', async () => {
            const response = await request('/api/accounts', sender.token);
            await diagnoseHttpStatuses([response], [200], 'list customer accounts');
            assert.equal(response.status, 200);
            const data = await response.json();
            assert.deepEqual(data.accounts.map((account) => account._id), [sender.account.id]);

            const emptyResponse = await request('/api/accounts', emptyUser.token);
            await diagnoseHttpStatuses([emptyResponse], [200], 'list empty user accounts');
            assert.equal(emptyResponse.status, 200);
            assert.deepEqual((await emptyResponse.json()).accounts, []);

            const unauthorizedBalance = await request(
                `/api/accounts/balance/${sender.account.id}`,
                recipient.token
            );
            await diagnoseHttpStatuses([unauthorizedBalance], [404], 'unauthorized balance');
            assert.equal(unauthorizedBalance.status, 404);
        });

        await t.test('registration atomically provisions exactly one account across retries', async () => {
            const email = `registration_${crypto.randomUUID()}@example.test`;
            const registration = {
                name: 'Registration Integration Test',
                email,
                password: 'integration-test-password'
            };
            const responses = await Promise.all([
                request('/api/auth/register', null, registration, 'POST'),
                request('/api/auth/register', null, registration, 'POST')
            ]);
            await diagnoseHttpStatuses(responses, [201, 422], 'concurrent registration');
            assert.deepEqual(responses.map((response) => response.status).sort(), [201, 422]);

            const createdResponse = responses.find((response) => response.status === 201);
            assert.ok(createdResponse);
            const createdData = await createdResponse.json();
            users.push({ id: createdData.user._id });
            assert.equal(await prisma.user.count({ where: { email } }), 1);
            const createdAccounts = await prisma.account.findMany({
                where: { userId: createdData.user._id }
            });
            accounts.push(...createdAccounts);
            assert.equal(createdAccounts.length, 1);
            assert.equal(createdAccounts[0].role, 'CUSTOMER');
            assert.equal(createdAccounts[0].status, 'ACTIVE');
        });

        await t.test('account provisioning derives owner from authenticated identity', async () => {
            const response = await request('/api/accounts', emptyUser.token, {}, 'POST');
            await diagnoseHttpStatuses([response], [201], 'provision account');
            assert.equal(response.status, 201);
            const data = await response.json();
            assert.equal(data.account.userId, emptyUser.user.id);
            assert.equal(data.account.role, 'CUSTOMER');
            assert.equal(data.account.status, 'ACTIVE');
            accounts.push({ id: data.account.id });

            const refreshed = await request('/api/accounts', emptyUser.token);
            assert.equal((await refreshed.json()).accounts.length, 1);
        });

        await t.test('transfer posts matching debit and credit and updates both histories and balances', async () => {
            const key = crypto.randomUUID();
            const response = await request('/api/transactions', sender.token, {
                fromAccount: sender.account.id,
                toAccount: recipient.account.id,
                amount: '300.0000',
                idempotencyKey: key
            }, 'POST');

            await diagnoseHttpStatuses([response], [201], 'successful transfer');
            assert.equal(response.status, 201);
            const data = await response.json();
            assert.equal(data.transaction.amount, '300');

            const [debit, credit] = await Promise.all([
                prisma.ledger.findFirst({
                    where: { transactionId: data.transaction._id, accountId: sender.account.id }
                }),
                prisma.ledger.findFirst({
                    where: { transactionId: data.transaction._id, accountId: recipient.account.id }
                })
            ]);
            assert.equal(debit.type, 'DEBIT');
            assert.equal(credit.type, 'CREDIT');
            assert.equal(Number(debit.amount), 300);
            assert.equal(Number(credit.amount), 300);
            assert.equal(await getBalance(sender.account.id, sender.token), 700);
            assert.equal(await getBalance(recipient.account.id, recipient.token), 800);

            const [senderHistory, recipientHistory] = await Promise.all([
                request(`/api/accounts/activity/${sender.account.id}`, sender.token),
                request(`/api/accounts/activity/${recipient.account.id}`, recipient.token)
            ]);
            assert.ok((await senderHistory.json()).activity.some((entry) => entry._id === debit.id));
            assert.ok((await recipientHistory.json()).activity.some((entry) => entry._id === credit.id));
        });

        await t.test('idempotent retry returns the original transfer and rejects changed payloads', async () => {
            const key = crypto.randomUUID();
            const body = {
                fromAccount: sender.account.id,
                toAccount: recipient.account.id,
                amount: '25',
                idempotencyKey: key
            };
            const [first, duplicate] = await Promise.all([
                request('/api/transactions', sender.token, body, 'POST'),
                request('/api/transactions', sender.token, body, 'POST')
            ]);
            await diagnoseHttpStatuses([first, duplicate], [200, 201], 'concurrent idempotent transfer');
            assert.deepEqual([first.status, duplicate.status].sort(), [200, 201]);

            const firstData = await first.json();
            const duplicateData = await duplicate.json();
            assert.equal(firstData.transaction._id, duplicateData.transaction._id);

            const conflict = await request('/api/transactions', sender.token, {
                ...body,
                amount: '26'
            }, 'POST');
            await diagnoseHttpStatuses([conflict], [409], 'changed idempotency payload');
            assert.equal(conflict.status, 409);
        });

        await t.test('invalid, unsupported-currency, self, and insufficient-funds requests post no entries', async () => {
            const before = await prisma.ledger.count({
                where: { accountId: sender.account.id }
            });
            const requests = [
                {
                    toAccount: recipient.account.id,
                    amount: '-1',
                    key: crypto.randomUUID()
                },
                {
                    toAccount: sender.account.id,
                    amount: '1',
                    key: crypto.randomUUID()
                },
                {
                    toAccount: unsupportedCurrencyAccount.account.id,
                    amount: '1',
                    key: crypto.randomUUID()
                },
                {
                    toAccount: recipient.account.id,
                    amount: '999999',
                    key: crypto.randomUUID()
                }
            ];

            const responses = await Promise.all(requests.map(({ toAccount, amount, key }) =>
                request('/api/transactions', sender.token, {
                    fromAccount: sender.account.id,
                    toAccount,
                    amount,
                    idempotencyKey: key
                }, 'POST')
            ));

            await diagnoseHttpStatuses(responses, [400, 400, 400, 400], 'invalid transfer requests');
            assert.deepEqual(responses.map((response) => response.status), [400, 400, 400, 400]);
            assert.equal(await prisma.ledger.count({
                where: { accountId: sender.account.id }
            }), before);
        });

        await t.test('concurrent transfers cannot overspend one source account', async () => {
            const responses = await Promise.all([1, 2].map(() =>
                request('/api/transactions', concurrentSender.token, {
                    fromAccount: concurrentSender.account.id,
                    toAccount: recipient.account.id,
                    amount: '400',
                    idempotencyKey: crypto.randomUUID()
                }, 'POST')
            ));

            await diagnoseHttpStatuses(responses, [201, 400], 'concurrent overspend transfers');
            assert.deepEqual(responses.map((response) => response.status).sort(), [201, 400]);
            assert.equal(await getBalance(concurrentSender.account.id, concurrentSender.token), 100);
        });

        await t.test('opposite-direction transfers complete without deadlock', async () => {
            const results = await Promise.all([
                request('/api/transactions', sender.token, {
                    fromAccount: sender.account.id,
                    toAccount: recipient.account.id,
                    amount: '10',
                    idempotencyKey: crypto.randomUUID()
                }, 'POST'),
                request('/api/transactions', recipient.token, {
                    fromAccount: recipient.account.id,
                    toAccount: sender.account.id,
                    amount: '10',
                    idempotencyKey: crypto.randomUUID()
                }, 'POST')
            ]);

            await diagnoseHttpStatuses(results, [201, 201], 'opposite-direction transfers');
            assert.deepEqual(results.map((response) => response.status), [201, 201]);
        });

        await t.test('required ledger write failure rolls back transaction and debit', async () => {
            const idempotencyKey = crypto.randomUUID();
            const suffix = crypto.randomUUID().replaceAll('-', '');
            triggerFunction = `test_fail_credit_${suffix}`;
            triggerName = `test_fail_credit_trigger_${suffix}`;

            await prisma.$executeRawUnsafe(`
                CREATE FUNCTION "${triggerFunction}"() RETURNS trigger LANGUAGE plpgsql AS $$
                BEGIN
                    IF NEW."type" = 'CREDIT' AND EXISTS (
                        SELECT 1 FROM "Transaction"
                        WHERE "id" = NEW."transactionId"
                          AND "idempotencyKey" = '${idempotencyKey}'
                    ) THEN
                        RAISE EXCEPTION 'intentional integration-test failure';
                    END IF;
                    RETURN NEW;
                END;
                $$
            `);
            await prisma.$executeRawUnsafe(`
                CREATE TRIGGER "${triggerName}"
                BEFORE INSERT ON "Ledger"
                FOR EACH ROW EXECUTE FUNCTION "${triggerFunction}"()
            `);

            try {
                const beforeBalance = await getBalance(sender.account.id, sender.token);
                const response = await request('/api/transactions', sender.token, {
                    fromAccount: sender.account.id,
                    toAccount: recipient.account.id,
                    amount: '5',
                    idempotencyKey
                }, 'POST');
                await diagnoseHttpStatuses([response], [500], 'rollback transfer failure');
                assert.equal(response.status, 500);
                assert.equal(await prisma.transaction.count({ where: { idempotencyKey } }), 0);
                assert.equal(await getBalance(sender.account.id, sender.token), beforeBalance);
            } finally {
                await prisma.$executeRawUnsafe(`DROP TRIGGER IF EXISTS "${triggerName}" ON "Ledger"`);
                await prisma.$executeRawUnsafe(`DROP FUNCTION IF EXISTS "${triggerFunction}"()`);
                triggerName = undefined;
                triggerFunction = undefined;
            }
        });
    } finally {
        if (triggerName) {
            await prisma.$executeRawUnsafe(`DROP TRIGGER IF EXISTS "${triggerName}" ON "Ledger"`);
        }
        if (triggerFunction) {
            await prisma.$executeRawUnsafe(`DROP FUNCTION IF EXISTS "${triggerFunction}"()`);
        }

        await new Promise((resolve) => server.close(resolve));
        const accountIds = accounts.map((account) => account.id);
        const transactionRecords = accountIds.length
            ? await prisma.transaction.findMany({
                where: {
                    OR: [
                        { fromAccountId: { in: accountIds } },
                        { toAccountId: { in: accountIds } }
                    ]
                },
                select: { id: true }
            })
            : [];
        const transactionIds = transactionRecords.map((transaction) => transaction.id);

        if (transactionIds.length) {
            await prisma.ledger.deleteMany({ where: { transactionId: { in: transactionIds } } });
            await prisma.transaction.deleteMany({ where: { id: { in: transactionIds } } });
        }
        if (accountIds.length) {
            await prisma.ledger.deleteMany({ where: { accountId: { in: accountIds } } });
            await prisma.account.deleteMany({ where: { id: { in: accountIds } } });
        }
        const userIds = users.map((user) => user.id);
        if (userIds.length) {
            await prisma.user.deleteMany({ where: { id: { in: userIds } } });
        }
        await prisma.$disconnect();
    }
});
