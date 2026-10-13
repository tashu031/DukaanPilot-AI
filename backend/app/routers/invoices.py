from fastapi import APIRouter, HTTPException, Response
from typing import List
from backend.app.schemas import InvoiceCreate, InvoiceResponse
from backend.app.services.invoice_service import (
    generate_invoice_for_order,
    get_invoice_details,
    list_invoices,
    render_invoice_html
)

router = APIRouter(prefix="/api/invoices", tags=["Invoices"])

@router.get("", response_model=List[InvoiceResponse])
def get_all_invoices():
    return list_invoices()

@router.post("", response_model=InvoiceResponse, status_code=201)
def create_invoice(inv_in: InvoiceCreate):
    try:
        invoice = generate_invoice_for_order(
            order_id=inv_in.order_id,
            due_days=inv_in.due_days,
            tax_percent=inv_in.tax_percent,
            discount_amount=inv_in.discount_amount,
            notes=inv_in.notes
        )
        return invoice
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{invoice_id}", response_model=InvoiceResponse)
def get_single_invoice(invoice_id: int):
    invoice = get_invoice_details(invoice_id)
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return invoice

@router.get("/{invoice_id}/html")
def get_invoice_html_view(invoice_id: int):
    html = render_invoice_html(invoice_id)
    return Response(content=html, media_type="text/html")
