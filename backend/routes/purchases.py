"""
Purchase routes - Purchase entry, purchase receipts, sales receipts
"""
from fastapi import APIRouter, HTTPException
from typing import Optional, List
from datetime import datetime
from bson import ObjectId
from models.purchase import (
    PurchaseCreate, SalesReceiptCreate, PurchaseReceiptCreate
)
from utils.calculations import calculate_closing_stock
from database import get_db, Database

router = APIRouter(prefix="/api/purchases", tags=["Purchases"])


# ─── Purchase Entry ───

@router.get("/", response_model=List[dict])
async def get_purchases(
    supplier: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None
):
    db = get_db()
    query = {}
    if supplier:
        query["supplier_name"] = {"$regex": supplier, "$options": "i"}
    purchases = []
    async for p in db.purchases.find(query).sort("date", -1):
        p["_id"] = str(p["_id"])
        purchases.append(p)
    return purchases


@router.get("/next-number")
async def get_next_purchase_number():
    seq = await Database.get_next_sequence("purchase_bill_number")
    return {"bill_no": f"P{seq:04d}"}


@router.get("/{purchase_id}")
async def get_purchase(purchase_id: str):
    db = get_db()
    purchase = await db.purchases.find_one({"_id": ObjectId(purchase_id)})
    if not purchase:
        raise HTTPException(status_code=404, detail="Purchase not found")
    purchase["_id"] = str(purchase["_id"])
    return purchase


@router.post("/", response_model=dict)
async def create_purchase(data: PurchaseCreate):
    db = get_db()
    seq = await Database.get_next_sequence("purchase_bill_number")
    bill_no = f"P{seq:04d}"
    date = data.date or datetime.now().strftime("%Y-%m-%d")

    items_list = []
    total_purchase = 0.0
    for item in data.items:
        total = round(item.qty * item.rate, 2)
        items_list.append({
            "brand": item.brand, "product": item.product,
            "qty": item.qty, "rate": item.rate, "total": total
        })
        total_purchase += total

    remaining = max(0, total_purchase - data.paid)

    purchase_doc = {
        "bill_no": bill_no, "date": date,
        "supplier_name": data.supplier_name,
        "supplier_phone": data.supplier_phone,
        "place": data.place, "site": data.site,
        "payment_type": data.payment_type,
        "items": items_list,
        "items_count": len(items_list),
        "total_purchase": round(total_purchase, 2),
        "paid": round(data.paid, 2),
        "remaining": round(remaining, 2)
    }

    result = await db.purchases.insert_one(purchase_doc)

    # Update product stock
    for item in items_list:
        product = await db.products.find_one({
            "brand": item["brand"], "product_name": item["product"]
        })
        
        if product:
            new_purchased = int(product.get("purchased_stock", 0)) + int(item["qty"])
            new_closing = calculate_closing_stock(
                int(product.get("opening_stock", 0)),
                new_purchased,
                int(product.get("sold_stock", 0))
            )
            await db.products.update_one(
                {"_id": product["_id"]},
                {"$set": {
                    "purchased_stock": new_purchased,
                    "closing_stock": new_closing,
                    "purchase_rate": item["rate"],
                    "purchase_date": date,
                    "modified_date": datetime.now().strftime("%Y-%m-%d")
                }}
            )
        else:
            # Create new product if it doesn't exist
            new_product = {
                "brand": item["brand"],
                "product_name": item["product"],
                "opening_stock": 0,
                "purchased_stock": int(item["qty"]),
                "sold_stock": 0,
                "closing_stock": int(item["qty"]),
                "purchase_rate": item["rate"],
                "retail_rate": item["rate"] * 1.2, # Default 20% markup
                "wholesale_rate": item["rate"] * 1.1, # Default 10% markup
                "purchase_date": date,
                "modified_date": datetime.now().strftime("%Y-%m-%d")
            }
            await db.products.insert_one(new_product)

    purchase_doc["_id"] = str(result.inserted_id)
    return purchase_doc


