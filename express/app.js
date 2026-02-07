// imported modules

import express from 'express';

// Global variables
const app = express();
const port = 8080;

import { Client } from 'pg'
const client = await new Client({
    user:'postgres',
    host: 'localhost',
    database:'postgres',
    password:'1234',
    port:5432
})
await client.connect()// Hello world!

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
        const response = await client.query('SELECT $1::text as message', ['Hello world from DB']);
        
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


app.listen(port, () => {
    console.log(`Server started at ${port}`);
})

