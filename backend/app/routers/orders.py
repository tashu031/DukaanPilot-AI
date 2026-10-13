import random
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query
from backend.app.database import get_db
from backend.app.schemas import OrderCreate, OrderUpdate, OrderResponse

router = APIRouter(prefix="/api/orders", tags=["Orders"])

def generate_order_number() -> str:
    timestamp = datetime.now().strftime("%y%m%d")
    rand_suffix = random.randint(100, 999)
    return f"ORD-{timestamp}-{rand_suffix}"

@router.get("", response_model=List[OrderResponse])
def get_orders(
    search: Optional[str] = None,
    status: Optional[str] = None,
    payment_status: Optional[str] = None,
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0)
):
    with get_db() as conn:
        cursor = conn.cursor()
        query = "SELECT * FROM orders WHERE 1=1"
        params = []
        
        if search:
            query += " AND (customer_name LIKE ? OR product_name LIKE ? OR order_number LIKE ? OR customer_contact LIKE ?)"
            s_param = f"%{search}%"
            params.extend([s_param, s_param, s_param, s_param])
            
        if status and status.lower() != "all":
            query += " AND order_status = ?"
            params.append(status)
            
        if payment_status and payment_status.lower() != "all":
            query += " AND payment_status = ?"
            params.append(payment_status)
            
        query += " ORDER BY created_at DESC LIMIT ? OFFSET ?;"
        params.extend([limit, offset])
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        return [dict(r) for r in rows]

@router.post("", response_model=OrderResponse, status_code=201)
def create_order(order_in: OrderCreate):
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Calculate total if not provided
        total = order_in.total_amount
        if total is None:
            total = round(order_in.quantity * order_in.unit_price, 2)
            
        order_num = generate_order_number()
        now = datetime.now().isoformat()
        
        cursor.execute("""
            INSERT INTO orders (
                order_number, customer_name, customer_contact, product_name,
                quantity, unit_price, total_amount, order_status, payment_status,
                payment_method, notes, source, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, (
            order_num, order_in.customer_name, order_in.customer_contact,
            order_in.product_name, order_in.quantity, order_in.unit_price,
            total, order_in.order_status, order_in.payment_status,
            order_in.payment_method, order_in.notes, order_in.source,
            now, now
        ))
        
        new_id = cursor.lastrowid
        cursor.execute("SELECT * FROM orders WHERE id = ?;", (new_id,))
        return dict(cursor.fetchone())

@router.get("/{order_id}", response_model=OrderResponse)
def get_order(order_id: int):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM orders WHERE id = ?;", (order_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Order not found")
        return dict(row)

@router.put("/{order_id}", response_model=OrderResponse)
def update_order(order_id: int, order_in: OrderUpdate):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM orders WHERE id = ?;", (order_id,))
        existing = cursor.fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Order not found")
            
        current = dict(existing)
        
        # Determine updated fields
        qty = order_in.quantity if order_in.quantity is not None else current["quantity"]
        price = order_in.unit_price if order_in.unit_price is not None else current["unit_price"]
        
        if order_in.total_amount is not None:
            total = order_in.total_amount
        elif order_in.quantity is not None or order_in.unit_price is not None:
            total = round(qty * price, 2)
        else:
            total = current["total_amount"]
            
        cust_name = order_in.customer_name if order_in.customer_name is not None else current["customer_name"]
        contact = order_in.customer_contact if order_in.customer_contact is not None else current["customer_contact"]
        prod_name = order_in.product_name if order_in.product_name is not None else current["product_name"]
        status = order_in.order_status if order_in.order_status is not None else current["order_status"]
        pay_status = order_in.payment_status if order_in.payment_status is not None else current["payment_status"]
        pay_method = order_in.payment_method if order_in.payment_method is not None else current["payment_method"]
        notes = order_in.notes if order_in.notes is not None else current["notes"]
        source = order_in.source if order_in.source is not None else current["source"]
        now = datetime.now().isoformat()
        
        cursor.execute("""
            UPDATE orders SET
                customer_name = ?, customer_contact = ?, product_name = ?,
                quantity = ?, unit_price = ?, total_amount = ?,
                order_status = ?, payment_status = ?, payment_method = ?,
                notes = ?, source = ?, updated_at = ?
            WHERE id = ?;
        """, (
            cust_name, contact, prod_name, qty, price, total,
            status, pay_status, pay_method, notes, source, now, order_id
        ))
        
        cursor.execute("SELECT * FROM orders WHERE id = ?;", (order_id,))
        return dict(cursor.fetchone())

@router.delete("/{order_id}", status_code=204)
def delete_order(order_id: int):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM orders WHERE id = ?;", (order_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Order not found")
        cursor.execute("DELETE FROM orders WHERE id = ?;", (order_id,))
        return None
