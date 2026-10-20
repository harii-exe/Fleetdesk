# Deploy FleetDesk to Vercel

This guide explains how to publish the **FleetDesk** web application (React/TypeScript frontend + Node.js/Express backend) to Vercel.

## Prerequisites
- A Vercel account (sign‑up at https://vercel.com).
- Git installed locally (`git --version`).
- Node.js LTS (Vercel provides Node 18+, but you need it locally for building). The project already uses the **agy‑node** wrapper; for Vercel we will use the regular Node runtime.
- An external MySQL/Postgres database (Vercel Postgres, PlanetScale, or any hosted MySQL) because Vercel serverless functions are stateless and cannot persist a SQLite file.

---

## 1. Prepare the Project for Vercel
### 1.1 Move static assets
Vercel automatically serves files placed in a `public/` folder at the project root.
```bash
# From the project root
rm -rf public          # ensure clean state
mkdir public
cp -r client/* public/   # copy the React build output or the raw client files
```
If you already have a built bundle (`npm run build`), copy the `dist`/`build` directory instead.

### 1.2 Convert the Express server to a Serverless Function
Vercel treats any file under the `api/` directory as a serverless function.
1. Create an `api/` folder.
2. Move the existing `server/src/app.js` into `api/index.js`.
3. Export the Express app instead of calling `app.listen`.
```js
// api/index.js
const express = require('express');
const routes = require('../server/src/routes'); // adjust path if needed
const app = express();
app.use(express.json());
app.use('/api', routes);

// Vercel will invoke the exported handler
module.exports = app;
```
All route files can stay where they are; just ensure they are required correctly.

### 1.3 Database layer – switch to MySQL/Postgres
Create a new file `server/db/mysql.js` (or `db.js` that selects the driver based on `DATABASE_URL`). Example using `mysql2`:
```js
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  uri: process.env.DATABASE_URL, // e.g. mysql://user:pass@host/db
  waitForConnections: true,
  connectionLimit: 10,
});

module.exports = pool;
```
Update your data‑access code to import this pool when `process.env.DATABASE_URL` is present; keep the SQLite implementation as a fallback for local development.

### 1.4 Add a migration script (optional)
```bash
# scripts/migrate_sqlite_to_mysql.js
```
Run it locally once you have provisioned the external DB, then push the data.

---

## 2. Add Vercel Configuration Files
### 2.1 `vercel.json`
Create a `vercel.json` at the project root:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "functions": {
    "api/**/*.js": { "runtime": "nodejs18.x" }
  }
}
```
- The rewrite ensures that SPA routes fall back to `index.html`.
- The `functions` stanza tells Vercel to use Node 18 for all API functions.

### 2.2 `package.json` scripts
Add a build script that copies the client files to `public/`:
```json
"scripts": {
  "build": "npm run client-build && cp -r client/* public/",
  "client-build": "cd client && npm install && npm run build",
  "start": "node server/src/app.js"
}
```
Vercel runs `npm run build` automatically.

---

## 3. Deploy via the Vercel UI or CLI
### 3.1 Using the Vercel Web UI (simplest)
1. Push the repository to GitHub/GitLab/Bitbucket.
2. In Vercel, click **New Project** → **Import Git Repository** → select your repo.
3. Vercel detects a Node project; keep the default **Framework Preset** = *Other*.
4. Under **Environment Variables**, add:
   - `DATABASE_URL` – the connection string of your MySQL/Postgres instance.
   - `JWT_SECRET` – a random secret for signing JWTs.
   - (Optional) any other env vars used by the app.
5. Click **Deploy**.
   - Vercel will run `npm install` then `npm run build`.
   - The `api/` folder is deployed as serverless functions.
6. After deployment completes, you get a live URL like `https://fleetdesk‑yourname.vercel.app`.

### 3.2 Using the Vercel CLI (full control)
```bash
# Install the CLI globally (once)
npm i -g vercel

# Inside the project folder
vercel login               # authenticate
vercel                     # first‑time setup – accept defaults or customise
# Add env vars (you can also do this in the dashboard)
vercel env add DATABASE_URL production
vercel env add JWT_SECRET production

# Deploy
vercel --prod
```
The CLI will prompt for the build command (use the `build` script defined above) and the output directory (`public`).

---

## 4. Verify the Deployment
1. Open the provided Vercel URL.
2. Test the login flow → the app should call `/api/auth/login`.
3. Visit a protected page (e.g., `/dashboard`).
4. Use a tool like `curl` or Postman to hit an API endpoint directly:
   ```bash
   curl https://<your‑project>.vercel.app/api/vehicles
   ```
5. Check the Vercel **Functions** logs for any runtime errors.

---

## 5. Common Pitfalls
| Issue | Cause | Fix |
|-------|-------|-----|
| `Error: SQLITE_OPEN_READWRITE` | SQLite file not found (Vercel is stateless) | Switch to MySQL/Postgres as described above. |
| `ReferenceError: process is not defined` | Trying to use `process.env.PORT` manually. Vercel provides the request object; you can ignore the `PORT` env var. |
| “Cannot find module 'express'” | Dependencies not listed in `package.json` | Ensure `express` and any other packages are in `dependencies` (not `devDependencies`). |
| 404 on SPA routes | No rewrite to `index.html`. | Verify `rewrites` in `vercel.json`. |

---

## 6. Next Steps (optional)
- **Add a custom domain** in the Vercel dashboard.
- **Enable preview deployments** for each Pull Request.
- **Set up CI/CD** with GitHub Actions that run the migration script before the first production deploy.

---

**You’re now ready to publish FleetDesk on Vercel!** Feel free to reach out if you encounter any issues during the migration or deployment.
