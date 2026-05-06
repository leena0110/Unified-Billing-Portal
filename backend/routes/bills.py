"""
Bills / Invoice routes - Create, view, PDF generation
"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from typing import Optional, List
from datetime import datetime
from bson import ObjectId
from models.bill import BillCreate
from utils.calculations import calculate_bill_totals, calculate_closing_stock
from utils.pdf_generator import generate_invoice_pdf
from database import get_db, Database

router = APIRouter(prefix="/api/bills", tags=["Bills"])


@router.get("/")
async def get_bills(
    customer: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    payment_type: Optional[str] = None
):
    db = get_db()
    query = {}
    if customer:
        query["customer_name"] = {"$regex": customer, "$options": "i"}
    if payment_type:
        query["payment_type"] = payment_type
    if date_from or date_to:
        date_q = {}
        if date_from:
            date_q["$gte"] = date_from
        if date_to:
            date_q["$lte"] = date_to + " 23:59 PM"
        query["date"] = date_q

    bills = []
    async for bill in db.bills.find(query).sort("date", -1):
        bill["_id"] = str(bill["_id"])
        bills.append(bill)
    return bills


@router.get("/next-number")
async def get_next_bill_number():
    seq = await Database.get_next_sequence("bill_number")
    return {"bill_no": f"{seq:04d}"}


@router.get("/{bill_id}")
async def get_bill(bill_id: str):
    db = get_db()
    bill = await db.bills.find_one({"_id": ObjectId(bill_id)})
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    bill["_id"] = str(bill["_id"])
    return bill


@router.post("/")
async def create_bill(bill_data: BillCreate):
    db = get_db()

    # Generate bill number
    seq = await Database.get_next_sequence("bill_number")
    bill_no = f"{seq:04d}"

    # Calculate items amounts
    items_list = []
    for item in bill_data.items:
        amount = round(item.qty * item.rate, 2)
        items_list.append({
            "brand": item.brand,
            "name": item.name,
            "qty": item.qty,
            "rate": item.rate,
            "amount": amount
        })

    # Calculate totals
    totals = calculate_bill_totals(items_list, bill_data.include_gst, bill_data.amount_paid)

    bill_doc = {
        "bill_no": bill_no,
        "date": datetime.now().strftime("%d/%m/%Y %I:%M %p"),
        "customer_name": bill_data.customer_name,
        "customer_phone": bill_data.customer_phone,
        "bill_type": bill_data.bill_type,
        "place": bill_data.place,
        "site": bill_data.site,
        "payment_type": bill_data.payment_type,
        "include_gst": bill_data.include_gst,
        "items": items_list,
        **totals
    }

    # Save bill
    result = await db.bills.insert_one(bill_doc)

    # Update sold stock for each item
    for item in items_list:
        product = await db.products.find_one({"product_name": item["name"]})
        if product:
            new_sold = int(product.get("sold_stock", 0)) + int(item["qty"])
            new_closing = calculate_closing_stock(
                int(product.get("opening_stock", 0)),
                int(product.get("purchased_stock", 0)),
                new_sold
            )
            await db.products.update_one(
                {"_id": product["_id"]},
                {"$set": {
                    "sold_stock": new_sold,
                    "closing_stock": new_closing,
                    "modified_date": datetime.now().strftime("%Y-%m-%d")
                }}
            )

    # Save/update customer
    if bill_data.customer_name != "Cash Sale" and bill_data.customer_phone:
        existing_cust = await db.customers.find_one({"phone": bill_data.customer_phone})
        cust_doc = {
            "name": bill_data.customer_name,
            "phone": bill_data.customer_phone,
            "place": bill_data.place,
            "site": bill_data.site
        }
        if existing_cust:
            await db.customers.update_one({"_id": existing_cust["_id"]}, {"$set": cust_doc})
        else:
            await db.customers.insert_one(cust_doc)

    bill_doc["_id"] = str(result.inserted_id)
    return bill_doc


@router.delete("/{bill_id}")
async def delete_bill(bill_id: str):
    db = get_db()
    bill = await db.bills.find_one({"_id": ObjectId(bill_id)})
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")

    # Reverse sold stock
    for item in bill.get("items", []):
        product = await db.products.find_one({"product_name": item["name"]})
        if product:
            new_sold = max(0, int(product.get("sold_stock", 0)) - int(item["qty"]))
            new_closing = calculate_closing_stock(
                int(product.get("opening_stock", 0)),
                int(product.get("purchased_stock", 0)),
                new_sold
            )
            await db.products.update_one(
                {"_id": product["_id"]},
                {"$set": {"sold_stock": new_sold, "closing_stock": new_closing}}
            )

    await db.bills.delete_one({"_id": ObjectId(bill_id)})
    return {"message": "Bill deleted and stock reversed"}


@router.get("/{bill_id}/pdf")
async def get_bill_pdf(bill_id: str):
    db = get_db()
    bill = await db.bills.find_one({"_id": ObjectId(bill_id)})
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")

    bill["_id"] = str(bill["_id"])
    pdf_buffer = generate_invoice_pdf(bill)

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=invoice_{bill['bill_no']}.pdf"}
    )


@router.get("/{bill_id}/receipt-text")
async def get_receipt_text(bill_id: str):
    """Get formatted receipt text for WhatsApp sharing"""
    db = get_db()
    bill = await db.bills.find_one({"_id": ObjectId(bill_id)})
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")

    from database import get_settings
    settings = get_settings()

    lines = [
        settings.company_name,
        "451A, Periyar Nagar, Opp Rajaji Statue",
        "Thirumangalam-625 706",
        "Madurai Main Road, Tamil Nadu",
        f"Phone: {settings.company_phone}",
        f"GSTIN: {settings.company_gstin}",
        "",
        f"Bill No: {bill['bill_no']}",
        f"Date: {bill['date']}",
        f"Customer: {bill['customer_name']}",
        f"Phone: {bill['customer_phone']}",
        "",
        "Items:"
    ]

    for item in bill.get("items", []):
        lines.append(f"{item['name']} - {item['qty']} x {item['rate']} = {item['amount']}")

    lines.append("")
    lines.append(f"Subtotal: {bill.get('subtotal', 0):.2f}")

    if bill.get("include_gst"):
        lines.append(f"CGST @9%: {bill.get('cgst', 0):.2f}")
        lines.append(f"SGST @9%: {bill.get('sgst', 0):.2f}")

    lines.append(f"Total: {bill.get('total', 0):.2f}")
    lines.append("")
    lines.append("Thank you for your business!")
    lines.append("Please visit again!")

    return {"text": "\n".join(lines), "phone": bill.get("customer_phone", "")}
