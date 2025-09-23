Next steps for migration:

- Replace the server-rendered legacy HTML at `pages/app.js` with React components in `pages/index.js`.
- Move client `app.js` logic into React where appropriate.
- Add Auth0 integration using `next-auth` or Auth0 SDK when ready.
- Wire Brevo (Sendinblue) for emails in `pages/api/email.js` using server-side secrets.
