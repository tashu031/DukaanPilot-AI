
import sqlite3
import os
from contextlib import contextmanager
from datetime import datetime

from backend.app.config import DATABASE_PATH, DEMO_MODE


def get_connection():
    """Create a SQLite connection and ensure its parent directory exists."""
    db_dir = os.path.dirname(DATABASE_PATH)

    if db_dir and not os.path.exists(db_dir):
        os.makedirs(db_dir, exist_ok=True)

    conn = sqlite3.connect(DATABASE_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")

    return conn


@contextmanager
def get_db():
    """Provide a database connection with automatic commit or rollback."""
    conn = get_connection()

    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db():
    """Initialize the schema and safely seed an empty demo database."""

    with get_db() as conn:
        cursor = conn.cursor()

        # 1. Business Profile table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS business_profile (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                business_name TEXT NOT NULL DEFAULT 'Dukaan Boutique',
                owner_name TEXT NOT NULL DEFAULT 'Seller',
                tagline TEXT DEFAULT 'Handcrafted with Love',
                email TEXT DEFAULT 'seller@dukaanpilot.local',
                phone TEXT DEFAULT '+91 98765 43210',
                upi_id TEXT DEFAULT 'seller@okhdfcbank',
                currency_symbol TEXT NOT NULL DEFAULT '₹',
                currency_code TEXT NOT NULL DEFAULT 'INR',
                address TEXT DEFAULT 'Mumbai, India',
                invoice_prefix TEXT NOT NULL DEFAULT 'INV-',
                notes TEXT DEFAULT 'Thank you for supporting our small business!',
                updated_at TEXT NOT NULL
            );
        """)

        # 2. Orders table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_number TEXT UNIQUE NOT NULL,
                customer_name TEXT NOT NULL,
                customer_contact TEXT,
                product_name TEXT NOT NULL,
                quantity INTEGER NOT NULL DEFAULT 1,
                unit_price REAL NOT NULL DEFAULT 0.0,
                total_amount REAL NOT NULL DEFAULT 0.0,
                order_status TEXT NOT NULL DEFAULT 'Pending',
                payment_status TEXT NOT NULL DEFAULT 'Unpaid',
                payment_method TEXT DEFAULT 'UPI',
                notes TEXT,
                source TEXT DEFAULT 'Manual',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
        """)

        cursor.execute(
            "CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status);"
        )
        cursor.execute(
            "CREATE INDEX IF NOT EXISTS idx_orders_payment_status "
            "ON orders(payment_status);"
        )
        cursor.execute(
            "CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);"
        )

        # 3. Expenses table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS expenses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                category TEXT NOT NULL,
                amount REAL NOT NULL,
                description TEXT NOT NULL,
                date TEXT NOT NULL,
                payment_method TEXT DEFAULT 'UPI',
                created_at TEXT NOT NULL
            );
        """)

        cursor.execute(
            "CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);"
        )
        cursor.execute(
            "CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);"
        )

        # 4. Inventory table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS inventory (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sku TEXT UNIQUE NOT NULL,
                product_name TEXT NOT NULL,
                unit_cost REAL NOT NULL DEFAULT 0.0,
                selling_price REAL NOT NULL DEFAULT 0.0,
                stock_quantity INTEGER NOT NULL DEFAULT 0,
                low_stock_threshold INTEGER NOT NULL DEFAULT 5,
                category TEXT DEFAULT 'General',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
        """)

        cursor.execute(
            "CREATE INDEX IF NOT EXISTS idx_inventory_stock "
            "ON inventory(stock_quantity);"
        )

        # 5. Invoices table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS invoices (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                invoice_number TEXT UNIQUE NOT NULL,
                order_id INTEGER NOT NULL,
                issue_date TEXT NOT NULL,
                due_date TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'Issued',
                subtotal REAL NOT NULL,
                tax_amount REAL NOT NULL DEFAULT 0.0,
                discount_amount REAL NOT NULL DEFAULT 0.0,
                total_amount REAL NOT NULL,
                notes TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
            );
        """)

        cursor.execute(
            "CREATE INDEX IF NOT EXISTS idx_invoices_order ON invoices(order_id);"
        )

        # Initialize the default business profile if missing.
        cursor.execute("SELECT id FROM business_profile WHERE id = 1;")

        if not cursor.fetchone():
            now = datetime.now().isoformat()

            cursor.execute(
                """
                INSERT INTO business_profile (
                    id,
                    business_name,
                    owner_name,
                    tagline,
                    email,
                    phone,
                    upi_id,
                    currency_symbol,
                    currency_code,
                    address,
                    invoice_prefix,
                    notes,
                    updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
                """,
                (
                    1,
                    "Aura Artisans",
                    "Aditi Sharma",
                    "Handcrafted Jewellery & Keepsakes",
                    "aditi@auraartisans.in",
                    "+91 98200 12345",
                    "auraartisans@okaxis",
                    "₹",
                    "INR",
                    "Bandra West, Mumbai, MH 400050",
                    "AA-INV-",
                    "Handmade with love. For queries or exchanges, WhatsApp us at +91 98200 12345.",
                    now,
                ),
            )

    # Seed sample records only in demo mode and only if every business
    # data table is empty. Never reset existing records during startup.
    if DEMO_MODE:
        with get_db() as conn:
            cursor = conn.cursor()

            cursor.execute("""
                SELECT
                    (SELECT COUNT(*) FROM orders) AS orders_count,
                    (SELECT COUNT(*) FROM expenses) AS expenses_count,
                    (SELECT COUNT(*) FROM inventory) AS inventory_count,
                    (SELECT COUNT(*) FROM invoices) AS invoices_count;
            """)

            counts = cursor.fetchone()

            should_seed = all(
                counts[key] == 0
                for key in (
                    "orders_count",
                    "expenses_count",
                    "inventory_count",
                    "invoices_count",
                )
            )

        if should_seed:
            # Local import avoids a circular import at module load time.
            from backend.app.seed_data import seed_sample_data

            seed_sample_data()
