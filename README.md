# basic-db-viewer

A small, **strictly read-only** web viewer for PostgreSQL. Paste a `SELECT` query, press Run, and see the results in a clean, sortable table — from any machine with a browser. Nothing to install on the machine that views the data.

- SQL editor with PostgreSQL syntax highlighting (Ctrl+Enter to run)
- DataGrip-style connection dialog: host, port, database, user, password, SSL mode, CA certificate — with a **Test Connection** button
- Sortable results table, NULL highlighting, row count and query time
- Schema sidebar: browse tables and columns, click to insert into your query
- Export results as CSV
- **Writes are impossible by design** — see [Security model](#security-model)

## Quick start (Windows, recommended)

Requirements: [Docker Desktop](https://www.docker.com/products/docker-desktop/) and access to your PostgreSQL server.

1. **Create the read-only database user** (once, using DataGrip/psql as an admin):
   run [`scripts/create_readonly_user.sql`](scripts/create_readonly_user.sql) after replacing the password and database name.

2. **Create the config file** (PowerShell, inside the project folder — defaults are fine, you can set everything in the UI later):

   ```powershell
   Copy-Item .env.example .env
   ```

3. **Start it:**

   ```powershell
   docker compose up --build
   ```

4. Open **http://localhost:8000**, click the **⚙ connection** button in the header, and fill in host, port, database, user and password — just like DataGrip. Press **Test Connection**, then **OK**, and run your first `SELECT`.

Colleagues on the same network can use it too at `http://<your-machine>:8000` — their computers need nothing installed at all.

## Connecting to your database

Click the **⚙** button in the header to open the data source dialog (DataGrip-style):

| Field | Notes |
|---|---|
| Host / Port | Your PostgreSQL server (default port 5432) |
| Database | Database name |
| User / Password | Use the **read-only** user from `scripts/create_readonly_user.sql`. The password is kept in memory only — it is never saved to disk or browser storage, so you re-enter it after a page refresh. |
| SSL mode | `disable`, `allow`, `prefer` (default), `require`, `verify-ca`, `verify-full` |
| CA certificate | Path to the root/CA certificate file, needed for `verify-ca` / `verify-full` |

**Using an SSL CA certificate with Docker:** the certificate must be readable by the backend, which runs inside the container. Put the file in the project's `certs/` folder (it is mounted into the container automatically) and enter the path as `/certs/your-ca.pem` in the dialog.

**Alternative — server default:** instead of using the dialog, you can set a full connection string in `.env`; the viewer uses it whenever no connection is configured in the UI. SSL options go straight into the string:

```
DATABASE_URL=postgresql://dbviewer_readonly:pass@host:5432/db?sslmode=verify-full&sslrootcert=/certs/ca.pem
```

## Quick start (without Docker, with a virtual environment)

Requirements: [Python 3.12+](https://www.python.org/downloads/) (check "Add python.exe to PATH" during install) and [Node.js 20+](https://nodejs.org/).

Open **PowerShell** in the project folder and run:

```powershell
# 1. Build the frontend (one time, and after frontend changes)
cd frontend
npm install
npm run build
cd ..

# 2. Create and activate a virtual environment
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1     # prompt now shows (.venv)

# 3. Install dependencies into the venv
pip install -r requirements.txt

# 4. Configure and start
Copy-Item ..\.env.example .env
Copy-Item -Recurse -Force ..\frontend\dist .\static
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Then open http://localhost:8000. Next time you only need steps 2 (activation) and 4 (start):

```powershell
cd backend
.venv\Scripts\Activate.ps1
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

> If PowerShell refuses to run `Activate.ps1` ("running scripts is disabled"), run this once and try again:
> `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`

Running without Docker, the CA certificate path in the connection dialog is a normal Windows path, e.g. `C:\certs\ca.pem`.

## Security model

Read-only is enforced in **four independent layers** — any single layer alone would already block writes:

| Layer | Where | What it does |
|---|---|---|
| 1. Database role | PostgreSQL | The viewer connects as a user with only `SELECT` granted ([`scripts/create_readonly_user.sql`](scripts/create_readonly_user.sql)). PostgreSQL itself refuses any write. **Do not skip this step.** |
| 2. Read-only connection | `backend/app/db/executor.py` | Every connection is opened with `default_transaction_read_only=on`, so write statements error out at the session level. |
| 3. SQL validation | `backend/app/core/sql_guard.py` | The query is parsed; only a single `SELECT` (incl. CTEs and UNION) is accepted. Multiple statements, `INSERT`/`UPDATE`/`DELETE`/DDL, writing CTEs, `SELECT INTO`, and `FOR UPDATE` locks are rejected with a clear message. |
| 4. Guard rails | backend config | 30s statement timeout and a 5000-row cap protect the database and the browser from runaway queries. |

The database password lives only in the server's `.env` file (git-ignored) — it is never sent to the browser.

## Configuration

Set in `.env` (see `.env.example`):

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | — | PostgreSQL connection string for the **read-only** user |
| `MAX_ROWS` | `5000` | Maximum rows returned; larger results are flagged as truncated |
| `STATEMENT_TIMEOUT_MS` | `30000` | Queries running longer are cancelled by PostgreSQL |

## Architecture

```
Browser ──► FastAPI backend ──► PostgreSQL (read-only role)
            │
            ├─ api/routes.py      HTTP endpoints (/api/query, /api/schema, /api/health)
            ├─ core/sql_guard.py  read-only SQL validation (isolated, unit-tested)
            ├─ db/executor.py     read-only connections, row cap, JSON-safe values
            └─ static/            built React frontend, served by the same process
```

Frontend: React + TypeScript (Vite), CodeMirror SQL editor — all dependencies are bundled at build time (no CDN calls, works behind corporate proxies).

## Development

```bash
# Backend API with auto-reload
cd backend && pip install -r requirements-dev.txt && uvicorn app.main:app --reload

# Frontend dev server (proxies /api to localhost:8000)
cd frontend && npm install && npm run dev

# Tests
cd backend && python -m pytest
```

## Roadmap

- Chart view (pick X/Y columns → bar/line)
- Saved queries and query history
- Optional access token for shared deployments
- Multiple connections

## License

MIT
