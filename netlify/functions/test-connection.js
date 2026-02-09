// netlify/functions/test-connection.js
//
// A simple Netlify Function that tests the connection to your Neon database.
//
// HOW IT WORKS:
//   1. Your browser sends a request to /.netlify/functions/test-connection
//   2. Netlify runs THIS function on a server (not in the browser)
//   3. This function reads DATABASE_URL from your environment variables
//   4. It connects to your Neon Postgres database and runs a simple query
//   5. It sends back a success or error message
//
// WHY A SERVER FUNCTION?
//   Your database credentials (DATABASE_URL) must NEVER be in browser code.
//   Netlify Functions run on a server, so the credentials stay secret.

const { Client } = require("pg");

exports.handler = async function () {
  // Step 1: Check that DATABASE_URL exists
  if (!process.env.DATABASE_URL) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        success: false,
        error: "DATABASE_URL is not set. Check your .env.local file.",
      }),
    };
  }

  // Step 2: Try to connect to the database
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();

    // Step 3: Run a simple test query
    // This asks Postgres for the current time and version -- just to prove it works
    const result = await client.query(
      "SELECT NOW() as current_time, version() as pg_version"
    );

    const row = result.rows[0];

    // Step 4: Also check what tables exist in the database
    const tablesResult = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
    );
    const tables = tablesResult.rows.map((r) => r.table_name);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        success: true,
        message: "Connected to Neon database successfully!",
        database: {
          currentTime: row.current_time,
          postgresVersion: row.pg_version,
          tables: tables,
          tableCount: tables.length,
        },
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        success: false,
        error: error.message,
      }),
    };
  } finally {
    // Always close the connection when done
    await client.end();
  }
};
