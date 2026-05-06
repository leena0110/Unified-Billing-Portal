import asyncio
from database import Database, get_db

async def check_users():
    await Database.connect()
    db = get_db()
    print("Listing all users:")
    async for user in db.users.find():
        print(f"Username: '{user['username']}', Role: '{user['role']}', Full Name: '{user.get('full_name')}'")
    await Database.disconnect()

if __name__ == "__main__":
    asyncio.run(check_users())
