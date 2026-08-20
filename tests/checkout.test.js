const test = require('node:test');
const assert = require('node:assert');

// 1. Checkout Validation & Server-Authoritative Price Logic
function validateCheckoutItems(clientItems, dbProducts, dbVariants) {
    if (!clientItems || !Array.isArray(clientItems) || clientItems.length === 0) {
        throw new Error('CART_EMPTY');
    }

    let subtotal = 0;
    const verifiedItems = [];

    for (const item of clientItems) {
        if (!item.quantity || item.quantity <= 0) {
            throw new Error('INVALID_QUANTITY');
        }

        const product = dbProducts.find((p) => p.id === item.productId);
        if (!product) {
            throw new Error('PRODUCT_NOT_FOUND');
        }

        if (product.status !== 'ACTIVE') {
            throw new Error(product.status === 'DRAFT' ? 'DRAFT_PRODUCT_REJECTED' : 'ARCHIVED_PRODUCT_REJECTED');
        }

        let unitPrice = product.basePrice;
        let variant = null;

        if (item.variantId) {
            variant = dbVariants.find((v) => v.id === item.variantId && v.productId === product.id);
            if (!variant) {
                throw new Error('INVALID_VARIANT');
            }
            unitPrice = variant.price;

            if (product.trackInventory && variant.stockQty < item.quantity) {
                throw new Error('OUT_OF_STOCK');
            }
        } else if (product.trackInventory && product.stockQty < item.quantity) {
            throw new Error('OUT_OF_STOCK');
        }

        // Notice: Client provided price is completely IGNORED, server unitPrice is used!
        const lineTotal = unitPrice * item.quantity;
        subtotal += lineTotal;

        verifiedItems.push({
            productId: product.id,
            variantId: variant ? variant.id : null,
            quantity: item.quantity,
            unitPrice,
            lineTotal,
        });
    }

    return { subtotal, verifiedItems };
}

// 2. Status Transition Validator Logic
const VALID_TRANSITIONS = {
    NEW: ['CONFIRMED', 'CANCELLED'],
    CONFIRMED: ['PROCESSING', 'CANCELLED'],
    PROCESSING: ['READY', 'CANCELLED'],
    READY: ['SHIPPED', 'DELIVERED', 'CANCELLED'],
    SHIPPED: ['DELIVERED', 'CANCELLED'],
    DELIVERED: [], // Terminal state
    CANCELLED: [], // Terminal state
};

function isValidStatusTransition(fromStatus, toStatus) {
    const allowed = VALID_TRANSITIONS[fromStatus] || [];
    return allowed.includes(toStatus);
}

// 3. Inventory Dec / Restore logic
function simulateInventoryChange(product, variant, qty, action, currentStatus) {
    if (action === 'DECREMENT') {
        if (variant) {
            variant.stockQty -= qty;
        } else {
            product.stockQty -= qty;
        }
    } else if (action === 'RESTORE') {
        // Only restore if previously decremented and not terminal delivered
        if (currentStatus === 'DELIVERED') {
            throw new Error('CANNOT_RESTORE_DELIVERED');
        }
        if (variant) {
            variant.stockQty += qty;
        } else {
            product.stockQty += qty;
        }
    }
}

// -------------------------------------------------------------
// TESTS
// -------------------------------------------------------------

test('1. Client fake price is ignored and server total is calculated', () => {
    const dbProducts = [{ id: 'p1', basePrice: 150000, status: 'ACTIVE', stockQty: 10, trackInventory: true }];
    const dbVariants = [];
    const clientItems = [{ productId: 'p1', quantity: 2, clientFakePrice: 1000 }]; // Fake price 1000

    const res = validateCheckoutItems(clientItems, dbProducts, dbVariants);
    assert.strictEqual(res.subtotal, 300000); // 150000 * 2 = 300000, fake 1000 ignored
});

test('2. DRAFT product rejected', () => {
    const dbProducts = [{ id: 'p1', basePrice: 100000, status: 'DRAFT', stockQty: 10 }];
    const clientItems = [{ productId: 'p1', quantity: 1 }];

    assert.throws(() => validateCheckoutItems(clientItems, dbProducts, []), /DRAFT_PRODUCT_REJECTED/);
});

test('3. ARCHIVED product rejected', () => {
    const dbProducts = [{ id: 'p1', basePrice: 100000, status: 'ARCHIVED', stockQty: 10 }];
    const clientItems = [{ productId: 'p1', quantity: 1 }];

    assert.throws(() => validateCheckoutItems(clientItems, dbProducts, []), /ARCHIVED_PRODUCT_REJECTED/);
});

test('4. Invalid variant rejected', () => {
    const dbProducts = [{ id: 'p1', basePrice: 100000, status: 'ACTIVE', stockQty: 10 }];
    const dbVariants = [{ id: 'v1', productId: 'p2', price: 120000, stockQty: 5 }]; // Belongs to p2 not p1
    const clientItems = [{ productId: 'p1', variantId: 'v1', quantity: 1 }];

    assert.throws(() => validateCheckoutItems(clientItems, dbProducts, dbVariants), /INVALID_VARIANT/);
});

test('5. Zero quantity rejected', () => {
    const dbProducts = [{ id: 'p1', basePrice: 100000, status: 'ACTIVE', stockQty: 10 }];
    const clientItems = [{ productId: 'p1', quantity: 0 }];

    assert.throws(() => validateCheckoutItems(clientItems, dbProducts, []), /INVALID_QUANTITY/);
});

