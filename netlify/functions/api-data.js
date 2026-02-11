// netlify/functions/api-data.js
//
// Bulk data sync endpoint. Loads or saves ALL user data in one request.
//
// Adapted to work with the existing database schema:
//   - users: id (UUID), firebase_uid, email, display_name
//   - folders: id (UUID auto-generated), name, parent_folder_id, user_id
//   - decks: id (UUID auto-generated), title, subject, description,
//            visibility, cards (JSONB), folder_id, user_id
//   - user_settings: settings per user (created by setup-database)
//   - study_sessions: study history (created by setup-database)
//
// GET  /.netlify/functions/api-data  → Load all user data
// PUT  /.netlify/functions/api-data  → Save all user data (full replace)
//
// Headers: Authorization: Bearer <firebase-id-token>

const { query, getPool } = require("./utils/db");
const { authenticateRequest } = require("./utils/auth");

// ─── GET: Load all user data ───────────────────────────────────────────

async function loadUserData(dbUserId) {
    // Load folders
    const foldersResult = await query(
        `SELECT id, name, parent_folder_id, created_at
         FROM folders WHERE user_id = $1 ORDER BY name`,
        [dbUserId]
    );

    // Load decks (cards are JSONB inside the decks table)
    const decksResult = await query(
        `SELECT id, title, subject, description, visibility, folder_id, cards, created_at
         FROM decks WHERE user_id = $1 ORDER BY created_at`,
        [dbUserId]
    );

    // Load settings
    const settingsResult = await query(
        `SELECT stats_enabled, dark_mode, font_size, high_contrast, reduced_motion
         FROM user_settings WHERE user_id = $1`,
        [dbUserId]
    );

    // Load study sessions
    const statsResult = await query(
        `SELECT deck_name, cards_studied, studied_at
         FROM study_sessions WHERE user_id = $1 ORDER BY studied_at`,
        [dbUserId]
    );

    // Format data to match the frontend's expected shape.
    // The frontend uses: name/category/folderId (camelCase)
    // The database uses: title/subject/folder_id (different names)

    const folders = foldersResult.rows.map((f) => ({
        id: f.id, // UUID string — frontend uses this as-is
        name: f.name,
        parentFolderId: f.parent_folder_id || null,
        created: f.created_at.toISOString(),
    }));

    const decks = decksResult.rows.map((d) => ({
        name: d.title, // DB "title" → frontend "name"
        category: d.subject || "", // DB "subject" → frontend "category"
        visibility: d.visibility || "private",
        folderId: d.folder_id || null, // UUID string, matches folder IDs
        cards: d.cards || [], // JSONB parsed automatically by pg
        created: d.created_at.toISOString(),
    }));

    const settingsRow = settingsResult.rows[0];
    const settings = settingsRow
        ? {
              statsEnabled: settingsRow.stats_enabled,
              darkMode: settingsRow.dark_mode,
              fontSize: settingsRow.font_size,
              highContrast: settingsRow.high_contrast,
              reducedMotion: settingsRow.reduced_motion,
          }
        : {
              statsEnabled: true,
              darkMode: false,
              fontSize: "medium",
              highContrast: false,
              reducedMotion: false,
          };

    const studySessions = statsResult.rows.map((s) => ({
        timestamp: s.studied_at.toISOString(),
        deckName: s.deck_name,
        cardsStudied: s.cards_studied,
    }));

    return {
        folders,
        decks,
        settings,
        stats: { studySessions },
    };
}

// ─── PUT: Save all user data (full replace within a transaction) ────────

