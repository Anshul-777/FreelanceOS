"""
Seed demo data into the database for immediate demonstration.
Run automatically when the app starts if no users exist.
"""
from datetime import date, datetime, timedelta
from sqlalchemy.orm import Session
from models import (
    User, Client, Project, Task, TimeEntry, Invoice,
    InvoiceItem, Expense, Note,
    ProjectStatus, TaskStatus, InvoiceStatus, ExpenseCategory
)
from auth import get_password_hash
from config import settings
import random


def seed_database(db: Session):
    """Seed the database with demo data if empty."""
    existing_user = db.query(User).first()
    if existing_user:
        return  # Already seeded

    print("Seeding demo data...")

    # ─── Create Demo User ────────────────────────────────────────────────────
    user = User(
        email=settings.DEMO_EMAIL,
        hashed_password=get_password_hash(settings.DEMO_PASSWORD),
        full_name=settings.DEMO_NAME,
        company_name=settings.DEMO_COMPANY,
        phone="+1 (555) 234-5678",
        address="123 Creative Ave, Suite 400",
        city="San Francisco",
        country="United States",
        currency="USD",
        hourly_rate=settings.DEMO_HOURLY_RATE,
        bio="Full-stack developer and UI/UX designer with 8+ years of experience building digital products for startups and enterprises.",
        website="https://alexjohnson.dev",
        tax_number="EIN: 12-3456789",
        invoice_prefix="AJD",
        invoice_notes="Payment is due within 30 days. Late payments are subject to a 1.5% monthly interest charge.\n\nBank: Chase Bank\nAccount: 1234567890\nRouting: 021000021",
        payment_terms=30,
    )
    db.add(user)
    db.flush()

    # ─── Create Clients ──────────────────────────────────────────────────────
    clients_data = [
        {
            "name": "Sarah Mitchell",
            "company": "Nexus Digital Agency",
            "email": "sarah@nexusdigital.com",
            "phone": "+1 (415) 555-0101",
            "website": "https://nexusdigital.com",
            "address": "450 Market St",
            "city": "San Francisco",
            "country": "United States",
            "industry": "Digital Marketing",
            "notes": "Long-term client. Prefers weekly status updates via Slack.",
            "hourly_rate": 110.0,
        },
        {
            "name": "Marcus Chen",
            "company": "TechVault Inc.",
            "email": "marcus@techvault.io",
            "phone": "+1 (650) 555-0202",
            "website": "https://techvault.io",
            "address": "1000 Innovation Dr",
            "city": "Palo Alto",
            "country": "United States",
            "industry": "SaaS / Technology",
            "notes": "Startup client. Fast-paced environment, frequently changes requirements.",
            "hourly_rate": 120.0,
        },
        {
            "name": "Elena Rodriguez",
            "company": "Bloom & Co.",
            "email": "elena@bloomco.com",
            "phone": "+1 (310) 555-0303",
            "website": "https://bloomco.com",
            "address": "789 Sunset Blvd",
            "city": "Los Angeles",
            "country": "United States",
            "industry": "Fashion & Retail",
            "notes": "Seasonal projects. Budget-conscious but values quality.",
            "hourly_rate": 90.0,
        },
        {
            "name": "James Whitfield",
            "company": "Meridian Real Estate",
            "email": "james@meridianre.com",
            "phone": "+1 (212) 555-0404",
            "website": "https://meridianre.com",
            "address": "55 Water Street",
            "city": "New York",
            "country": "United States",
            "industry": "Real Estate",
            "notes": "Referred by TechVault. Very professional, pays promptly.",
            "hourly_rate": 100.0,
        },
        {
            "name": "Priya Sharma",
            "company": "GreenLeaf Foundation",
            "email": "priya@greenleaf.org",
            "phone": "+1 (720) 555-0505",
            "website": "https://greenleaf.org",
            "address": "200 Pearl St",
            "city": "Denver",
            "country": "United States",
            "industry": "Non-profit",
            "notes": "Non-profit client. Discounted rate applied. Great communication.",
            "hourly_rate": 75.0,
        },
    ]

    clients = []
    for cd in clients_data:
        client = Client(user_id=user.id, **cd)
        db.add(client)
        clients.append(client)
    db.flush()

    # ─── Notes for Clients ───────────────────────────────────────────────────
    notes_data = [
        (0, "Met at Web Summit 2023. Wants to build new brand identity."),
        (0, "Discussed Q1 2024 budget: $45,000 allocated for digital projects."),
        (1, "Intro call went well. Looking for a React specialist for their platform rebuild."),
        (2, "E-commerce redesign project starting next month. Needs Shopify expertise."),
        (3, "Website redesign + CRM integration needed. Tight deadline - March 15."),
        (4, "Grant-funded project. Work within $20k total budget."),
    ]
    for ci, content in notes_data:
        note = Note(client_id=clients[ci].id, content=content)
        db.add(note)

    # ─── Create Projects ─────────────────────────────────────────────────────
    today = date.today()
    projects_data = [
        {
            "client_idx": 0,
            "name": "Nexus Brand Redesign",
            "description": "Complete brand identity overhaul including logo redesign, brand guidelines, and new website.",
            "status": ProjectStatus.ACTIVE,
            "color": "#4F46E5",
            "budget": 18500.0,
            "budget_type": "fixed",
            "hourly_rate": 110.0,
            "start_date": today - timedelta(days=45),
            "due_date": today + timedelta(days=30),
            "estimated_hours": 168.0,
            "is_billable": True,
        },
        {
            "client_idx": 1,
            "name": "TechVault Platform v2.0",
            "description": "Complete rebuild of the SaaS dashboard using React 18, TypeScript, and new API layer.",
            "status": ProjectStatus.ACTIVE,
            "color": "#0EA5E9",
            "budget": None,
            "budget_type": "hourly",
            "hourly_rate": 120.0,
            "start_date": today - timedelta(days=30),
            "due_date": today + timedelta(days=60),
            "estimated_hours": 240.0,
            "is_billable": True,
        },
        {
            "client_idx": 2,
            "name": "Bloom E-Commerce Redesign",
            "description": "Shopify store redesign with custom theme development and UX improvements.",
            "status": ProjectStatus.COMPLETED,
            "color": "#EC4899",
            "budget": 12000.0,
            "budget_type": "fixed",
            "hourly_rate": 90.0,
            "start_date": today - timedelta(days=90),
            "due_date": today - timedelta(days=15),
            "estimated_hours": 133.0,
            "is_billable": True,
        },
        {
            "client_idx": 3,
            "name": "Meridian Property Portal",
            "description": "Real estate listing portal with advanced search, virtual tours, and agent dashboard.",
            "status": ProjectStatus.ACTIVE,
            "color": "#F59E0B",
            "budget": 25000.0,
            "budget_type": "fixed",
            "hourly_rate": 100.0,
            "start_date": today - timedelta(days=20),
            "due_date": today + timedelta(days=75),
            "estimated_hours": 250.0,
            "is_billable": True,
        },
        {
            "client_idx": 4,
            "name": "GreenLeaf Website & CMS",
            "description": "New nonprofit website with custom CMS, donation portal, and volunteer management system.",
            "status": ProjectStatus.ON_HOLD,
            "color": "#10B981",
            "budget": 9500.0,
            "budget_type": "fixed",
            "hourly_rate": 75.0,
            "start_date": today - timedelta(days=60),
            "due_date": today + timedelta(days=20),
            "estimated_hours": 126.0,
            "is_billable": True,
        },
        {
            "client_idx": 0,
            "name": "Nexus Social Media Kit",
            "description": "Social media templates, animated content, and brand assets for all major platforms.",
            "status": ProjectStatus.LEAD,
            "color": "#8B5CF6",
            "budget": 4500.0,
            "budget_type": "fixed",
            "hourly_rate": 110.0,
            "start_date": today + timedelta(days=15),
            "due_date": today + timedelta(days=45),
            "estimated_hours": 41.0,
            "is_billable": True,
        },
        {
            "client_idx": 1,
            "name": "Mobile App (iOS/Android)",
            "description": "React Native companion app for TechVault platform.",
            "status": ProjectStatus.LEAD,
            "color": "#06B6D4",
            "budget": None,
            "budget_type": "hourly",
            "hourly_rate": 120.0,
            "start_date": today + timedelta(days=30),
            "due_date": today + timedelta(days=120),
            "estimated_hours": 320.0,
            "is_billable": True,
        },
    ]

    projects = []
    for pd in projects_data:
        ci = pd.pop("client_idx")
        project = Project(user_id=user.id, client_id=clients[ci].id, **pd)
        db.add(project)
        projects.append(project)
    db.flush()

    # ─── Create Tasks ────────────────────────────────────────────────────────
    tasks_data = [
        # Project 0: Nexus Brand Redesign
        {"project_idx": 0, "title": "Initial discovery & brand audit", "status": TaskStatus.DONE, "priority": "high", "estimated_hours": 8.0, "position": 0},
        {"project_idx": 0, "title": "Competitor analysis & mood boards", "status": TaskStatus.DONE, "priority": "high", "estimated_hours": 12.0, "position": 1},
        {"project_idx": 0, "title": "Logo concept development (3 directions)", "status": TaskStatus.DONE, "priority": "high", "estimated_hours": 20.0, "position": 2},
        {"project_idx": 0, "title": "Client presentation - Round 1", "status": TaskStatus.DONE, "priority": "high", "estimated_hours": 4.0, "position": 3},
        {"project_idx": 0, "title": "Logo refinement based on feedback", "status": TaskStatus.IN_PROGRESS, "priority": "high", "estimated_hours": 16.0, "position": 4},
        {"project_idx": 0, "title": "Brand guidelines document", "status": TaskStatus.TODO, "priority": "medium", "estimated_hours": 24.0, "position": 5},
        {"project_idx": 0, "title": "Website wireframes & prototypes", "status": TaskStatus.TODO, "priority": "medium", "estimated_hours": 32.0, "position": 6},
        {"project_idx": 0, "title": "Website development (5 pages)", "status": TaskStatus.TODO, "priority": "medium", "estimated_hours": 40.0, "position": 7},
        {"project_idx": 0, "title": "Final review & delivery", "status": TaskStatus.TODO, "priority": "low", "estimated_hours": 8.0, "position": 8},

        # Project 1: TechVault Platform v2.0
        {"project_idx": 1, "title": "Technical architecture planning", "status": TaskStatus.DONE, "priority": "high", "estimated_hours": 16.0, "position": 0},
        {"project_idx": 1, "title": "Design system & component library", "status": TaskStatus.DONE, "priority": "high", "estimated_hours": 40.0, "position": 1},
        {"project_idx": 1, "title": "Authentication & user management", "status": TaskStatus.IN_PROGRESS, "priority": "high", "estimated_hours": 24.0, "position": 2},
        {"project_idx": 1, "title": "Dashboard & analytics module", "status": TaskStatus.IN_PROGRESS, "priority": "high", "estimated_hours": 40.0, "position": 3},
        {"project_idx": 1, "title": "API integration & data layer", "status": TaskStatus.REVIEW, "priority": "high", "estimated_hours": 32.0, "position": 4},
        {"project_idx": 1, "title": "Settings & billing pages", "status": TaskStatus.TODO, "priority": "medium", "estimated_hours": 24.0, "position": 5},
        {"project_idx": 1, "title": "Mobile responsiveness", "status": TaskStatus.TODO, "priority": "medium", "estimated_hours": 16.0, "position": 6},
        {"project_idx": 1, "title": "Testing & QA", "status": TaskStatus.TODO, "priority": "medium", "estimated_hours": 24.0, "position": 7},

        # Project 2: Bloom E-Commerce (completed)
        {"project_idx": 2, "title": "UX audit & research", "status": TaskStatus.DONE, "priority": "high", "estimated_hours": 16.0, "position": 0},
        {"project_idx": 2, "title": "Custom Shopify theme development", "status": TaskStatus.DONE, "priority": "high", "estimated_hours": 60.0, "position": 1},
        {"project_idx": 2, "title": "Product page optimization", "status": TaskStatus.DONE, "priority": "medium", "estimated_hours": 24.0, "position": 2},
        {"project_idx": 2, "title": "Checkout flow redesign", "status": TaskStatus.DONE, "priority": "high", "estimated_hours": 20.0, "position": 3},
        {"project_idx": 2, "title": "Launch & post-launch fixes", "status": TaskStatus.DONE, "priority": "medium", "estimated_hours": 8.0, "position": 4},

        # Project 3: Meridian Property Portal
        {"project_idx": 3, "title": "Requirements gathering & SOW", "status": TaskStatus.DONE, "priority": "high", "estimated_hours": 8.0, "position": 0},
        {"project_idx": 3, "title": "Database schema & API design", "status": TaskStatus.IN_PROGRESS, "priority": "high", "estimated_hours": 20.0, "position": 1},
        {"project_idx": 3, "title": "Property listing pages (search + filters)", "status": TaskStatus.TODO, "priority": "high", "estimated_hours": 40.0, "position": 2},
        {"project_idx": 3, "title": "Interactive map integration", "status": TaskStatus.TODO, "priority": "medium", "estimated_hours": 24.0, "position": 3},
        {"project_idx": 3, "title": "Agent dashboard & CRM features", "status": TaskStatus.TODO, "priority": "medium", "estimated_hours": 48.0, "position": 4},
    ]

    for td in tasks_data:
        pi = td.pop("project_idx")
        task = Task(project_id=projects[pi].id, **td)
        db.add(task)
    db.flush()

    # ─── Create Time Entries ─────────────────────────────────────────────────
    time_entries_data = []
    # Generate 45 days of time entries
    for days_ago in range(0, 45):
        entry_date = today - timedelta(days=days_ago)
        # Skip weekends sometimes
        if entry_date.weekday() >= 5 and random.random() < 0.7:
            continue

        # 1-3 entries per day
        num_entries = random.randint(1, 3)
        for _ in range(num_entries):
            project_idx = random.randint(0, 3)
            project = projects[project_idx]
            duration = random.randint(45, 240)  # 45 mins to 4 hours
            descriptions = [
                "Working on UI components and responsive layouts",
                "Code review and bug fixes",
                "Client feedback implementation",
                "Design iteration and mockups",
                "API integration and testing",
                "Documentation and cleanup",
                "Research and prototyping",
                "Team sync and planning",
                "Performance optimization",
                "Feature development",
            ]
            start = datetime.combine(entry_date, datetime.min.time()).replace(
                hour=random.randint(8, 17)
            )
            end = start + timedelta(minutes=duration)
            rate = project.hourly_rate or 95.0
            time_entries_data.append({
                "project_idx": project_idx,
                "description": random.choice(descriptions),
                "start_time": start,
                "end_time": end,
                "duration_minutes": duration,
                "hourly_rate": rate,
                "is_billable": True,
                "date": entry_date,
            })

    for ted in time_entries_data:
        pi = ted.pop("project_idx")
        te = TimeEntry(
            user_id=user.id,
            project_id=projects[pi].id,
            **ted
        )
        db.add(te)
    db.flush()

    # ─── Create Invoices ─────────────────────────────────────────────────────
    invoice_counter = 1

    invoices_data = [
        {
            "client_idx": 2,
            "project_idx": 2,
            "status": InvoiceStatus.PAID,
            "issue_date": today - timedelta(days=75),
            "due_date": today - timedelta(days=45),
            "paid_date": today - timedelta(days=50),
            "subtotal": 6000.0,
            "tax_rate": 8.0,
            "items": [
                {"description": "UX Audit & Research (16 hrs @ $90)", "quantity": 1, "unit_price": 1440.0},
                {"description": "Custom Shopify Theme Development (50 hrs @ $90)", "quantity": 1, "unit_price": 4500.0},
                {"description": "Project Management & Communication", "quantity": 1, "unit_price": 60.0},
            ],
        },
        {
            "client_idx": 2,
            "project_idx": 2,
            "status": InvoiceStatus.PAID,
            "issue_date": today - timedelta(days=45),
            "due_date": today - timedelta(days=15),
            "paid_date": today - timedelta(days=20),
            "subtotal": 5760.0,
            "tax_rate": 8.0,
            "items": [
                {"description": "Checkout Flow Redesign (20 hrs @ $90)", "quantity": 1, "unit_price": 1800.0},
                {"description": "Product Page Optimization (24 hrs @ $90)", "quantity": 1, "unit_price": 2160.0},
                {"description": "Launch Support & Post-Launch Fixes (8 hrs @ $90)", "quantity": 1, "unit_price": 720.0},
                {"description": "Testing & QA (12 hrs @ $90)", "quantity": 1, "unit_price": 1080.0},
            ],
        },
        {
            "client_idx": 0,
            "project_idx": 0,
            "status": InvoiceStatus.PAID,
            "issue_date": today - timedelta(days=60),
            "due_date": today - timedelta(days=30),
            "paid_date": today - timedelta(days=35),
            "subtotal": 5500.0,
            "tax_rate": 0.0,
            "items": [
                {"description": "Discovery & Brand Audit (8 hrs @ $110)", "quantity": 1, "unit_price": 880.0},
                {"description": "Competitor Analysis & Mood Boards (12 hrs @ $110)", "quantity": 1, "unit_price": 1320.0},
                {"description": "Logo Concept Development (20 hrs @ $110)", "quantity": 1, "unit_price": 2200.0},
                {"description": "Client Presentation Preparation", "quantity": 1, "unit_price": 1100.0},
            ],
        },
        {
            "client_idx": 1,
            "project_idx": 1,
            "status": InvoiceStatus.SENT,
            "issue_date": today - timedelta(days=25),
            "due_date": today + timedelta(days=5),
            "paid_date": None,
            "subtotal": 8640.0,
            "tax_rate": 0.0,
            "items": [
                {"description": "Technical Architecture Planning (16 hrs @ $120)", "quantity": 1, "unit_price": 1920.0},
                {"description": "Design System & Component Library (40 hrs @ $120)", "quantity": 1, "unit_price": 4800.0},
                {"description": "Authentication Module - Phase 1 (16 hrs @ $120)", "quantity": 1, "unit_price": 1920.0},
            ],
        },
        {
            "client_idx": 3,
            "project_idx": 3,
            "status": InvoiceStatus.SENT,
            "issue_date": today - timedelta(days=15),
            "due_date": today + timedelta(days=15),
            "paid_date": None,
            "subtotal": 3800.0,
            "tax_rate": 0.0,
            "items": [
                {"description": "Requirements Gathering & SOW (8 hrs @ $100)", "quantity": 1, "unit_price": 800.0},
                {"description": "Database Schema & API Design - Phase 1 (20 hrs @ $100)", "quantity": 1, "unit_price": 2000.0},
                {"description": "Project Setup & Infrastructure", "quantity": 1, "unit_price": 1000.0},
            ],
        },
        {
            "client_idx": 0,
            "project_idx": 0,
            "status": InvoiceStatus.DRAFT,
            "issue_date": today,
            "due_date": today + timedelta(days=30),
            "paid_date": None,
            "subtotal": 7040.0,
            "tax_rate": 0.0,
            "items": [
                {"description": "Logo Refinement & Revisions (16 hrs @ $110)", "quantity": 1, "unit_price": 1760.0},
                {"description": "Brand Guidelines Document (24 hrs @ $110)", "quantity": 1, "unit_price": 2640.0},
                {"description": "Website Wireframes & Prototypes (24 hrs @ $110)", "quantity": 1, "unit_price": 2640.0},
            ],
        },
        {
            "client_idx": 4,
            "project_idx": 4,
            "status": InvoiceStatus.OVERDUE,
            "issue_date": today - timedelta(days=45),
            "due_date": today - timedelta(days=15),
            "paid_date": None,
            "subtotal": 3750.0,
            "tax_rate": 0.0,
            "items": [
                {"description": "UX Research & Information Architecture (20 hrs @ $75)", "quantity": 1, "unit_price": 1500.0},
                {"description": "Website Design & Prototyping (30 hrs @ $75)", "quantity": 1, "unit_price": 2250.0},
            ],
        },
        {
            "client_idx": 1,
            "project_idx": 1,
            "status": InvoiceStatus.PAID,
            "issue_date": today - timedelta(days=90),
            "due_date": today - timedelta(days=60),
            "paid_date": today - timedelta(days=63),
            "subtotal": 3600.0,
            "tax_rate": 0.0,
            "items": [
                {"description": "Initial Project Kickoff & Planning (30 hrs @ $120)", "quantity": 1, "unit_price": 3600.0},
            ],
        },
    ]

    for inv_data in invoices_data:
        ci = inv_data.pop("client_idx")
        pi = inv_data.pop("project_idx")
        items_data = inv_data.pop("items")
        tax_rate = inv_data.get("tax_rate", 0.0)
        subtotal = inv_data["subtotal"]
        tax_amount = subtotal * (tax_rate / 100) if tax_rate else 0.0
        total = subtotal + tax_amount

        invoice = Invoice(
            user_id=user.id,
            client_id=clients[ci].id,
            project_id=projects[pi].id,
            invoice_number=f"AJD-{str(invoice_counter).zfill(4)}",
            tax_amount=tax_amount,
            total=total,
            currency="USD",
            notes=user.invoice_notes,
            payment_terms=30,
            **inv_data,
        )
        db.add(invoice)
        db.flush()

        for item_data in items_data:
            item = InvoiceItem(
                invoice_id=invoice.id,
                amount=item_data["unit_price"] * item_data["quantity"],
                **item_data,
            )
            db.add(item)

        invoice_counter += 1

    # ─── Create Expenses ─────────────────────────────────────────────────────
    expenses_data = [
        {"category": ExpenseCategory.SOFTWARE, "description": "Adobe Creative Cloud", "amount": 54.99, "date": today - timedelta(days=5), "vendor": "Adobe Inc.", "is_billable": False},
        {"category": ExpenseCategory.SOFTWARE, "description": "Figma Professional Plan", "amount": 15.00, "date": today - timedelta(days=5), "vendor": "Figma Inc.", "is_billable": False},
        {"category": ExpenseCategory.SOFTWARE, "description": "Linear (Project Management)", "amount": 8.00, "date": today - timedelta(days=5), "vendor": "Linear", "is_billable": False},
        {"category": ExpenseCategory.SOFTWARE, "description": "GitHub Pro", "amount": 4.00, "date": today - timedelta(days=5), "vendor": "GitHub Inc.", "is_billable": False},
        {"category": ExpenseCategory.SOFTWARE, "description": "Vercel Pro Plan", "amount": 20.00, "date": today - timedelta(days=5), "vendor": "Vercel Inc.", "is_billable": True},
        {"category": ExpenseCategory.HARDWARE, "description": "USB-C Hub for MacBook", "amount": 89.99, "date": today - timedelta(days=12), "vendor": "Amazon", "is_billable": False},
        {"category": ExpenseCategory.TRAVEL, "description": "Flight to SF Tech Conference", "amount": 385.00, "date": today - timedelta(days=20), "vendor": "United Airlines", "is_billable": False},
        {"category": ExpenseCategory.TRAVEL, "description": "Conference hotel (2 nights)", "amount": 420.00, "date": today - timedelta(days=18), "vendor": "Marriott", "is_billable": False},
        {"category": ExpenseCategory.OFFICE, "description": "WeWork Day Pass x4", "amount": 120.00, "date": today - timedelta(days=15), "vendor": "WeWork", "is_billable": False},
        {"category": ExpenseCategory.OFFICE, "description": "Office supplies & stationery", "amount": 67.45, "date": today - timedelta(days=22), "vendor": "Staples", "is_billable": False},
        {"category": ExpenseCategory.EDUCATION, "description": "Advanced React Patterns Course", "amount": 199.00, "date": today - timedelta(days=30), "vendor": "Frontend Masters", "is_billable": False},
        {"category": ExpenseCategory.MARKETING, "description": "LinkedIn Premium (1 month)", "amount": 39.99, "date": today - timedelta(days=5), "vendor": "LinkedIn", "is_billable": False},
        {"category": ExpenseCategory.CONTRACTOR, "description": "SEO Copywriter - Nexus Blog Posts", "amount": 650.00, "date": today - timedelta(days=8), "vendor": "Freelance SEO Writer", "is_billable": True},
        {"category": ExpenseCategory.SOFTWARE, "description": "Loom Pro (Video Messaging)", "amount": 12.50, "date": today - timedelta(days=5), "vendor": "Loom Inc.", "is_billable": False},
        {"category": ExpenseCategory.UTILITIES, "description": "Home office internet (share)", "amount": 40.00, "date": today - timedelta(days=5), "vendor": "Comcast", "is_billable": False},
    ]

    for ed in expenses_data:
        expense = Expense(user_id=user.id, currency="USD", **ed)
        db.add(expense)

    db.commit()
    print(f"Demo data seeded! Login with: {settings.DEMO_EMAIL} / {settings.DEMO_PASSWORD}")
