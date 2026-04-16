from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from datetime import date
from database import get_db
from models import User, Invoice, Expense, TimeEntry, Project, Client, InvoiceStatus, ProjectStatus
from schemas import AnalyticsResponse
from auth import get_current_user
import calendar

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("", response_model=AnalyticsResponse)
def get_analytics(
    year: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    today = date.today()
    target_year = year or today.year

    year_start = date(target_year, 1, 1)
    year_end = date(target_year, 12, 31)

    # ── Revenue by Month ──────────────────────────────────────────────────────
    revenue_by_month = []
    for m in range(1, 13):
        m_start = date(target_year, m, 1)
        m_end = date(target_year, m, calendar.monthrange(target_year, m)[1])
        month_name = date(target_year, m, 1).strftime("%b")

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

        hours = db.query(func.sum(TimeEntry.duration_minutes)).filter(
            TimeEntry.user_id == current_user.id,
            TimeEntry.date >= m_start,
            TimeEntry.date <= m_end,
        ).scalar() or 0

        revenue_by_month.append({
            "month": month_name,
            "month_num": m,
            "revenue": round(rev, 2),
            "expenses": round(exp, 2),
            "profit": round(rev - exp, 2),
            "hours": round(hours / 60, 1),
        })

    # ── Revenue by Client ─────────────────────────────────────────────────────
    clients = db.query(Client).filter(Client.user_id == current_user.id).all()
    revenue_by_client = []
    for c in clients:
        rev = db.query(func.sum(Invoice.total)).filter(
            Invoice.client_id == c.id,
            Invoice.status == InvoiceStatus.PAID,
            Invoice.paid_date >= year_start,
            Invoice.paid_date <= year_end,
        ).scalar() or 0.0
        if rev > 0:
            revenue_by_client.append({
                "client_id": c.id,
                "client_name": c.name,
                "company": c.company or "",
                "revenue": round(rev, 2),
            })
    revenue_by_client.sort(key=lambda x: x["revenue"], reverse=True)

    # ── Time by Project ───────────────────────────────────────────────────────
    projects = db.query(Project).filter(Project.user_id == current_user.id).all()
    time_by_project = []
    for p in projects:
        mins = db.query(func.sum(TimeEntry.duration_minutes)).filter(
            TimeEntry.project_id == p.id,
            TimeEntry.date >= year_start,
            TimeEntry.date <= year_end,
        ).scalar() or 0
        if mins > 0:
            time_by_project.append({
                "project_id": p.id,
                "project_name": p.name,
                "color": p.color or "#4F46E5",
                "hours": round(mins / 60, 1),
                "minutes": mins,
            })
    time_by_project.sort(key=lambda x: x["hours"], reverse=True)

    # ── Expenses by Category ──────────────────────────────────────────────────
    from models import ExpenseCategory
    expenses_by_category = []
    for cat in ExpenseCategory:
        total = db.query(func.sum(Expense.amount)).filter(
            Expense.user_id == current_user.id,
            Expense.category == cat,
            Expense.date >= year_start,
            Expense.date <= year_end,
        ).scalar() or 0.0
        if total > 0:
            expenses_by_category.append({
                "category": cat.value,
                "label": cat.value.replace("_", " ").title(),
                "amount": round(total, 2),
            })
    expenses_by_category.sort(key=lambda x: x["amount"], reverse=True)

    # ── Invoice Status Breakdown ───────────────────────────────────────────────
    invoice_status_breakdown = []
    status_colors = {
        "draft": "#94A3B8",
        "sent": "#3B82F6",
        "viewed": "#8B5CF6",
        "paid": "#10B981",
        "overdue": "#EF4444",
        "cancelled": "#6B7280",
    }
    for inv_status in InvoiceStatus:
        count = db.query(func.count(Invoice.id)).filter(
            Invoice.user_id == current_user.id,
            Invoice.status == inv_status,
            Invoice.issue_date >= year_start,
            Invoice.issue_date <= year_end,
        ).scalar() or 0
        total_amount = db.query(func.sum(Invoice.total)).filter(
            Invoice.user_id == current_user.id,
            Invoice.status == inv_status,
            Invoice.issue_date >= year_start,
            Invoice.issue_date <= year_end,
        ).scalar() or 0.0
        if count > 0:
            invoice_status_breakdown.append({
                "status": inv_status.value,
                "label": inv_status.value.title(),
                "count": count,
                "total": round(total_amount, 2),
                "color": status_colors.get(inv_status.value, "#94A3B8"),
            })

    # ── KPI Calculations ───────────────────────────────────────────────────────
    # Utilization rate: billable hours / total hours * 100
    total_minutes = db.query(func.sum(TimeEntry.duration_minutes)).filter(
        TimeEntry.user_id == current_user.id,
        TimeEntry.date >= year_start,
        TimeEntry.date <= year_end,
    ).scalar() or 0

    billable_minutes = db.query(func.sum(TimeEntry.duration_minutes)).filter(
        TimeEntry.user_id == current_user.id,
        TimeEntry.date >= year_start,
        TimeEntry.date <= year_end,
        TimeEntry.is_billable == True,
    ).scalar() or 0

    utilization_rate = round((billable_minutes / total_minutes) * 100, 1) if total_minutes > 0 else 0.0

    # Average project value
    completed_projects = db.query(Project).filter(
        Project.user_id == current_user.id,
        Project.status == ProjectStatus.COMPLETED,
    ).all()

    avg_project_value = 0.0
    if completed_projects:
        total_project_revenue = 0.0
        for p in completed_projects:
            rev = db.query(func.sum(Invoice.total)).filter(
                Invoice.project_id == p.id,
                Invoice.status == InvoiceStatus.PAID,
            ).scalar() or 0.0
            total_project_revenue += rev
        avg_project_value = round(total_project_revenue / len(completed_projects), 2)

    # Average hourly rate (from paid time entries)
    avg_rate_result = db.query(func.avg(TimeEntry.hourly_rate)).filter(
        TimeEntry.user_id == current_user.id,
        TimeEntry.is_billable == True,
        TimeEntry.hourly_rate > 0,
        TimeEntry.date >= year_start,
        TimeEntry.date <= year_end,
    ).scalar() or 0.0

    # YTD totals
    total_revenue_ytd = db.query(func.sum(Invoice.total)).filter(
        Invoice.user_id == current_user.id,
        Invoice.status == InvoiceStatus.PAID,
        Invoice.paid_date >= year_start,
        Invoice.paid_date <= year_end,
    ).scalar() or 0.0

    total_expenses_ytd = db.query(func.sum(Expense.amount)).filter(
        Expense.user_id == current_user.id,
        Expense.date >= year_start,
        Expense.date <= year_end,
    ).scalar() or 0.0

    return AnalyticsResponse(
        revenue_by_month=revenue_by_month,
        revenue_by_client=revenue_by_client,
        time_by_project=time_by_project,
        expenses_by_category=expenses_by_category,
        invoice_status_breakdown=invoice_status_breakdown,
        utilization_rate=utilization_rate,
        avg_project_value=avg_project_value,
        avg_hourly_rate=round(avg_rate_result, 2),
        total_revenue_ytd=round(total_revenue_ytd, 2),
        total_expenses_ytd=round(total_expenses_ytd, 2),
        net_profit_ytd=round(total_revenue_ytd - total_expenses_ytd, 2),
    )
