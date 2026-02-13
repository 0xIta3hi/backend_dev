const { Pool } = require('pg');
const redis = require('redis');

// 1. Setup Postgres Connection
const pool = new Pool({
    connectionString: 'postgresql://postgres:1234@localhost:5432/postgres'
});

// 2. Setup Redis Connection
const redisClient = redis.createClient();

async function processOrder(order) {
    const client = await pool.connect();
    try {
        // --- THE "SAFE" LOGIC FROM DAY 2 ---
        await client.query('BEGIN');
        
        // Lock the row!
        const { rows } = await client.query('SELECT quantity FROM inventory WHERE id = 1 FOR UPDATE');
        const quantity = rows[0].quantity;

        if (quantity > 0) {
            // Simulate work (generating PDF ticket, etc.)
            // await new Promise(r => setTimeout(r, 50)); 

            await client.query('UPDATE inventory SET quantity = quantity - 1 WHERE id = 1');
            await client.query('COMMIT');
            console.log(`✅ Order processed for User ${order.userId}. Remaining: ${quantity - 1}`);
        } else {
            await client.query('ROLLBACK');
            console.log(`❌ SOLD OUT! Order failed for User ${order.userId}`);
            // TODO: In a real app, you would email the user "Sorry, refunding..."
        }
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Processing Error:', err);
    } finally {
        client.release();
    }
}

async function startWorker() {
    await redisClient.connect();
    console.log("👷 Worker started. Waiting for jobs...");

    while (true) {
        try {
            // 3. THE MAGIC: 'brPop' (Blocking Right Pop)
            // It waits forever (0 timeout) until an item appears in 'ticket_queue'
            // This is efficient. It doesn't use CPU while waiting.
            const response = await redisClient.brPop('ticket_queue', 0);
            
            // response is an object: { key: 'ticket_queue', element: '{"userId":...}' }
            const order = JSON.parse(response.element);
            
            await processOrder(order);
            
        } catch (err) {
            console.error("Worker Error:", err);
        }
    }
}

startWorker();