from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List
from datetime import datetime, date
from models import ProjectStatus, TaskStatus, InvoiceStatus, ExpenseCategory


# ─── Auth Schemas ──────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"


# ─── User Schemas ──────────────────────────────────────────────────────────────

class UserBase(BaseModel):
    email: str
    full_name: str
    company_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = "United States"
    currency: str = "USD"
    hourly_rate: float = 75.0
    bio: Optional[str] = None
    website: Optional[str] = None
    tax_number: Optional[str] = None
    invoice_prefix: Optional[str] = "INV"
    invoice_notes: Optional[str] = None
    payment_terms: Optional[int] = 30


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    company_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    currency: Optional[str] = None
    hourly_rate: Optional[float] = None
    bio: Optional[str] = None
    website: Optional[str] = None
    tax_number: Optional[str] = None
    invoice_prefix: Optional[str] = None
    invoice_notes: Optional[str] = None
    payment_terms: Optional[int] = None


class UserResponse(UserBase):
    id: int
    avatar_url: Optional[str] = None
    is_active: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ─── Client Schemas ────────────────────────────────────────────────────────────

class ClientBase(BaseModel):
    name: str
    company: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    industry: Optional[str] = None
    notes: Optional[str] = None
    hourly_rate: Optional[float] = None
    is_active: bool = True


class ClientCreate(ClientBase):
    pass


class ClientUpdate(BaseModel):
    name: Optional[str] = None
    company: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    industry: Optional[str] = None
    notes: Optional[str] = None
    hourly_rate: Optional[float] = None
    is_active: Optional[bool] = None


class ClientResponse(ClientBase):
    id: int
    user_id: int
    created_at: Optional[datetime] = None
    total_projects: Optional[int] = 0
    total_invoiced: Optional[float] = 0.0
    total_paid: Optional[float] = 0.0

    class Config:
        from_attributes = True


# ─── Task Schemas ──────────────────────────────────────────────────────────────

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: TaskStatus = TaskStatus.TODO
    priority: Optional[str] = "medium"
    estimated_hours: Optional[float] = None
    due_date: Optional[date] = None
    position: Optional[int] = 0


class TaskCreate(TaskBase):
    project_id: int


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[str] = None
    estimated_hours: Optional[float] = None
    due_date: Optional[date] = None
    position: Optional[int] = None


class TaskResponse(TaskBase):
    id: int
    project_id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ─── Project Schemas ───────────────────────────────────────────────────────────

class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    status: ProjectStatus = ProjectStatus.ACTIVE
    color: Optional[str] = "#4F46E5"
    budget: Optional[float] = None
    budget_type: Optional[str] = "fixed"
    hourly_rate: Optional[float] = None
    start_date: Optional[date] = None
    due_date: Optional[date] = None
    estimated_hours: Optional[float] = None
    is_billable: bool = True


class ProjectCreate(ProjectBase):
    client_id: Optional[int] = None


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[ProjectStatus] = None
    color: Optional[str] = None
    client_id: Optional[int] = None
    budget: Optional[float] = None
    budget_type: Optional[str] = None
    hourly_rate: Optional[float] = None
    start_date: Optional[date] = None
    due_date: Optional[date] = None
    estimated_hours: Optional[float] = None
    is_billable: Optional[bool] = None


class ProjectResponse(ProjectBase):
    id: int
    user_id: int
    client_id: Optional[int] = None
    client_name: Optional[str] = None
    created_at: Optional[datetime] = None
    tasks: List[TaskResponse] = []
    total_hours: Optional[float] = 0.0
    total_earnings: Optional[float] = 0.0
    completion_percentage: Optional[float] = 0.0

    class Config:
        from_attributes = True


class ProjectListResponse(ProjectBase):
    id: int
    user_id: int
    client_id: Optional[int] = None
    client_name: Optional[str] = None
    created_at: Optional[datetime] = None
    total_hours: Optional[float] = 0.0
    total_earnings: Optional[float] = 0.0
    task_count: Optional[int] = 0
    completion_percentage: Optional[float] = 0.0

    class Config:
        from_attributes = True


# ─── Time Entry Schemas ────────────────────────────────────────────────────────

class TimeEntryBase(BaseModel):
    description: Optional[str] = None
    start_time: datetime
    end_time: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    hourly_rate: Optional[float] = None
    is_billable: bool = True
    date: date


class TimeEntryCreate(TimeEntryBase):
    project_id: Optional[int] = None
    task_id: Optional[int] = None


class TimeEntryUpdate(BaseModel):
    description: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    project_id: Optional[int] = None
    task_id: Optional[int] = None
    hourly_rate: Optional[float] = None
    is_billable: Optional[bool] = None


