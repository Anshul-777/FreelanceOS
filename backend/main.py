"""
FreelanceOS Backend — FastAPI Application Entry Point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from database import create_tables, SessionLocal
from config import settings
from routers import auth_router, dashboard, projects, clients, time_entries, invoices, expenses, analytics


@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    yield
    print("Shutting down FreelanceOS API")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="""
## FreelanceOS API

Complete backend for the FreelanceOS freelancer management platform.

### Features
- 🔐 JWT Authentication
- 👥 Client Management
- 📁 Project Tracking (with Kanban tasks)
- ⏱️ Time Tracking
- 🧾 Invoice Generation + PDF Export
- 💰 Expense Tracking
- 📊 Analytics & Reporting
- 🗂️ Dashboard with KPIs
    """,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ─── CORS ────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ─────────────────────────────────────────────────────────────────
app.include_router(auth_router.router)
app.include_router(dashboard.router)
app.include_router(projects.router)
app.include_router(clients.router)
app.include_router(time_entries.router)
app.include_router(invoices.router)
app.include_router(expenses.router)
app.include_router(analytics.router)


# ─── Root & Health ────────────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "docs": "/docs",
        "demo_email": settings.DEMO_EMAIL,
        "demo_password": settings.DEMO_PASSWORD,
    }


@app.get("/health", tags=["Health"])
def health():
    return {"status": "healthy", "version": settings.APP_VERSION}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )
