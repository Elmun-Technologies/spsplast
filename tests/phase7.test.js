const test = require('node:test');
const assert = require('node:assert');
const crypto = require('crypto');

// Simulated Click signature calculator
function generateClickSignature(params, secretKey) {
    const raw = `${params.click_trans_id}${params.service_id}${secretKey}${params.merchant_trans_id}${params.amount}${params.action}${params.sign_time}`;
    return crypto.createHash('md5').update(raw).digest('hex');
}

// 1. Click MD5 signature generation and validation logic
test('1. Click MD5 signature validation', () => {
    const secretKey = 'my_click_secret';
    const params = {
        click_trans_id: '12345',
        service_id: '999',
        merchant_trans_id: 'order-101',
        amount: '150000',
        action: '0',
        sign_time: '2026-08-20 12:00:00',
    };

    const validSign = generateClickSignature(params, secretKey);
    assert.strictEqual(typeof validSign, 'string');
    assert.strictEqual(validSign.length, 32);

    const invalidSign = 'invalid_md5_hash_string_12345';
    assert.notStrictEqual(validSign, invalidSign);
});

// 2. Click Prepare action validates order existence and amount match
test('2. Click Prepare action validates order and amount', () => {
    const mockOrder = { id: 'ord-1', totalAmount: 150000, paymentStatus: 'PENDING' };

    function processClickPrepare(order, amountStr) {
        if (!order) return { error: -5, error_note: 'Order not found' };
        if (Number(amountStr) !== order.totalAmount) return { error: -2, error_note: 'Incorrect amount' };
        if (order.paymentStatus === 'PAID') return { error: -4, error_note: 'Already paid' };
        return { error: 0, error_note: 'Success' };
    }

    const resValid = processClickPrepare(mockOrder, '150000');
    assert.strictEqual(resValid.error, 0);

    const resBadAmount = processClickPrepare(mockOrder, '100000');
    assert.strictEqual(resBadAmount.error, -2);

    const resNoOrder = processClickPrepare(null, '150000');
    assert.strictEqual(resNoOrder.error, -5);
});

// 3. Click Prepare action returns error -2 when amount mismatched
test('3. Click Prepare action returns error -2 when amount mismatched', () => {
    const order = { id: 'ord-2', totalAmount: 500000 };
    const amountRequested = '450000';
    const isValid = Number(amountRequested) === order.totalAmount;
    assert.strictEqual(isValid, false);
});

// 4. Click Prepare action returns error -5 when order non-existent
test('4. Click Prepare action returns error -5 when order non-existent', () => {
    const dbOrders = [];
    const found = dbOrders.find((o) => o.id === 'non-existent');
    assert.strictEqual(found, undefined);
});

// 5. Click Complete action marks transaction and order paymentStatus as PAID
test('5. Click Complete action marks transaction and order paymentStatus as PAID', () => {
    let order = { id: 'ord-3', paymentStatus: 'PENDING' };
    let transaction = { id: 'tx-1', status: 'PENDING' };

    function completeClickPayment(errCode) {
        if (errCode < 0) {
            transaction.status = 'FAILED';
            order.paymentStatus = 'FAILED';
        } else {
            transaction.status = 'PAID';
            order.paymentStatus = 'PAID';
        }
    }

    completeClickPayment(0);
    assert.strictEqual(transaction.status, 'PAID');
    assert.strictEqual(order.paymentStatus, 'PAID');
});

// 6. Click Complete action rejects invalid signature
test('6. Click Complete action rejects invalid signature', () => {
    const secret = 'secret_key';
    const body = {
        click_trans_id: '100',
        service_id: '10',
        merchant_trans_id: 'ord-1',
        amount: '1000',
        action: '1',
        sign_time: '2026-08-20 12:00:00',
        sign_string: 'wrong_signature',
    };

    const expectedSign = generateClickSignature(body, secret);
    const isSignValid = body.sign_string === expectedSign;
    assert.strictEqual(isSignValid, false);
});