class TimeEntryResponse(TimeEntryBase):
    id: int
    user_id: int
    project_id: Optional[int] = None
    task_id: Optional[int] = None
    project_name: Optional[str] = None
    task_title: Optional[str] = None
    earnings: Optional[float] = 0.0
    is_invoiced: bool = False
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ─── Invoice Schemas ───────────────────────────────────────────────────────────

class InvoiceItemBase(BaseModel):
    description: str
    quantity: float = 1.0
    unit_price: float = 0.0
    amount: float = 0.0


class InvoiceItemCreate(InvoiceItemBase):
    pass


class InvoiceItemResponse(InvoiceItemBase):
    id: int
    invoice_id: int

    class Config:
        from_attributes = True


class InvoiceBase(BaseModel):
    status: InvoiceStatus = InvoiceStatus.DRAFT
    issue_date: date
    due_date: date
    subtotal: float = 0.0
    tax_rate: Optional[float] = 0.0
    tax_amount: float = 0.0
    discount_amount: float = 0.0
    total: float = 0.0
    currency: str = "USD"
    notes: Optional[str] = None
    payment_terms: Optional[int] = 30


class InvoiceCreate(InvoiceBase):
    client_id: Optional[int] = None
    project_id: Optional[int] = None
    items: List[InvoiceItemCreate] = []


class InvoiceUpdate(BaseModel):
    client_id: Optional[int] = None
    project_id: Optional[int] = None
    status: Optional[InvoiceStatus] = None
    issue_date: Optional[date] = None
    due_date: Optional[date] = None
    paid_date: Optional[date] = None
    subtotal: Optional[float] = None
    tax_rate: Optional[float] = None
    tax_amount: Optional[float] = None
    discount_amount: Optional[float] = None
    total: Optional[float] = None
    currency: Optional[str] = None
    notes: Optional[str] = None
    payment_terms: Optional[int] = None
    items: Optional[List[InvoiceItemCreate]] = None


class InvoiceResponse(InvoiceBase):
    id: int
    user_id: int
    client_id: Optional[int] = None
    project_id: Optional[int] = None
    invoice_number: str
    client_name: Optional[str] = None
    project_name: Optional[str] = None
    paid_date: Optional[date] = None
    sent_at: Optional[datetime] = None
    items: List[InvoiceItemResponse] = []
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ─── Expense Schemas ───────────────────────────────────────────────────────────

class ExpenseBase(BaseModel):
    category: ExpenseCategory = ExpenseCategory.OTHER
    description: str
    amount: float
    currency: str = "USD"
    date: date
    vendor: Optional[str] = None
    is_billable: bool = False
    is_reimbursed: bool = False
    notes: Optional[str] = None


class ExpenseCreate(ExpenseBase):
    project_id: Optional[int] = None


class ExpenseUpdate(BaseModel):
    category: Optional[ExpenseCategory] = None
    description: Optional[str] = None
    amount: Optional[float] = None
    currency: Optional[str] = None
    date: Optional[date] = None
    vendor: Optional[str] = None
    project_id: Optional[int] = None
    is_billable: Optional[bool] = None
    is_reimbursed: Optional[bool] = None
    notes: Optional[str] = None


class ExpenseResponse(ExpenseBase):
    id: int
    user_id: int
    project_id: Optional[int] = None
    project_name: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ─── Dashboard Schemas ─────────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    total_revenue_this_month: float
    total_revenue_last_month: float
    revenue_change_pct: float
    total_hours_this_month: float
    total_hours_last_month: float
    hours_change_pct: float
    active_projects: int
    total_clients: int
    outstanding_invoices: float
    outstanding_count: int
    total_expenses_this_month: float
    net_income_this_month: float


class RevenueDataPoint(BaseModel):
    month: str
    revenue: float
    expenses: float
    profit: float


class ActivityItem(BaseModel):
    id: int
    type: str  # time_entry | invoice | project | expense
    description: str
    amount: Optional[float] = None
    date: str
    color: str


class DashboardResponse(BaseModel):
    stats: DashboardStats
    revenue_chart: List[RevenueDataPoint]
    recent_activity: List[ActivityItem]
    top_clients: List[dict]
    upcoming_deadlines: List[dict]


# ─── Analytics Schemas ─────────────────────────────────────────────────────────

class AnalyticsResponse(BaseModel):
    revenue_by_month: List[dict]
    revenue_by_client: List[dict]
    time_by_project: List[dict]
    expenses_by_category: List[dict]
    invoice_status_breakdown: List[dict]
    utilization_rate: float
    avg_project_value: float
    avg_hourly_rate: float
    total_revenue_ytd: float
    total_expenses_ytd: float
    net_profit_ytd: float
