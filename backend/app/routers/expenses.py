from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query
from backend.app.database import get_db
from backend.app.schemas import ExpenseCreate, ExpenseUpdate, ExpenseResponse
from backend.app.services.analytics_service import get_expenses_by_category

router = APIRouter(prefix="/api/expenses", tags=["Expenses"])

@router.get("", response_model=List[ExpenseResponse])
def get_expenses(
    search: Optional[str] = None,
    category: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0)
):
    with get_db() as conn:
        cursor = conn.cursor()
        query = "SELECT * FROM expenses WHERE 1=1"
        params = []
        
        if search:
            query += " AND (description LIKE ? OR category LIKE ?)"
            s_param = f"%{search}%"
            params.extend([s_param, s_param])
            
        if category and category.lower() != "all":
            query += " AND category = ?"
            params.append(category)
            
        if start_date:
            query += " AND date >= ?"
            params.append(start_date)
            
        if end_date:
            query += " AND date <= ?"
            params.append(end_date)
            
        query += " ORDER BY date DESC, id DESC LIMIT ? OFFSET ?;"
        params.extend([limit, offset])
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        return [dict(r) for r in rows]

@router.get("/categories")
def get_categories_breakdown():
    return get_expenses_by_category()

@router.post("", response_model=ExpenseResponse, status_code=201)
def create_expense(exp_in: ExpenseCreate):
    with get_db() as conn:
        cursor = conn.cursor()
        now = datetime.now().isoformat()
        
        cursor.execute("""
            INSERT INTO expenses (category, amount, description, date, payment_method, created_at)
            VALUES (?, ?, ?, ?, ?, ?);
        """, (
            exp_in.category, exp_in.amount, exp_in.description,
            exp_in.date, exp_in.payment_method, now
        ))
        
        new_id = cursor.lastrowid
        cursor.execute("SELECT * FROM expenses WHERE id = ?;", (new_id,))
        return dict(cursor.fetchone())

@router.get("/{expense_id}", response_model=ExpenseResponse)
def get_expense(expense_id: int):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM expenses WHERE id = ?;", (expense_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Expense not found")
        return dict(row)

@router.put("/{expense_id}", response_model=ExpenseResponse)
def update_expense(expense_id: int, exp_in: ExpenseUpdate):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM expenses WHERE id = ?;", (expense_id,))
        existing = cursor.fetchone()
        if not existing:
            raise HTTPException(status_code=404, detail="Expense not found")
            
        cur = dict(existing)
        cat = exp_in.category if exp_in.category is not None else cur["category"]
        amt = exp_in.amount if exp_in.amount is not None else cur["amount"]
        desc = exp_in.description if exp_in.description is not None else cur["description"]
        dt = exp_in.date if exp_in.date is not None else cur["date"]
        method = exp_in.payment_method if exp_in.payment_method is not None else cur["payment_method"]
        
        cursor.execute("""
            UPDATE expenses SET
                category = ?, amount = ?, description = ?, date = ?, payment_method = ?
            WHERE id = ?;
        """, (cat, amt, desc, dt, method, expense_id))
        
        cursor.execute("SELECT * FROM expenses WHERE id = ?;", (expense_id,))
        return dict(cursor.fetchone())

@router.delete("/{expense_id}", status_code=204)
def delete_expense(expense_id: int):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM expenses WHERE id = ?;", (expense_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Expense not found")
        cursor.execute("DELETE FROM expenses WHERE id = ?;", (expense_id,))
        return None
