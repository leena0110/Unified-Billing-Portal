from pydantic import BaseModel
from typing import Optional

class PaymentCreate(BaseModel):
    customer_name: str
    cash: float = 0.0
    cheque: float = 0.0
    bank_transfer: float = 0.0
    amount_received: float
    payment_date: str
    remarks: Optional[str] = ""
