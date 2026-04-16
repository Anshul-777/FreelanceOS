from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List, Optional
from datetime import date
from database import get_db
from models import User, Expense, ExpenseCategory
from schemas import ExpenseCreate, ExpenseUpdate, ExpenseResponse
from auth import get_current_user

router = APIRouter(prefix="/expenses", tags=["Expenses"])


@router.get("", response_model=List[ExpenseResponse])
def list_expenses(
    category: Optional[str] = None,
    project_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    is_billable: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Expense).options(
        joinedload(Expense.project)
    ).filter(Expense.user_id == current_user.id)

    if category:
        try:
            cat = ExpenseCategory(category)
            query = query.filter(Expense.category == cat)
        except ValueError:
            pass

    if project_id:
        query = query.filter(Expense.project_id == project_id)
    if start_date:
        query = query.filter(Expense.date >= start_date)
    if end_date:
        query = query.filter(Expense.date <= end_date)
    if is_billable is not None:
        query = query.filter(Expense.is_billable == is_billable)

    expenses = query.order_by(Expense.date.desc(), Expense.created_at.desc()).all()

    result = []
    for e in expenses:
        project_name = e.project.name if e.project else None
        result.append(ExpenseResponse(
            id=e.id,
            user_id=e.user_id,
            project_id=e.project_id,
            project_name=project_name,
            category=e.category,
            description=e.description,
            amount=e.amount,
            currency=e.currency,
            date=e.date,
            vendor=e.vendor,
            is_billable=e.is_billable,
            is_reimbursed=e.is_reimbursed,
            notes=e.notes,
            created_at=e.created_at,
        ))
    return result


@router.post("", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
def create_expense(
    expense_data: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    expense = Expense(user_id=current_user.id, **expense_data.model_dump())
    db.add(expense)
    db.commit()
    db.refresh(expense)

    expense = db.query(Expense).options(
        joinedload(Expense.project)
    ).filter(Expense.id == expense.id).first()

    project_name = expense.project.name if expense.project else None

    return ExpenseResponse(
        id=expense.id,
        user_id=expense.user_id,
        project_id=expense.project_id,
        project_name=project_name,
        category=expense.category,
        description=expense.description,
        amount=expense.amount,
        currency=expense.currency,
        date=expense.date,
        vendor=expense.vendor,
        is_billable=expense.is_billable,
        is_reimbursed=expense.is_reimbursed,
        notes=expense.notes,
        created_at=expense.created_at,
    )


@router.get("/summary")
def get_expense_summary(
    year: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from datetime import date as dt
    target_year = year or dt.today().year

    expenses = db.query(Expense).filter(
        Expense.user_id == current_user.id,
        func.strftime("%Y", Expense.date) == str(target_year)
    ).all()

    total = sum(e.amount for e in expenses)
    by_category = {}
    for e in expenses:
        cat = e.category.value
        by_category[cat] = by_category.get(cat, 0) + e.amount

    by_month = {}
    for e in expenses:
        month_key = e.date.strftime("%b")
        by_month[month_key] = by_month.get(month_key, 0) + e.amount

    return {
        "year": target_year,
        "total": round(total, 2),
        "by_category": [{"category": k, "amount": round(v, 2)} for k, v in sorted(by_category.items())],
        "by_month": [{"month": k, "amount": round(v, 2)} for k, v in by_month.items()],
        "count": len(expenses),
    }


@router.get("/{expense_id}", response_model=ExpenseResponse)
def get_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    expense = db.query(Expense).options(
        joinedload(Expense.project)
    ).filter(
        Expense.id == expense_id,
        Expense.user_id == current_user.id
    ).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    project_name = expense.project.name if expense.project else None
    return ExpenseResponse(
        id=expense.id,
        user_id=expense.user_id,
        project_id=expense.project_id,
        project_name=project_name,
        category=expense.category,
        description=expense.description,
        amount=expense.amount,
        currency=expense.currency,
        date=expense.date,
        vendor=expense.vendor,
        is_billable=expense.is_billable,
        is_reimbursed=expense.is_reimbursed,
        notes=expense.notes,
        created_at=expense.created_at,
    )


@router.put("/{expense_id}", response_model=ExpenseResponse)
def update_expense(
    expense_id: int,
    update_data: ExpenseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    expense = db.query(Expense).filter(
        Expense.id == expense_id,
        Expense.user_id == current_user.id
    ).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    for field, value in update_data.model_dump(exclude_unset=True).items():
        setattr(expense, field, value)

    db.commit()

    expense = db.query(Expense).options(
        joinedload(Expense.project)
    ).filter(Expense.id == expense_id).first()

    project_name = expense.project.name if expense.project else None
    return ExpenseResponse(
        id=expense.id,
        user_id=expense.user_id,
        project_id=expense.project_id,
        project_name=project_name,
        category=expense.category,
        description=expense.description,
        amount=expense.amount,
        currency=expense.currency,
        date=expense.date,
        vendor=expense.vendor,
        is_billable=expense.is_billable,
        is_reimbursed=expense.is_reimbursed,
        notes=expense.notes,
        created_at=expense.created_at,
    )


@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    expense = db.query(Expense).filter(
        Expense.id == expense_id,
        Expense.user_id == current_user.id
    ).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    db.delete(expense)
    db.commit()
