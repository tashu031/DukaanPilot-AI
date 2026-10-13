import re
import json
import logging
import httpx
from typing import Dict, Any, Tuple, Optional
from datetime import datetime

from backend.app.config import OLLAMA_BASE_URL, OLLAMA_MODEL, OLLAMA_TIMEOUT
from backend.app.database import get_db
from backend.app.services.analytics_service import (
    get_analytics_summary,
    get_top_products,
    get_expenses_by_category,
    get_low_stock_alerts
)

logger = logging.getLogger("dukaanpilot.ai")

async def check_ollama_status() -> Dict[str, Any]:
    """Check if Ollama server is running and accessible."""
    try:
        async with httpx.AsyncClient(timeout=1.5) as client:
            resp = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
            if resp.status_code == 200:
                models_data = resp.json()
                models = [m.get("name") for m in models_data.get("models", [])]
                model_found = any(OLLAMA_MODEL in m for m in models)
                return {
                    "available": True,
                    "model": OLLAMA_MODEL,
                    "model_installed": model_found,
                    "all_installed_models": models,
                    "details": "Ollama local inference service connected."
                }
    except Exception as e:
        logger.debug(f"Ollama check failed: {e}")
        
    return {
        "available": False,
        "model": OLLAMA_MODEL,
        "model_installed": False,
        "all_installed_models": [],
        "details": "Ollama is not running locally or port 11434 unreachable. DukaanPilot is operating in high-precision Deterministic Mode."
    }