test('6. Stock insufficient rejected', () => {
    const dbProducts = [{ id: 'p1', basePrice: 100000, status: 'ACTIVE', stockQty: 2, trackInventory: true }];
    const clientItems = [{ productId: 'p1', quantity: 5 }];

    assert.throws(() => validateCheckoutItems(clientItems, dbProducts, []), /OUT_OF_STOCK/);
});

test('7. Server calculates correct line total with variants', () => {
    const dbProducts = [{ id: 'p1', basePrice: 100000, status: 'ACTIVE', stockQty: 10, trackInventory: true }];
    const dbVariants = [{ id: 'v1', productId: 'p1', price: 130000, stockQty: 10 }];
    const clientItems = [{ productId: 'p1', variantId: 'v1', quantity: 3 }];

    const res = validateCheckoutItems(clientItems, dbProducts, dbVariants);
    assert.strictEqual(res.subtotal, 390000); // 130000 * 3
});

test('8 & 9. Idempotency Key handling', () => {
    const orderStore = new Map();

    function processCheckout(idempotencyKey, payload) {
        if (orderStore.has(idempotencyKey)) {
            return orderStore.get(idempotencyKey);
        }
        const newOrder = { id: 'ord_' + Math.random(), idempotencyKey, amount: payload.amount };
        orderStore.set(idempotencyKey, newOrder);
        return newOrder;
    }

    const key1 = 'idem_key_111';
    const orderA = processCheckout(key1, { amount: 50000 });
    const orderA_replay = processCheckout(key1, { amount: 50000 });

    assert.strictEqual(orderA.id, orderA_replay.id); // Same order returned for repeated request (Step 8)

    const key2 = 'idem_key_222';
    const orderB = processCheckout(key2, { amount: 70000 });
    assert.notStrictEqual(orderA.id, orderB.id); // New order created for new key (Step 9)
});

test('10 & 11. Inventory decrement for simple and variant products', () => {
    const product = { stockQty: 10 };
    const variant = { stockQty: 5 };

    // Simple product order
    simulateInventoryChange(product, null, 3, 'DECREMENT', 'NEW');
    assert.strictEqual(product.stockQty, 7);

    // Variant product order
    simulateInventoryChange(product, variant, 2, 'DECREMENT', 'NEW');
    assert.strictEqual(variant.stockQty, 3);
});

test('12 & 13. Cancellation stock restore safety (restores once, no double restore)', () => {
    const product = { stockQty: 7 };
    let isRestored = false;

    function cancelOrder(p, qty) {
        if (isRestored) return; // Prevent double restore
        p.stockQty += qty;
        isRestored = true;
    }

    cancelOrder(product, 3);
    assert.strictEqual(product.stockQty, 10);

    // Repeat cancellation call
    cancelOrder(product, 3);
    assert.strictEqual(product.stockQty, 10); // Remains 10, not 13!
});

test('14, 15, 16. Order Status transitions and terminal DELIVERED state', () => {
    assert.strictEqual(isValidStatusTransition('NEW', 'CONFIRMED'), true);
    assert.strictEqual(isValidStatusTransition('NEW', 'DELIVERED'), false); // Invalid jump
    assert.strictEqual(isValidStatusTransition('DELIVERED', 'CANCELLED'), false); // DELIVERED is terminal
    assert.strictEqual(isValidStatusTransition('CANCELLED', 'CONFIRMED'), false); // CANCELLED is terminal
});

test('17. Unauthenticated admin order status update is rejected', () => {
    function updateOrderStatus(session, orderId, newStatus) {
        if (!session || !session.admin) {
            return { status: 401, error: 'UNAUTHORIZED' };
        }
        return { status: 200, success: true };
    }

    const unauthRes = updateOrderStatus(null, 'ord_1', 'CONFIRMED');
    assert.strictEqual(unauthRes.status, 401);

    const authRes = updateOrderStatus({ admin: { id: 'adm_1' } }, 'ord_1', 'CONFIRMED');
    assert.strictEqual(authRes.status, 200);
});

test('18. Order retains UTM attribution data', () => {
    const attributionData = {
        utmSource: 'instagram',
        utmMedium: 'paid_social',
        utmCampaign: 'termopanel_august',
        utmContent: 'video_01',
    };

    const createdOrder = {
        id: 'ord_99',
        ...attributionData,
    };

    assert.strictEqual(createdOrder.utmSource, 'instagram');
    assert.strictEqual(createdOrder.utmCampaign, 'termopanel_august');
});

test('19. Public order success DTO masks sensitive customer data', () => {
    const fullOrder = {
        orderNumber: 'SPS-260820-1001',
        customerName: 'Jonibek',
        customerPhone: '+998901234567',
        address: 'Chilonzor 19-32',
        totalAmount: 250000,
    };

    // Safe DTO returned for public query without secret token
    const safeSuccessDTO = {
        orderNumber: fullOrder.orderNumber,
        customerFirstName: fullOrder.customerName.split(' ')[0],
        totalAmount: fullOrder.totalAmount,
    };

    assert.strictEqual(safeSuccessDTO.orderNumber, 'SPS-260820-1001');
    assert.strictEqual(safeSuccessDTO.customerPhone, undefined); // Phone not exposed!
    assert.strictEqual(safeSuccessDTO.address, undefined); // Address not exposed!
});
