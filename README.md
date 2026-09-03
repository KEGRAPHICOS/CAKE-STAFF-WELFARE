# CAKE STAFFS WELFARE

## Online backend

This version stores contribution data in **PostgreSQL** instead of writing changes to `data.json`.

### Local setup

1. Install Node.js.
2. Create a PostgreSQL database.
3. Set `DATABASE_URL` to the PostgreSQL connection string.
4. Set `ADMIN_USERNAME` and `ADMIN_PASSWORD`.
5. Run:

```bash
npm install
npm start
```

Then open:

```text
http://localhost:3000/admin.html
```

### First startup / migration

If the PostgreSQL database is empty and `data.json` is present, `server.js` performs a one-time migration of the existing 2026/2027/2028 contribution records into PostgreSQL.

After migration, all reads and saves use PostgreSQL. `data.json` is kept only as a local backup/seed file and is blocked from public access by the server.

### Render deployment

- Build Command: `npm install`
- Start Command: `npm start`
- Add a PostgreSQL database and set its `DATABASE_URL` environment variable on the web service.
- Set `ADMIN_USERNAME` and `ADMIN_PASSWORD` in the web service environment variables.

The frontend and backend are served from the same Render web service, so the browser uses the same origin for `/api/...` requests.
