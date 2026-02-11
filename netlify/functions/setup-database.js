// netlify/functions/setup-database.js
//
// Updates the database schema to match what SparkDeck needs.
//
// What it does:
//   - Adds missing columns to existing tables (parent_folder_id on folders)
//   - Creates new tables if they don't exist (user_settings, study_sessions)
//
// Safe to run multiple times — uses IF NOT EXISTS and IF NOT EXISTS everywhere.
//
// HOW TO USE:
//   1. Make sure DATABASE_URL is set in your .env.local
//   2. Run: npx netlify dev
//   3. Visit: http://localhost:8888/.netlify/functions/setup-database

const { query } = require("./utils/db");

const SCHEMA_SQL = `
-- Add parent_folder_id to folders table if it doesn't exist yet.
-- This enables nested folders (subfolders).
-- Safe to run if column already exists — IF NOT EXISTS prevents errors.
ALTER TABLE folders ADD COLUMN IF NOT EXISTS
    parent_folder_id UUID REFERENCES folders(id) ON DELETE CASCADE;

-- Index for parent folder lookups
CREATE INDEX IF NOT EXISTS idx_folders_parent_id ON folders(parent_folder_id);

-- User settings table: per-user preferences (dark mode, font size, etc.)
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

        // Show all tables and the folders columns to verify
        const tablesResult = await query(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
        );
        const tables = tablesResult.rows.map((r) => r.table_name);

        const columnsResult = await query(
            "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'folders' ORDER BY ordinal_position"
        );
        const folderColumns = columnsResult.rows.map(
            (r) => r.column_name + " (" + r.data_type + ")"
        );

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                success: true,
                message:
                    "Database schema updated successfully!",
                tables: tables,
                folderColumns: folderColumns,
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
