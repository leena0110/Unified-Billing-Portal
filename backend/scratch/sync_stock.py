import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

async def fix_stock():
    mongo_uri = os.getenv("MONGODB_URI")
    client = AsyncIOMotorClient(mongo_uri)
    db = client["rite_electricals"]

    print("Syncing GOVINDHAN purchase...")
    purchase = await db.purchases.find_one({"supplier_name": "GOVINDHAN"})
    
    if not purchase:
        print("Could not find GOVINDHAN purchase.")
        return

    for item in purchase.get("items", []):
        brand = item.get("brand")
        product_name = item.get("product")
        qty = item.get("qty")
        
        print(f"Syncing {qty} units of {brand} {product_name}...")
        product = await db.products.find_one({"brand": brand, "product_name": product_name})
        
        if product:
            new_purchased = int(product.get("purchased_stock", 0)) + int(qty)
            new_closing = int(product.get("opening_stock", 0)) + new_purchased - int(product.get("sold_stock", 0))
            await db.products.update_one(
                {"_id": product["_id"]},
                {"$set": {
                    "purchased_stock": new_purchased,
                    "closing_stock": new_closing,
                    "modified_date": datetime.now().strftime("%Y-%m-%d")
                }}
            )
            print(f"Updated {product_name}.")
        else:
            new_product = {
                "brand": brand,
                "product_name": product_name,
                "opening_stock": 0,
                "purchased_stock": int(qty),
                "sold_stock": 0,
                "closing_stock": int(qty),
                "purchase_rate": item.get("rate"),
                "retail_rate": item.get("rate") * 1.2,
                "wholesale_rate": item.get("rate") * 1.1,
                "purchase_date": purchase.get("date"),
                "modified_date": datetime.now().strftime("%Y-%m-%d")
            }
            await db.products.insert_one(new_product)
            print(f"Created NEW product entry for {product_name}.")

if __name__ == "__main__":
    asyncio.run(fix_stock())
