Quick backend for local testing (placed inside okpi-frontend for convenience).

Run:
  cd okpi-frontend
  npm install express better-sqlite3 bcryptjs jsonwebtoken cors dotenv
  node server.js --seed
  node server.js

Notes:
- Server listens on PORT (default 18080).
- Seed creates admin@example.com / manager@example.com / alice / bob (password: password).
- Endpoints emulate the real backend required by the frontend.
