from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List, Optional
from database import get_db
from models import User, Project, Task, TimeEntry, ProjectStatus, TaskStatus
from schemas import (
    ProjectCreate, ProjectUpdate, ProjectResponse, ProjectListResponse,
    TaskCreate, TaskUpdate, TaskResponse
)
from auth import get_current_user

router = APIRouter(prefix="/projects", tags=["Projects"])


def enrich_project(project: Project, db: Session) -> dict:
    """Calculate computed fields for a project."""
    total_minutes = db.query(func.sum(TimeEntry.duration_minutes)).filter(
        TimeEntry.project_id == project.id
    ).scalar() or 0
    total_hours = round(total_minutes / 60, 2)

    rate = project.hourly_rate or 95.0
    total_earnings = round(total_hours * rate, 2)

    task_count = db.query(func.count(Task.id)).filter(
        Task.project_id == project.id
    ).scalar() or 0

    done_count = db.query(func.count(Task.id)).filter(
        Task.project_id == project.id,
        Task.status == TaskStatus.DONE
    ).scalar() or 0

    completion = round((done_count / task_count) * 100, 1) if task_count > 0 else 0.0

    client_name = project.client.name if project.client else None

    return {
        "total_hours": total_hours,
        "total_earnings": total_earnings,
        "task_count": task_count,
        "completion_percentage": completion,
        "client_name": client_name,
    }


@router.get("", response_model=List[ProjectListResponse])
def list_projects(
    status_filter: Optional[str] = None,
    client_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Project).filter(
        Project.user_id == current_user.id
    ).options(joinedload(Project.client))

    if status_filter:
        try:
            ps = ProjectStatus(status_filter)
            query = query.filter(Project.status == ps)
        except ValueError:
            pass

    if client_id:
        query = query.filter(Project.client_id == client_id)

    projects = query.order_by(Project.created_at.desc()).all()

    result = []
    for p in projects:
        enriched = enrich_project(p, db)
        p_dict = {
            "id": p.id,
            "user_id": p.user_id,
            "client_id": p.client_id,
            "name": p.name,
            "description": p.description,
            "status": p.status,
            "color": p.color,
            "budget": p.budget,
            "budget_type": p.budget_type,
            "hourly_rate": p.hourly_rate,
            "start_date": p.start_date,
            "due_date": p.due_date,
            "estimated_hours": p.estimated_hours,
            "is_billable": p.is_billable,
            "created_at": p.created_at,
            **enriched,
        }
        result.append(ProjectListResponse(**p_dict))

    return result


@router.post("", response_model=ProjectListResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    project_data: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = Project(user_id=current_user.id, **project_data.model_dump())
    db.add(project)
    db.commit()
    db.refresh(project)
    enriched = enrich_project(project, db)
    return ProjectListResponse(
        id=project.id,
        user_id=project.user_id,
        client_id=project.client_id,
        name=project.name,
        description=project.description,
        status=project.status,
        color=project.color,
        budget=project.budget,
        budget_type=project.budget_type,
        hourly_rate=project.hourly_rate,
        start_date=project.start_date,
        due_date=project.due_date,
        estimated_hours=project.estimated_hours,
        is_billable=project.is_billable,
        created_at=project.created_at,
        **enriched,
    )


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).options(
        joinedload(Project.tasks),
        joinedload(Project.client)
    ).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    enriched = enrich_project(project, db)
    tasks = [TaskResponse.model_validate(t) for t in sorted(project.tasks, key=lambda x: x.position or 0)]

    return ProjectResponse(
        id=project.id,
        user_id=project.user_id,
        client_id=project.client_id,
        name=project.name,
        description=project.description,
        status=project.status,
        color=project.color,
        budget=project.budget,
        budget_type=project.budget_type,
        hourly_rate=project.hourly_rate,
        start_date=project.start_date,
        due_date=project.due_date,
        estimated_hours=project.estimated_hours,
        is_billable=project.is_billable,
        created_at=project.created_at,
        tasks=tasks,
        **enriched,
    )


@router.put("/{project_id}", response_model=ProjectListResponse)
def update_project(
    project_id: int,
    update_data: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    for field, value in update_data.model_dump(exclude_unset=True).items():
        setattr(project, field, value)

    db.commit()
    db.refresh(project)
    enriched = enrich_project(project, db)

    return ProjectListResponse(
        id=project.id,
        user_id=project.user_id,
        client_id=project.client_id,
        name=project.name,
        description=project.description,
        status=project.status,
        color=project.color,
        budget=project.budget,
        budget_type=project.budget_type,
        hourly_rate=project.hourly_rate,
        start_date=project.start_date,
        due_date=project.due_date,
        estimated_hours=project.estimated_hours,
        is_billable=project.is_billable,
        created_at=project.created_at,
        **enriched,
    )


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(project)
    db.commit()


# ─── Task Routes ──────────────────────────────────────────────────────────────

@router.get("/{project_id}/tasks", response_model=List[TaskResponse])
def list_tasks(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    tasks = db.query(Task).filter(
        Task.project_id == project_id
    ).order_by(Task.position.asc(), Task.created_at.asc()).all()

    return [TaskResponse.model_validate(t) for t in tasks]


@router.post("/{project_id}/tasks", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    project_id: int,
    task_data: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    task_dict = task_data.model_dump()
    task_dict["project_id"] = project_id
    task = Task(**task_dict)
    db.add(task)
    db.commit()
    db.refresh(task)
    return TaskResponse.model_validate(task)


@router.put("/tasks/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: int,
    update_data: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    task = db.query(Task).join(Project).filter(
        Task.id == task_id,
        Project.user_id == current_user.id
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    for field, value in update_data.model_dump(exclude_unset=True).items():
        setattr(task, field, value)

    db.commit()
    db.refresh(task)
    return TaskResponse.model_validate(task)


@router.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    task = db.query(Task).join(Project).filter(
        Task.id == task_id,
        Project.user_id == current_user.id
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()
