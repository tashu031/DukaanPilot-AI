
import json
import logging
import re
from typing import Any, Dict, Optional, Tuple

import httpx

from backend.app.config import (
    OLLAMA_BASE_URL,
    OLLAMA_MODEL,
    OLLAMA_TIMEOUT,
)
from backend.app.database import get_db
from backend.app.services.analytics_service import (
    get_analytics_summary,
    get_top_products,
    get_expenses_by_category,
    get_low_stock_alerts,
)

logger = logging.getLogger("dukaanpilot.ai")


async def check_ollama_status() -> Dict[str, Any]:
    """Check whether Ollama and the configured model are available."""
    try:
        async with httpx.AsyncClient(timeout=1.5) as client:
            response = await client.get(f"{OLLAMA_BASE_URL}/api/tags")

            if response.status_code == 200:
                models_data = response.json()
                models = [
                    model.get("name", "")
                    for model in models_data.get("models", [])
                ]
                model_found = any(
                    name == OLLAMA_MODEL
                    or name.startswith(f"{OLLAMA_MODEL}:")
                    for name in models
                )

                return {
                    "available": True,
                    "model": OLLAMA_MODEL,
                    "model_installed": model_found,
                    "all_installed_models": models,
                    "details": "Ollama local inference service connected.",
                }

    except Exception as exc:
        logger.debug("Ollama check failed: %s", exc)

    return {
        "available": False,
        "model": OLLAMA_MODEL,
        "model_installed": False,
        "all_installed_models": [],
        "details": (
            "Ollama is unavailable. "
            "DukaanPilot is operating in Deterministic Mode."
        ),
    }


def deterministic_order_parse(text: str) -> Dict[str, Any]:
    """Extract basic order details from a seller's message."""
    cleaned = text.strip()

    customer_name = "Walk-in Customer"

    name_match = re.search(
        r"^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+"
        r"(?:ordered|wants|booked|bought|needs|purchased)",
        cleaned,
        re.IGNORECASE,
    )

    if name_match:
        customer_name = name_match.group(1).title()
    else:
        name_prefix = re.search(
            r"(?:customer|client|from|buyer|name)[:\s]+"
            r"([A-Za-z\s]+?)(?:,|ordered|\.|\n|$)",
            cleaned,
            re.IGNORECASE,
        )
        if name_prefix:
            customer_name = name_prefix.group(1).strip().title()

    contact = None
    phone_match = re.search(
        r"(?:\+?\d{1,3}[-.\s]?)?"
        r"(?:\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})"
        r"|\b[6-9]\d{9}\b",
        cleaned,
    )
    if phone_match:
        contact = phone_match.group(0).strip()

    quantity = 1
    qty_match = re.search(
        r"\b(\d+)\s*(?:pcs|pieces|units|items|sets?|x)?\b",
        cleaned,
        re.IGNORECASE,
    )
    if qty_match:
        value = int(qty_match.group(1))
        if 1 <= value < 100:
            quantity = value

    word_num_map = {
        "one": 1,
        "two": 2,
        "three": 3,
        "four": 4,
        "five": 5,
        "six": 6,
        "ten": 10,
        "dozen": 12,
    }
    for word, number in word_num_map.items():
        if re.search(rf"\b{word}\b", cleaned, re.IGNORECASE):
            quantity = number
            break

    unit_price = 0.0
    price_match = re.search(
        r"(?:at|@|rs\.?|inr|₹)\s*(\d+(?:\.\d{1,2})?)"
        r"(?:\s*(?:each|per\s+item|pc|piece|/-))?",
        cleaned,
        re.IGNORECASE,
    )

    if price_match:
        unit_price = float(price_match.group(1))
    else:
        alt_price = re.search(
            r"(\d+(?:\.\d{1,2})?)\s*(?:/-|rs|rupees)",
            cleaned,
            re.IGNORECASE,
        )
        if alt_price:
            unit_price = float(alt_price.group(1))

    product_name = "Handcrafted Item"
    product_match = re.search(
        r"(?:ordered|bought|booked|wants|purchased)\s+"
        r"(?:\d+\s+)?(.+?)"
        r"(?:\s+(?:at|@|for|rs\.?|inr|₹|delivery|status|paid|unpaid)"
        r"|[,.]|$)",
        cleaned,
        re.IGNORECASE,
    )

    if product_match:
        product = product_match.group(1).strip()
        product = re.sub(
            r"^(?:of|x|the|a|an)\s+",
            "",
            product,
            flags=re.IGNORECASE,
        )
        if len(product) > 2:
            product_name = product.title()
    else:
        product_name = "Custom Order Item"

    order_status = "Pending"
    if re.search(r"\b(shipped|dispatched|in transit)\b", cleaned, re.I):
        order_status = "Shipped"
    elif re.search(r"\b(delivered|completed|received)\b", cleaned, re.I):
        order_status = "Delivered"
    elif re.search(r"\b(confirmed|accepted)\b", cleaned, re.I):
        order_status = "Confirmed"
    elif re.search(r"\b(cancelled|rejected)\b", cleaned, re.I):
        order_status = "Cancelled"

    payment_status = "Unpaid"
    if (
        re.search(
            r"\b(paid|payment received|done via upi|gpay done)\b",
            cleaned,
            re.IGNORECASE,
        )
        and not re.search(
            r"\b(unpaid|not paid|pending payment)\b",
            cleaned,
            re.IGNORECASE,
        )
    ):
        payment_status = "Paid"
    elif re.search(
        r"\b(half paid|partial|advance paid|deposit)\b",
        cleaned,
        re.IGNORECASE,
    ):
        payment_status = "Partial"

    total_amount = round(quantity * unit_price, 2)

    return {
        "customer_name": customer_name,
        "customer_contact": contact,
        "product_name": product_name,
        "quantity": max(1, quantity),
        "unit_price": max(0.0, unit_price),
        "total_amount": total_amount,
        "order_status": order_status,
        "payment_status": payment_status,
        "notes": f"Extracted from note: '{cleaned}'",
    }


