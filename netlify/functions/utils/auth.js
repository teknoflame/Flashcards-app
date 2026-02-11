// netlify/functions/utils/auth.js
// Verifies Firebase ID tokens using the jose library.
//
// This is a lightweight alternative to the full firebase-admin SDK.
// It fetches Google's public signing keys and verifies the JWT signature,
// issuer, audience, and expiry — exactly what firebase-admin does internally.

const { createRemoteJWKSet, jwtVerify } = require("jose");

const FIREBASE_PROJECT_ID = "sparkdeck-8d613";

// Google's public keys for Firebase token verification
const JWKS = createRemoteJWKSet(
    new URL(
        "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"
    )
);

// Verify a Firebase ID token and return the decoded payload.
// Throws an error if the token is invalid, expired, or tampered with.
async function verifyToken(idToken) {
    const { payload } = await jwtVerify(idToken, JWKS, {
        issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
        audience: FIREBASE_PROJECT_ID,
    });

    // Firebase tokens must have a non-empty subject (the user's UID)
    if (!payload.sub) {
        throw new Error("Token has no subject (uid).");
    }

    return {
        uid: payload.sub,
        email: payload.email || null,
    };
}

// Extract the Bearer token from an Authorization header.
// Returns null if the header is missing or malformed.
function extractToken(authHeader) {
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return null;
    }
    return authHeader.slice(7);
}

// Middleware-style helper: verify the request and return the user info.
// Returns { uid, email } on success, or an error response object on failure.
async function authenticateRequest(event) {
    const authHeader =
        event.headers.authorization || event.headers.Authorization;
    const idToken = extractToken(authHeader);

    if (!idToken) {
        return {
            error: true,
            statusCode: 401,
            body: { error: "Missing or invalid Authorization header." },
        };
    }

    try {
        const user = await verifyToken(idToken);
        return { error: false, user };
    } catch (err) {
        return {
            error: true,
            statusCode: 401,
            body: { error: "Invalid or expired token.", detail: err.message },
        };
    }
}

module.exports = { verifyToken, extractToken, authenticateRequest };