def deterministic_order_parse(text: str) -> Dict[str, Any]:
    """
    Deterministic rule-based extractor for unstructured seller text.
    Handles inputs like: 'Priya ordered 2 handmade bracelets at ₹350 each, delivery pending.'
    """
    cleaned = text.strip()
    
    # 1. Customer Name extraction
    customer_name = "Walk-in Customer"
    name_match = re.search(r"^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:ordered|wants|booked|bought|needs|purchased)", cleaned, re.IGNORECASE)
    if name_match:
        customer_name = name_match.group(1).title()
    else:
        # Fallback customer name search
        name_prefix = re.search(r"(?:customer|client|from|buyer|name)[:\s]+([A-Za-z\s]+?)(?:,|ordered|\.|\n|$)", cleaned, re.IGNORECASE)
        if name_prefix:
            customer_name = name_prefix.group(1).strip().title()

    # 2. Contact extraction (Phone number)
    contact = None
    phone_match = re.search(r"(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\b[6-9]\d{9}\b", cleaned)
    if phone_match:
        contact = phone_match.group(0).strip()

    # 3. Quantity extraction
    quantity = 1
    # Check words or digits before item
    qty_match = re.search(r"\b(\d+)\s*(?:pcs|pieces|units|items|set|sets)?\b(?:\s+(?:of|x))?", cleaned, re.IGNORECASE)
    # Check if number is not a price
    if qty_match:
        val = int(qty_match.group(1))
        # Ensure it's not a price like 350
        if val < 100:
            quantity = val
            
    word_num_map = {"one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6, "ten": 10, "dozen": 12}
    for word, num in word_num_map.items():
        if re.search(rf"\b{word}\b", cleaned, re.IGNORECASE):
            quantity = num
            break

    # 4. Unit Price extraction
    unit_price = 0.0
    price_match = re.search(r"(?:at|@|rs\.?|inr|₹)\s*(\d+(?:\.\d{1,2})?)(?:\s*(?:each|per\s+item|pc|piece|/-))?", cleaned, re.IGNORECASE)
    if price_match:
        unit_price = float(price_match.group(1))
    else:
        # Look for standalone number with /- or rs
        alt_price = re.search(r"(\d+)\s*(?:/-|rs|rupees)", cleaned, re.IGNORECASE)
        if alt_price:
            unit_price = float(alt_price.group(1))

    # 5. Product Name extraction
    # Strip customer prefix and price suffix
    product_name = "Handcrafted Item"
    cleaned_lower = cleaned
    
    # Try pattern: [Name] ordered [Qty] [Product Name] at/for/with...
    pattern = re.search(r"(?:ordered|bought|booked|wants|purchased)\s+(?:\d+\s+)?(.+?)(?:\s+(?:at|@|for|rs\.?|inr|₹|delivery|status|paid|unpaid|\.|\,)|$)", cleaned, re.IGNORECASE)
    if pattern:
        prod = pattern.group(1).strip()
        # Clean any trailing connector words
        prod = re.sub(r"^(?:of|x|the|a|an)\s+", "", prod, flags=re.IGNORECASE)
        if len(prod) > 2:
            product_name = prod.title()
    else:
        # Generic heuristic
        product_name = "Custom Order Item"

    # 6. Order Status
    order_status = "Pending"
    if re.search(r"\b(shipped|dispatched|in transit)\b", cleaned, re.IGNORECASE):
        order_status = "Shipped"
    elif re.search(r"\b(delivered|completed|received)\b", cleaned, re.IGNORECASE):
        order_status = "Delivered"
    elif re.search(r"\b(confirmed|accepted)\b", cleaned, re.IGNORECASE):
        order_status = "Confirmed"
    elif re.search(r"\b(cancelled|rejected)\b", cleaned, re.IGNORECASE):
        order_status = "Cancelled"

    # 7. Payment Status
    payment_status = "Unpaid"
    if re.search(r"\b(paid|payment received|done via upi|gpay done)\b", cleaned, re.IGNORECASE) and not re.search(r"unpaid|not paid|pending payment", cleaned, re.IGNORECASE):
        payment_status = "Paid"
    elif re.search(r"\b(half paid|partial|advance paid|deposit)\b", cleaned, re.IGNORECASE):
        payment_status = "Partial"

    total_amount = round(quantity * unit_price, 2) if unit_price > 0 else 0.0

    return {
        "customer_name": customer_name,
        "customer_contact": contact,
        "product_name": product_name,
        "quantity": max(1, quantity),
        "unit_price": unit_price,
        "total_amount": total_amount,
        "order_status": order_status,
        "payment_status": payment_status,
        "notes": f"Extracted from note: '{cleaned}'"
    }

async def extract_order_with_ai(text: str) -> Tuple[Dict[str, Any], str, float]:
    """
    Attempt extraction with local Gemma via Ollama, fallback to deterministic parser.
    Returns: (draft_data, source_model_label, confidence_score)
    """
    status = await check_ollama_status()
    
    if status["available"]:
        prompt = f"""You are DukaanPilot AI, extracting structured order details from a seller's message.
Return ONLY valid JSON matching this schema:
{{
  "customer_name": "string",
  "customer_contact": "string or null",
  "product_name": "string",
  "quantity": integer,
  "unit_price": float,
  "total_amount": float,
  "order_status": "Pending" | "Confirmed" | "Shipped" | "Delivered" | "Cancelled",
  "payment_status": "Paid" | "Partial" | "Unpaid",
  "notes": "string"
}}

Seller text: "{text}"
JSON:"""
        try:
            async with httpx.AsyncClient(timeout=OLLAMA_TIMEOUT) as client:
                resp = await client.post(
                    f"{OLLAMA_BASE_URL}/api/generate",
                    json={
                        "model": OLLAMA_MODEL,
                        "prompt": prompt,
                        "stream": False,
                        "format": "json"
                    }
                )
                if resp.status_code == 200:
                    raw_reply = resp.json().get("response", "")
                    data = json.loads(raw_reply)
                    
                    # Validate & ensure mathematical consistency
                    qty = int(data.get("quantity", 1))
                    price = float(data.get("unit_price", 0.0))
                    data["quantity"] = max(1, qty)
                    data["unit_price"] = max(0.0, price)
                    data["total_amount"] = round(qty * price, 2)
                    return data, f"Gemma ({OLLAMA_MODEL})", 0.95
        except Exception as e:
            logger.warning(f"Ollama extraction failed or timed out: {e}. Falling back to deterministic rule engine.")

    # Fallback to Deterministic Engine
    draft = deterministic_order_parse(text)
    return draft, "Deterministic Rule-based Engine", 0.88

async def answer_business_assistant_query(query: str) -> Dict[str, Any]:
    """
    Processes business queries against verified database facts with zero financial hallucination.
    """
    q_lower = query.lower()
    summary = get_analytics_summary()
    currency = summary["currency_symbol"]
    
    # 1. Orders awaiting delivery / Pending delivery
    if any(k in q_lower for k in ["awaiting delivery", "pending delivery", "pending orders", "not delivered", "undelivered", "orders to ship"]):
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT order_number, customer_name, product_name, quantity, total_amount, order_status, created_at
                FROM orders
                WHERE order_status IN ('Pending', 'Confirmed')
                ORDER BY created_at DESC;
            """)
            orders = [dict(r) for r in cursor.fetchall()]
            
        if not orders:
            reply = f"Great news! There are currently **0 orders awaiting delivery**. All your active customer orders are either already shipped or delivered."
        else:
            list_md = "\n".join([f"- **{o['order_number']}** ({o['customer_name']}): {o['quantity']}x {o['product_name']} ({currency}{o['total_amount']:,.2f}) — Status: *{o['order_status']}*" for o in orders])
            reply = f"You have **{len(orders)} order(s) awaiting delivery / fulfillment**:\n\n{list_md}\n\nTip: You can dispatch them and update their status to 'Shipped' in the Orders tab."
            
        return {
            "reply": reply,
            "source_mode": "Deterministic Business Intelligence Engine",
            "suggested_actions": ["View Orders", "Filter by Pending", "Generate Invoices"],
            "context_data": {"pending_orders_count": len(orders)}
        }

    # 2. Top products / Most revenue
    elif any(k in q_lower for k in ["most revenue", "top product", "best selling", "popular", "top selling", "highest revenue"]):
        top_prods = get_top_products(5)
        if not top_prods:
            reply = "No product sales data recorded yet. Create orders or load sample data to see top sellers!"
        else:
            list_md = "\n".join([f"{i+1}. **{p['product_name']}** — {currency}{p['total_revenue']:,.2f} total revenue ({p['quantity_sold']} units sold)" for i, p in enumerate(top_prods)])
            best = top_prods[0]
            reply = f"Your top revenue-generating product is **{best['product_name']}**, generating **{currency}{best['total_revenue']:,.2f}** ({best['quantity_sold']} units).\n\n**Top 5 Sellers:**\n{list_md}"
            
        return {
            "reply": reply,
            "source_mode": "Deterministic Business Intelligence Engine",
            "suggested_actions": ["View Products", "Manage Inventory", "Run Bundle Offer"],
            "context_data": {"top_products": top_prods}
        }

    # 3. Total expenses
    elif any(k in q_lower for k in ["expense", "expenses", "spending", "how much spent", "cost", "expenditure"]):
        expenses_by_cat = get_expenses_by_category()
        total_exp = summary["total_expenses"]
        
        if total_exp == 0.0:
            reply = f"You have recorded **{currency}0.00** in expenses so far."
        else:
            cat_md = "\n".join([f"- **{c['category']}**: {currency}{c['total_amount']:,.2f} ({c['percentage']}%)" for c in expenses_by_cat])
            reply = f"Your recorded expenses total **{currency}{total_exp:,.2f}**.\n\n**Breakdown by Category:**\n{cat_md}"
            
        return {
            "reply": reply,
            "source_mode": "Deterministic Business Intelligence Engine",
            "suggested_actions": ["Add Expense", "View Expenses Breakdown", "Export Costs"],
            "context_data": {"total_expenses": total_exp, "categories": expenses_by_cat}
        }

    # 4. Profit & Net Margin
    elif any(k in q_lower for k in ["profit", "net profit", "margin", "how much did i make", "earnings"]):
        rev = summary["total_revenue"]
        exp = summary["total_expenses"]
        prof = summary["estimated_profit"]
        margin = summary["profit_margin_percent"]
        
        reply = (
            f"Here is your financial profitability summary:\n\n"
            f"- **Total Revenue:** {currency}{rev:,.2f}\n"
            f"- **Total Recorded Expenses:** {currency}{exp:,.2f}\n"
            f"- **Estimated Net Profit:** **{currency}{prof:,.2f}**\n"
            f"- **Net Profit Margin:** **{margin}%**\n\n"
            f"*Note: Calculations are based strictly on recorded order totals minus recorded expenses. "
            f"Keep all supplier and shipping expenses up-to-date for exact figures.*"
        )
        return {
            "reply": reply,
            "source_mode": "Deterministic Business Intelligence Engine",
            "suggested_actions": ["View Insights", "Log Supplier Costs", "Download Summary"],
            "context_data": summary
        }

    # 5. Pending payments / Unpaid customers
    elif any(k in q_lower for k in ["pending payment", "unpaid", "who owes", "pending money", "payment recovery", "due"]):
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT order_number, customer_name, customer_contact, total_amount, payment_status, created_at
                FROM orders
                WHERE payment_status IN ('Unpaid', 'Partial') AND order_status != 'Cancelled'
                ORDER BY created_at ASC;
            """)
            unpaid_orders = [dict(r) for r in cursor.fetchall()]
            
        total_unpaid = sum(o["total_amount"] for o in unpaid_orders)
        if not unpaid_orders:
            reply = f"Congratulations! You have **{currency}0.00** in pending payments. All non-cancelled orders have been fully paid."
        else:
            list_md = "\n".join([f"- **{o['customer_name']}** ({o['customer_contact'] or 'No phone'}): {currency}{o['total_amount']:,.2f} for Order **{o['order_number']}**" for o in unpaid_orders])
            reply = f"You have **{currency}{total_unpaid:,.2f}** in pending payments across {len(unpaid_orders)} order(s):\n\n{list_md}\n\nTip: You can send them a polite WhatsApp reminder with your UPI ID."
            
        return {
            "reply": reply,
            "source_mode": "Deterministic Business Intelligence Engine",
            "suggested_actions": ["Send WhatsApp Reminder", "View Invoices", "Mark as Paid"],
            "context_data": {"pending_total": total_unpaid, "unpaid_orders": unpaid_orders}
        }

    # 6. Low stock alerts
    elif any(k in q_lower for k in ["stock", "inventory", "low stock", "out of stock"]):
        low_items = get_low_stock_alerts()
        if not low_items:
            reply = "All inventory items are currently above their minimum safety thresholds. None are low in stock."
        else:
            items_md = "\n".join([f"- **{i['product_name']}** ({i['sku']}): Only **{i['stock_quantity']}** left (Safety threshold: {i['low_stock_threshold']})" for i in low_items])
            reply = f"⚠️ **Low Stock Alert:** You have **{len(low_items)}** item(s) running low:\n\n{items_md}\n\nConsider restocking soon to avoid stockouts on social media!"
            
        return {
            "reply": reply,
            "source_mode": "Deterministic Business Intelligence Engine",
            "suggested_actions": ["Restock Inventory", "View Products"],
            "context_data": {"low_stock_items": low_items}
        }

    # 7. General business query / Fallback with Ollama if running
    else:
        status = await check_ollama_status()
        if status["available"]:
            # Pass verified context into local Gemma
            system_prompt = f"""You are DukaanPilot AI, a business assistant for Indian online micro-businesses and boutique sellers.
Database Summary:
- Total Revenue: {currency}{summary['total_revenue']}
- Total Expenses: {currency}{summary['total_expenses']}
- Estimated Profit: {currency}{summary['estimated_profit']} ({summary['profit_margin_percent']}%)
- Pending Payments: {currency}{summary['pending_payments']}
- Total Orders: {summary['total_orders_count']}

User query: "{query}"

Answer concisely and accurately based on these business facts. Never fabricate financial figures."""
            try:
                async with httpx.AsyncClient(timeout=OLLAMA_TIMEOUT) as client:
                    resp = await client.post(
                        f"{OLLAMA_BASE_URL}/api/generate",
                        json={
                            "model": OLLAMA_MODEL,
                            "prompt": system_prompt,
                            "stream": False
                        }
                    )
                    if resp.status_code == 200:
                        llm_text = resp.json().get("response", "")
                        return {
                            "reply": llm_text,
                            "source_mode": f"Gemma ({OLLAMA_MODEL} via Ollama)",
                            "suggested_actions": ["View Dashboard", "Ask Another Question"],
                            "context_data": summary
                        }
            except Exception:
                pass
                
        # Deterministic general overview
        reply = (
            f"Here is a quick snapshot of your business status:\n\n"
            f"- **Total Revenue:** {currency}{summary['total_revenue']:,.2f}\n"
            f"- **Recorded Expenses:** {currency}{summary['total_expenses']:,.2f}\n"
            f"- **Net Profit:** {currency}{summary['estimated_profit']:,.2f}\n"
            f"- **Pending Payments:** {currency}{summary['pending_payments']:,.2f}\n"
            f"- **Delivered Orders:** {summary['delivered_orders_count']} / {summary['total_orders_count']}\n\n"
            f"You can ask me questions like:\n"
            f"1. *Which products generated the most revenue?*\n"
            f"2. *What are my total expenses this month?*\n"
            f"3. *Which orders are awaiting delivery?*\n"
            f"4. *Which customers have pending payments?*"
        )
        return {
            "reply": reply,
            "source_mode": "Deterministic Business Intelligence Engine",
            "suggested_actions": ["Top Products", "Pending Deliveries", "Pending Payments", "Profit Margin"],
            "context_data": summary
        }
