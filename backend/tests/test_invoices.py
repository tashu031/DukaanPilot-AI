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

def test_invoice_generation_and_html():
    # 1. Fetch an order
    orders_resp = client.get("/api/orders")
    assert orders_resp.status_code == 200
    orders = orders_resp.json()
    assert len(orders) > 0
    order = orders[1] # Use second order

    # 2. Generate invoice
    inv_payload = {
        "order_id": order["id"],
        "due_days": 10,
        "tax_percent": 5.0,
        "discount_amount": 0.0,
        "notes": "Thank you for shopping with us!"
    }
    create_inv = client.post("/api/invoices", json=inv_payload)
    assert create_inv.status_code == 201
    inv_data = create_inv.json()
    assert inv_data["order_id"] == order["id"]
    assert "invoice_number" in inv_data
    inv_id = inv_data["id"]

    # 3. Check HTML view
    html_resp = client.get(f"/api/invoices/{inv_id}/html")
    assert html_resp.status_code == 200
    assert "text/html" in html_resp.headers["content-type"]
    assert inv_data["invoice_number"] in html_resp.text