async function saveUserData(dbUserId, data) {
    const client = await getPool().connect();

    try {
        await client.query("BEGIN");

        // 1. Delete existing data (order matters for foreign keys)
        //    study_sessions and user_settings don't depend on decks/folders
        await client.query("DELETE FROM study_sessions WHERE user_id = $1", [
            dbUserId,
        ]);
        await client.query("DELETE FROM decks WHERE user_id = $1", [dbUserId]);
        await client.query("DELETE FROM folders WHERE user_id = $1", [
            dbUserId,
        ]);

        // 2. Insert folders — DB generates UUID IDs, we map client IDs to new UUIDs
        const folderIdMap = new Map();

        if (data.folders && data.folders.length > 0) {
            // Sort so parent folders are inserted before children
            const sorted = sortFoldersForInsert(data.folders);

            for (const folder of sorted) {
                // Map parent ID: use the new UUID if parent was already inserted
                const parentId = folder.parentFolderId
                    ? folderIdMap.get(folder.parentFolderId) || null
                    : null;

                const result = await client.query(
                    `INSERT INTO folders (user_id, name, parent_folder_id, created_at)
                     VALUES ($1, $2, $3, $4)
                     RETURNING id`,
                    [
                        dbUserId,
                        folder.name,
                        parentId,
                        folder.created || new Date().toISOString(),
                    ]
                );

                // Map the client's folder ID to the new DB-generated UUID
                folderIdMap.set(folder.id, result.rows[0].id);
            }
        }

        // 3. Insert decks with JSONB cards
        if (data.decks && data.decks.length > 0) {
            for (const deck of data.decks) {
                // Map folder ID from client ID to DB UUID
                const folderId = deck.folderId
                    ? folderIdMap.get(deck.folderId) || null
                    : null;

                await client.query(
                    `INSERT INTO decks (user_id, folder_id, title, subject, visibility, cards, created_at)
                     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                    [
                        dbUserId,
                        folderId,
                        deck.name, // Frontend "name" → DB "title"
                        deck.category || null, // Frontend "category" → DB "subject"
                        deck.visibility || "private",
                        JSON.stringify(deck.cards || []),
                        deck.created || new Date().toISOString(),
                    ]
                );
            }
        }

        // 4. Upsert settings
        if (data.settings) {
            await client.query(
                `INSERT INTO user_settings (user_id, stats_enabled, dark_mode, font_size, high_contrast, reduced_motion, updated_at)
                 VALUES ($1, $2, $3, $4, $5, $6, NOW())
                 ON CONFLICT (user_id) DO UPDATE SET
                     stats_enabled = EXCLUDED.stats_enabled,
                     dark_mode = EXCLUDED.dark_mode,
                     font_size = EXCLUDED.font_size,
                     high_contrast = EXCLUDED.high_contrast,
                     reduced_motion = EXCLUDED.reduced_motion,
                     updated_at = NOW()`,
                [
                    dbUserId,
                    data.settings.statsEnabled !== false,
                    data.settings.darkMode === true,
                    data.settings.fontSize || "medium",
                    data.settings.highContrast === true,
                    data.settings.reducedMotion === true,
                ]
            );
        }

        // 5. Insert study sessions
        if (
            data.stats &&
            data.stats.studySessions &&
            data.stats.studySessions.length > 0
        ) {
            for (const session of data.stats.studySessions) {
                await client.query(
                    `INSERT INTO study_sessions (user_id, deck_name, cards_studied, studied_at)
                     VALUES ($1, $2, $3, $4)`,
                    [
                        dbUserId,
                        session.deckName || "Unknown",
                        session.cardsStudied || 0,
                        session.timestamp || new Date().toISOString(),
                    ]
                );
            }
        }

        await client.query("COMMIT");
        return { success: true };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

// Sort folders so parents come before children (topological sort).
// This ensures parent_folder_id references are valid when inserting.
function sortFoldersForInsert(folders) {
    const sorted = [];
    const remaining = [...folders];
    const insertedIds = new Set();

    // Safety limit to prevent infinite loops from circular references
    let maxIterations = folders.length * folders.length;
    let iterations = 0;

    while (remaining.length > 0 && iterations < maxIterations) {
        iterations++;
        for (let i = remaining.length - 1; i >= 0; i--) {
            const folder = remaining[i];
            if (
                !folder.parentFolderId ||
                insertedIds.has(folder.parentFolderId)
            ) {
                sorted.push(folder);
                insertedIds.add(folder.id);
                remaining.splice(i, 1);
            }
        }
    }

    // If any remain (orphaned references), insert with no parent
    for (const folder of remaining) {
        folder.parentFolderId = null;
        sorted.push(folder);
    }

    return sorted;
}

// ─── Handler ────────────────────────────────────────────────────────────

exports.handler = async function (event) {
    // Verify Firebase token
    const authResult = await authenticateRequest(event);
    if (authResult.error) {
        return {
            statusCode: authResult.statusCode,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(authResult.body),
        };
    }

    const { uid } = authResult.user;

    // Look up the database user ID from the Firebase UID
    const userResult = await query(
        "SELECT id FROM users WHERE firebase_uid = $1",
        [uid]
    );

    if (userResult.rows.length === 0) {
        return {
            statusCode: 404,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                error: "User not found. Call api-user first.",
            }),
        };
    }

    const dbUserId = userResult.rows[0].id;

    try {
        if (event.httpMethod === "GET") {
            const data = await loadUserData(dbUserId);
            return {
                statusCode: 200,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            };
        }

        if (event.httpMethod === "PUT") {
            const data = JSON.parse(event.body);
            await saveUserData(dbUserId, data);
            return {
                statusCode: 200,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ success: true }),
            };
        }

        return {
            statusCode: 405,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: "Method not allowed" }),
        };
    } catch (error) {
        console.error("api-data error:", error);
        return {
            statusCode: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                error: "Server error.",
                message: error.message,
                detail: error.stack ? error.stack.split("\n").slice(0, 3).join(" | ") : "",
            }),
        };
    }
};
