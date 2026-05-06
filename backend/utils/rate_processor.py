"""
Automatic rate change processor
"""
from datetime import datetime
from database import get_db

async def process_pending_rate_changes():
    """
    Check for scheduled rate changes that are due today or earlier
    and apply them to the products.
    """
    db = get_db()
    today_str = datetime.now().strftime("%Y-%m-%d")
    
    # Find changes that are due today or in the past
    cursor = db.future_rate_changes.find({"effective_date": {"$lte": today_str}})
    
    applied_count = 0
    async for change in cursor:
        product_name = change["product_name"]
        
        # Apply change to product
        result = await db.products.update_one(
            {"product_name": {"$regex": f"^{product_name}$", "$options": "i"}},
            {"$set": {
                "purchase_rate": change.get("new_purchase_rate"),
                "purchase_date": change.get("effective_date"),
                "margin1": change.get("margin1"),
                "wholesale_rate": change.get("wholesale_rate"),
                "margin2": change.get("margin2"),
                "retail_rate": change.get("retail_rate"),
                "modified_date": today_str
            }}
        )
        
        if result.matched_count > 0:
            # Remove from queue after successful application
            await db.future_rate_changes.delete_one({"_id": change["_id"]})
            applied_count += 1
            print(f"Automatically applied rate change for: {product_name}")
            
    return applied_count
