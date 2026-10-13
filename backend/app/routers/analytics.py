from fastapi import APIRouter
from typing import List
from backend.app.schemas import (
    AnalyticsSummary,
    TopProduct,
    CategoryExpense,
    DailyTrend
)
from backend.app.services.analytics_service import (
    get_analytics_summary,
    get_top_products,
    get_expenses_by_category,
    get_financial_trends,
    get_business_recommendations,
    get_low_stock_alerts
)

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

@router.get("/summary", response_model=AnalyticsSummary)
def get_summary():
    return get_analytics_summary()

@router.get("/top-products", response_model=List[TopProduct])
def get_products_ranking(limit: int = 5):
    return get_top_products(limit)

@router.get("/expenses-by-category", response_model=List[CategoryExpense])
def get_expense_categories():
    return get_expenses_by_category()

@router.get("/trends", response_model=List[DailyTrend])
def get_trends():
    return get_financial_trends()

@router.get("/recommendations")
def get_recommendations():
    return get_business_recommendations()

@router.get("/low-stock")
def get_low_stock():
    return get_low_stock_alerts()
