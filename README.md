# Fly Masters Admin Portal

Standalone admin control center for the Fly Masters student website and counselor website. It uses the **same PostgreSQL database** so leads, documents, applications, chat, and HR stay in sync.

## Run

```bash
npm install
npm run dev
```

- Admin UI: http://localhost:8084
- Admin API: http://127.0.0.1:8788

Default login: `admin@local.test` / `admin123`

## Related apps

| Product | Typical URL |
|---------|-------------|
| Student website | http://localhost:8080 |
| Counselor website | http://localhost:8083 |
| Admin portal | http://localhost:8084 |

All three should point `DATABASE_URL` at `postgresql://...@127.0.0.1:5433/flymasters`.

## What admins can do

- CRM: create, assign, and convert student leads
- Review student documents and applications
- Watch counselor–student chat and AI advisor sessions
- Manage users, roles, counselors, leave, attendance, and salary
- Maintain the university catalog and document checklists
- Send notifications into both portals
