"""
MongoDB Atlas connection using Motor (async driver)
"""
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic_settings import BaseSettings
from functools import lru_cache
import os
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseSettings):
    mongodb_uri: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    jwt_secret_key: str = os.getenv("JWT_SECRET_KEY", "default-secret-key")
    jwt_algorithm: str = os.getenv("JWT_ALGORITHM", "HS256")
    jwt_expiration_minutes: int = int(os.getenv("JWT_EXPIRATION_MINUTES", "1440"))
    app_name: str = os.getenv("APP_NAME", "RITE ELECTRICALS Billing System")
    debug: bool = os.getenv("DEBUG", "true").lower() == "true"
    cors_origins: str = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000")
    company_name: str = os.getenv("COMPANY_NAME", "RITE ELECTRICALS")
    company_address: str = os.getenv("COMPANY_ADDRESS", "451A, Periyar Nagar, Opp Rajaji Statue, Thirumangalam-625 706, Madurai Main Road, Tamil Nadu")
    company_phone: str = os.getenv("COMPANY_PHONE", "9342244061, 9842204841")
    company_gstin: str = os.getenv("COMPANY_GSTIN", "33BMGPM7077J1ZO")

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings():
    return Settings()


class Database:
    client: AsyncIOMotorClient = None
    db = None

    @classmethod
    async def connect(cls):
        settings = get_settings()
        cls.client = AsyncIOMotorClient(settings.mongodb_uri)
        cls.db = cls.client.rite_electricals
        
        # Create indexes
        await cls.create_indexes()
        
        # Seed default admin user
        await cls.seed_default_users()
        
        print(f"Connected to MongoDB Atlas - Database: rite_electricals")

    @classmethod
    async def disconnect(cls):
        if cls.client:
            cls.client.close()
            print("Disconnected from MongoDB Atlas")

    @classmethod
    async def create_indexes(cls):
        """Create indexes for better query performance"""
        # Products indexes
        await cls.db.products.create_index([("brand", 1), ("product_name", 1)], unique=True)
        await cls.db.products.create_index([("brand", 1)])
        
        # Customers indexes
        await cls.db.customers.create_index([("phone", 1)], unique=True)
        await cls.db.customers.create_index([("name", 1)])
        
        # Bills indexes
        await cls.db.bills.create_index([("bill_no", 1)], unique=True)
        await cls.db.bills.create_index([("date", -1)])
        await cls.db.bills.create_index([("customer_name", 1)])
        
        # Purchases indexes
        await cls.db.purchases.create_index([("bill_no", 1)], unique=True)
        await cls.db.purchases.create_index([("supplier_name", 1)])
        await cls.db.purchases.create_index([("date", -1)])
        
        # Sales receipts indexes
        await cls.db.sales_receipts.create_index([("customer", 1)])
        await cls.db.sales_receipts.create_index([("date", -1)])
        
        # Purchase receipts indexes
        await cls.db.purchase_receipts.create_index([("supplier", 1)])
        await cls.db.purchase_receipts.create_index([("date", -1)])
        
        # Users indexes
        await cls.db.users.create_index([("username", 1)], unique=True)
        
        # Counters
        await cls.db.counters.create_index([("name", 1)], unique=True)
        
        # Future rate changes
        await cls.db.future_rate_changes.create_index([("product_name", 1)])
        await cls.db.future_rate_changes.create_index([("effective_date", 1)])
        
        print("Database indexes created successfully")

    @classmethod
    async def seed_default_users(cls):
        """Seed default admin and user accounts"""
        from utils.auth import get_password_hash
        
        existing_admin = await cls.db.users.find_one({"username": "admin"})
        if not existing_admin:
            await cls.db.users.insert_one({
                "username": "admin",
                "password": get_password_hash("admin123"),
                "role": "admin",
                "full_name": "Administrator"
            })
            print("Default admin user created")
        
        existing_user = await cls.db.users.find_one({"username": "user"})
        if not existing_user:
            await cls.db.users.insert_one({
                "username": "user",
                "password": get_password_hash("user123"),
                "role": "user",
                "full_name": "Standard User"
            })
            print("Default standard user created")

    @classmethod
    async def get_next_sequence(cls, name: str) -> int:
        """Get next sequence number for bill numbering"""
        result = await cls.db.counters.find_one_and_update(
            {"name": name},
            {"$inc": {"value": 1}},
            upsert=True,
            return_document=True
        )
        return result["value"]


def get_db():
    return Database.db
