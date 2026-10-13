import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.app.database import init_db

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    init_db()

def test_health_endpoint():
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "healthy"

def test_order_lifecycle():
    # 1. Create order
    payload = {
        "customer_name": "Riya Sen",
        "customer_contact": "+91 99887 76655",
        "product_name": "Handmade Clay Earrings",
        "quantity": 3,
        "unit_price": 250.0,
        "order_status": "Pending",
        "payment_status": "Unpaid",
        "payment_method": "UPI",
        "notes": "Red & gold color pattern",
        "source": "Instagram DM"
    }
    create_resp = client.post("/api/orders", json=payload)
    assert create_resp.status_code == 201
    data = create_resp.json()
    assert data["customer_name"] == "Riya Sen"
    assert data["quantity"] == 3
    assert data["unit_price"] == 250.0
    assert data["total_amount"] == 750.0 # auto-calculated
    assert data["order_number"].startswith("ORD-")
    order_id = data["id"]

    # 2. Fetch order
    get_resp = client.get(f"/api/orders/{order_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == order_id

    # 3. Update order
    update_resp = client.put(f"/api/orders/{order_id}", json={
        "order_status": "Delivered",
        "payment_status": "Paid"
    })
    assert update_resp.status_code == 200
    assert update_resp.json()["order_status"] == "Delivered"
    assert update_resp.json()["payment_status"] == "Paid"

    # 4. Search orders
    search_resp = client.get("/api/orders?search=Riya")
    assert search_resp.status_code == 200
    assert any(o["id"] == order_id for o in search_resp.json())

    # 5. Delete order
    del_resp = client.delete(f"/api/orders/{order_id}")
    assert del_resp.status_code == 204

    # 6. Verify deleted
    not_found_resp = client.get(f"/api/orders/{order_id}")
    assert not_found_resp.status_code == 404
