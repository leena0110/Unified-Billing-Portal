import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

# Path to the .env file in the backend directory
env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(env_path)

async def check_users():
    mongodb_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    client = AsyncIOMotorClient(mongodb_uri)
    db = client.rite_electricals
    
    print("\n--- Current System Users ---")
    async for user in db.users.find({}, {"username": 1, "role": 1, "full_name": 1, "_id": 0}):
        print(f"Name: {user.get('full_name', 'N/A')} | Username: {user['username']} | Role: {user['role']}")
    print("---------------------------\n")

if __name__ == "__main__":
    asyncio.run(check_users())
