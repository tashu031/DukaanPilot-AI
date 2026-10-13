import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.app.database import init_db

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    init_db()

def test_expense_lifecycle():
    # 1. Create expense
    payload = {
        "category": "Packaging",
        "amount": 420.0,
        "description": "Eco mailer bubble wraps and thank you stickers",
        "date": "2026-10-10",
        "payment_method": "UPI"
    }
    create_resp = client.post("/api/expenses", json=payload)
    assert create_resp.status_code == 201
    data = create_resp.json()
    assert data["category"] == "Packaging"
    assert data["amount"] == 420.0
    exp_id = data["id"]

    # 2. Update expense
    update_resp = client.put(f"/api/expenses/{exp_id}", json={
        "amount": 450.0,
        "description": "Eco mailer bubble wraps and embossed stickers"
    })
    assert update_resp.status_code == 200
    assert update_resp.json()["amount"] == 450.0

    # 3. Filter by category
    filter_resp = client.get("/api/expenses?category=Packaging")
    assert filter_resp.status_code == 200
    assert any(e["id"] == exp_id for e in filter_resp.json())

    # 4. Delete expense
    del_resp = client.delete(f"/api/expenses/{exp_id}")
    assert del_resp.status_code == 204
