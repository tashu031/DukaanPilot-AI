from datetime import datetime, timedelta
from backend.app.database import get_db

def generate_invoice_for_order(order_id: int, due_days: int = 7, tax_percent: float = 0.0, discount_amount: float = 0.0, notes: str = None):
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Fetch profile
        cursor.execute("SELECT * FROM business_profile WHERE id = 1;")
        profile = dict(cursor.fetchone())
        
        # Fetch order
        cursor.execute("SELECT * FROM orders WHERE id = ?;", (order_id,))
        order_row = cursor.fetchone()
        if not order_row:
            raise ValueError(f"Order #{order_id} not found")
        order = dict(order_row)
        
        # Check if invoice already exists for this order
        cursor.execute("SELECT * FROM invoices WHERE order_id = ?;", (order_id,))
        existing = cursor.fetchone()
        if existing:
            return get_invoice_details(existing["id"])
            
        # Create invoice number
        prefix = profile.get("invoice_prefix", "INV-")
        inv_number = f"{prefix}{order['order_number'].replace('ORD-', '')}"
        
        issue_date = datetime.now().strftime("%Y-%m-%d")
        due_date = (datetime.now() + timedelta(days=due_days)).strftime("%Y-%m-%d")
        
        subtotal = float(order["total_amount"])
        tax_amount = round(subtotal * (tax_percent / 100.0), 2)
        total_amount = round(subtotal + tax_amount - discount_amount, 2)
        
        invoice_status = "Paid" if order["payment_status"] == "Paid" else "Issued"
        custom_notes = notes or profile.get("notes", "Thank you for your business!")
        now_iso = datetime.now().isoformat()
        
        cursor.execute("""
            INSERT INTO invoices (
                invoice_number, order_id, issue_date, due_date, status,
                subtotal, tax_amount, discount_amount, total_amount, notes, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, (
            inv_number, order_id, issue_date, due_date, invoice_status,
            subtotal, tax_amount, discount_amount, total_amount, custom_notes, now_iso
        ))
        
        new_id = cursor.lastrowid
        conn.commit()
    return get_invoice_details(new_id)

def get_invoice_details(invoice_id: int):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM invoices WHERE id = ?;", (invoice_id,))
        inv_row = cursor.fetchone()
        if not inv_row:
            return None
        invoice = dict(inv_row)
        
        cursor.execute("SELECT * FROM orders WHERE id = ?;", (invoice["order_id"],))
        order_row = cursor.fetchone()
        invoice["order"] = dict(order_row) if order_row else None
        
        cursor.execute("SELECT * FROM business_profile WHERE id = 1;")
        profile_row = cursor.fetchone()
        invoice["business"] = dict(profile_row) if profile_row else None
        
        return invoice

def list_invoices():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT i.*, o.customer_name, o.product_name, o.order_number, o.payment_status as order_payment_status
            FROM invoices i
            LEFT JOIN orders o ON i.order_id = o.id
            ORDER BY i.id DESC;
        """)
        return [dict(r) for r in cursor.fetchall()]

def render_invoice_html(invoice_id: int) -> str:
    data = get_invoice_details(invoice_id)
    if not data:
        return "<h1>Invoice not found</h1>"
        
    biz = data["business"] or {}
    order = data["order"] or {}
    currency = biz.get("currency_symbol", "₹")
    
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Invoice {data['invoice_number']} - {biz.get('business_name', 'DukaanPilot')}</title>
  <style>
    body {{
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 40px;
      color: #0f172a;
      background: #f8fafc;
    }}
    .invoice-card {{
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      padding: 48px;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
      border: 1px solid #e2e8f0;
    }}
    .header {{
      display: flex;
      justify-content: space-between;
      border-bottom: 2px solid #f1f5f9;
      padding-bottom: 24px;
      margin-bottom: 24px;
    }}
    .biz-brand {{
      font-size: 26px;
      font-weight: 800;
      color: #0d9488;
      letter-spacing: -0.5px;
    }}
    .biz-tagline {{
      font-size: 13px;
      color: #64748b;
      margin-top: 4px;
    }}
    .inv-title {{
      text-align: right;
    }}
    .inv-title h1 {{
      margin: 0;
      font-size: 28px;
      color: #0f172a;
      letter-spacing: -0.5px;
    }}
    .inv-number {{
      font-size: 14px;
      font-weight: 600;
      color: #64748b;
      margin-top: 4px;
    }}
    .meta-grid {{
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 32px;
      margin-bottom: 32px;
    }}
    .meta-box h3 {{
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #94a3b8;
      margin: 0 0 8px 0;
    }}
    .meta-box p {{
      margin: 0;
      font-size: 14px;
      line-height: 1.6;
      color: #334155;
    }}
    table {{
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }}
    th {{
      background: #f8fafc;
      text-align: left;
      padding: 12px 16px;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
      border-bottom: 1px solid #e2e8f0;
    }}
    td {{
      padding: 16px;
      border-bottom: 1px solid #f1f5f9;
      font-size: 14px;
      color: #1e293b;
    }}
    .text-right {{
      text-align: right;
    }}
    .summary-section {{
      display: flex;
      justify-content: flex-end;
      margin-top: 16px;
    }}
    .summary-table {{
      width: 280px;
    }}
    .summary-row {{
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 14px;
      color: #64748b;
    }}
    .summary-row.total {{
      border-top: 2px solid #e2e8f0;
      padding-top: 12px;
      margin-top: 8px;
      font-size: 18px;
      font-weight: 700;
      color: #0f172a;
    }}
    .badge {{
      display: inline-block;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
    }}
    .badge-paid {{
      background: #dcfce7;
      color: #15803d;
    }}
    .badge-issued {{
      background: #fef3c7;
      color: #b45309;
    }}
    .footer-note {{
      margin-top: 40px;
      padding-top: 24px;
      border-top: 1px dashed #e2e8f0;
      font-size: 13px;
      color: #64748b;
      text-align: center;
    }}
    .action-bar {{
      max-width: 800px;
      margin: 0 auto 20px auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }}
    .print-btn {{
      background: #0d9488;
      color: #ffffff;
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
    }}
    @media print {{
      body {{
        padding: 0;
        background: #ffffff;
      }}
      .action-bar {{
        display: none;
      }}
      .invoice-card {{
        border: none;
        box-shadow: none;
        padding: 0;
      }}
    }}
  </style>
