// netlify/functions/setup-database.js
//
// One-time database setup function. Creates all tables needed for SparkDeck.
// Run this once after setting up your Neon database.
//
// HOW TO USE:
//   1. Make sure DATABASE_URL is set in your .env.local
//   2. Run: npx netlify dev
//   3. Visit: http://localhost:8888/.netlify/functions/setup-database
//
// This is safe to run multiple times — it uses IF NOT EXISTS everywhere.

const { query } = require("./utils/db");

const SCHEMA_SQL = `
-- Users table: one row per authenticated user
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    firebase_uid TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Folders table: user-created folders for organizing decks
CREATE TABLE IF NOT EXISTS folders (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    parent_folder_id TEXT REFERENCES folders(id) ON DELETE SET NULL,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Decks table: flashcard decks belonging to a user
CREATE TABLE IF NOT EXISTS decks (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    category TEXT,
    visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'public', 'unlisted')),
    folder_id TEXT REFERENCES folders(id) ON DELETE SET NULL,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cards table: individual flashcards within a deck
CREATE TABLE IF NOT EXISTS cards (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    front TEXT NOT NULL,
    back TEXT NOT NULL,
    media_url TEXT,
    position INT DEFAULT 0,
    deck_id TEXT NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User settings table: per-user preferences
CREATE TABLE IF NOT EXISTS user_settings (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stats_enabled BOOLEAN DEFAULT true,
    dark_mode BOOLEAN DEFAULT false,
    font_size TEXT DEFAULT 'medium',
    high_contrast BOOLEAN DEFAULT false,
    reduced_motion BOOLEAN DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Study sessions table: records of completed study sessions
CREATE TABLE IF NOT EXISTS study_sessions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    deck_name TEXT NOT NULL,
    cards_studied INT DEFAULT 0,
    studied_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id);
CREATE INDEX IF NOT EXISTS idx_folders_parent ON folders(parent_folder_id);
CREATE INDEX IF NOT EXISTS idx_decks_user_id ON decks(user_id);
CREATE INDEX IF NOT EXISTS idx_decks_folder_id ON decks(folder_id);
CREATE INDEX IF NOT EXISTS idx_decks_visibility ON decks(visibility);
CREATE INDEX IF NOT EXISTS idx_cards_deck_id ON cards(deck_id);
CREATE INDEX IF NOT EXISTS idx_cards_position ON cards(deck_id, position);
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_id ON study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_date ON study_sessions(studied_at);
`;

exports.handler = async function () {
    try {
        await query(SCHEMA_SQL);

        // Verify tables were created
        const result = await query(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
        );
        const tables = result.rows.map((r) => r.table_name);

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                success: true,
                message: "Database schema created successfully!",
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
