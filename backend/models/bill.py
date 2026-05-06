"""
Pydantic models for Bills / Invoices
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class BillItem(BaseModel):
    brand: str
    name: str
    qty: float = Field(gt=0)
    rate: float = Field(ge=0)
    amount: float = Field(ge=0)


class BillBase(BaseModel):
    bill_no: str
    date: str = Field(default_factory=lambda: datetime.now().strftime("%Y-%m-%d %I:%M %p"))
    customer_name: str = Field(default="Cash Sale")
    customer_phone: str = Field(default="")
    bill_type: str = Field(default="Retail", description="Retail or Wholesale")
    place: str = Field(default="")
    site: str = Field(default="")
    payment_type: str = Field(default="Cash", description="Cash or Credit")
    include_gst: bool = Field(default=False)
    items: List[BillItem] = Field(default_factory=list)
    subtotal: float = Field(default=0, ge=0)
    cgst: float = Field(default=0, ge=0)
    sgst: float = Field(default=0, ge=0)
    total: float = Field(default=0, ge=0)
    amount_paid: float = Field(default=0, ge=0)
    remaining_amount: float = Field(default=0, ge=0)


class BillCreate(BaseModel):
    customer_name: str = Field(default="Cash Sale")
    customer_phone: str = Field(default="")
    bill_type: str = Field(default="Retail")
    place: str = Field(default="")
    site: str = Field(default="")
    payment_type: str = Field(default="Cash")
    include_gst: bool = Field(default=False)
    items: List[BillItem] = Field(min_length=1)
    amount_paid: float = Field(default=0, ge=0)


class BillResponse(BillBase):
    id: str = Field(alias="_id")
    
    class Config:
        populate_by_name = True


class BillSummary(BaseModel):
    """Summary for reports"""
    bill_no: str
    date: str
    customer_name: str
    bill_type: str
    payment_type: str
    items_count: int
    total: float
    amount_paid: float
    remaining_amount: float
