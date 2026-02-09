// imported modules
import express from 'express';
import { createClient } from 'redis';

// Global variables
const app = express();
const port = 8080;
const redisClient = createClient();
redisClient.on('error', (err) => console.log('Error conecting to redis server'))
const startServer = async () => {
    try{
        await redisClient.connect();
        console.log("RedisConnected Successfully.")
    } catch (err) {
        console.error(err)
    }
}
startServer();


import { Pool } from 'pg'
const pool = await new Pool({
    user:'postgres',
    host: 'localhost',
    database:'postgres',
    password:'1234',
    port:5432,
    max:4,
})
await pool.connect()// Hello world!

app.get('/', (req, res) => {
    const data = {
        message: 'Hello world!',
        status: "success",
        timestamp: new Date().toISOString()
    }
    res.json(data)
})

app.get('/pg_data', async (req, res) => {
    try {
        // You MUST use 'await' here, or you get [object Promise]
        const response = await pool.query('SELECT $1::text as message', ['Hello world from DB']);
        
        console.log(`Data from pg: ${response.rows[0].message}`);

        res.json({
            message: response.rows[0].message,
            status: 'success',
        });
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).json({ error: "Failed to fetch data" });
    }
});

app.post('/buy', async (req,res) => {
    const client = await pool.connect();
    try {
        const { rows } = await client.query("SELECT quantity FROM inventory WHERE id = 1")
        const available = rows[0].quantity
        if (available > 0) {
            await new Promise(r => setTimeout(r, 50));
            await client.query("update inventory SET quantity = quantity - 1 WHERE id = 1")
            res.json({message:"Ticket Purchased!", status:"successfull", remaining:available -1 })
        }
        else{
            res.send("Sold out 0 tickets remain..")
        }
    } catch (err){
        console.error(`Error in processing ticket ${err}`)
        res.send("server Error")
    }
    finally{
        client.release()
    }

app.post('/buy_safe', async (req, res) => {
    const client = await pool.connect();

    try {
        await client.query('begin');

        const { rows } = await client.query('SELECT quantity FROM inventory WHERE id = 1 FOR UPDATE');
        
        if (rows.length === 0) {
            throw new Error('Ticket not found');
        }

        const available = rows[0].quantity;

        if (available > 0) {
            await new Promise(r => setTimeout(r, 50));

            await client.query('UPDATE inventory SET quantity = quantity - 1 WHERE id = 1');
            
            await client.query('rollback');
            
            res.json({ message: 'Purchased!', remaining: available - 1 });
        } else {
            await client.query('rollback');
            res.status(400).json({ message: 'Sold out!' });
        }

    } catch (err) {
        await client.query('rollback');
        console.error('Transaction Failed:', err);
        res.status(500).send('Error');
    } finally {
        client.release();
    }
});

})

app.get('/safe', async (req,res) => {
    const safe_client = await pool.connect()
    try{
        console.log('borrowed client')
        res.send('Safe route')
    }
    catch (err){
        console.error('error occured during connection')
    }
    finally {
        safe_client.release()
        console.log('released the client back to pool!!')
    }
})

// making a faster endpoint with redis.
app.post('/buy-fast', async (req,res) =>{
    try{
        const job = {
            userId: req.body.userId,
            timestamp: Date.now(),
            requestedQty: 1,
        }
        await redisClient.lPush('ticket_queue', JSON.stringify(job))
        res.json({
            message: 'Request recieved, check email for notification',
            status: 'processing',
        });

    } catch (err){
        console.error(err)
        res.status(500).send('Queue Error')
    };
})


app.listen(port, () => {
    console.log(`Server started at ${port}`);
})