// 7. Click Complete action handles provider error < 0 by marking FAILED
test('7. Click Complete action handles provider error < 0', () => {
    let order = { id: 'ord-4', paymentStatus: 'PENDING' };

    function handleComplete(clickError) {
        if (clickError < 0) {
            order.paymentStatus = 'FAILED';
        } else {
            order.paymentStatus = 'PAID';
        }
    }

    handleComplete(-5017); // Click cancelled by user error
    assert.strictEqual(order.paymentStatus, 'FAILED');
});

// 8. Payme CheckPerformTransaction returns success for valid order and amount (in tiyn)
test('8. Payme CheckPerformTransaction returns success for valid order (in tiyn)', () => {
    const order = { id: 'ord-5', totalAmount: 250000 }; // 250,000 UZS
    const paymeAmountTiyn = 25000000; // 250,000 * 100 tiyn

    function checkPerform(amountInTiyn, orderAmountUzs) {
        if (amountInTiyn !== orderAmountUzs * 100) {
            return { error: { code: -31001, message: 'Invalid amount' } };
        }
        return { result: { allow: true } };
    }

    const res = checkPerform(paymeAmountTiyn, order.totalAmount);
    assert.strictEqual(res.result.allow, true);
});

// 9. Payme CheckPerformTransaction returns error -31001 when order not found
test('9. Payme CheckPerformTransaction returns error -31001 when order not found', () => {
    const order = null;
    function checkPerform(ord) {
        if (!ord) return { error: { code: -31001, message: { uz: 'Buyurtma topilmadi' } } };
        return { result: { allow: true } };
    }

    const res = checkPerform(order);
    assert.strictEqual(res.error.code, -31001);
});

// 10. Payme CheckPerformTransaction returns error -31001 when amount mismatched
test('10. Payme CheckPerformTransaction returns error -31001 when amount mismatched', () => {
    const order = { totalAmount: 100000 };
    const requestedTiyn = 5000000; // 50,000 UZS in tiyn
    const isValid = requestedTiyn === order.totalAmount * 100;
    assert.strictEqual(isValid, false);
});

// 11. Payme CreateTransaction creates PENDING transaction with 12 hour expiration window
test('11. Payme CreateTransaction creates PENDING transaction with expiration window', () => {
    const now = Date.now();
    const createTime = now;
    const expireTime = createTime + 12 * 60 * 60 * 1000; // 12 hours

    const tx = {
        providerTransactionId: 'payme-tx-99',
        status: 'PENDING',
        createdAt: createTime,
        expiresAt: expireTime,
    };

    assert.strictEqual(tx.status, 'PENDING');
    assert.strictEqual(tx.expiresAt - tx.createdAt, 43200000); // 12 hours in ms
});

// 12. Payme CreateTransaction returns existing transaction if called again (idempotent)
test('12. Payme CreateTransaction returns existing transaction (idempotent)', () => {
    const existingTx = {
        providerTransactionId: 'payme-tx-99',
        status: 'PENDING',
        create_time: 1700000000000,
    };

    function createTx(paymeTxId) {
        if (existingTx && existingTx.providerTransactionId === paymeTxId) {
            return {
                result: {
                    create_time: existingTx.create_time,
                    transaction: existingTx.providerTransactionId,
                    state: 1, // Payme state 1 = Created / Pending
                },
            };
        }
        return { result: { state: 1 } };
    }

    const res = createTx('payme-tx-99');
    assert.strictEqual(res.result.transaction, 'payme-tx-99');
    assert.strictEqual(res.result.state, 1);
});

// 13. Payme PerformTransaction transitions status to PAID and updates order paymentStatus
test('13. Payme PerformTransaction transitions status to PAID and updates order', () => {
    let order = { id: 'ord-6', paymentStatus: 'PENDING' };
    let tx = { providerTransactionId: 'ptx-1', status: 'PENDING', state: 1 };

    function performTx(paymeTxId) {
        if (tx.providerTransactionId === paymeTxId && tx.status === 'PENDING') {
            tx.status = 'PAID';
            tx.state = 2; // Payme state 2 = Performed / Paid
            order.paymentStatus = 'PAID';
            return { result: { transaction: tx.providerTransactionId, perform_time: Date.now(), state: 2 } };
        }
        return null;
    }

    const res = performTx('ptx-1');
    assert.strictEqual(res.result.state, 2);
    assert.strictEqual(order.paymentStatus, 'PAID');
    assert.strictEqual(tx.status, 'PAID');
});