async def extract_order_with_ai(
    text: str,
) -> Tuple[Dict[str, Any], str, float]:
    """Use local Gemma for order extraction, with a deterministic fallback."""
    status = await check_ollama_status()

    if status["available"] and status["model_installed"]:
        prompt = f"""
You are DukaanPilot AI. Extract order details from the seller message.
Return only valid JSON with these fields:
customer_name, customer_contact, product_name, quantity,
unit_price, total_amount, order_status, payment_status, notes.

Use valid values:
order_status: Pending, Confirmed, Shipped, Delivered, Cancelled.
payment_status: Paid, Partial, Unpaid.

Seller message: {json.dumps(text)}
"""

        try:
            async with httpx.AsyncClient(timeout=OLLAMA_TIMEOUT) as client:
                response = await client.post(
                    f"{OLLAMA_BASE_URL}/api/generate",
                    json={
                        "model": OLLAMA_MODEL,
                        "prompt": prompt,
                        "stream": False,
                        "format": "json",
                    },
                )
                response.raise_for_status()
                data = json.loads(response.json().get("response", ""))

                quantity = max(1, int(data.get("quantity", 1)))
                unit_price = max(0.0, float(data.get("unit_price", 0.0)))

                data["quantity"] = quantity
                data["unit_price"] = unit_price
                data["total_amount"] = round(quantity * unit_price, 2)

                return data, f"Gemma ({OLLAMA_MODEL})", 0.95

        except Exception as exc:
            logger.warning(
                "Ollama extraction failed; using rule engine: %s",
                exc,
            )

    draft = deterministic_order_parse(text)
    return draft, "Deterministic Rule-based Engine", 0.88


