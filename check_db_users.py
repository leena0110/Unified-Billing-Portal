import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

async def check_users():
    load_dotenv(dotenv_path="backend/.env")
    mongodb_uri = os.getenv("MONGODB_URI")
    print(f"Connecting to: {mongodb_uri}")
    client = AsyncIOMotorClient(mongodb_uri)
    db = client.rite_electricals
    
    users = await db.users.find().to_list(length=10)
    print(f"Found {len(users)} users")
    for user in users:
        print(f"Username: {user['username']}, Role: {user['role']}")

if __name__ == "__main__":
    asyncio.run(check_users())
