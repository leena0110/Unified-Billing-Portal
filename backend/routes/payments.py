from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from datetime import datetime
from database import get_db
from models.payment import PaymentCreate
from utils.auth import get_current_user

router = APIRouter(prefix="/api/payments", tags=["Payments"])

@router.post("/")
async def create_payment(payment: PaymentCreate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    
    payment_doc = payment.model_dump()
    payment_doc["created_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    result = await db.payments.insert_one(payment_doc)
    payment_doc["_id"] = str(result.inserted_id)
    
    return payment_doc

@router.get("/")
async def get_payments(customer_name: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    db = get_db()
    query = {}
    if customer_name:
        query["customer_name"] = {"$regex": customer_name, "$options": "i"}
        
    payments = []
    async for p in db.payments.find(query).sort("payment_date", -1):
        p["_id"] = str(p["_id"])
        payments.append(p)
    return payments
