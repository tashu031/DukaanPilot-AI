import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.app.database import init_db
from backend.app.seed_data import seed_sample_data, reset_all_data

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_sample_data():
    init_db()
    seed_sample_data()

def test_analytics_summary_accuracy():
    resp = client.get("/api/analytics/summary")
    assert resp.status_code == 200
    data = resp.json()
    
    assert data["total_revenue"] > 0
    assert data["total_expenses"] > 0
    # Net profit should match revenue - expenses
    assert data["estimated_profit"] == round(data["total_revenue"] - data["total_expenses"], 2)
    assert data["pending_payments"] >= 0
    assert data["currency_symbol"] == "₹"

def test_top_products():
    resp = client.get("/api/analytics/top-products")
    assert resp.status_code == 200
    products = resp.json()
    assert len(products) > 0
    # Should be sorted descending by total_revenue
    if len(products) > 1:
        assert products[0]["total_revenue"] >= products[1]["total_revenue"]

def test_business_recommendations():
    resp = client.get("/api/analytics/recommendations")
    assert resp.status_code == 200
    recs = resp.json()
    assert isinstance(recs, list)
    assert len(recs) > 0
