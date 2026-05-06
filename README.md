# RITE ELECTRICALS - Billing & Inventory Management System

A modern full-stack web platform migrated from a legacy Python/Tkinter desktop application.

## Tech Stack
- **Frontend:** React.js, Tailwind CSS, React Router, Vite, Axios, Recharts, Lucide Icons.
- **Backend:** FastAPI, Motor (Async MongoDB), Pydantic, JWT Authentication, ReportLab (PDF Generation).
- **Database:** MongoDB Atlas.

## Migration Highlights
1. **Database Modernization:** Moved from 11 separate CSV files to a scalable, structured MongoDB Atlas cluster with proper indexing and data validation.
2. **Web-based UI:** Transformed the Tkinter UI into a responsive, glassmorphism-inspired React dashboard with dynamic data visualization using Recharts.
3. **Authentication:** Upgraded hardcoded credentials to robust JWT-based role authentication (Admin/User).
4. **PDF Generation:** Upgraded text-based `.txt` receipts to professional PDF invoices using ReportLab.
5. **Logic Preservation:** Successfully preserved all core business logic formulas (e.g., GST markup, margin-based pricing, stock closing formulas).

## Setup Instructions

### 1. Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in the `backend` directory (use `.env.example` as a template) and add your MongoDB Atlas URI.

Start the FastAPI server:
```bash
uvicorn main:app --reload
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 3. Default Accounts
- **Admin:** `admin` / `admin123`
- **User:** `user` / `user123`

## Features Included
- Beautiful interactive Dashboard with charts and low-stock alerts.
- Complex Billing interface preserving Retail/Wholesale rate toggle.
- WhatsApp sharing integration (generates text format of the receipt).
- Advanced inventory management tracking Opening/Purchased/Sold/Closing stock.
- Rate scheduling logic for future effective dates.
