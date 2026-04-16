from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from database import get_db
from models import User, Client, Project, Invoice, InvoiceStatus, Note
from schemas import ClientCreate, ClientUpdate, ClientResponse
from auth import get_current_user

router = APIRouter(prefix="/clients", tags=["Clients"])


def enrich_client(client: Client, db: Session) -> dict:
    total_projects = db.query(func.count(Project.id)).filter(
        Project.client_id == client.id
    ).scalar() or 0

    total_invoiced = db.query(func.sum(Invoice.total)).filter(
        Invoice.client_id == client.id
    ).scalar() or 0.0

    total_paid = db.query(func.sum(Invoice.total)).filter(
        Invoice.client_id == client.id,
        Invoice.status == InvoiceStatus.PAID
    ).scalar() or 0.0

    return {
        "total_projects": total_projects,
        "total_invoiced": round(total_invoiced, 2),
        "total_paid": round(total_paid, 2),
    }


@router.get("", response_model=List[ClientResponse])
def list_clients(
    search: Optional[str] = None,
    industry: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Client).filter(Client.user_id == current_user.id)

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Client.name.ilike(search_term)) |
            (Client.company.ilike(search_term)) |
            (Client.email.ilike(search_term))
        )

    if industry:
        query = query.filter(Client.industry == industry)

    clients = query.order_by(Client.created_at.desc()).all()

    result = []
    for c in clients:
        enriched = enrich_client(c, db)
        result.append(ClientResponse(
            id=c.id,
            user_id=c.user_id,
            name=c.name,
            company=c.company,
            email=c.email,
            phone=c.phone,
            website=c.website,
            address=c.address,
            city=c.city,
            country=c.country,
            industry=c.industry,
            notes=c.notes,
            hourly_rate=c.hourly_rate,
            is_active=c.is_active,
            created_at=c.created_at,
            **enriched,
        ))
    return result


@router.post("", response_model=ClientResponse, status_code=status.HTTP_201_CREATED)
def create_client(
    client_data: ClientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    client = Client(user_id=current_user.id, **client_data.model_dump())
    db.add(client)
    db.commit()
    db.refresh(client)
    enriched = enrich_client(client, db)
    return ClientResponse(
        id=client.id,
        user_id=client.user_id,
        name=client.name,
        company=client.company,
        email=client.email,
        phone=client.phone,
        website=client.website,
        address=client.address,
        city=client.city,
        country=client.country,
        industry=client.industry,
        notes=client.notes,
        hourly_rate=client.hourly_rate,
        is_active=client.is_active,
        created_at=client.created_at,
        **enriched,
    )


@router.get("/{client_id}", response_model=ClientResponse)
def get_client(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    client = db.query(Client).filter(
        Client.id == client_id,
        Client.user_id == current_user.id
    ).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    enriched = enrich_client(client, db)
    return ClientResponse(
        id=client.id,
        user_id=client.user_id,
        name=client.name,
        company=client.company,
        email=client.email,
        phone=client.phone,
        website=client.website,
        address=client.address,
        city=client.city,
        country=client.country,
        industry=client.industry,
        notes=client.notes,
        hourly_rate=client.hourly_rate,
        is_active=client.is_active,
        created_at=client.created_at,
        **enriched,
    )


@router.put("/{client_id}", response_model=ClientResponse)
def update_client(
    client_id: int,
    update_data: ClientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    client = db.query(Client).filter(
        Client.id == client_id,
        Client.user_id == current_user.id
    ).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    for field, value in update_data.model_dump(exclude_unset=True).items():
        setattr(client, field, value)

    db.commit()
    db.refresh(client)
    enriched = enrich_client(client, db)
    return ClientResponse(
        id=client.id,
        user_id=client.user_id,
        name=client.name,
        company=client.company,
        email=client.email,
        phone=client.phone,
        website=client.website,
        address=client.address,
        city=client.city,
        country=client.country,
        industry=client.industry,
        notes=client.notes,
        hourly_rate=client.hourly_rate,
        is_active=client.is_active,
        created_at=client.created_at,
        **enriched,
    )


@router.delete("/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_client(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    client = db.query(Client).filter(
        Client.id == client_id,
        Client.user_id == current_user.id
    ).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    db.delete(client)
    db.commit()


@router.get("/{client_id}/notes")
def get_client_notes(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    client = db.query(Client).filter(
        Client.id == client_id,
        Client.user_id == current_user.id
    ).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    notes = db.query(Note).filter(Note.client_id == client_id).order_by(Note.created_at.desc()).all()
    return [{"id": n.id, "content": n.content, "created_at": n.created_at} for n in notes]


@router.post("/{client_id}/notes")
def add_client_note(
    client_id: int,
    content: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    client = db.query(Client).filter(
        Client.id == client_id,
        Client.user_id == current_user.id
    ).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    note = Note(client_id=client_id, content=content)
    db.add(note)
    db.commit()
    db.refresh(note)
    return {"id": note.id, "content": note.content, "created_at": note.created_at}