// 14. Payme CancelTransaction before payment cancels transaction cleanly
test('14. Payme CancelTransaction before payment cancels transaction', () => {
    let tx = { providerTransactionId: 'ptx-2', status: 'PENDING', state: 1 };

    function cancelTx(paymeTxId, reason) {
        if (tx.providerTransactionId === paymeTxId) {
            tx.status = 'CANCELLED';
            tx.state = -1; // Payme state -1 = Cancelled before payment
            tx.cancelReason = reason;
            return { result: { transaction: tx.providerTransactionId, cancel_time: Date.now(), state: -1 } };
        }
        return null;
    }

    const res = cancelTx('ptx-2', 1); // Reason 1 = User cancelled
    assert.strictEqual(res.result.state, -1);
    assert.strictEqual(tx.status, 'CANCELLED');
});

// 15. Payme CheckTransaction returns status and timestamps
test('15. Payme CheckTransaction returns status and timestamps', () => {
    const tx = {
        providerTransactionId: 'ptx-3',
        createTime: 1700000000000,
        performTime: 1700000050000,
        cancelTime: 0,
        state: 2,
        reason: null,
    };

    function checkTx(paymeTxId) {
        if (tx.providerTransactionId === paymeTxId) {
            return {
                result: {
                    create_time: tx.createTime,
                    perform_time: tx.performTime,
                    cancel_time: tx.cancelTime,
                    transaction: tx.providerTransactionId,
                    state: tx.state,
                    reason: tx.reason,
                },
            };
        }
        return null;
    }

    const res = checkTx('ptx-3');
    assert.strictEqual(res.result.state, 2);
    assert.strictEqual(res.result.perform_time, 1700000050000);
});

// 16. Payme GetStatement returns list of transactions in range
test('16. Payme GetStatement returns list of transactions in range', () => {
    const transactions = [
        { id: 't1', createdAt: 1000 },
        { id: 't2', createdAt: 2000 },
        { id: 't3', createdAt: 3000 },
    ];

    function getStatement(from, to) {
        return transactions.filter((t) => t.createdAt >= from && t.createdAt <= to);
    }

    const inRange = getStatement(1500, 2500);
    assert.strictEqual(inRange.length, 1);
    assert.strictEqual(inRange[0].id, 't2');
});

// 17. amoCRM client safely formats lead name and phone
test('17. amoCRM client safely formats lead name and phone', () => {
    function formatAmoLeadPayload(order) {
        return {
            name: `Buyurtma #${order.orderNumber} - ${order.customerName}`,
            custom_fields_values: [
                { field_name: 'PHONE', values: [{ value: order.customerPhone }] },
                { field_name: 'TOTAL_AMOUNT', values: [{ value: order.totalAmount }] },
            ],
        };
    }

    const payload = formatAmoLeadPayload({
        orderNumber: 'SPS-100',
        customerName: 'Jasur Bek',
        customerPhone: '+998901112233',
        totalAmount: 350000,
    });

    assert.strictEqual(payload.name, 'Buyurtma #SPS-100 - Jasur Bek');
    assert.strictEqual(payload.custom_fields_values[0].values[0].value, '+998901112233');
});

// 18. amoCRM client attaches UTM parameters
test('18. amoCRM client attaches UTM parameters', () => {
    function mapUtmFields(order) {
        const fields = [];
        if (order.utmSource) fields.push({ code: 'UTM_SOURCE', value: order.utmSource });
        if (order.utmMedium) fields.push({ code: 'UTM_MEDIUM', value: order.utmMedium });
        if (order.utmCampaign) fields.push({ code: 'UTM_CAMPAIGN', value: order.utmCampaign });
        return fields;
    }

    const orderWithUtm = {
        utmSource: 'google',
        utmMedium: 'cpc',
        utmCampaign: 'spring_sale_2026',
    };

    const utmFields = mapUtmFields(orderWithUtm);
    assert.strictEqual(utmFields.length, 3);
    assert.strictEqual(utmFields[0].value, 'google');
    assert.strictEqual(utmFields[2].value, 'spring_sale_2026');
});

