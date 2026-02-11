// netlify/functions/utils/db.js
// Shared database connection pool for all Netlify Functions.
//
// Uses a connection pool so that multiple requests can share connections
// instead of opening a new one every time (important for serverless).

const { Pool } = require("pg");

let pool;

function getPool() {
    if (!pool) {
        if (!process.env.DATABASE_URL) {
            throw new Error("DATABASE_URL environment variable is not set.");
        }
        pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false },
            max: 3, // Keep pool small for serverless
        });
    }
    return pool;
}

// Run a query and return the result
async function query(text, params) {
    const client = await getPool().connect();
    try {
        return await client.query(text, params);
    } finally {
        client.release();
    }
}

module.exports = { getPool, query };
