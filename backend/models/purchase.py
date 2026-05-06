"""
Pydantic models for Purchases and Purchase Receipts
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class PurchaseItem(BaseModel):
    brand: str
    product: str
    qty: float = Field(gt=0)
    rate: float = Field(ge=0)
    total: float = Field(ge=0)


class PurchaseBase(BaseModel):
    bill_no: str
    date: str = Field(default_factory=lambda: datetime.now().strftime("%Y-%m-%d"))
    supplier_name: str = Field(..., min_length=1)
    supplier_phone: str = Field(default="")
    place: str = Field(default="")
    site: str = Field(default="")
    payment_type: str = Field(default="Cash")
    items: List[PurchaseItem] = Field(default_factory=list)
    items_count: int = Field(default=0)
    total_purchase: float = Field(default=0, ge=0)
    paid: float = Field(default=0, ge=0)
    remaining: float = Field(default=0, ge=0)


class PurchaseCreate(BaseModel):
    supplier_name: str = Field(..., min_length=1)
    supplier_phone: str = Field(default="")
    place: str = Field(default="")
    site: str = Field(default="")
    payment_type: str = Field(default="Cash")
    items: List[PurchaseItem] = Field(min_length=1)
    paid: float = Field(default=0, ge=0)
    date: Optional[str] = None


class PurchaseResponse(PurchaseBase):
    id: str = Field(alias="_id")
    
    class Config:
        populate_by_name = True


# --- Sales Receipt Models ---

class SalesReceiptBase(BaseModel):
    date: str = Field(default_factory=lambda: datetime.now().strftime("%Y-%m-%d"))
    customer: str = Field(..., min_length=1)
    amount_received: float = Field(gt=0)
    cash: float = Field(default=0, ge=0)
    cheque: float = Field(default=0, ge=0)
    bank_transfer: float = Field(default=0, ge=0)
    total_sales: float = Field(default=0, ge=0)
    initial_paid: float = Field(default=0, ge=0)
    total_paid: float = Field(default=0, ge=0)
    remaining: float = Field(default=0, ge=0)


class SalesReceiptCreate(BaseModel):
    customer: str = Field(..., min_length=1)
    amount_received: float = Field(gt=0)
    cash: float = Field(default=0, ge=0)
    cheque: float = Field(default=0, ge=0)
    bank_transfer: float = Field(default=0, ge=0)
    date: Optional[str] = None


class SalesReceiptResponse(SalesReceiptBase):
    id: str = Field(alias="_id")
    
    class Config:
        populate_by_name = True


# --- Purchase Receipt Models ---

class PurchaseReceiptBase(BaseModel):
    date: str = Field(default_factory=lambda: datetime.now().strftime("%Y-%m-%d"))
    supplier: str = Field(..., min_length=1)
    amount_paid_now: float = Field(gt=0)
    cash: float = Field(default=0, ge=0)
    cheque: float = Field(default=0, ge=0)
    bank_transfer: float = Field(default=0, ge=0)
    total_purchase: float = Field(default=0, ge=0)
    initially_paid: float = Field(default=0, ge=0)
    total_paid: float = Field(default=0, ge=0)
    remaining_amount: float = Field(default=0, ge=0)


class PurchaseReceiptCreate(BaseModel):
    supplier: str = Field(..., min_length=1)
    amount_paid_now: float = Field(gt=0)
    cash: float = Field(default=0, ge=0)
    cheque: float = Field(default=0, ge=0)
    bank_transfer: float = Field(default=0, ge=0)
    date: Optional[str] = None


class PurchaseReceiptResponse(PurchaseReceiptBase):
    id: str = Field(alias="_id")
    
    class Config:
        populate_by_name = True