@router.delete("/{purchase_id}")
async def delete_purchase(purchase_id: str):
    db = get_db()
    purchase = await db.purchases.find_one({"_id": ObjectId(purchase_id)})
    if not purchase:
        raise HTTPException(status_code=404, detail="Purchase not found")

    # Reverse purchased stock
    for item in purchase.get("items", []):
        product = await db.products.find_one({
            "brand": item["brand"], "product_name": item["product"]
        })
        if product:
            new_purchased = max(0, int(product.get("purchased_stock", 0)) - int(item["qty"]))
            new_closing = calculate_closing_stock(
                int(product.get("opening_stock", 0)),
                new_purchased,
                int(product.get("sold_stock", 0))
            )
            await db.products.update_one(
                {"_id": product["_id"]},
                {"$set": {"purchased_stock": new_purchased, "closing_stock": new_closing}}
            )

    await db.purchases.delete_one({"_id": ObjectId(purchase_id)})
    return {"message": "Purchase deleted and stock reversed"}


@router.get("/{purchase_id}/items")
async def get_purchase_items(purchase_id: str):
    db = get_db()
    purchase = await db.purchases.find_one({"_id": ObjectId(purchase_id)})
    if not purchase:
        raise HTTPException(status_code=404, detail="Purchase not found")
    return purchase.get("items", [])


# ─── Supplier Balance ───

@router.get("/supplier/{supplier_name}/balance")
async def get_supplier_balance(supplier_name: str):
    db = get_db()
    total_purchase = 0.0
    total_paid = 0.0
    async for p in db.purchases.find({"supplier_name": supplier_name}):
        total_purchase += p.get("total_purchase", 0)
        total_paid += p.get("paid", 0)
    # Add receipt payments
    async for r in db.purchase_receipts.find({"supplier": supplier_name}):
        total_paid += r.get("amount_paid_now", 0)
    return {
        "total_purchase": round(total_purchase, 2),
        "total_paid": round(total_paid, 2),
        "remaining": round(max(0, total_purchase - total_paid), 2)
    }


# ─── Sales Receipts ───

@router.get("/sales-receipts/")
async def get_sales_receipts(
    customer: Optional[str] = None
):
    db = get_db()
    query = {}
    if customer:
        query["customer"] = customer
    receipts = []
    async for r in db.sales_receipts.find(query).sort("date", -1):
        r["_id"] = str(r["_id"])
        receipts.append(r)
    return receipts


@router.get("/sales-receipts/customers")
async def get_sales_receipt_customers():
    db = get_db()
    customers = set()
    # From customers collection
    async for c in db.customers.find({}, {"name": 1}):
        if c.get("name"):
            customers.add(c["name"])
    # From bills
    async for b in db.bills.find({"customer_name": {"$ne": "Cash Sale"}}, {"customer_name": 1}):
        if b.get("customer_name"):
            customers.add(b["customer_name"])
    return sorted(customers)


@router.get("/sales-receipts/customer/{customer_name}/summary")
async def get_customer_sales_summary(customer_name: str):
    db = get_db()
    total_sales = 0.0
    total_initial_paid = 0.0
    async for bill in db.bills.find({"customer_name": customer_name}):
        total_sales += bill.get("total", 0)
        total_initial_paid += bill.get("amount_paid", 0)
    total_receipts = 0.0
    async for r in db.sales_receipts.find({"customer": customer_name}):
        total_receipts += r.get("amount_received", 0)
    cumulative_paid = total_initial_paid + total_receipts
    return {
        "total_sales": round(total_sales, 2),
        "total_paid": round(cumulative_paid, 2),
        "remaining": round(max(0, total_sales - cumulative_paid), 2)
    }


