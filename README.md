# DukaanPilot AI 🛍️🤖

> **"Less paperwork. More profit."**  
> AI-powered operating system for Instagram sellers, WhatsApp business owners, home-based artisans, and boutique micro-entrepreneurs.

[![Hacktoberfest 2026](https://img.shields.io/badge/Hacktoberfest-2026-orange.svg)](https://hacktoberfest.com/)
[![DEV Challenge](https://img.shields.io/badge/DEV%20Challenge-Side%20Hustle-blue.svg)](https://dev.to/challenges)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-teal.svg)](https://fastapi.tiangolo.com/)
[![React 19](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite-indigo.svg)](https://vitejs.dev/)
[![TailwindCSS v4](https://img.shields.io/badge/Styling-Tailwind%20v4-38bdf8.svg)](https://tailwindcss.com/)
[![Gemma](https://img.shields.io/badge/AI-Gemma%20(Ollama)-emerald.svg)](https://ollama.ai/)
[![Tests](https://img.shields.io/badge/Tests-Pytest%20Passing-brightgreen.svg)]()

---

## 🌟 1. Product Vision & Problem

Millions of social sellers across Instagram, WhatsApp, and home boutiques manage orders, customer inquiries, and supplier payments across fragmented chats, handwritten notebooks, and messy spreadsheets. They struggle with:
1. **Chat Disorganization**: Losing track of customer sizes, quantities, and delivery statuses in DMs.
2. **Delayed Invoicing**: Spending 10 minutes per order creating invoices manually.
3. **Financial Guesswork**: Confusing gross sales with net profit, ignoring packaging, courier, and raw material costs.
4. **Payment Recovery Leaks**: Forgetting which customers placed orders on COD or partial advance payments.

**DukaanPilot AI** solves this with an end-to-end commercial-grade business assistant that turns unstructured customer messages into validated orders, generates branded PDF invoices with one click, and delivers strictly accurate, SQL-computed financial metrics with zero AI hallucinations.

---

## 🛠️ 2. Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React icons.
- **Backend**: Python 3.11+, FastAPI, Pydantic v2, Uvicorn.
- **Database**: SQLite with indexed schema, transactions, and foreign key integrity.
- **AI Engine**: Google Gemma open-weight models (`gemma2:2b`) running locally via Ollama with strict timeouts.
- **Precision Engine**: Deterministic Python and SQL algorithms for accurate financial analytics and rule-based NLP fallback when Ollama is offline.
- **Testing**: Pytest test suite covering full CRUD, calculation precision, invoice generation, and AI fallbacks.
- **Deployment**: Production Render configuration with persistent storage disk for SQLite.

---

## 🚀 3. Features Implemented

### A. Professional Dashboard
- Real-time KPI cards: **Total Revenue**, **Total Expenses**, **Estimated Net Profit**, and **Pending Payments**.
- Visual daily revenue vs. expense timeline charts.
- Recent orders and transaction activity.
- Low-stock inventory alert banners.
- Rule-based business health suggestions.
- Built-in **"Load Sample Boutique Data"** button to instantly demo realistic Indian artisan shop data ("Aura Artisans").

### B. Order Management & AI Unstructured Parser
- Full CRUD operations: Create, read, update, and delete orders.
- Customer name, contact number, product name, quantity, unit price, and auto-computed totals.
- Five order states: `Pending`, `Confirmed`, `Shipped`, `Delivered`, `Cancelled`.
- Payment tracking: `Paid`, `Partial`, `Unpaid`.
- **AI Natural Language Order Parser**:
  - Paste raw customer messages such as:  
    `"Priya ordered 2 handmade bracelets at ₹350 each, delivery pending."`
  - Extracts customer name, item, quantity, unit price, and status.
  - Presents an **editable, reviewable draft** before persisting to database.
  - Works with local Gemma via Ollama or seamless rule-based deterministic NLP fallback when offline.

### C. Expense Management
- Categorized cost tracking: Raw Materials, Packaging, Courier & Shipping, Marketing & Ads, Tools & Software, Utilities, Other.
- Visual percentage cost allocation breakdown.
- AI-assisted keyword categorization as you type descriptions.
- Deterministic calculation ensuring mathematical accuracy.

### D. Invoice Generator
- Instant professional invoice generation from any stored customer order.
- Custom business details (Store Name, Phone, WhatsApp, UPI ID, Address, Invoice Prefix).
- Itemized lines, customizable tax percentage, and discount amounts.
- **Print-ready HTML/PDF view**: Clean styling with browser print optimization (`window.print()` / Save as PDF) with zero paid third-party API dependencies.

### E. Business Intelligence & Analytics
- Net Profit Margin formula: `Total Revenue - Total Recorded Expenses`.
- Best-performing products ranked by real sales volume.
- Outstanding payment recovery watchlist showing who owes money and phone numbers for follow-up.
- Automated financial health recommendations.
- Low-stock inventory safety alerts.

### F. Gemma AI Assistant
- Interactive chat interface answering business questions:
  - *"Which products generated the most revenue?"*
  - *"What are my total expenses this month?"*
  - *"Which orders are awaiting delivery?"*
  - *"How much estimated profit did I make?"*
  - *"Which customers have pending payments?"*
- **Transparent AI Modes**:
  - `Gemma (Ollama Local)`: Enabled when Ollama is running locally.
  - `Deterministic Business Intelligence Engine`: High-precision deterministic fallback when Ollama is offline.

### G. Store Settings & Sample Data
- Edit boutique profile, owner name, UPI ID, and contact details.
- Real-time diagnostic monitor testing Ollama connectivity at `http://localhost:11434`.
- One-click buttons to load sample boutique data or reset all records.

---

## 💻 4. Running the Project Locally

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### Backend Setup
1. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```

2. Install backend dependencies:
   ```bash
   pip install -r backend/requirements.txt
   ```

3. Start the FastAPI development server:
   ```bash
   uvicorn backend.main:app --reload --port 8000
   ```
   The API will be available at: `http://localhost:8000`  
   Interactive API docs (Swagger): `http://localhost:8000/docs`

### Frontend Setup
1. Open a new terminal in the `frontend` folder:
   ```bash
   cd frontend
   npm install
   ```

2. Start the Vite development server:
   ```bash
   npm run dev
   ```
   The application will be accessible at: `http://localhost:5173`

---

## 🤖 5. How to Enable Local Gemma via Ollama

DukaanPilot AI is designed with an offline-first architecture. It functions with complete precision using its built-in rule engine even without Ollama. To enable the local Gemma open-weight model:

1. Download and install Ollama from [ollama.ai](https://ollama.ai).
2. Pull and start the Gemma model:
   ```bash
   ollama run gemma2:2b
   ```
3. Ensure Ollama is running at `http://localhost:11434` (the default port).
4. DukaanPilot AI will automatically detect Ollama and display the green **"Gemma (Ollama)"** badge in the navigation bar!

---

## 🧪 6. Running Tests

Run the Pytest backend test suite:
```bash
python -m pytest -v backend/tests
```

### Verified Test Suite Results:
- `test_ai_status`: Verifies Ollama connectivity detection.
- `test_natural_language_order_extraction`: Verifies extraction of unstructured seller notes into validated orders.
- `test_business_assistant_queries`: Tests accuracy of answers for revenue, profit, and pending deliveries.
- `test_analytics_summary_accuracy`: Verifies exact mathematical matching of revenues, expenses, and net margins.
- `test_top_products`: Verifies ranking of bestsellers by revenue.
- `test_business_recommendations`: Tests automated business advice generation.
- `test_expense_lifecycle`: Tests expense creation, updating, and category breakdown.
- `test_invoice_generation_and_html`: Tests invoice calculation and printable HTML view.
- `test_health_endpoint`: Tests `/health` service availability.
- `test_order_lifecycle`: Tests full CRUD and automated total calculation.

Frontend production build check:
```bash
cd frontend
npm run build
```

---

## ☁️ 7. Render Deployment Guide

The repository includes a ready-to-deploy `render.yaml` blueprint.

### Single-Service Architecture:
When built, the FastAPI application automatically serves the production React bundle in `frontend/dist`. On Render, the entire application runs as a single web service.

### Steps to Deploy:
1. Push this repository to GitHub or GitLab.
2. In the [Render Dashboard](https://dashboard.render.com/), click **New** &rarr; **Blueprint**.
3. Select your repository. Render will automatically detect `render.yaml`.
4. Configure the persistent disk:
   - Render mounts a 1GB persistent disk at `/var/data`.
   - The environment variable `DATABASE_PATH=/var/data/dukaanpilot.db` ensures SQLite data persists across service redeployments.
5. Click **Apply**. Render will run:
   - **Build Command**: `pip install -r backend/requirements.txt && cd frontend && npm install && npm run build && cd ..`
   - **Start Command**: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`

> **Note on Cloud AI**: Because Ollama is a local GPU/CPU tool and is not available on free cloud containers, DukaanPilot AI automatically switches to its high-precision **Deterministic Business Intelligence Engine** on cloud deployments.

---

## 📝 8. Architecture Overview

```
DukaanPilot AI
├── backend/
│   ├── app/
│   │   ├── config.py             # Environment configurations
│   │   ├── database.py           # SQLite connection, schema & indexes
│   │   ├── models.py             # Internal data definitions
│   │   ├── schemas.py            # Pydantic request & response schemas
│   │   ├── seed_data.py          # Realistic boutique sample dataset
│   │   ├── services/
│   │   │   ├── ai_service.py     # Ollama Gemma client & rule-based NLP fallback
│   │   │   ├── analytics_service.py # Deterministic SQL business calculations
│   │   │   └── invoice_service.py   # Branded print-ready HTML invoice renderer
│   │   └── routers/
│   │       ├── orders.py         # Orders CRUD & filters
│   │       ├── expenses.py       # Expenses CRUD & category breakdown
│   │       ├── invoices.py       # Invoicing endpoints
│   │       ├── analytics.py      # KPI summaries & recommendations
│   │       ├── ai.py             # Order extraction & business assistant chat
│   │       └── settings.py       # Profile & sample data management
│   ├── main.py                   # FastAPI app entry point & SPA static server
│   ├── requirements.txt          # Python dependencies
│   └── tests/                    # Pytest test suite (10 passing tests)
├── frontend/
│   ├── src/
│   │   ├── components/           # Sidebar, Navbar, StatCard, Badge, Modal, EmptyState
│   │   ├── pages/                # Landing, Dashboard, Orders, Expenses, Invoices, Insights, AI, Settings
│   │   ├── services/api.ts       # Unified API client
│   │   ├── types/index.ts        # TypeScript data contracts
│   │   ├── App.tsx               # Root app coordinator
│   │   └── index.css             # Tailwind v4 styles & print media queries
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.app.json
├── render.yaml                   # Production deployment manifest with persistent disk
├── .env.example                  # Environment variable template
├── .gitignore                    # Git ignore file
└── README.md
```

---

## 🔒 9. Limitations & Future Roadmap

1. **Local AI on Hosted Environments**: Running local Gemma requires Ollama installed on the host machine. Cloud hosted instances without Ollama operate in high-precision Deterministic Mode. Future releases will support optional API keys for hosted Gemma endpoints.
2. **Multi-Tenancy**: The current MVP is designed for a single boutique business profile. Future updates can introduce multi-tenant user accounts with JWT authentication and isolated stores.
3. **Automated WhatsApp Webhook**: Currently, users copy-paste chat notes into the AI parser. Future iterations could integrate WhatsApp Cloud API webhooks for direct order capture.

---

## 📄 License

Built for **Hacktoberfest 2026 - DEV Challenge 3: Side Hustle**.  
Released under the MIT License.
