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

def test_invoice_html_security_escaping():
    """Verify malicious HTML tags in customer and product fields are safely escaped as plain text."""
    # 1. Create order with XSS payload
    malicious_order_payload = {
        "customer_name": "<script>alert('xss-cust')</script>",
        "customer_contact": "+91 9898989898",
        "product_name": "<img src=x onerror=alert('xss-prod')>",
        "quantity": 1,
        "unit_price": 499.0,
        "notes": "<b onmouseover=alert('xss-notes')>Bold</b>",
        "order_status": "Pending",
        "payment_status": "Paid",
        "payment_method": "UPI",
        "source": "Web"
    }
    ord_resp = client.post("/api/orders", json=malicious_order_payload)
    assert ord_resp.status_code == 201
    ord_id = ord_resp.json()["id"]

    # 2. Generate invoice
    inv_resp = client.post("/api/invoices", json={
        "order_id": ord_id,
        "due_days": 7,
        "tax_percent": 0.0,
        "discount_amount": 0.0,
        "notes": "<iframe src='evil.com'></iframe>"
    })
    assert inv_resp.status_code == 201
    inv_id = inv_resp.json()["id"]

    # 3. Retrieve HTML view
    html_resp = client.get(f"/api/invoices/{inv_id}/html")
    assert html_resp.status_code == 200
    html_content = html_resp.text

    # Executable HTML tags must NOT be present unescaped
    assert "<script>" not in html_content
    assert "</script>" not in html_content
    assert "<img src=x" not in html_content
    assert "<iframe" not in html_content

    # Escaped safe entities MUST be present
    assert "&lt;script&gt;alert(" in html_content
    assert "&lt;img src=x" in html_content
    assert "&lt;iframe" in html_content

def test_invoice_input_validation_rules():
    """Verify validation on due_days, tax_percent, discount limits and negative totals."""
    orders_resp = client.get("/api/orders")
    orders = orders_resp.json()
    order = orders[0]
    subtotal = float(order["total_amount"])

    # 1. Reject negative due_days
    bad_due = client.post("/api/invoices", json={
        "order_id": order["id"],
        "due_days": -1
    })
    assert bad_due.status_code in (400, 422)

    # 2. Reject excessive due_days (> 365)
    bad_due_high = client.post("/api/invoices", json={
        "order_id": order["id"],
        "due_days": 500
    })
    assert bad_due_high.status_code in (400, 422)

    # 3. Reject negative tax_percent
    bad_tax = client.post("/api/invoices", json={
        "order_id": order["id"],
        "tax_percent": -5.0
    })
    assert bad_tax.status_code in (400, 422)

    # 4. Reject tax_percent > 100
    bad_tax_high = client.post("/api/invoices", json={
        "order_id": order["id"],
        "tax_percent": 150.0
    })
    assert bad_tax_high.status_code in (400, 422)

    # 5. Reject negative discount
    bad_discount_neg = client.post("/api/invoices", json={
        "order_id": order["id"],
        "discount_amount": -20.0
    })
    assert bad_discount_neg.status_code in (400, 422)

    # 6. Reject discount exceeding subtotal
    bad_discount_excess = client.post("/api/invoices", json={
        "order_id": order["id"],
        "discount_amount": subtotal + 500.0
    })
    assert bad_discount_excess.status_code == 400
    assert "cannot exceed subtotal" in bad_discount_excess.json()["detail"]