async def answer_business_assistant_query(
    query: str,
) -> Dict[str, Any]:
    """
    Answer business questions using verified database analytics.
    Financial figures are obtained from existing analytics services.
    """
    q_lower = re.sub(r"\s+", " ", query.lower()).strip()

    summary = get_analytics_summary()
    currency = summary.get("currency_symbol") or "₹"

    def make_response(
        reply: str,
        actions: list,
        context: Dict[str, Any],
    ) -> Dict[str, Any]:
        return {
            "reply": reply,
            "source_mode": "Deterministic Business Intelligence Engine",
            "suggested_actions": actions,
            "context_data": context,
        }

    # 1. Top products: check this before general financial questions.
    product_keywords = (
        "top product",
        "top products",
        "top 5",
        "most revenue",
        "best selling",
        "best-selling",
        "popular product",
        "popular products",
        "top selling",
        "top sellers",
        "highest revenue",
        "ranked by actual revenue",
        "products generated",
        "product revenue",
        "which products",
    )

    if any(keyword in q_lower for keyword in product_keywords):
        top_products = get_top_products(5) or []

        if not top_products:
            reply = (
                "No product sales data was returned by the analytics service. "
                "Please check your recorded orders."
            )
        else:
            product_lines = []
            for index, product in enumerate(top_products, start=1):
                name = product.get("product_name", "Unknown product")
                revenue = float(product.get("total_revenue") or 0)
                quantity = int(product.get("quantity_sold") or 0)

                product_lines.append(
                    f"{index}. **{name}** — "
                    f"{currency}{revenue:,.2f} revenue "
                    f"({quantity} units sold)"
                )

            first = top_products[0]
            reply = (
                "**Top 5 products by recorded revenue**\n\n"
                + "\n".join(product_lines)
                + "\n\n"
                + f"**Total store revenue:** "
                + f"{currency}{summary['total_revenue']:,.2f}\n"
                + f"**Recorded expenses:** "
                + f"{currency}{summary['total_expenses']:,.2f}\n"
                + f"**Estimated profit:** "
                + f"{currency}{summary['estimated_profit']:,.2f}"
            )

        return make_response(
            reply,
            ["View Products", "Manage Inventory", "View Insights"],
            {
                "top_products": top_products,
                "total_revenue": summary["total_revenue"],
                "total_expenses": summary["total_expenses"],
                "estimated_profit": summary["estimated_profit"],
            },
        )

    # 2. Orders awaiting delivery.
    if any(
        keyword in q_lower
        for keyword in (
            "awaiting delivery",
            "pending delivery",
            "pending orders",
            "not delivered",
            "undelivered",
            "orders to ship",
        )
    ):
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT order_number, customer_name, product_name, quantity,
                       total_amount, order_status, created_at
                FROM orders
                WHERE order_status IN ('Pending', 'Confirmed')
                ORDER BY created_at DESC
                """
            )
            orders = [dict(row) for row in cursor.fetchall()]

        if not orders:
            reply = "There are currently no orders awaiting delivery."
        else:
            lines = [
                f"- **{order['order_number']}** "
                f"({order['customer_name']}): "
                f"{order['quantity']} x {order['product_name']} — "
                f"{currency}{order['total_amount']:,.2f}; "
                f"Status: {order['order_status']}"
                for order in orders
            ]
            reply = (
                f"You have **{len(orders)} order(s)** awaiting fulfillment:\n\n"
                + "\n".join(lines)
            )

        return make_response(
            reply,
            ["View Orders", "Filter by Pending", "Generate Invoices"],
            {"pending_orders_count": len(orders), "orders": orders},
        )

    # 3. Pending payments.
    if any(
        keyword in q_lower
        for keyword in (
            "pending payment",
            "pending payments",
            "unpaid",
            "who owes",
            "pending money",
            "payment recovery",
            "amount due",
            "customers have pending",
        )
    ):
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT order_number, customer_name, customer_contact,
                       total_amount, payment_status, created_at
                FROM orders
                WHERE payment_status IN ('Unpaid', 'Partial')
                  AND order_status != 'Cancelled'
                ORDER BY created_at ASC
                """
            )
            unpaid_orders = [dict(row) for row in cursor.fetchall()]

        total_unpaid = sum(
            float(order.get("total_amount") or 0)
            for order in unpaid_orders
        )

        if not unpaid_orders:
            reply = f"No pending payments were found. Total due: {currency}0.00."
        else:
            lines = [
                f"- **{order['customer_name']}** "
                f"({order.get('customer_contact') or 'No phone'}): "
                f"{currency}{order['total_amount']:,.2f} — "
                f"Order {order['order_number']} "
                f"({order['payment_status']})"
                for order in unpaid_orders
            ]
            reply = (
                f"**Pending payment total: {currency}{total_unpaid:,.2f}**\n\n"
                + "\n".join(lines)
            )

        return make_response(
            reply,
            ["View Orders", "View Invoices", "Payment Recovery"],
            {
                "pending_total": total_unpaid,
                "unpaid_orders": unpaid_orders,
            },
        )

    # 4. Expenses.
    if any(
        keyword in q_lower
        for keyword in (
            "expense",
            "expenses",
            "spending",
            "how much spent",
            "cost",
            "expenditure",
        )
    ):
        expenses_by_category = get_expenses_by_category() or []
        total_expenses = float(summary["total_expenses"])

        if total_expenses == 0:
            reply = "You have recorded ₹0.00 in expenses so far."
        else:
            lines = [
                f"- **{item['category']}**: "
                f"{currency}{item['total_amount']:,.2f} "
                f"({item.get('percentage', 0)}%)"
                for item in expenses_by_category
            ]
            reply = (
                f"Your recorded expenses total "
                f"**{currency}{total_expenses:,.2f}**."
            )
            if lines:
                reply += "\n\n**Breakdown by category:**\n\n" + "\n".join(lines)

            if "this month" in q_lower:
                reply += (
                    "\n\nNote: This figure is the total returned by the "
                    "current analytics service; a month-specific filter "
                    "has not been applied."
                )

        return make_response(
            reply,
            ["Add Expense", "View Expenses Breakdown", "Export Costs"],
            {
                "total_expenses": total_expenses,
                "categories": expenses_by_category,
            },
        )

    # 5. Profit, revenue, or margin questions.
    if any(
        keyword in q_lower
        for keyword in (
            "profit",
            "net profit",
            "margin",
            "how much did i make",
            "earnings",
            "total revenue",
            "store revenue",
            "revenue summary",
        )
    ):
        reply = (
            "Here is your financial summary:\n\n"
            f"- **Total Revenue:** {currency}{summary['total_revenue']:,.2f}\n"
            f"- **Total Recorded Expenses:** "
            f"{currency}{summary['total_expenses']:,.2f}\n"
            f"- **Estimated Net Profit:** "
            f"**{currency}{summary['estimated_profit']:,.2f}**\n"
            f"- **Net Profit Margin:** "
            f"**{summary['profit_margin_percent']}%**\n\n"
            "Calculations use the figures returned by the current "
            "analytics service."
        )

        return make_response(
            reply,
            ["View Insights", "Log Supplier Costs", "Download Summary"],
            summary,
        )

    # 6. Low-stock and inventory questions.
    if any(
        keyword in q_lower
        for keyword in ("stock", "inventory", "low stock", "out of stock")
    ):
        low_items = get_low_stock_alerts() or []

        if not low_items:
            reply = (
                "No low-stock items were returned by the inventory service."
            )
        else:
            lines = [
                f"- **{item['product_name']}** ({item['sku']}): "
                f"{item['stock_quantity']} left; "
                f"threshold: {item['low_stock_threshold']}"
                for item in low_items
            ]
            reply = (
                f"**Low-stock items: {len(low_items)}**\n\n"
                + "\n".join(lines)
            )

        return make_response(
            reply,
            ["Restock Inventory", "View Products"],
            {"low_stock_items": low_items},
        )

    # 7. General question: try Gemma if the model is available.
    status = await check_ollama_status()

    if status["available"] and status["model_installed"]:
        prompt = f"""
You are DukaanPilot AI, an assistant for small businesses.

Use only the verified business summary below for financial facts.
Do not invent figures or claim to have product-level data that was not supplied.

Verified summary:
{json.dumps(summary, ensure_ascii=False, default=str)}

User question:
{query}

Answer concisely. If the available summary does not answer the question,
say which data is missing.
"""
        try:
            async with httpx.AsyncClient(timeout=OLLAMA_TIMEOUT) as client:
                response = await client.post(
                    f"{OLLAMA_BASE_URL}/api/generate",
                    json={
                        "model": OLLAMA_MODEL,
                        "prompt": prompt,
                        "stream": False,
                    },
                )
                response.raise_for_status()
                llm_text = response.json().get("response", "").strip()

                if llm_text:
                    return {
                        "reply": llm_text,
                        "source_mode": f"Gemma ({OLLAMA_MODEL} via Ollama)",
                        "suggested_actions": [
                            "View Dashboard",
                            "Ask Another Question",
                        ],
                        "context_data": summary,
                    }

        except Exception as exc:
            logger.warning("Ollama query failed: %s", exc)

    # 8. Deterministic general overview.
    reply = (
        "Here is a snapshot of your recorded business data:\n\n"
        f"- **Total Revenue:** {currency}{summary['total_revenue']:,.2f}\n"
        f"- **Recorded Expenses:** {currency}{summary['total_expenses']:,.2f}\n"
        f"- **Estimated Profit:** {currency}{summary['estimated_profit']:,.2f}\n"
        f"- **Pending Payments:** {currency}{summary['pending_payments']:,.2f}\n"
        f"- **Delivered Orders:** {summary['delivered_orders_count']} / "
        f"{summary['total_orders_count']}\n\n"
        "You can ask about top products, expenses, pending deliveries, "
        "pending payments, profit, or inventory."
    )

    return make_response(
        reply,
        ["Top Products", "Pending Deliveries", "Pending Payments", "Profit Margin"],
        summary,
    )
