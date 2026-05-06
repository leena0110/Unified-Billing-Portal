"""
Pydantic models for Customer
"""
from pydantic import BaseModel, Field
from typing import Optional


class CustomerBase(BaseModel):
    name: str = Field(..., min_length=1, description="Customer name")
    phone: str = Field(..., min_length=1, description="Phone number")
    place: str = Field(default="")
    site: str = Field(default="")


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    place: Optional[str] = None
    site: Optional[str] = None


class CustomerResponse(CustomerBase):
    id: str = Field(alias="_id")
    
    class Config:
        populate_by_name = True
