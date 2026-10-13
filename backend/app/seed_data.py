from datetime import datetime, timedelta
from backend.app.database import get_db

def seed_sample_data():
    today = datetime.now()
    d = lambda days_ago: (today - timedelta(days=days_ago)).strftime("%Y-%m-%d")
    
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Clear existing non-profile records
        cursor.execute("DELETE FROM invoices;")
        cursor.execute("DELETE FROM orders;")
        cursor.execute("DELETE FROM expenses;")
        cursor.execute("DELETE FROM inventory;")
        
        # 1. Update Profile
        now_iso = datetime.now().isoformat()
        cursor.execute("""
        UPDATE business_profile SET
            business_name = 'Aura Artisans',
            owner_name = 'Aditi Sharma',
            tagline = 'Handcrafted Jewellery & Keepsakes',
            email = 'aditi@auraartisans.in',
            phone = '+91 98200 12345',
            upi_id = 'auraartisans@okaxis',
            currency_symbol = '₹',
            currency_code = 'INR',
            address = 'Bandra West, Mumbai, MH 400050',
            invoice_prefix = 'AA-INV-',
            notes = 'Handmade with love. For queries or exchanges, WhatsApp us at +91 98200 12345.',
            updated_at = ?
        WHERE id = 1;
        """, (now_iso,))
        
        # 2. Insert Inventory items
        inventory_items = [
            ("SKU-JW-01", "Kundan Choker Set", 450.0, 1250.0, 8, 4, "Jewellery"),
            ("SKU-JW-02", "Resin Pressed Floral Earrings", 120.0, 399.0, 3, 5, "Earrings"), # Low stock!
            ("SKU-JW-03", "Handmade Terracotta Necklace", 280.0, 850.0, 12, 5, "Necklaces"),
            ("SKU-HM-04", "Boho Macrame Plant Hanger", 180.0, 599.0, 2, 4, "Home Decor"), # Low stock!
            ("SKU-JW-05", "Evil Eye Charm Bracelet", 95.0, 350.0, 15, 6, "Bracelets"),
            ("SKU-HM-06", "Scented Soy Wax Bubble Candle", 110.0, 450.0, 1, 3, "Candles"), # Low stock!
        ]
        
        for item in inventory_items:
            cursor.execute("""
            INSERT INTO inventory (sku, product_name, unit_cost, selling_price, stock_quantity, low_stock_threshold, category, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
            """, (item[0], item[1], item[2], item[3], item[4], item[5], item[6], now_iso, now_iso))
            
        # 3. Insert Orders
        orders = [
            ("ORD-1001", "Priya Nair", "+91 98111 22334", "Kundan Choker Set", 1, 1250.0, 1250.0, "Delivered", "Paid", "UPI", "Gift packaging requested with card", "Instagram DM", d(10)),
            ("ORD-1002", "Sneha Kapoor", "+91 98222 33445", "Resin Pressed Floral Earrings", 2, 399.0, 798.0, "Delivered", "Paid", "UPI", "Pink rose petals style", "WhatsApp Business", d(8)),
            ("ORD-1003", "Rohan Mehta", "+91 98333 44556", "Handmade Terracotta Necklace", 1, 850.0, 850.0, "Shipped", "Paid", "Card", "Tracking shared via SMS", "Website", d(6)),
            ("ORD-1004", "Ananya Verma", "+91 98444 55667", "Evil Eye Charm Bracelet", 3, 350.0, 1050.0, "Delivered", "Paid", "UPI", "Silver clasp requested", "Instagram DM", d(5)),
            ("ORD-1005", "Meera Joshi", "+91 98555 66778", "Boho Macrame Plant Hanger", 2, 599.0, 1198.0, "Confirmed", "Paid", "UPI", "Courier dispatch scheduled", "WhatsApp Business", d(3)),
            ("ORD-1006", "Vikram Singhal", "+91 98666 77889", "Kundan Choker Set", 1, 1250.0, 1250.0, "Pending", "Unpaid", "Cash on Delivery", "Awaiting confirmation call", "WhatsApp Business", d(2)),
            ("ORD-1007", "Kavita Reddy", "+91 98777 88990", "Scented Soy Wax Bubble Candle", 2, 450.0, 900.0, "Pending", "Unpaid", "UPI", "Customer will scan QR code tonight", "Instagram DM", d(1)),
            ("ORD-1008", "Deepika Rao", "+91 98888 99001", "Resin Pressed Floral Earrings", 1, 399.0, 399.0, "Delivered", "Paid", "UPI", "Repeat customer, 5 star review", "Instagram DM", d(12)),
            ("ORD-1009", "Tanvi Desai", "+91 98999 00112", "Handmade Terracotta Necklace", 2, 850.0, 1700.0, "Delivered", "Paid", "UPI", "Festival bulk gift order", "WhatsApp Business", d(15)),
            ("ORD-1010", "Farah Khan", "+91 99000 11223", "Evil Eye Charm Bracelet", 2, 350.0, 700.0, "Confirmed", "Unpaid", "UPI", "Pending UPI payment screenshot", "Instagram DM", d(0)),
        ]
        
        for o in orders:
            cursor.execute("""
            INSERT INTO orders (
                order_number, customer_name, customer_contact, product_name, quantity,
                unit_price, total_amount, order_status, payment_status, payment_method,
                notes, source, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            """, (o[0], o[1], o[2], o[3], o[4], o[5], o[6], o[7], o[8], o[9], o[10], o[11], o[12], o[12]))
            
        # 4. Insert Expenses
        expenses = [
            ("Raw Materials", 1450.0, "Sourcing brass wire, jump rings and jewellery beads from Crawford Market", d(14), "UPI"),
            ("Packaging", 850.0, "100 pcs Kraft gift boxes and custom printed thank-you cards", d(11), "UPI"),
            ("Courier & Shipping", 620.0, "Delhivery surface pickup for 5 customer orders", d(7), "UPI"),
            ("Marketing & Ads", 1200.0, "Meta / Instagram Reel promo boost for festive collection", d(5), "Card"),
            ("Raw Materials", 950.0, "Organic soy wax flakes & essential lavender oils", d(4), "UPI"),
            ("Courier & Shipping", 380.0, "Shiprocket express courier charges for 3 parcel dispatches", d(2), "UPI"),
            ("Tools & Software", 499.0, "Canva Pro monthly subscription for social media graphics", d(9), "Card"),
        ]
        
        for e in expenses:
            cursor.execute("""
            INSERT INTO expenses (category, amount, description, date, payment_method, created_at)
            VALUES (?, ?, ?, ?, ?, ?);
            """, (e[0], e[1], e[2], e[3], e[4], e[3]))
            
        # 5. Insert an Invoice for Priya Nair (ORD-1001)
        cursor.execute("SELECT id, total_amount FROM orders WHERE order_number = 'ORD-1001';")
        first_order = cursor.fetchone()
        if first_order:
            cursor.execute("""
            INSERT INTO invoices (
                invoice_number, order_id, issue_date, due_date, status, subtotal, tax_amount, discount_amount, total_amount, notes, created_at
            ) VALUES (
                'AA-INV-1001', ?, ?, ?, 'Paid', ?, 0.0, 0.0, ?, 'Paid via UPI. Thank you for your business!', ?
            );
            """, (first_order["id"], d(10), d(3), first_order["total_amount"], first_order["total_amount"], d(10)))

def reset_all_data():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM invoices;")
        cursor.execute("DELETE FROM orders;")
        cursor.execute("DELETE FROM expenses;")
        cursor.execute("DELETE FROM inventory;")
