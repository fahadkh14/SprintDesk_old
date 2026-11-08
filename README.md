# SprintDesk

SprintDesk is a three-tier project management application (Kanban, list, timeline, calendar, analytics and reports) built as a DevOps portfolio project. Everything runs with one command through Docker Compose.

There is no login, no AI feature and no payment gateway. Every number on screen comes from MySQL through the REST API.

## Architecture

```
   Browser
      │  http://localhost:8092
      ▼
┌───────────────────────────┐
│ frontend  (Nginx :80)     │  Serves the React build.
│ React + Vite + Tailwind   │  Proxies /api and /health
└─────────────┬─────────────┘  to http://backend:5761
              │  sprintdesk-net (custom Docker network)
              ▼
┌───────────────────────────┐
│ backend  (Express :5761)  │  REST API, validation,
│ Node.js + mysql2 pool     │  error handling, /health
└─────────────┬─────────────┘
              │  mysql:3306 (not published to the host)
              ▼
┌───────────────────────────┐
│ mysql  (MySQL 8.4)        │  Schema + seed data on first start
│ volume: sprintdesk_mysql_data │
└───────────────────────────┘
```

## Technology stack

| Tier | Technology |
|------|------------|
| Frontend | React, Vite, Tailwind CSS, Axios, React Router, Recharts, Lucide icons |
| Backend | Node.js, Express, mysql2 (connection pool), dotenv, CORS |
| Database | MySQL 8.4 with SQL init and seed scripts |
| Containers | Docker, Docker Compose, multi-stage Dockerfiles, Nginx, health checks, named volume, custom network |

## Features

- **Dashboard**: total, overdue, in-progress and completed counts, plus Board, List, Timeline and Analytics views.
- **Kanban board**: drag and drop between To Do, In Progress, Review and Done. On touch screens each card has a "Move to" menu.
- **Tasks**: create, edit, delete, priority, category, assignee, start and due dates, subtasks (check off, add, remove) and comments.
- **List view**: search, filter by project, member, priority and status, sort by any column.
- **Timeline**: Gantt-style bars from start to due date, grouped by project, with a today marker.
- **Projects**: create, edit, delete, progress, detail page with its own tasks.
- **Team**: 8 members with title, email and assigned/completed counts. **My Tasks** shows one member's work.
- **Calendar**: month view of tasks by due date, with a day panel and quick add.
- **Reports**: charts, project and team summaries, CSV export of all tasks.
- **Overview, Workspace, Settings**: portfolio summary, category breakdown, personal preferences (saved in the browser) and live system status.

## Folder structure

```
SprintDesk/
├── frontend/   React app, Dockerfile, nginx.conf
├── backend/    Express API (config, controllers, routes, services, middleware)
├── database/init/   01-schema.sql, 02-seed.sql
├── docker-compose.yml
├── .env.example
└── README.md
```

## Requirements

- Docker Engine 24+ with the Compose plugin (`docker compose`)
- Free ports 8092 and 5761

## Setup

```bash
cp .env.example .env      # a ready-to-use .env is already included
# edit the passwords in .env if you wish
docker compose up -d --build
```

The first start takes a minute: MySQL initialises, loads the schema and seed data, then the backend and frontend start in order.

Useful commands:

```bash
docker compose ps            # status and health
docker compose logs -f       # follow logs
docker compose down          # stop (data is kept)
docker compose down -v       # stop and delete the database volume
```

## URLs and ports

| Service | URL | Notes |
|---------|-----|-------|
| App | http://localhost:8092 | Host 8092 → container 80 |
| API health | http://localhost:5761/health | Host 5761 → container 5761 |
| API | http://localhost:5761/api | Also available at http://localhost:8092/api |
| MySQL | `mysql:3306` | Internal only |

Inside the Docker network the backend is `http://backend:5761`.

## Environment variables (`.env`)

| Variable | Purpose | Default |
|----------|---------|---------|
| `MYSQL_ROOT_PASSWORD` | MySQL root password | change me |
| `MYSQL_DATABASE` | Database name | `sprintdesk` |
| `MYSQL_USER` / `MYSQL_PASSWORD` | Application user | `sprintdesk` / change me |
| `DB_HOST`, `DB_PORT`, `DB_POOL_SIZE` | Backend DB connection | `mysql`, `3306`, `10` |
| `CORS_ORIGIN` | Allowed origins | `*` |
| `FRONTEND_HOST_PORT`, `BACKEND_HOST_PORT` | Published host ports | `8092`, `5761` |

