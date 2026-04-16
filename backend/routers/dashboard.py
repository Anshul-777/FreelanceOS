from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import date, datetime, timedelta
from database import get_db
from models import User, Project, TimeEntry, Invoice, Expense, Client, InvoiceStatus
from schemas import DashboardResponse, DashboardStats, RevenueDataPoint, ActivityItem
from auth import get_current_user
from typing import List
import calendar

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


def get_month_range(year: int, month: int):
    first_day = date(year, month, 1)
    last_day = date(year, month, calendar.monthrange(year, month)[1])
    return first_day, last_day


@router.get("", response_model=DashboardResponse)
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    today = date.today()
    this_month_start, this_month_end = get_month_range(today.year, today.month)

    # Last month
    if today.month == 1:
        last_month_start, last_month_end = get_month_range(today.year - 1, 12)
    else:
        last_month_start, last_month_end = get_month_range(today.year, today.month - 1)

    # ── Revenue this month ────────────────────────────────────────────────────
    paid_invoices_this_month = db.query(func.sum(Invoice.total)).filter(
        Invoice.user_id == current_user.id,
        Invoice.status == InvoiceStatus.PAID,
        Invoice.paid_date >= this_month_start,
        Invoice.paid_date <= this_month_end,
    ).scalar() or 0.0

    paid_invoices_last_month = db.query(func.sum(Invoice.total)).filter(
        Invoice.user_id == current_user.id,
        Invoice.status == InvoiceStatus.PAID,
        Invoice.paid_date >= last_month_start,
        Invoice.paid_date <= last_month_end,
    ).scalar() or 0.0

    revenue_change = 0.0
    if paid_invoices_last_month > 0:
        revenue_change = ((paid_invoices_this_month - paid_invoices_last_month) / paid_invoices_last_month) * 100

    # ── Hours this month ──────────────────────────────────────────────────────
    hours_this_month = db.query(func.sum(TimeEntry.duration_minutes)).filter(
        TimeEntry.user_id == current_user.id,
        TimeEntry.date >= this_month_start,
        TimeEntry.date <= this_month_end,
    ).scalar() or 0
    hours_this_month = round(hours_this_month / 60, 1)

    hours_last_month = db.query(func.sum(TimeEntry.duration_minutes)).filter(
        TimeEntry.user_id == current_user.id,
        TimeEntry.date >= last_month_start,
        TimeEntry.date <= last_month_end,
    ).scalar() or 0
    hours_last_month = round(hours_last_month / 60, 1)

    hours_change = 0.0
    if hours_last_month > 0:
        hours_change = ((hours_this_month - hours_last_month) / hours_last_month) * 100

    # ── Active projects ───────────────────────────────────────────────────────
    from models import ProjectStatus
    active_projects = db.query(func.count(Project.id)).filter(
        Project.user_id == current_user.id,
        Project.status == ProjectStatus.ACTIVE,
    ).scalar() or 0

    # ── Total clients ──────────────────────────────────────────────────────────
    total_clients = db.query(func.count(Client.id)).filter(
        Client.user_id == current_user.id,
        Client.is_active == True,
    ).scalar() or 0

    # ── Outstanding invoices ───────────────────────────────────────────────────
    outstanding = db.query(func.sum(Invoice.total)).filter(
        Invoice.user_id == current_user.id,
        Invoice.status.in_([InvoiceStatus.SENT, InvoiceStatus.VIEWED, InvoiceStatus.OVERDUE]),
    ).scalar() or 0.0

    outstanding_count = db.query(func.count(Invoice.id)).filter(
        Invoice.user_id == current_user.id,
        Invoice.status.in_([InvoiceStatus.SENT, InvoiceStatus.VIEWED, InvoiceStatus.OVERDUE]),
    ).scalar() or 0

    # ── Expenses this month ────────────────────────────────────────────────────
    expenses_this_month = db.query(func.sum(Expense.amount)).filter(
        Expense.user_id == current_user.id,
        Expense.date >= this_month_start,
        Expense.date <= this_month_end,
    ).scalar() or 0.0

    net_income = paid_invoices_this_month - expenses_this_month

    stats = DashboardStats(
        total_revenue_this_month=round(paid_invoices_this_month, 2),
        total_revenue_last_month=round(paid_invoices_last_month, 2),
        revenue_change_pct=round(revenue_change, 1),
        total_hours_this_month=hours_this_month,
        total_hours_last_month=hours_last_month,
        hours_change_pct=round(hours_change, 1),
        active_projects=active_projects,
        total_clients=total_clients,
        outstanding_invoices=round(outstanding, 2),
        outstanding_count=outstanding_count,
        total_expenses_this_month=round(expenses_this_month, 2),
        net_income_this_month=round(net_income, 2),
    )

    # ── Revenue chart (last 6 months) ──────────────────────────────────────────
    revenue_chart = []
    for i in range(5, -1, -1):
        if today.month - i <= 0:
            m = today.month - i + 12
            y = today.year - 1
        else:
            m = today.month - i
            y = today.year
        m_start, m_end = get_month_range(y, m)

        rev = db.query(func.sum(Invoice.total)).filter(
            Invoice.user_id == current_user.id,
            Invoice.status == InvoiceStatus.PAID,
            Invoice.paid_date >= m_start,
            Invoice.paid_date <= m_end,
        ).scalar() or 0.0

        exp = db.query(func.sum(Expense.amount)).filter(
            Expense.user_id == current_user.id,
            Expense.date >= m_start,
            Expense.date <= m_end,
        ).scalar() or 0.0

        month_name = date(y, m, 1).strftime("%b")
        revenue_chart.append(RevenueDataPoint(
            month=month_name,
            revenue=round(rev, 2),
            expenses=round(exp, 2),
            profit=round(rev - exp, 2),
        ))

    # ── Recent Activity ────────────────────────────────────────────────────────
    activity = []

    # Recent time entries
    recent_entries = db.query(TimeEntry).filter(
        TimeEntry.user_id == current_user.id
    ).order_by(TimeEntry.created_at.desc()).limit(5).all()

    for te in recent_entries:
        hours = round((te.duration_minutes or 0) / 60, 1)
        proj_name = te.project.name if te.project else "No project"
        activity.append(ActivityItem(
            id=te.id,
            type="time_entry",
            description=f"Logged {hours}h on {proj_name}",
            amount=(te.duration_minutes or 0) / 60 * (te.hourly_rate or 0),
            date=te.date.strftime("%b %d") if te.date else "",
            color="#4F46E5",
        ))

    # Recent invoices
    recent_invoices = db.query(Invoice).filter(
        Invoice.user_id == current_user.id
    ).order_by(Invoice.created_at.desc()).limit(5).all()

    for inv in recent_invoices:
        status_text = inv.status.value.title()
        client_name = inv.client.name if inv.client else "No client"
        activity.append(ActivityItem(
            id=inv.id,
            type="invoice",
            description=f"Invoice {inv.invoice_number} ({status_text}) - {client_name}",
            amount=inv.total,
            date=inv.issue_date.strftime("%b %d") if inv.issue_date else "",
            color="#10B981" if inv.status == InvoiceStatus.PAID else "#F59E0B",
        ))

    # Sort by date (approximate) and take top 10
    activity = activity[:10]

    # ── Top Clients ────────────────────────────────────────────────────────────
    clients = db.query(Client).filter(Client.user_id == current_user.id).all()
    top_clients = []
    for c in clients:
        total_paid = db.query(func.sum(Invoice.total)).filter(
            Invoice.client_id == c.id,
            Invoice.status == InvoiceStatus.PAID,
        ).scalar() or 0.0
        total_projects = db.query(func.count(Project.id)).filter(
            Project.client_id == c.id
        ).scalar() or 0
        top_clients.append({
            "id": c.id,
            "name": c.name,
            "company": c.company or "",
            "total_paid": round(total_paid, 2),
            "total_projects": total_projects,
        })
    top_clients.sort(key=lambda x: x["total_paid"], reverse=True)
    top_clients = top_clients[:5]

    # ── Upcoming Deadlines ─────────────────────────────────────────────────────
    from models import ProjectStatus as PS
    upcoming = db.query(Project).filter(
        Project.user_id == current_user.id,
        Project.due_date >= today,
        Project.due_date <= today + timedelta(days=30),
        Project.status.in_([PS.ACTIVE, PS.ON_HOLD]),
    ).order_by(Project.due_date.asc()).limit(5).all()

    upcoming_deadlines = []
    for p in upcoming:
        days_left = (p.due_date - today).days
        upcoming_deadlines.append({
            "id": p.id,
            "name": p.name,
            "due_date": p.due_date.strftime("%b %d, %Y"),
            "days_left": days_left,
            "status": p.status.value,
            "color": p.color or "#4F46E5",
            "client_name": p.client.name if p.client else "Personal",
        })

    return DashboardResponse(
        stats=stats,
        revenue_chart=revenue_chart,
        recent_activity=activity,
        top_clients=top_clients,
        upcoming_deadlines=upcoming_deadlines,
    )