@router.post("/sales-receipts/")
async def create_sales_receipt(data: SalesReceiptCreate):
    db = get_db()
    date = data.date or datetime.now().strftime("%Y-%m-%d")

    # Calculate cumulative totals
    total_sales = 0.0
    total_initial_paid = 0.0
    async for bill in db.bills.find({"customer_name": data.customer}):
        total_sales += bill.get("total", 0)
        total_initial_paid += bill.get("amount_paid", 0)
    total_receipts = 0.0
    async for r in db.sales_receipts.find({"customer": data.customer}):
        total_receipts += r.get("amount_received", 0)

    cumulative_paid = total_initial_paid + total_receipts + data.amount_received
    cumulative_remaining = max(0, total_sales - cumulative_paid)

    receipt_doc = {
        "date": date, "customer": data.customer,
        "amount_received": round(data.amount_received, 2),
        "cash": round(data.cash, 2),
        "cheque": round(data.cheque, 2),
        "bank_transfer": round(data.bank_transfer, 2),
        "total_sales": round(total_sales, 2),
        "initial_paid": round(total_initial_paid, 2),
        "total_paid": round(cumulative_paid, 2),
        "remaining": round(cumulative_remaining, 2)
    }
    result = await db.sales_receipts.insert_one(receipt_doc)
    receipt_doc["_id"] = str(result.inserted_id)
    return receipt_doc


@router.get("/sales-receipts/summary")
async def get_sales_receipts_summary():
    db = get_db()
    totals = {"total_sales": 0, "total_received": 0, "cash": 0, "cheque": 0, "bank_transfer": 0}
    async for r in db.sales_receipts.find():
        totals["total_sales"] += r.get("total_sales", 0)
        totals["total_received"] += r.get("amount_received", 0)
        totals["cash"] += r.get("cash", 0)
        totals["cheque"] += r.get("cheque", 0)
        totals["bank_transfer"] += r.get("bank_transfer", 0)
    return {k: round(v, 2) for k, v in totals.items()}


# ─── Purchase Receipts ───

@router.get("/purchase-receipts/")
async def get_purchase_receipts(
    supplier: Optional[str] = None
):
    db = get_db()
    query = {}
    if supplier:
        query["supplier"] = supplier
    receipts = []
    async for r in db.purchase_receipts.find(query).sort("date", -1):
        r["_id"] = str(r["_id"])
        receipts.append(r)
    return receipts


@router.get("/purchase-receipts/suppliers")
async def get_purchase_receipt_suppliers():
    db = get_db()
    suppliers = await db.purchases.distinct("supplier_name")
    return sorted([s for s in suppliers if s])


@router.get("/purchase-receipts/supplier/{supplier_name}/summary")
async def get_supplier_purchase_summary(supplier_name: str):
    db = get_db()
    total_purchase = 0.0
    initial_paid = 0.0
    async for p in db.purchases.find({"supplier_name": supplier_name}):
        total_purchase += p.get("total_purchase", 0)
        initial_paid += p.get("paid", 0)
    total_receipts = 0.0
    async for r in db.purchase_receipts.find({"supplier": supplier_name}):
        total_receipts += r.get("amount_paid_now", 0)
    total_paid = initial_paid + total_receipts
    return {
        "total_purchase": round(total_purchase, 2),
        "initially_paid": round(initial_paid, 2),
        "total_paid": round(total_paid, 2),
        "remaining": round(max(0, total_purchase - total_paid), 2)
    }


@router.post("/purchase-receipts/")
async def create_purchase_receipt(data: PurchaseReceiptCreate):
    db = get_db()
    date = data.date or datetime.now().strftime("%Y-%m-%d")

    total_purchase = 0.0
    initial_paid = 0.0
    async for p in db.purchases.find({"supplier_name": data.supplier}):
        total_purchase += p.get("total_purchase", 0)
        initial_paid += p.get("paid", 0)
        
    total_receipts = 0.0
    async for r in db.purchase_receipts.find({"supplier": data.supplier}):
        total_receipts += r.get("amount_paid_now", 0)

    total_paid = initial_paid + total_receipts + data.amount_paid_now
    remaining = max(0, total_purchase - total_paid)

    receipt_doc = {
        "date": date, "supplier": data.supplier,
        "amount_paid_now": round(data.amount_paid_now, 2),
        "cash": round(data.cash, 2),
        "cheque": round(data.cheque, 2),
        "bank_transfer": round(data.bank_transfer, 2),
        "total_purchase": round(total_purchase, 2),
        "initially_paid": round(initial_paid, 2),
        "total_paid": round(total_paid, 2),
        "remaining_amount": round(remaining, 2)
    }
    result = await db.purchase_receipts.insert_one(receipt_doc)
    receipt_doc["_id"] = str(result.inserted_id)
    return receipt_doc
