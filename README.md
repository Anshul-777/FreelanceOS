# FreelanceOS

### The Complete Operating System for Independent Professionals

![FreelanceOS Banner](https://img.shields.io/badge/FreelanceOS-v1.0.0-4F46E5?style=for-the-badge&logo=lightning&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688?style=flat-square&logo=fastapi)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4-06B6D4?style=flat-square&logo=tailwindcss)

---

## Overview

FreelanceOS is a **full-stack business management platform** built specifically for freelancers and independent professionals. It solves the real problem of fragmented tooling — instead of juggling 5+ different apps for projects, time tracking, invoicing, expenses, and analytics, everything lives in one beautiful, connected workspace.

### The Problem It Solves

Freelancers typically use:
- Trello/Notion for projects → siloed from billing
- Toggl/Harvest for time → separate from invoices
- Excel/Wave for invoices → no connection to projects
- Mint/QuickBooks for expenses → no business context
- Separate analytics tools → no unified view

**FreelanceOS replaces all of these** with a single cohesive platform where every piece of data is connected.

---

## Features

### 📊 Dashboard
- Live KPIs: Revenue, Hours, Active Projects, Outstanding Invoices
- 6-month revenue vs expenses area chart
- Net income banner with month-over-month comparison
- Top clients by revenue with progress bars
- Upcoming deadlines with day countdown
- Recent activity feed

### 📁 Project Management
- Grid and list views
- Color-coded projects with status tracking (Lead → Active → Completed)
- Per-project budget tracking (fixed price or hourly)
- Task management with priorities and due dates
- Automatic progress calculation from task completion
- Real earnings tracking from logged time

### 👥 Client CRM
- Full contact management with company profiles
- Client detail panel with communication history
- Per-client notes system with timestamped entries
- Revenue stats per client (total invoiced, total paid)
- Industry categorization and contact info

### ⏱️ Time Tracker
- **Real-time live timer** with elapsed display
- Quick-start with project selection and description
- One-click stop → auto-saves entry to database
- Manual time logging with hour/minute fields
- Billable vs non-billable tracking
- Daily grouping with totals
- Weekly/monthly summary with project breakdown
- Earnings calculation per entry

### 🧾 Invoice Management
- Professional invoice creation with line items
- Automatic numbering with configurable prefix
- Tax rate and discount support
- Status workflow: Draft → Sent → Paid
- **PDF generation** with branded layout (ReportLab)
- Mark as Sent / Mark as Paid actions
- Outstanding and overdue amount tracking
- Full invoice preview modal

### 💰 Expense Tracking
- 9 expense categories (Software, Hardware, Travel, Office, etc.)
- Pie chart breakdown by category
- Billable expense flagging for client reimbursement
- Vendor and project association
- Monthly and YTD totals
- Year-over-year comparison

### 📈 Analytics
- Annual revenue vs expenses vs profit bar chart
- Hours tracked by month (area chart)
- Revenue by client (horizontal bar chart)
- Time allocation by project (progress bars)
- Expenses by category (donut chart)
- Invoice status breakdown (donut chart)
- KPI cards: Utilization rate, avg hourly rate, avg project value, net profit YTD

### ⚙️ Settings
- Profile management (name, bio, contact info)
- Business details (company name, hourly rate, currency, tax number)
- Invoice defaults (prefix, payment terms, default notes/bank details)
- Password change with validation

---

## Tech Stack

### Backend
| Technology     | Purpose                                     |
|----------------|---------------------------------------------|
| FastAPI        | Async REST API framework                    |
| SQLAlchemy 2.0 | ORM with SQLite (upgradeable to PostgreSQL) |
| Pydantic v2    | Request/response validation                 |
| python-jose    | JWT token creation and validation           |
| passlib/bcrypt | Secure password hashing                     |
| ReportLab      | Professional PDF invoice generation         |

### Frontend
| Technology      | Purpose                                    |
|-----------------|--------------------------------------------|
| React 18        | UI framework                               |
| TypeScript      | Type safety                                |
| Vite            | Build tool and dev server                  |
| Tailwind CSS    | Utility-first styling                      |
| Zustand         | Global state management (with persistence) |
| Axios           | HTTP client with interceptors              |
| Recharts        | Beautiful data visualization               |
| react-hot-toast | Non-intrusive notifications                |
| lucide-react    | Consistent icon system                     |
| date-fns        | Date formatting utilities                  |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        React Frontend                           │
│  ┌──────────┐ ┌─────────┐ ┌──────────┐ ┌─────────────────────┐ │
│  │  Pages   │ │   UI    │ │  Store   │ │    API Client       │ │
│  │ 8 pages  │ │Components│ │ (Zustand)│ │  (Axios + proxy)   │ │
│  └──────────┘ └─────────┘ └──────────┘ └─────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │ HTTP / REST
                    ┌─────────▼──────────┐
                    │   FastAPI Backend  │
                    │                   │
                    │  ┌─────────────┐  │
                    │  │   Routers   │  │
                    │  │  8 modules  │  │
                    │  └──────┬──────┘  │
                    │         │         │
                    │  ┌──────▼──────┐  │
                    │  │  Services   │  │
                    │  │  PDF Gen    │  │
                    │  └──────┬──────┘  │
                    │         │         │
                    │  ┌──────▼──────┐  │
                    │  │  SQLAlchemy │  │
                    │  │  + SQLite   │  │
                    │  └─────────────┘  │
                    └───────────────────┘
```

### Key Design Decisions

1. **SQLite for zero-config setup** — No database server to install. Upgradeable to PostgreSQL by changing `DATABASE_URL` in config.
2. **JWT stored in localStorage** — Simple for demo purposes. In production, use httpOnly cookies.
3. **Vite proxy to backend** — All API calls go to `/api/*` and Vite proxies them to `localhost:8000`, avoiding CORS issues in development.
4. **Zustand with persistence** — Auth token survives page refresh without re-login.
5. **ReportLab PDF** — No external PDF service required. Generates professional invoices server-side.

---

## Security Notes

- Passwords are hashed with **bcrypt** (12 rounds)
- JWT tokens expire after **30 days**
- All API endpoints require authentication except `/auth/login`
- SQLAlchemy uses parameterized queries (no SQL injection risk)
- For production: change `SECRET_KEY` in `config.py`, use PostgreSQL, enable HTTPS

---

## Extending the Project

### Adding PostgreSQL
```python
# backend/config.py
DATABASE_URL: str = "postgresql+asyncpg://user:pass@localhost/freelanceos"
```

### Adding Email (SendGrid/Resend)
- Add to `routers/invoices.py` → `mark-sent` endpoint
- Send PDF as email attachment

### Adding a Multi-Tenant Mode
- Add `workspace_id` to all models
- Filter all queries by workspace

### Deploying to Production
```bash
# Backend: Gunicorn + Uvicorn workers
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker

# Frontend: Build static files
npm run build
# Serve with nginx or Vercel
```

---

## License

MIT License — Free for personal and commercial use.

---

*Built with ❤️ as a portfolio-grade, production-ready full-stack application.*
