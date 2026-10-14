from backend.app.database import get_db

def get_analytics_summary():
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Currency symbol from profile
        cursor.execute("SELECT currency_symbol FROM business_profile WHERE id = 1;")
        prof = cursor.fetchone()
        currency_symbol = prof["currency_symbol"] if prof else "₹"
        
        # Revenue from valid orders (not cancelled)
        cursor.execute("""
            SELECT 
                COALESCE(SUM(total_amount), 0.0) as revenue,
                COUNT(id) as total_orders
            FROM orders 
            WHERE order_status != 'Cancelled';
        """)
        rev_row = cursor.fetchone()
        total_revenue = float(rev_row["revenue"])
        total_orders_count = int(rev_row["total_orders"])
        
        # Delivered orders count
        cursor.execute("SELECT COUNT(id) as delivered_cnt FROM orders WHERE order_status = 'Delivered';")
        delivered_orders_count = int(cursor.fetchone()["delivered_cnt"])

        # Pending orders count
        cursor.execute("SELECT COUNT(id) as pending_cnt FROM orders WHERE order_status = 'Pending';")
        pending_orders_count = int(cursor.fetchone()["pending_cnt"])
        
        # Pending payments (Unpaid or Partial, excluding Cancelled)
        cursor.execute("""
            SELECT COALESCE(SUM(total_amount), 0.0) as pending_rev 
            FROM orders 
            WHERE payment_status IN ('Unpaid', 'Partial') AND order_status != 'Cancelled';
        """)
        pending_payments = float(cursor.fetchone()["pending_rev"])
        
        # Total expenses
        cursor.execute("SELECT COALESCE(SUM(amount), 0.0) as expenses FROM expenses;")
        total_expenses = float(cursor.fetchone()["expenses"])
        
        # Estimated Net Profit
        estimated_profit = round(total_revenue - total_expenses, 2)
        profit_margin = round((estimated_profit / total_revenue * 100), 1) if total_revenue > 0 else 0.0
        
        return {
            "total_revenue": total_revenue,
            "total_expenses": total_expenses,
            "estimated_profit": estimated_profit,
            "pending_payments": pending_payments,
            "total_orders_count": total_orders_count,
            "delivered_orders_count": delivered_orders_count,
            "pending_orders_count": pending_orders_count,
            "profit_margin_percent": profit_margin,
            "currency_symbol": currency_symbol
        }

def get_top_products(limit=5):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT 
                product_name,
                SUM(quantity) as quantity_sold,
                SUM(total_amount) as total_revenue
            FROM orders
            WHERE order_status != 'Cancelled'
            GROUP BY product_name
            ORDER BY SUM(total_amount) DESC, product_name ASC
            LIMIT ?;
        """, (limit,))
        
        return [
            {
                "product_name": row["product_name"],
                "quantity_sold": int(row["quantity_sold"]),
                "total_revenue": float(row["total_revenue"])
            }
            for row in cursor.fetchall()
        ]

def get_expenses_by_category():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COALESCE(SUM(amount), 0.0) as total FROM expenses;")
        total = float(cursor.fetchone()["total"])
        
        cursor.execute("""
            SELECT category, SUM(amount) as cat_total
            FROM expenses
            GROUP BY category
            ORDER BY cat_total DESC;
        """)
        rows = cursor.fetchall()
        
        return [
            {
                "category": r["category"],
                "total_amount": float(r["cat_total"]),
                "percentage": round((float(r["cat_total"]) / total * 100), 1) if total > 0 else 0.0
            }
            for r in rows
        ]

def get_financial_trends():
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Fetch daily order totals
        cursor.execute("""
            SELECT date(created_at) as day, SUM(total_amount) as rev
            FROM orders
            WHERE order_status != 'Cancelled'
            GROUP BY date(created_at)
            ORDER BY day ASC;
        """)
        order_days = {r["day"]: float(r["rev"]) for r in cursor.fetchall()}
        
        # Fetch daily expense totals
        cursor.execute("""
            SELECT date as day, SUM(amount) as exp
            FROM expenses
            GROUP BY date
            ORDER BY day ASC;
        """)
        expense_days = {r["day"]: float(r["exp"]) for r in cursor.fetchall()}
        
        all_days = sorted(list(set(list(order_days.keys()) + list(expense_days.keys()))))
        
        trends = []
        for day in all_days:
            rev = order_days.get(day, 0.0)
            exp = expense_days.get(day, 0.0)
            trends.append({
                "date": day,
                "revenue": rev,
                "expenses": exp,
                "profit": round(rev - exp, 2)
            })
        return trends

def get_business_recommendations():
    summary = get_analytics_summary()
    top_prods = get_top_products(1)
    expenses = get_expenses_by_category()
    
    recommendations = []
    
    # 1. Unpaid payment alerts
    if summary["pending_payments"] > 0:
        recommendations.append({
            "type": "warning",
            "title": "Payment Recovery Alert",
            "message": f"You have {summary['currency_symbol']}{summary['pending_payments']:,.2f} in unpaid orders. Send polite WhatsApp payment links to improve your cash flow.",
            "action": "View Pending Orders"
        })
        
    # 2. Profitability check
    if summary["total_revenue"] > 0:
        if summary["profit_margin_percent"] < 25:
            recommendations.append({
                "type": "caution",
                "title": "Margin Compression Notice",
                "message": f"Your current net profit margin is {summary['profit_margin_percent']}%. Review packaging and shipping fees to keep margins above 35%.",
                "action": "Review Expenses"
            })
        else:
            recommendations.append({
                "type": "success",
                "title": "Healthy Operating Margin",
                "message": f"Your business is running at an estimated {summary['profit_margin_percent']}% net margin! Reinvest a portion into Instagram influencer gifting.",
                "action": "View Insights"
            })

    # 3. Best seller boost
    if top_prods:
        best = top_prods[0]
        recommendations.append({
            "type": "opportunity",
            "title": "Star Product Detected",
            "message": f"'{best['product_name']}' is your #1 revenue generator ({summary['currency_symbol']}{best['total_revenue']:,.2f}). Bundle it with lower-selling accessories to lift average order value.",
            "action": "Promote Item"
        })
        
    # 4. Top expense category
    if expenses:
        top_exp = expenses[0]
        recommendations.append({
            "type": "info",
            "title": "Cost Concentration",
            "message": f"'{top_exp['category']}' accounts for {top_exp['percentage']}% of your total spending. Sourcing in higher bulk could unlock vendor discounts.",
            "action": "Analyze Costs"
        })
        
    return recommendations

def get_low_stock_alerts():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT sku, product_name, stock_quantity, low_stock_threshold, category
            FROM inventory
            WHERE stock_quantity <= low_stock_threshold
            ORDER BY stock_quantity ASC;
        """)
        return [dict(r) for r in cursor.fetchall()]