</head>
<body>
  <div class="action-bar">
    <a href="javascript:window.history.back()" style="color: #64748b; text-decoration: none; font-size: 14px; font-weight: 500;">&larr; Back to DukaanPilot</a>
    <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
  </div>
  <div class="invoice-card">
    <div class="header">
      <div>
        <div class="biz-brand">{biz.get('business_name', 'Dukaan Boutique')}</div>
        <div class="biz-tagline">{biz.get('tagline', 'Handcrafted & Curated')}</div>
        <div style="font-size: 13px; color: #475569; margin-top: 8px;">
          {biz.get('address', '')}<br/>
          WhatsApp / Phone: {biz.get('phone', '')}<br/>
          UPI: <strong>{biz.get('upi_id', '')}</strong>
        </div>
      </div>
      <div class="inv-title">
        <h1>INVOICE</h1>
        <div class="inv-number">{data['invoice_number']}</div>
        <div style="margin-top: 12px;">
          <span class="badge {'badge-paid' if data['status'] == 'Paid' else 'badge-issued'}">{data['status']}</span>
        </div>
      </div>
    </div>

    <div class="meta-grid">
      <div class="meta-box">
        <h3>Billed To</h3>
        <p>
          <strong style="font-size: 16px; color: #0f172a;">{order.get('customer_name', 'Customer')}</strong><br/>
          Contact: {order.get('customer_contact', 'N/A')}<br/>
          Source: {order.get('source', 'Online Order')}
        </p>
      </div>
      <div class="meta-box text-right">
        <h3>Invoice Details</h3>
        <p>
          <strong>Issue Date:</strong> {data['issue_date']}<br/>
          <strong>Payment Due:</strong> {data['due_date']}<br/>
          <strong>Order Ref:</strong> {order.get('order_number', 'N/A')}
        </p>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Item Description</th>
          <th class="text-right">Qty</th>
          <th class="text-right">Unit Price</th>
          <th class="text-right">Total</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <strong>{order.get('product_name', 'Product Item')}</strong>
            <div style="font-size: 12px; color: #64748b; margin-top: 4px;">{order.get('notes') or 'Standard delivery item'}</div>
          </td>
          <td class="text-right">{order.get('quantity', 1)}</td>
          <td class="text-right">{currency}{order.get('unit_price', 0.0):,.2f}</td>
          <td class="text-right">{currency}{order.get('total_amount', 0.0):,.2f}</td>
        </tr>
      </tbody>
    </table>

    <div class="summary-section">
      <div class="summary-table">
        <div class="summary-row">
          <span>Subtotal</span>
          <span>{currency}{data['subtotal']:,.2f}</span>
        </div>
        {f'<div class="summary-row"><span>Tax</span><span>{currency}{data["tax_amount"]:,.2f}</span></div>' if data['tax_amount'] > 0 else ''}
        {f'<div class="summary-row"><span>Discount</span><span>-{currency}{data["discount_amount"]:,.2f}</span></div>' if data['discount_amount'] > 0 else ''}
        <div class="summary-row total">
          <span>Amount Due</span>
          <span>{currency}{data['total_amount']:,.2f}</span>
        </div>
      </div>
    </div>

    <div class="footer-note">
      <p>{data.get('notes') or biz.get('notes', 'Thank you for shopping with us!')}</p>
      <p style="margin-top: 6px; font-size: 11px; color: #94a3b8;">Generated via DukaanPilot AI &bull; Less paperwork. More profit.</p>
    </div>
  </div>
</body>
</html>
"""
