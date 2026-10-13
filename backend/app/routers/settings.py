from datetime import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException, Header
from backend.app import config
from backend.app.database import get_db
from backend.app.schemas import BusinessProfileResponse, BusinessProfileUpdate
from backend.app.seed_data import seed_sample_data, reset_all_data

router = APIRouter(prefix="/api/settings", tags=["Settings & Profile"])

@router.get("/profile", response_model=BusinessProfileResponse)
def get_profile():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM business_profile WHERE id = 1;")
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Profile not found")
        return dict(row)

@router.put("/profile", response_model=BusinessProfileResponse)
def update_profile(prof_in: BusinessProfileUpdate):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM business_profile WHERE id = 1;")
        existing = cursor.fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Profile not found")
            
        cur = dict(existing)
        now = datetime.now().isoformat()
        
        biz_name = prof_in.business_name if prof_in.business_name is not None else cur["business_name"]
        owner = prof_in.owner_name if prof_in.owner_name is not None else cur["owner_name"]
        tagline = prof_in.tagline if prof_in.tagline is not None else cur["tagline"]
        email = prof_in.email if prof_in.email is not None else cur["email"]
        phone = prof_in.phone if prof_in.phone is not None else cur["phone"]
        upi = prof_in.upi_id if prof_in.upi_id is not None else cur["upi_id"]
        sym = prof_in.currency_symbol if prof_in.currency_symbol is not None else cur["currency_symbol"]
        code = prof_in.currency_code if prof_in.currency_code is not None else cur["currency_code"]
        addr = prof_in.address if prof_in.address is not None else cur["address"]
        prefix = prof_in.invoice_prefix if prof_in.invoice_prefix is not None else cur["invoice_prefix"]
        notes = prof_in.notes if prof_in.notes is not None else cur["notes"]
        
        cursor.execute("""
            UPDATE business_profile SET
                business_name = ?, owner_name = ?, tagline = ?, email = ?,
                phone = ?, upi_id = ?, currency_symbol = ?, currency_code = ?,
                address = ?, invoice_prefix = ?, notes = ?, updated_at = ?
            WHERE id = 1;
        """, (
            biz_name, owner, tagline, email, phone, upi, sym, code,
            addr, prefix, notes, now
        ))
        
        cursor.execute("SELECT * FROM business_profile WHERE id = 1;")
        return dict(cursor.fetchone())
def check_demo_mutation_allowed(x_admin_key: Optional[str] = None):
    if config.DEMO_MODE:
        if config.ADMIN_API_KEY and x_admin_key == config.ADMIN_API_KEY:
            return
        raise HTTPException(
            status_code=403,
            detail="Resetting or re-seeding demo data is disabled in public demo mode to preserve shared demonstration data."
        )

@router.post("/seed-data")
def trigger_seed_data(x_admin_key: Optional[str] = Header(default=None)):
    check_demo_mutation_allowed(x_admin_key)
    seed_sample_data()
    return {"message": "Sample boutique store data loaded successfully!"}

@router.post("/reset-data")
def trigger_reset_data(x_admin_key: Optional[str] = Header(default=None)):
    check_demo_mutation_allowed(x_admin_key)
    reset_all_data()
    return {"message": "All store orders, expenses, and invoices cleared."}
