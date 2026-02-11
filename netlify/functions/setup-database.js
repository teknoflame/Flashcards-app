// netlify/functions/setup-database.js
//
// Creates tables that don't already exist in the Neon database.
//
// Your database already has: users, folders, decks (with JSONB cards)
// This function creates the additional tables needed for settings and stats.
//
// Safe to run multiple times — uses IF NOT EXISTS.
//
// HOW TO USE:
//   1. Make sure DATABASE_URL is set in your .env.local
//   2. Run: npx netlify dev
//   3. Visit: http://localhost:8888/.netlify/functions/setup-database

const { query } = require("./utils/db");

const SCHEMA_SQL = `
-- User settings table: per-user preferences (dark mode, font size, etc.)
-- References users(id) which is UUID in the existing schema.
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stats_enabled BOOLEAN DEFAULT true,
    dark_mode BOOLEAN DEFAULT false,
    font_size TEXT DEFAULT 'medium',
    high_contrast BOOLEAN DEFAULT false,
    reduced_motion BOOLEAN DEFAULT false,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Study sessions table: records of completed study sessions
CREATE TABLE IF NOT EXISTS study_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    deck_name TEXT NOT NULL,
    cards_studied INT DEFAULT 0,
    studied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for the new tables
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_id ON study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_date ON study_sessions(studied_at);
`;

exports.handler = async function () {
    try {
        await query(SCHEMA_SQL);

        // Show all tables to verify
        const result = await query(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
        );
        const tables = result.rows.map((r) => r.table_name);

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                success: true,
                message:
                    "Database schema updated! New tables created if they did not exist.",
                tables: tables,
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
    }
};
