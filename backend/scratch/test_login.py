import asyncio
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from utils.auth import verify_password, get_password_hash

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env'))

async def test():
    client = AsyncIOMotorClient(os.getenv("MONGODB_URI"))
    db = client.rite_electricals
    
    user = await db.users.find_one({"username": "admin"})
    if user:
        print("Admin user found!")
        print(f"  Role: {user.get('role')}")
        print(f"  Password hash: {user.get('password')[:40]}...")
        
        result = verify_password("admin123", user["password"])
        print(f"  Password 'admin123' matches: {result}")
        
        if not result:
            print("\n  Fixing: Resetting admin password to 'admin123'...")
            new_hash = get_password_hash("admin123")
            await db.users.update_one(
                {"username": "admin"},
                {"$set": {"password": new_hash}}
            )
            print("  Password reset! Try logging in again.")
    else:
        print("Admin user NOT found! Creating one...")
        await db.users.insert_one({
            "username": "admin",
            "password": get_password_hash("admin123"),
            "role": "admin",
            "full_name": "Administrator"
        })
        print("Admin user created! Login with admin / admin123")
    
    client.close()

asyncio.run(test())
