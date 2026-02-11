// netlify/functions/check-schema.js
//
// Diagnostic function that shows all columns for all SparkDeck tables.
// Visit: http://localhost:8888/.netlify/functions/check-schema

const { query } = require("./utils/db");

exports.handler = async function () {
    try {
        const result = await query(
            `SELECT table_name, column_name, data_type, is_nullable, column_default
             FROM information_schema.columns
             WHERE table_schema = 'public'
               AND table_name IN ('users', 'folders', 'decks', 'cards', 'user_settings', 'study_sessions')
             ORDER BY table_name, ordinal_position`
        );

        // Group columns by table
        const tables = {};
        for (const row of result.rows) {
            if (!tables[row.table_name]) {
                tables[row.table_name] = [];
            }
            tables[row.table_name].push(
                row.column_name +
                    " (" +
                    row.data_type +
                    (row.is_nullable === "NO" ? ", NOT NULL" : "") +
                    ")"
            );
        }

        // Also list tables that don't exist
        const expectedTables = [
            "users",
            "folders",
            "decks",
            "user_settings",
            "study_sessions",
        ];
        const missing = expectedTables.filter((t) => !tables[t]);

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(
                {
                    message: "Current database schema",
                    tables: tables,
                    missingTables: missing.length > 0 ? missing : "none",
                },
                null,
                2
            ),
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: error.message }),
        };
    }
};
