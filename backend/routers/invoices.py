from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import date
from database import get_db
from models import User, Invoice, InvoiceItem, Client, Project, InvoiceStatus
from schemas import InvoiceCreate, InvoiceUpdate, InvoiceResponse
from auth import get_current_user
import io

router = APIRouter(prefix="/invoices", tags=["Invoices"])


def enrich_invoice(inv: Invoice) -> dict:
    client_name = inv.client.name if inv.client else None
    project_name = inv.project.name if inv.project else None
    return {"client_name": client_name, "project_name": project_name}


def get_next_invoice_number(db: Session, user: User) -> str:
    prefix = user.invoice_prefix or "INV"
    count = db.query(Invoice).filter(Invoice.user_id == user.id).count()
    return f"{prefix}-{str(count + 1).zfill(4)}"


@router.get("", response_model=List[InvoiceResponse])
def list_invoices(
    status_filter: Optional[str] = None,
    client_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Invoice).options(
        joinedload(Invoice.client),
        joinedload(Invoice.project),
        joinedload(Invoice.items)
    ).filter(Invoice.user_id == current_user.id)

    if status_filter:
        try:
            inv_status = InvoiceStatus(status_filter)
            query = query.filter(Invoice.status == inv_status)
        except ValueError:
            pass

    if client_id:
        query = query.filter(Invoice.client_id == client_id)

    invoices = query.order_by(Invoice.created_at.desc()).all()

    result = []
    for inv in invoices:
        enriched = enrich_invoice(inv)
        items = [
            {
                "id": item.id,
                "invoice_id": item.invoice_id,
                "description": item.description,
                "quantity": item.quantity,
                "unit_price": item.unit_price,
                "amount": item.amount,
            }
            for item in inv.items
        ]
        result.append(InvoiceResponse(
            id=inv.id,
            user_id=inv.user_id,
            client_id=inv.client_id,
            project_id=inv.project_id,
            invoice_number=inv.invoice_number,
            status=inv.status,
            issue_date=inv.issue_date,
            due_date=inv.due_date,
            paid_date=inv.paid_date,
            subtotal=inv.subtotal,
            tax_rate=inv.tax_rate,
            tax_amount=inv.tax_amount,
            discount_amount=inv.discount_amount,
            total=inv.total,
            currency=inv.currency,
            notes=inv.notes,
            payment_terms=inv.payment_terms,
            sent_at=inv.sent_at,
            items=items,
            created_at=inv.created_at,
            **enriched,
        ))
    return result