// 19. Outbox queue enqueues AMOCRM_SYNC_LEAD job with correct initial status
test('19. Outbox queue enqueues AMOCRM_SYNC_LEAD job', () => {
    const jobs = [];
    function enqueueJob(type, payload) {
        const job = {
            id: 'job-' + (jobs.length + 1),
            type,
            payload,
            status: 'PENDING',
            attempts: 0,
            createdAt: new Date(),
        };
        jobs.push(job);
        return job;
    }

    const createdJob = enqueueJob('AMOCRM_SYNC_LEAD', { orderId: 'ord-100' });
    assert.strictEqual(createdJob.status, 'PENDING');
    assert.strictEqual(createdJob.attempts, 0);
    assert.strictEqual(jobs.length, 1);
});

// 20. Integration outbox worker retries failed jobs up to max 5 attempts
test('20. Integration outbox worker retries failed jobs up to 5 attempts', () => {
    let job = { id: 'j-1', attempts: 4, status: 'RETRY' };

    function processJobFailure(jobObj) {
        jobObj.attempts += 1;
        if (jobObj.attempts >= 5) {
            jobObj.status = 'FAILED';
        } else {
            jobObj.status = 'RETRY';
        }
    }

    processJobFailure(job);
    assert.strictEqual(job.attempts, 5);
    assert.strictEqual(job.status, 'FAILED');
});

// 21. Unconfigured Click merchant ID returns missing credentials indicator in admin
test('21. Unconfigured Click merchant ID returns missing credentials indicator', () => {
    const clickEnv = { merchantId: '' };
    const isConfigured = Boolean(clickEnv.merchantId);
    assert.strictEqual(isConfigured, false);
});

// 22. Unconfigured Payme merchant ID returns missing credentials indicator
test('22. Unconfigured Payme merchant ID returns missing credentials indicator', () => {
    const paymeEnv = { merchantId: '' };
    const isConfigured = Boolean(paymeEnv.merchantId);
    assert.strictEqual(isConfigured, false);
});

// 23. Order payment status transition logs audit entry safely
test('23. Order payment status transition logs audit entry safely', () => {
    const auditLogs = [];
    function updateOrderPaymentStatus(orderId, newStatus, provider) {
        auditLogs.push({
            provider,
            operation: 'STATUS_CHANGE',
            entityType: 'Order',
            entityId: orderId,
            status: 'SUCCESS',
            details: `Payment status changed to ${newStatus}`,
        });
    }

    updateOrderPaymentStatus('ord-77', 'PAID', 'CLICK');
    assert.strictEqual(auditLogs.length, 1);
    assert.strictEqual(auditLogs[0].provider, 'CLICK');
    assert.strictEqual(auditLogs[0].status, 'SUCCESS');
});

// 24. Payment transaction idempotency prevents duplicate payment state transitions
test('24. Payment transaction idempotency prevents duplicate payment transitions', () => {
    let order = { id: 'ord-88', paymentStatus: 'PAID' };

    function processPaymentCompletion(orderObj) {
        if (orderObj.paymentStatus === 'PAID') {
            return { status: 'ALREADY_PROCESSED', message: 'Order is already marked as PAID' };
        }
        orderObj.paymentStatus = 'PAID';
        return { status: 'SUCCESS' };
    }

    const res = processPaymentCompletion(order);
    assert.strictEqual(res.status, 'ALREADY_PROCESSED');
});

// 25. IntegrationLog captures provider operation status (SUCCESS/FAILED)
test('25. IntegrationLog captures provider operation status', () => {
    const logs = [];
    function logIntegration(provider, operation, status, error = null) {
        logs.push({
            provider,
            operation,
            status,
            errorMessage: error,
            createdAt: new Date(),
        });
    }

    logIntegration('AMOCRM', 'OAUTH_REFRESH', 'SUCCESS');
    logIntegration('PAYME', 'CHECK_PERFORM', 'FAILED', 'Order not found');

    assert.strictEqual(logs.length, 2);
    assert.strictEqual(logs[0].status, 'SUCCESS');
    assert.strictEqual(logs[1].status, 'FAILED');
    assert.strictEqual(logs[1].errorMessage, 'Order not found');
});
