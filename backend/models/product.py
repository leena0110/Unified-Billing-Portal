"""
Pydantic models for Product / Inventory
"""
from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime


class ProductBase(BaseModel):
    brand: str = Field(..., min_length=1, description="Brand name")
    product_name: str = Field(..., min_length=1, description="Product name")
    purchase_date: str = Field(default_factory=lambda: datetime.now().strftime("%Y-%m-%d"))
    purchase_rate: float = Field(default=0, ge=0)
    margin1: float = Field(default=0, ge=0, description="Margin 1 percentage")
    wholesale_rate: float = Field(default=0, ge=0)
    margin2: float = Field(default=0, ge=0, description="Margin 2 percentage")
    retail_rate: float = Field(default=0, ge=0)
    opening_stock: int = Field(default=0, ge=0)
    purchased_stock: int = Field(default=0, ge=0)
    sold_stock: int = Field(default=0, ge=0)
    closing_stock: int = Field(default=0, ge=0)
    modified_date: str = Field(default_factory=lambda: datetime.now().strftime("%Y-%m-%d"))


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    brand: Optional[str] = None
    product_name: Optional[str] = None
    purchase_date: Optional[str] = None
    purchase_rate: Optional[float] = None
    margin1: Optional[float] = None
    wholesale_rate: Optional[float] = None
    margin2: Optional[float] = None
    retail_rate: Optional[float] = None
    opening_stock: Optional[int] = None
    purchased_stock: Optional[int] = None
    sold_stock: Optional[int] = None
    closing_stock: Optional[int] = None
    modified_date: Optional[str] = None


class ProductResponse(ProductBase):
    id: str = Field(alias="_id")
    
    class Config:
        populate_by_name = True


class RateChangeRequest(BaseModel):
    product_name: str
    new_purchase_rate: float = Field(ge=0)
    effective_date: str
    margin1: float = Field(default=0, ge=0)
    wholesale_rate: float = Field(default=0, ge=0)
    margin2: float = Field(default=0, ge=0)
    retail_rate: float = Field(default=0, ge=0)


class RateChangeResponse(BaseModel):
    id: str = Field(alias="_id")
    product_name: str
    new_purchase_rate: float
    effective_date: str
    margin1: float
    wholesale_rate: float
    margin2: float
    retail_rate: float
    modified_date: str
    
    class Config:
        populate_by_name = True
