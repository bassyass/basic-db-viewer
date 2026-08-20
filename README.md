# basic-db-viewer

A small, **strictly read-only** web viewer for PostgreSQL. Paste a `SELECT` query, press Run, and see the results in a clean, sortable table — from any machine with a browser. Nothing to install on the machine that views the data.

- SQL editor with PostgreSQL syntax highlighting (Ctrl+Enter to run)
- Sortable results table, NULL highlighting, row count and query time
- Schema sidebar: browse tables and columns, click to insert into your query
- Export results as CSV
- **Writes are impossible by design** — see [Security model](#security-model)

## Quick start (Windows, recommended)

Requirements: [Docker Desktop](https://www.docker.com/products/docker-desktop/) and access to your PostgreSQL server.

1. **Create the read-only database user** (once, using DataGrip/psql as an admin):
   run [`scripts/create_readonly_user.sql`](scripts/create_readonly_user.sql) after replacing the password and database name.

2. **Configure the connection** (PowerShell, inside the project folder):

   ```powershell
   Copy-Item .env.example .env
   notepad .env    # set DATABASE_URL to your read-only user
   ```

3. **Start it:**

   ```powershell
   docker compose up --build
   ```

4. Open **http://localhost:8000** in your browser. Done.

Colleagues on the same network can use it too at `http://<your-machine>:8000` — their computers need nothing installed at all.

## Quick start (without Docker)

Requirements: [Python 3.12+](https://www.python.org/downloads/) and [Node.js 20+](https://nodejs.org/).

```powershell
# 1. Build the frontend
cd frontend
npm install
npm run build

# 2. Run the backend (serves the frontend too)
cd ..\backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item ..\.env.example .env
notepad .env    # set DATABASE_URL
Copy-Item -Recurse ..\frontend\dist .\static
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Then open http://localhost:8000.

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
