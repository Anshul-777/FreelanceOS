from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List, Optional
from datetime import date, timedelta
from database import get_db
from models import User, TimeEntry, Project, Task
from schemas import TimeEntryCreate, TimeEntryUpdate, TimeEntryResponse
from auth import get_current_user

router = APIRouter(prefix="/time-entries", tags=["Time Tracking"])


def enrich_entry(entry: TimeEntry) -> dict:
    hours = round((entry.duration_minutes or 0) / 60, 2)
    rate = entry.hourly_rate or 0
    earnings = round(hours * rate, 2) if entry.is_billable else 0.0
    project_name = entry.project.name if entry.project else None
    task_title = entry.task.title if entry.task else None
    return {
        "project_name": project_name,
        "task_title": task_title,
        "earnings": earnings,
    }


@router.get("", response_model=List[TimeEntryResponse])
def list_time_entries(
    project_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    is_billable: Optional[bool] = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(TimeEntry).options(
        joinedload(TimeEntry.project),
        joinedload(TimeEntry.task)
    ).filter(TimeEntry.user_id == current_user.id)

    if project_id:
        query = query.filter(TimeEntry.project_id == project_id)
    if start_date:
        query = query.filter(TimeEntry.date >= start_date)
    if end_date:
        query = query.filter(TimeEntry.date <= end_date)
    if is_billable is not None:
        query = query.filter(TimeEntry.is_billable == is_billable)

    entries = query.order_by(TimeEntry.date.desc(), TimeEntry.start_time.desc()).offset(offset).limit(limit).all()

    result = []
    for e in entries:
        enriched = enrich_entry(e)
        result.append(TimeEntryResponse(
            id=e.id,
            user_id=e.user_id,
            project_id=e.project_id,
            task_id=e.task_id,
            description=e.description,
            start_time=e.start_time,
            end_time=e.end_time,
            duration_minutes=e.duration_minutes,
            hourly_rate=e.hourly_rate,
            is_billable=e.is_billable,
            is_invoiced=e.is_invoiced,
            date=e.date,
            created_at=e.created_at,
            **enriched,
        ))
    return result


@router.post("", response_model=TimeEntryResponse, status_code=status.HTTP_201_CREATED)
def create_time_entry(
    entry_data: TimeEntryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    entry_dict = entry_data.model_dump()

    # Auto-set hourly rate from project if not provided
    if entry_dict.get("project_id") and not entry_dict.get("hourly_rate"):
        project = db.query(Project).filter(Project.id == entry_dict["project_id"]).first()
        if project:
            entry_dict["hourly_rate"] = project.hourly_rate or current_user.hourly_rate

    if not entry_dict.get("hourly_rate"):
        entry_dict["hourly_rate"] = current_user.hourly_rate

    # Auto-calculate duration if start and end provided
    if entry_dict.get("start_time") and entry_dict.get("end_time") and not entry_dict.get("duration_minutes"):
        delta = entry_dict["end_time"] - entry_dict["start_time"]
        entry_dict["duration_minutes"] = int(delta.total_seconds() / 60)

    entry = TimeEntry(user_id=current_user.id, **entry_dict)
    db.add(entry)
    db.commit()
    db.refresh(entry)

    # Load relationships
    entry = db.query(TimeEntry).options(
        joinedload(TimeEntry.project),
        joinedload(TimeEntry.task)
    ).filter(TimeEntry.id == entry.id).first()

    enriched = enrich_entry(entry)
    return TimeEntryResponse(
        id=entry.id,
        user_id=entry.user_id,
        project_id=entry.project_id,
        task_id=entry.task_id,
        description=entry.description,
        start_time=entry.start_time,
        end_time=entry.end_time,
        duration_minutes=entry.duration_minutes,
        hourly_rate=entry.hourly_rate,
        is_billable=entry.is_billable,
        is_invoiced=entry.is_invoiced,
        date=entry.date,
        created_at=entry.created_at,
        **enriched,
    )


@router.get("/summary")
def get_time_summary(
    period: str = "week",  # week | month | year
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    today = date.today()

    if period == "week":
        start = today - timedelta(days=today.weekday())
        end = start + timedelta(days=6)
    elif period == "month":
        import calendar
        start = date(today.year, today.month, 1)
        end = date(today.year, today.month, calendar.monthrange(today.year, today.month)[1])
    else:  # year
        start = date(today.year, 1, 1)
        end = date(today.year, 12, 31)

    entries = db.query(TimeEntry).options(
        joinedload(TimeEntry.project)
    ).filter(
        TimeEntry.user_id == current_user.id,
        TimeEntry.date >= start,
        TimeEntry.date <= end,
    ).all()

    total_minutes = sum(e.duration_minutes or 0 for e in entries)
    billable_minutes = sum(e.duration_minutes or 0 for e in entries if e.is_billable)
    total_earnings = sum(
        (e.duration_minutes or 0) / 60 * (e.hourly_rate or 0)
        for e in entries if e.is_billable
    )

    # Group by day
    by_day = {}
    for e in entries:
        day_str = e.date.strftime("%Y-%m-%d")
        if day_str not in by_day:
            by_day[day_str] = {"minutes": 0, "earnings": 0.0, "date": day_str}
        by_day[day_str]["minutes"] += e.duration_minutes or 0
        if e.is_billable:
            by_day[day_str]["earnings"] += (e.duration_minutes or 0) / 60 * (e.hourly_rate or 0)

    # Group by project
    by_project = {}
    for e in entries:
        proj_name = e.project.name if e.project else "No Project"
        proj_id = e.project_id or 0
        key = str(proj_id)
        if key not in by_project:
            by_project[key] = {"project_id": proj_id, "project_name": proj_name, "minutes": 0, "earnings": 0.0}
        by_project[key]["minutes"] += e.duration_minutes or 0
        if e.is_billable:
            by_project[key]["earnings"] += (e.duration_minutes or 0) / 60 * (e.hourly_rate or 0)

    return {
        "period": period,
        "start_date": start.isoformat(),
        "end_date": end.isoformat(),
        "total_minutes": total_minutes,
        "total_hours": round(total_minutes / 60, 2),
        "billable_minutes": billable_minutes,
        "billable_hours": round(billable_minutes / 60, 2),
        "total_earnings": round(total_earnings, 2),
        "by_day": list(by_day.values()),
        "by_project": list(by_project.values()),
    }


@router.get("/{entry_id}", response_model=TimeEntryResponse)
def get_time_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    entry = db.query(TimeEntry).options(
        joinedload(TimeEntry.project),
        joinedload(TimeEntry.task)
    ).filter(
        TimeEntry.id == entry_id,
        TimeEntry.user_id == current_user.id
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Time entry not found")

    enriched = enrich_entry(entry)
    return TimeEntryResponse(
        id=entry.id,
        user_id=entry.user_id,
        project_id=entry.project_id,
        task_id=entry.task_id,
        description=entry.description,
        start_time=entry.start_time,
        end_time=entry.end_time,
        duration_minutes=entry.duration_minutes,
        hourly_rate=entry.hourly_rate,
        is_billable=entry.is_billable,
        is_invoiced=entry.is_invoiced,
        date=entry.date,
        created_at=entry.created_at,
        **enriched,
    )


@router.put("/{entry_id}", response_model=TimeEntryResponse)
def update_time_entry(
    entry_id: int,
    update_data: TimeEntryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    entry = db.query(TimeEntry).filter(
        TimeEntry.id == entry_id,
        TimeEntry.user_id == current_user.id
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Time entry not found")

    for field, value in update_data.model_dump(exclude_unset=True).items():
        setattr(entry, field, value)

    # Recalculate duration if start/end changed
    if entry.start_time and entry.end_time:
        delta = entry.end_time - entry.start_time
        entry.duration_minutes = int(delta.total_seconds() / 60)

    db.commit()

    entry = db.query(TimeEntry).options(
        joinedload(TimeEntry.project),
        joinedload(TimeEntry.task)
    ).filter(TimeEntry.id == entry_id).first()

    enriched = enrich_entry(entry)
    return TimeEntryResponse(
        id=entry.id,
        user_id=entry.user_id,
        project_id=entry.project_id,
        task_id=entry.task_id,
        description=entry.description,
        start_time=entry.start_time,
        end_time=entry.end_time,
        duration_minutes=entry.duration_minutes,
        hourly_rate=entry.hourly_rate,
        is_billable=entry.is_billable,
        is_invoiced=entry.is_invoiced,
        date=entry.date,
        created_at=entry.created_at,
        **enriched,
    )


@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_time_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    entry = db.query(TimeEntry).filter(
        TimeEntry.id == entry_id,
        TimeEntry.user_id == current_user.id
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Time entry not found")
    db.delete(entry)
    db.commit()