## API

All bodies are JSON. Errors return `{ "error": "...", "details": [...] }` with 400 (validation), 404 (not found), 409 (duplicate name) or 500.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | API and database status (503 if MySQL is down) |
| GET | `/api/projects` | Projects with task counts and progress |
| GET | `/api/projects/:id` | Project plus its tasks |
| POST / PUT / DELETE | `/api/projects[/:id]` | Create, replace, delete (tasks cascade) |
| GET | `/api/tasks` | Query: `project_id`, `status`, `priority`, `assignee_id`, `category_id`, `search`, `overdue=true`, `sort` (due_date, priority, status, title, project, created_at), `order` |
| GET | `/api/tasks/:id` | Task with subtasks and comments |
| POST / PUT / DELETE | `/api/tasks[/:id]` | Create, replace, delete |
| PATCH | `/api/tasks/:id/status` | Body `{ "status": "todo|in_progress|review|done" }` |
| GET / POST | `/api/tasks/:id/subtasks` | List or add a subtask |
| PATCH / DELETE | `/api/subtasks/:id` | Toggle `is_done` or remove |
| GET / POST | `/api/tasks/:id/comments` | List or add a comment (`body`, optional `author_id`) |
| GET | `/api/team` | Members with assigned/completed counts |
| GET | `/api/categories` | Categories with task counts |
| GET | `/api/dashboard/stats` | Headline numbers |
| GET | `/api/dashboard/analytics` | Grouped data for charts, upcoming tasks, activity |

Examples:

```bash
curl http://localhost:5761/api/dashboard/stats
curl -X PATCH -H 'Content-Type: application/json' -d '{"status":"done"}' http://localhost:5761/api/tasks/5/status
```

## Database

Tables: `team_members`, `projects`, `categories`, `tasks`, `subtasks`, `comments`.

- `tasks.project_id` → `projects` (ON DELETE CASCADE)
- `tasks.category_id`, `tasks.assignee_id` → `categories`, `team_members` (ON DELETE SET NULL)
- `subtasks.task_id`, `comments.task_id` → `tasks` (ON DELETE CASCADE)
- `comments.author_id` → `team_members` (ON DELETE SET NULL)

Seed data: 5 projects, 8 team members, 30 tasks, 40 subtasks, 20 comments, 6 categories. Seed dates are relative to the day the database is first created, so the dashboard always shows overdue, current and upcoming work.

The init scripts only run when the volume is empty. To reseed: `docker compose down -v && docker compose up -d --build`.

Open a SQL shell:

```bash
docker compose exec mysql sh -c 'mysql -uroot -p"$MYSQL_ROOT_PASSWORD" sprintdesk'
```

## Local development (without Docker)

```bash
# backend (needs a MySQL with the schema loaded)
cd backend && npm install
DB_HOST=127.0.0.1 DB_USER=sprintdesk DB_PASSWORD=... npm run dev

# frontend (proxies /api to http://localhost:5761)
cd frontend && npm install && npm run dev
```

## Verifying persistence

```bash
curl -X POST -H 'Content-Type: application/json' -d '{"name":"Persist check"}' http://localhost:5761/api/projects
docker compose restart
curl http://localhost:5761/api/projects      # "Persist check" is still there
```

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Port already in use | Change `FRONTEND_HOST_PORT` or `BACKEND_HOST_PORT` in `.env` (keep 8092 and 5761 for the documented setup). |
| Backend stays "unhealthy" | `docker compose logs backend mysql`. Usually a wrong password in `.env` after the volume was created with another one. Run `docker compose down -v` and start again. |
| Dashboard is empty | The seed only runs on an empty volume. `docker compose down -v && docker compose up -d --build`. |
| Page loads but shows "Cannot reach the SprintDesk API" | Check `docker compose ps` and `curl localhost:5761/health`. |
| Nginx 502 after recreating the backend | Nginx re-resolves `backend` every 10 seconds; wait briefly or `docker compose restart frontend`. |
