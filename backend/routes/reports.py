"""
Reports routes - Sales reports with date filtering
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional
from datetime import datetime, timedelta
from utils.auth import get_current_user, require_admin
from database import get_db

router = APIRouter(prefix="/api/reports", tags=["Reports"])


@router.get("/sales")
async def get_sales_report(
    report_type: str = Query("daily", enum=["daily", "fortnight", "monthly", "custom"]),
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    admin: dict = Depends(require_admin)
):
    db = get_db()
    today = datetime.now().date()

    if report_type == "daily":
        start = today.strftime("%d/%m/%Y")
        end = today.strftime("%d/%m/%Y")
        title = "Daily Sales Report"
    elif report_type == "fortnight":
        start = (today - timedelta(days=14)).strftime("%d/%m/%Y")
        end = today.strftime("%d/%m/%Y")
        title = "Fortnight Sales Report"
    elif report_type == "monthly":
        start = today.replace(day=1).strftime("%d/%m/%Y")
        end = today.strftime("%d/%m/%Y")
        title = "Monthly Sales Report"
    elif report_type == "custom":
        if not date_from or not date_to:
            raise HTTPException(status_code=400, detail="date_from and date_to required for custom reports")
        start = date_from
        end = date_to
        title = f"Custom Sales Report ({date_from} to {date_to})"
    else:
        raise HTTPException(status_code=400, detail="Invalid report type")

    # Fetch all bills and filter by date
    bills = []
    total_sales = 0.0
    total_items = 0
    total_cash = 0.0
    total_credit = 0.0

    async for bill in db.bills.find().sort("date", -1):
        try:
            bill_date_str = bill.get("date", "")
            # Parse date from format "DD/MM/YYYY HH:MM AM/PM"
            bill_date = datetime.strptime(bill_date_str.split(" ")[0], "%d/%m/%Y").date()
            
            # Parse range dates
            if "/" in start:
                start_date = datetime.strptime(start, "%d/%m/%Y").date()
                end_date = datetime.strptime(end, "%d/%m/%Y").date()
            else:
                start_date = datetime.strptime(start, "%Y-%m-%d").date()
                end_date = datetime.strptime(end, "%Y-%m-%d").date()

            if start_date <= bill_date <= end_date:
                bill["_id"] = str(bill["_id"])
                bill_total = bill.get("total", 0)
                bills.append({
                    "bill_no": bill.get("bill_no"),
                    "date": bill.get("date"),
                    "customer_name": bill.get("customer_name"),
                    "bill_type": bill.get("bill_type"),
                    "payment_type": bill.get("payment_type"),
                    "items_count": len(bill.get("items", [])),
                    "total": bill_total,
                    "amount_paid": bill.get("amount_paid", 0),
                    "remaining_amount": bill.get("remaining_amount", 0)
                })
                total_sales += bill_total
                total_items += len(bill.get("items", []))
                if bill.get("payment_type") == "Cash":
                    total_cash += bill_total
                else:
                    total_credit += bill_total
        except (ValueError, IndexError):
            continue

    return {
        "title": title,
        "date_range": {"from": start, "to": end},
        "bills": bills,
        "summary": {
            "total_bills": len(bills),
            "total_items": total_items,
            "total_sales": round(total_sales, 2),
            "total_cash": round(total_cash, 2),
            "total_credit": round(total_credit, 2)
        }
    }


@router.get("/dashboard")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    db = get_db()
    today = datetime.now().date()
    month_start = today.replace(day=1)

    # Count documents
    total_products = await db.products.count_documents({})
    total_customers = await db.customers.count_documents({})
    total_bills = await db.bills.count_documents({})
    total_purchases = await db.purchases.count_documents({})

    # Calculate today's and month's sales
    today_sales = 0.0
    month_sales = 0.0
    today_bills = 0
    month_bills = 0
    recent_bills = []

    async for bill in db.bills.find().sort("date", -1).limit(100):
        try:
            bill_date_str = bill.get("date", "")
            bill_date = datetime.strptime(bill_date_str.split(" ")[0], "%d/%m/%Y").date()
            bill_total = bill.get("total", 0)

            if bill_date == today:
                today_sales += bill_total
                today_bills += 1
            if bill_date >= month_start:
                month_sales += bill_total
                month_bills += 1

            if len(recent_bills) < 5:
                recent_bills.append({
                    "bill_no": bill.get("bill_no"),
                    "date": bill.get("date"),
                    "customer_name": bill.get("customer_name"),
                    "total": bill_total
                })
        except (ValueError, IndexError):
            continue

    # Low stock products (closing_stock <= 5)
    low_stock = []
    async for p in db.products.find({"closing_stock": {"$lte": 5}}).limit(10):
        low_stock.append({
            "brand": p["brand"],
            "product_name": p["product_name"],
            "closing_stock": p.get("closing_stock", 0)
        })

    # Calculate weekly sales for chart
    weekly_sales = []
    days = [(today - timedelta(days=i)) for i in range(6, -1, -1)]
    for day in days:
        day_str = day.strftime("%d/%m/%Y")
        day_total = 0.0
        # This is a bit inefficient for large DBs, but works for now. 
        # In a real app we'd use an aggregation pipeline.
        async for bill in db.bills.find():
            try:
                if bill.get("date", "").startswith(day_str):
                    day_total += bill.get("total", 0)
            except: continue
        weekly_sales.append({
            "name": day.strftime("%a"),
            "sales": round(day_total, 2)
        })

    return {
        "total_products": total_products,
        "total_customers": total_customers,
        "total_bills": total_bills,
        "total_purchases": total_purchases,
        "today_sales": round(today_sales, 2),
        "today_bills": today_bills,
        "month_sales": round(month_sales, 2),
        "month_bills": month_bills,
        "recent_bills": recent_bills,
        "low_stock_products": low_stock,
        "weekly_sales": weekly_sales
    }