@router.post("", response_model=InvoiceResponse, status_code=status.HTTP_201_CREATED)
def create_invoice(
    invoice_data: InvoiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    data = invoice_data.model_dump()
    items_data = data.pop("items", [])

    invoice_number = get_next_invoice_number(db, current_user)

    # Calculate totals
    subtotal = sum(item["quantity"] * item["unit_price"] for item in items_data)
    tax_rate = data.get("tax_rate") or 0.0
    tax_amount = subtotal * (tax_rate / 100)
    discount = data.get("discount_amount") or 0.0
    total = subtotal + tax_amount - discount

    data["subtotal"] = subtotal
    data["tax_amount"] = tax_amount
    data["total"] = total

    invoice = Invoice(
        user_id=current_user.id,
        invoice_number=invoice_number,
        **data
    )
    db.add(invoice)
    db.flush()

    for item_data in items_data:
        item = InvoiceItem(
            invoice_id=invoice.id,
            description=item_data["description"],
            quantity=item_data["quantity"],
            unit_price=item_data["unit_price"],
            amount=item_data["quantity"] * item_data["unit_price"],
        )
        db.add(item)

    db.commit()

    invoice = db.query(Invoice).options(
        joinedload(Invoice.client),
        joinedload(Invoice.project),
        joinedload(Invoice.items)
    ).filter(Invoice.id == invoice.id).first()

    enriched = enrich_invoice(invoice)
    items = [
        {
            "id": item.id,
            "invoice_id": item.invoice_id,
            "description": item.description,
            "quantity": item.quantity,
            "unit_price": item.unit_price,
            "amount": item.amount,
        }
        for item in invoice.items
    ]

    return InvoiceResponse(
        id=invoice.id,
        user_id=invoice.user_id,
        client_id=invoice.client_id,
        project_id=invoice.project_id,
        invoice_number=invoice.invoice_number,
        status=invoice.status,
        issue_date=invoice.issue_date,
        due_date=invoice.due_date,
        paid_date=invoice.paid_date,
        subtotal=invoice.subtotal,
        tax_rate=invoice.tax_rate,
        tax_amount=invoice.tax_amount,
        discount_amount=invoice.discount_amount,
        total=invoice.total,
        currency=invoice.currency,
        notes=invoice.notes,
        payment_terms=invoice.payment_terms,
        sent_at=invoice.sent_at,
        items=items,
        created_at=invoice.created_at,
        **enriched,
    )


@router.get("/{invoice_id}", response_model=InvoiceResponse)
def get_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    invoice = db.query(Invoice).options(
        joinedload(Invoice.client),
        joinedload(Invoice.project),
        joinedload(Invoice.items)
    ).filter(
        Invoice.id == invoice_id,
        Invoice.user_id == current_user.id
    ).first()

    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    enriched = enrich_invoice(invoice)
    items = [
        {
            "id": item.id,
            "invoice_id": item.invoice_id,
            "description": item.description,
            "quantity": item.quantity,
            "unit_price": item.unit_price,
            "amount": item.amount,
        }
        for item in invoice.items
    ]

    return InvoiceResponse(
        id=invoice.id,
        user_id=invoice.user_id,
        client_id=invoice.client_id,
        project_id=invoice.project_id,
        invoice_number=invoice.invoice_number,
        status=invoice.status,
        issue_date=invoice.issue_date,
        due_date=invoice.due_date,
        paid_date=invoice.paid_date,
        subtotal=invoice.subtotal,
        tax_rate=invoice.tax_rate,
        tax_amount=invoice.tax_amount,
        discount_amount=invoice.discount_amount,
        total=invoice.total,
        currency=invoice.currency,
        notes=invoice.notes,
        payment_terms=invoice.payment_terms,
        sent_at=invoice.sent_at,
        items=items,
        created_at=invoice.created_at,
        **enriched,
    )


@router.put("/{invoice_id}", response_model=InvoiceResponse)
def update_invoice(
    invoice_id: int,
    update_data: InvoiceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    invoice = db.query(Invoice).filter(
        Invoice.id == invoice_id,
        Invoice.user_id == current_user.id
    ).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    data = update_data.model_dump(exclude_unset=True)
    items_data = data.pop("items", None)

    for field, value in data.items():
        setattr(invoice, field, value)

    if items_data is not None:
        # Replace all items
        db.query(InvoiceItem).filter(InvoiceItem.invoice_id == invoice_id).delete()
        for item_data in items_data:
            item = InvoiceItem(
                invoice_id=invoice.id,
                description=item_data["description"],
                quantity=item_data["quantity"],
                unit_price=item_data["unit_price"],
                amount=item_data["quantity"] * item_data["unit_price"],
            )
            db.add(item)

        # Recalculate totals
        subtotal = sum(i["quantity"] * i["unit_price"] for i in items_data)
        tax_rate = invoice.tax_rate or 0.0
        tax_amount = subtotal * (tax_rate / 100)
        invoice.subtotal = subtotal
        invoice.tax_amount = tax_amount
        invoice.total = subtotal + tax_amount - (invoice.discount_amount or 0.0)

    db.commit()

    invoice = db.query(Invoice).options(
        joinedload(Invoice.client),
        joinedload(Invoice.project),
        joinedload(Invoice.items)
    ).filter(Invoice.id == invoice_id).first()

    enriched = enrich_invoice(invoice)
    items = [
        {
            "id": item.id,
            "invoice_id": item.invoice_id,
            "description": item.description,
            "quantity": item.quantity,
            "unit_price": item.unit_price,
            "amount": item.amount,
        }
        for item in invoice.items
    ]

    return InvoiceResponse(
        id=invoice.id,
        user_id=invoice.user_id,
        client_id=invoice.client_id,
        project_id=invoice.project_id,
        invoice_number=invoice.invoice_number,
        status=invoice.status,
        issue_date=invoice.issue_date,
        due_date=invoice.due_date,
        paid_date=invoice.paid_date,
        subtotal=invoice.subtotal,
        tax_rate=invoice.tax_rate,
        tax_amount=invoice.tax_amount,
        discount_amount=invoice.discount_amount,
        total=invoice.total,
        currency=invoice.currency,
        notes=invoice.notes,
        payment_terms=invoice.payment_terms,
        sent_at=invoice.sent_at,
        items=items,
        created_at=invoice.created_at,
        **enriched,
    )


@router.delete("/{invoice_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    invoice = db.query(Invoice).filter(
        Invoice.id == invoice_id,
        Invoice.user_id == current_user.id
    ).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    db.delete(invoice)
    db.commit()


@router.post("/{invoice_id}/mark-sent")
def mark_invoice_sent(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from datetime import datetime
    invoice = db.query(Invoice).filter(
        Invoice.id == invoice_id,
        Invoice.user_id == current_user.id
    ).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    invoice.status = InvoiceStatus.SENT
    invoice.sent_at = datetime.utcnow()
    db.commit()
    return {"message": "Invoice marked as sent", "status": "sent"}


@router.post("/{invoice_id}/mark-paid")
def mark_invoice_paid(
    invoice_id: int,
    paid_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    invoice = db.query(Invoice).filter(
        Invoice.id == invoice_id,
        Invoice.user_id == current_user.id
    ).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    invoice.status = InvoiceStatus.PAID
    invoice.paid_date = paid_date or date.today()
    db.commit()
    return {"message": "Invoice marked as paid", "status": "paid"}


@router.get("/{invoice_id}/pdf")
def download_invoice_pdf(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    invoice = db.query(Invoice).options(
        joinedload(Invoice.client),
        joinedload(Invoice.project),
        joinedload(Invoice.items)
    ).filter(
        Invoice.id == invoice_id,
        Invoice.user_id == current_user.id
    ).first()

    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    from services.pdf_service import generate_invoice_pdf
    pdf_buffer = generate_invoice_pdf(invoice, current_user)

    return StreamingResponse(
        io.BytesIO(pdf_buffer),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="Invoice-{invoice.invoice_number}.pdf"'
        }
    )
