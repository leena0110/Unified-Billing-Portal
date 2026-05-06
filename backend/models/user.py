"""
Pydantic models for User and Authentication
"""
from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum


class UserRole(str, Enum):
    admin = "admin"
    user = "user"


class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    role: UserRole = UserRole.user
    full_name: Optional[str] = None


class UserCreate(UserBase):
    password: str = Field(..., min_length=4)


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(UserBase):
    id: str = Field(alias="_id")
    
    class Config:
        populate_by_name = True


class UserInDB(UserBase):
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    username: str
    full_name: Optional[str] = None


class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None
