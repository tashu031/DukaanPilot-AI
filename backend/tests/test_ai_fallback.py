import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.app.database import init_db
from backend.app.seed_data import seed_sample_data

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_data():
    init_db()
    seed_sample_data()

def test_ai_status():
    resp = client.get("/api/ai/status")
    assert resp.status_code == 200
    data = resp.json()
    assert "available" in data
    assert "model" in data

def test_natural_language_order_extraction():
    sample_text = "Priya ordered 2 handmade bracelets at ₹350 each, delivery pending."
    resp = client.post("/api/ai/extract-order", json={"text": sample_text})
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert "source_model" in data
    
    draft = data["extracted_data"]
    assert "Priya" in draft["customer_name"]
    assert draft["quantity"] == 2
    assert draft["unit_price"] == 350.0
    assert draft["total_amount"] == 700.0
    assert draft["order_status"] == "Pending"

def test_business_assistant_queries():
    test_queries = [
        ("Which products generated the most revenue?", "top"),
        ("What are my total expenses this month?", "expenses"),
        ("Which orders are awaiting delivery?", "awaiting delivery"),
        ("How much estimated profit did I make?", "profit"),
        ("Which customers have pending payments?", "pending payments")
    ]
    
    for query, expected_keyword in test_queries:
        resp = client.post("/api/ai/chat", json={"message": query})
        assert resp.status_code == 200
        chat_data = resp.json()
        assert "reply" in chat_data
        assert len(chat_data["reply"]) > 10
        assert "source_mode" in chat_data
        # Ensure reply contains non-empty verified facts
        assert "₹" in chat_data["reply"] or "0" in chat_data["reply"]
