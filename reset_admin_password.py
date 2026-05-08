import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

async def reset_password():
    load_dotenv(dotenv_path="backend/.env")
    mongodb_uri = os.getenv("MONGODB_URI")
    print(f"Connecting to: {mongodb_uri}")
    client = AsyncIOMotorClient(mongodb_uri)
    db = client.rite_electricals
    
    new_password_hash = get_password_hash("admin123")
    
    result = await db.users.update_one(
        {"username": "admin"},
        {"$set": {"password": new_password_hash}}
    )
    
    if result.modified_count > 0:
        print("Admin password reset successfully to 'admin123'")
    else:
        # Maybe it was already admin123, or user doesn't exist
        user = await db.users.find_one({"username": "admin"})
        if user:
            print("Admin user found, but password was already set (or update failed)")
        else:
            print("Admin user not found!")

if __name__ == "__main__":
    asyncio.run(reset_password())
