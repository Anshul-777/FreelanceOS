# 🚀 How to Run FreelanceOS

Get the full-stack app running in **under 5 minutes**.

---

## Prerequisites

| Tool     | Version  | Download                        |
|----------|----------|---------------------------------|
| Python   | 3.10+    | https://python.org              |
| Node.js  | 18+      | https://nodejs.org              |
| npm      | 9+       | Comes with Node.js              |

---

## Step 1 — Backend (FastAPI)

Open **Terminal 1** and run:

```bash
cd freelanceos/backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# macOS / Linux:
source venv/bin/activate
# Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the server
python main.py
```

✅ Backend is now running at: **http://localhost:8000**

- API Docs (Swagger): http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

> The server automatically creates the SQLite database and seeds it with realistic demo data on first run.

---

## Step 2 — Frontend (React + Vite)

Open **Terminal 2** and run:

```bash
cd freelanceos/frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

✅ Frontend is now running at: **http://localhost:5173**

---

## Step 3 — Open the App

Navigate to **http://localhost:5173** in your browser.

### Demo Login Credentials

```
Email:    demo@freelanceos.com
Password: demo123
```

The demo account is pre-loaded with:
- 5 realistic clients with notes
- 7 projects (active, completed, leads)
- 45+ time entries spanning the last 45 days
- 8 invoices (paid, sent, draft, overdue)
- 15 business expenses categorized by type
- Full dashboard analytics and charts

---

## Directory Structure

```
freelanceos/
├── backend/                  # Python FastAPI backend
│   ├── main.py               # App entry point (run this)
│   ├── models.py             # SQLAlchemy ORM models
│   ├── schemas.py            # Pydantic request/response schemas
│   ├── auth.py               # JWT authentication
│   ├── database.py           # DB connection + session
│   ├── config.py             # Settings (env vars)
│   ├── seed_data.py          # Demo data seeder
│   ├── requirements.txt      # Python dependencies
│   ├── routers/
│   │   ├── auth_router.py    # POST /auth/login, GET /auth/me
│   │   ├── dashboard.py      # GET /dashboard
│   │   ├── projects.py       # CRUD /projects + /tasks
│   │   ├── clients.py        # CRUD /clients + notes
│   │   ├── time_entries.py   # CRUD /time-entries + summary
│   │   ├── invoices.py       # CRUD /invoices + PDF + status
│   │   ├── expenses.py       # CRUD /expenses + summary
│   │   └── analytics.py      # GET /analytics (KPIs + charts)
│   └── services/
│       └── pdf_service.py    # ReportLab invoice PDF generator
│
└── frontend/                 # React + TypeScript + Vite
    ├── src/
    │   ├── App.tsx           # Router setup
    │   ├── main.tsx          # React entry
    │   ├── index.css         # Tailwind + custom CSS
    │   ├── api/index.ts      # Axios API client
    │   ├── store/index.ts    # Zustand global state
    │   ├── utils/index.ts    # Formatters + helpers
    │   ├── components/
    │   │   ├── Layout/       # Sidebar, TopBar, AppLayout
    │   │   └── UI/           # Modal, StatCard, Badge, etc.
    │   └── pages/
    │       ├── LoginPage.tsx
    │       ├── DashboardPage.tsx
    │       ├── ProjectsPage.tsx
    │       ├── ClientsPage.tsx
    │       ├── TimeTrackerPage.tsx
    │       ├── InvoicesPage.tsx
    │       ├── ExpensesPage.tsx
    │       ├── AnalyticsPage.tsx
    │       └── SettingsPage.tsx
    ├── package.json
    ├── vite.config.ts        # Vite + proxy to :8000
    ├── tailwind.config.js
    └── tsconfig.json
```

---

## API Endpoints Overview

| Method | Endpoint                         | Description                   |
|--------|----------------------------------|-------------------------------|
| POST   | `/auth/login`                    | Login → JWT token             |
| GET    | `/auth/me`                       | Get current user              |
| PUT    | `/auth/me`                       | Update profile                |
| GET    | `/dashboard`                     | Dashboard KPIs + charts       |
| GET    | `/projects`                      | List projects                 |
| POST   | `/projects`                      | Create project                |
| PUT    | `/projects/{id}`                 | Update project                |
| GET    | `/projects/{id}/tasks`           | List tasks (Kanban)           |
| POST   | `/projects/{id}/tasks`           | Create task                   |
| PUT    | `/projects/tasks/{id}`           | Update task                   |
| GET    | `/clients`                       | List clients                  |
| POST   | `/clients`                       | Create client                 |
| GET    | `/time-entries`                  | List time entries             |
| POST   | `/time-entries`                  | Log time                      |
| GET    | `/time-entries/summary`          | Weekly/monthly summary        |
| GET    | `/invoices`                      | List invoices                 |
| POST   | `/invoices`                      | Create invoice                |
| POST   | `/invoices/{id}/mark-paid`       | Mark invoice paid             |
| GET    | `/invoices/{id}/pdf`             | Download PDF                  |
| GET    | `/expenses`                      | List expenses                 |
| POST   | `/expenses`                      | Add expense                   |
| GET    | `/analytics`                     | Full analytics data           |

---

## Troubleshooting

**Port already in use:**
```bash
# Kill process on port 8000
lsof -ti:8000 | xargs kill -9
# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

**Database reset (start fresh):**
```bash
cd freelanceos/backend
rm -f freelanceos.db
python main.py  # Re-seeds automatically
```

**CORS error:**
- Make sure frontend runs on port 5173
- Backend must be on port 8000
- Both must be running simultaneously

---

## Tech Stack

| Layer     | Technology                                    |
|-----------|-----------------------------------------------|
| Backend   | FastAPI, SQLAlchemy 2, Pydantic v2, SQLite    |
| Auth      | JWT (python-jose), bcrypt (passlib)           |
| PDF       | ReportLab                                     |
| Frontend  | React 18, TypeScript, Vite                    |
| Styling   | Tailwind CSS, DM Sans + Syne fonts            |
| Charts    | Recharts                                      |
| State     | Zustand (with persistence)                    |
| API       | Axios (with interceptors)                     |
| DnD       | @dnd-kit/core                                 |
| Toasts    | react-hot-toast                               |
