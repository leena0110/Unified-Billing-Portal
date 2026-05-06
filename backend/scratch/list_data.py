import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

async def list_data():
    mongo_uri = os.getenv("MONGODB_URI")
    client = AsyncIOMotorClient(mongo_uri)
    db = client["rite_electricals"]
    
    print(f"--- RECENT PURCHASES in {db.name} ---")
    async for p in db.purchases.find().sort("date", -1).limit(20):
        print(f"Bill: {p.get('bill_no')} | Supplier: {p.get('supplier_name')} | Date: {p.get('date')}")
        for item in p.get("items", []):
            print(f"  - {item.get('qty')} x {item.get('product')}")
            
    if await db.purchases.count_documents({}) == 0:
        print("NO PURCHASES FOUND.")

    print("\n--- PRODUCTS ---")
    async for prod in db.products.find().limit(20):
        print(f"Product: {prod.get('product_name')} | Brand: {prod.get('brand')} | Stock: {prod.get('closing_stock')}")

if __name__ == "__main__":
    asyncio.run(list_data())
