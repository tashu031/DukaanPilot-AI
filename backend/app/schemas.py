from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

# Business Profile Schemas
class BusinessProfileBase(BaseModel):
    business_name: str = Field(..., min_length=1)
    owner_name: str = Field(..., min_length=1)
    tagline: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    upi_id: Optional[str] = None
    currency_symbol: str = "₹"
    currency_code: str = "INR"
    address: Optional[str] = None
    invoice_prefix: str = "INV-"
    notes: Optional[str] = None

class BusinessProfileResponse(BusinessProfileBase):
    id: int
    updated_at: str

class BusinessProfileUpdate(BaseModel):
    business_name: Optional[str] = None
    owner_name: Optional[str] = None
    tagline: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    upi_id: Optional[str] = None
    currency_symbol: Optional[str] = None
    currency_code: Optional[str] = None
    address: Optional[str] = None
    invoice_prefix: Optional[str] = None
    notes: Optional[str] = None

# Order Schemas
class OrderCreate(BaseModel):
    customer_name: str = Field(..., min_length=1)
    customer_contact: Optional[str] = None
    product_name: str = Field(..., min_length=1)
    quantity: int = Field(..., ge=1)
    unit_price: float = Field(..., ge=0.0)
    total_amount: Optional[float] = None  # If omitted, auto calculated quantity * unit_price
    order_status: str = Field(default="Pending") # Pending, Confirmed, Shipped, Delivered, Cancelled
    payment_status: str = Field(default="Unpaid") # Paid, Partial, Unpaid
    payment_method: Optional[str] = "UPI"
    notes: Optional[str] = None
    source: Optional[str] = "Manual"

class OrderUpdate(BaseModel):
    customer_name: Optional[str] = None
    customer_contact: Optional[str] = None
    product_name: Optional[str] = None
    quantity: Optional[int] = Field(default=None, ge=1)
    unit_price: Optional[float] = Field(default=None, ge=0.0)
    total_amount: Optional[float] = None
    order_status: Optional[str] = None
    payment_status: Optional[str] = None
    payment_method: Optional[str] = None
    notes: Optional[str] = None
    source: Optional[str] = None

class OrderResponse(BaseModel):
    id: int
    order_number: str
    customer_name: str
    customer_contact: Optional[str] = None
    product_name: str
    quantity: int
    unit_price: float
    total_amount: float
    order_status: str
    payment_status: str
    payment_method: Optional[str] = None
    notes: Optional[str] = None
    source: Optional[str] = None
    created_at: str
    updated_at: str

# Expense Schemas
class ExpenseCreate(BaseModel):
    category: str = Field(..., min_length=1)
    amount: float = Field(..., gt=0.0)
    description: str = Field(..., min_length=1)
    date: str
    payment_method: Optional[str] = "UPI"

class ExpenseUpdate(BaseModel):
    category: Optional[str] = None
    amount: Optional[float] = Field(default=None, gt=0.0)
    description: Optional[str] = None
    date: Optional[str] = None
    payment_method: Optional[str] = None

class ExpenseResponse(BaseModel):
    id: int
    category: str
    amount: float
    description: str
    date: str
    payment_method: Optional[str] = None
    created_at: str

# Inventory Schemas
class InventoryCreate(BaseModel):
    sku: Optional[str] = None
    product_name: str = Field(..., min_length=1)
    unit_cost: float = Field(default=0.0, ge=0.0)
    selling_price: float = Field(default=0.0, ge=0.0)
    stock_quantity: int = Field(default=0, ge=0)
    low_stock_threshold: int = Field(default=5, ge=0)
    category: Optional[str] = "General"

class InventoryUpdate(BaseModel):
    sku: Optional[str] = None
    product_name: Optional[str] = None
    unit_cost: Optional[float] = Field(default=None, ge=0.0)
    selling_price: Optional[float] = Field(default=None, ge=0.0)
    stock_quantity: Optional[int] = Field(default=None, ge=0)
    low_stock_threshold: Optional[int] = Field(default=None, ge=0)
    category: Optional[str] = None

class InventoryResponse(BaseModel):
    id: int
    sku: str
    product_name: str
    unit_cost: float
    selling_price: float
    stock_quantity: int
    low_stock_threshold: int
    category: Optional[str] = None
    created_at: str
    updated_at: str

# Invoice Schemas
class InvoiceCreate(BaseModel):
    order_id: int
    due_days: int = Field(default=7, ge=0, le=365, description="Due days window (0-365 days)")
    tax_percent: float = Field(default=0.0, ge=0.0, le=100.0, description="Tax percentage (0-100%)")
    discount_amount: float = Field(default=0.0, ge=0.0, description="Flat discount amount (non-negative)")
    notes: Optional[str] = None

class InvoiceResponse(BaseModel):
    id: int
    invoice_number: str
    order_id: int
    issue_date: str
    due_date: str
    status: str
    subtotal: float
    tax_amount: float
    discount_amount: float
    total_amount: float
    notes: Optional[str] = None
    created_at: str
    order: Optional[OrderResponse] = None
    business: Optional[BusinessProfileResponse] = None

# AI Natural Language Order Extraction Schemas
class AIOrderExtractRequest(BaseModel):
    text: str = Field(..., min_length=3)

class ExtractedOrderDraft(BaseModel):
    customer_name: str
    customer_contact: Optional[str] = None
    product_name: str
    quantity: int
    unit_price: float
    total_amount: float
    order_status: str
    payment_status: str
    notes: Optional[str] = None

class AIOrderExtractResponse(BaseModel):
    success: bool
    source_model: str # "gemma:2b" or "deterministic-fallback"
    confidence: float
    extracted_data: ExtractedOrderDraft
    raw_message: Optional[str] = None

# AI Assistant Chat Schemas
class AIChatRequest(BaseModel):
    message: str = Field(..., min_length=1)

class AIChatResponse(BaseModel):
    reply: str
    source_mode: str # "Gemma (Ollama Local)" or "Deterministic Business Intelligence Engine"
    suggested_actions: Optional[List[str]] = None
    context_data: Optional[Dict[str, Any]] = None

# Analytics & Dashboard Schemas
class AnalyticsSummary(BaseModel):
    total_revenue: float
    total_expenses: float
    estimated_profit: float
    pending_payments: float
    total_orders_count: int
    delivered_orders_count: int
    pending_orders_count: int
    profit_margin_percent: float
    currency_symbol: str

class TopProduct(BaseModel):
    product_name: str
    quantity_sold: int
    total_revenue: float

class CategoryExpense(BaseModel):
    category: str
    total_amount: float
    percentage: float

class DailyTrend(BaseModel):
    date: str
    revenue: float
    expenses: float
    profit: float
