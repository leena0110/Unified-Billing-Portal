"""
Customer routes - CRUD operations
"""
from fastapi import APIRouter, HTTPException
from typing import Optional, List
from bson import ObjectId
from models.customer import CustomerCreate
from database import get_db

router = APIRouter(prefix="/api/customers", tags=["Customers"])


@router.get("/")
async def get_customers(search: Optional[str] = None):
    db = get_db()
    query = {}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"phone": {"$regex": search, "$options": "i"}}
        ]
    customers = []
    async for c in db.customers.find(query).sort("name", 1):
        c["_id"] = str(c["_id"])
        customers.append(c)
    return customers


@router.get("/names")
async def get_customer_names(search: Optional[str] = None):
    db = get_db()
    query = {"name": {"$regex": search, "$options": "i"}} if search else {}
    return [c["name"] async for c in db.customers.find(query, {"name": 1}).sort("name", 1)]


@router.get("/by-name/{name}")
async def get_customer_by_name(name: str):
    db = get_db()
    customer = await db.customers.find_one({"name": {"$regex": f"^{name}$", "$options": "i"}})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    customer["_id"] = str(customer["_id"])
    return customer


@router.get("/places")
async def get_places():
    db = get_db()
    return sorted(await db.customers.distinct("place", {"place": {"$ne": ""}}))


@router.get("/sites")
async def get_sites():
    db = get_db()
    return sorted(await db.customers.distinct("site", {"site": {"$ne": ""}}))


@router.get("/balance/{name}")
async def get_customer_balance(name: str):
    db = get_db()
    
    # 1. Total Sales and Paid from Bills
    total_sales = 0
    bill_paid = 0
    async for bill in db.bills.find({"customer_name": {"$regex": f"^{name}$", "$options": "i"}}):
        total_sales += bill.get("total", 0)
        bill_paid += bill.get("amount_paid", 0)
        
    # 2. Standalone Payments
    extra_paid = 0
    async for payment in db.payments.find({"customer_name": {"$regex": f"^{name}$", "$options": "i"}}):
        extra_paid += payment.get("amount_received", 0)
        
    total_paid = bill_paid + extra_paid
    remaining = total_sales - total_paid
    
    return {
        "total_sales": round(total_sales, 2),
        "total_paid": round(total_paid, 2),
        "remaining_amount": round(remaining, 2)
    }


@router.post("/")
async def create_or_update_customer(customer: CustomerCreate):
    db = get_db()
    if customer.name == "Cash Sale":
        return {"message": "Cash sale not saved"}
    existing = await db.customers.find_one({"phone": customer.phone})
    doc = customer.model_dump()
    if existing:
        await db.customers.update_one({"_id": existing["_id"]}, {"$set": doc})
        return {"message": "Customer updated", "id": str(existing["_id"])}
    result = await db.customers.insert_one(doc)
    return {"message": "Customer added", "id": str(result.inserted_id)}


@router.put("/{customer_id}")
async def update_customer(customer_id: str, customer: CustomerCreate):
    db = get_db()
    doc = customer.model_dump()
    result = await db.customers.update_one(
        {"_id": ObjectId(customer_id)}, 
        {"$set": doc}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Customer not found")
    return {"message": "Customer updated"}


@router.delete("/{customer_id}")
async def delete_customer(customer_id: str):
    db = get_db()
    result = await db.customers.delete_one({"_id": ObjectId(customer_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Customer not found")
    return {"message": "Customer deleted"}
