// imported modules

import express from 'express';

// Global variables
const app = express();
const port = 8080;

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

app.get('/poison', async (req, res) => {
    const client = await pool.connect();
    console.log('borrowed client..')
    res.send("just killed one connection")
})



app.listen(port, () => {
    console.log(`Server started at ${port}`);
})

