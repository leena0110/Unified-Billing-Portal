"""
Product management routes - Products, stocks, and rate changes
"""
from fastapi import APIRouter, HTTPException
from typing import Optional, List
from datetime import datetime
from bson import ObjectId
from models.product import ProductCreate, ProductUpdate, RateChangeRequest
from utils.calculations import calculate_closing_stock, calculate_rates
from database import get_db

router = APIRouter(prefix="/api/products", tags=["Products"])


@router.get("/", response_model=List[dict])
async def get_products(search: Optional[str] = None):
    db = get_db()
    query = {}
    if search:
        query["$or"] = [
            {"product_name": {"$regex": search, "$options": "i"}},
            {"brand": {"$regex": search, "$options": "i"}}
        ]
    products = []
    async for p in db.products.find(query).sort("product_name", 1):
        p["_id"] = str(p["_id"])
        products.append(p)
    return products


@router.get("/brands")
async def get_brands():
    db = get_db()
    return sorted(await db.products.distinct("brand"))


@router.get("/by-brand/{brand}")
async def get_products_by_brand(brand: str):
    db = get_db()
    products = []
    async for p in db.products.find({"brand": brand}).sort("product_name", 1):
        p["_id"] = str(p["_id"])
        products.append(p)
    return products


@router.get("/{product_id}")
async def get_product(product_id: str):
    db = get_db()
    product = await db.products.find_one({"_id": ObjectId(product_id)})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    product["_id"] = str(product["_id"])
    return product


@router.post("/")
async def create_product(product: ProductCreate):
    db = get_db()
    existing = await db.products.find_one({"product_name": product.product_name, "brand": product.brand})
    if existing:
        raise HTTPException(status_code=400, detail="Product already exists")
    
    doc = product.model_dump()
    doc["closing_stock"] = calculate_closing_stock(
        product.opening_stock, product.purchased_stock, product.sold_stock
    )
    doc["modified_date"] = datetime.now().strftime("%Y-%m-%d")
    
    result = await db.products.insert_one(doc)
    return {"message": "Product added", "id": str(result.inserted_id)}


@router.put("/{product_id}")
async def update_product(product_id: str, product: ProductUpdate):
    db = get_db()
    doc = product.model_dump(exclude_unset=True)
    
    # Recalculate closing stock if any stock values change
    if any(k in doc for k in ["opening_stock", "purchased_stock", "sold_stock"]):
        current = await db.products.find_one({"_id": ObjectId(product_id)})
        new_closing = calculate_closing_stock(
            doc.get("opening_stock", current.get("opening_stock", 0)),
            doc.get("purchased_stock", current.get("purchased_stock", 0)),
            doc.get("sold_stock", current.get("sold_stock", 0))
        )
        doc["closing_stock"] = new_closing
        
    doc["modified_date"] = datetime.now().strftime("%Y-%m-%d")
    
    result = await db.products.update_one({"_id": ObjectId(product_id)}, {"$set": doc})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product updated"}


@router.delete("/{product_id}")
async def delete_product(product_id: str):
    db = get_db()
    result = await db.products.delete_one({"_id": ObjectId(product_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted"}


# ─── Rate Changes ───

@router.post("/rate-change", response_model=dict)
async def schedule_rate_change(rate_change: RateChangeRequest):
    """Schedule a rate change (immediate or future)"""
    db = get_db()
    
    effective_date = datetime.strptime(rate_change.effective_date, "%Y-%m-%d").date()
    today = datetime.now().date()
    modified_date = datetime.now().strftime("%Y-%m-%d")
    
    rates = calculate_rates(
        rate_change.new_purchase_rate, rate_change.margin1, rate_change.margin2,
        rate_change.wholesale_rate, rate_change.retail_rate
    )
    
    if effective_date <= today:
        # Immediate rate change
        result = await db.products.update_one(
            {"product_name": {"$regex": f"^{rate_change.product_name}$", "$options": "i"}},
            {"$set": {
                "purchase_rate": rates["purchase_rate"],
                "purchase_date": rate_change.effective_date,
                "margin1": rates["margin1"],
                "wholesale_rate": rates["wholesale_rate"],
                "margin2": rates["margin2"],
                "retail_rate": rates["retail_rate"],
                "modified_date": modified_date
            }}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail=f"Product '{rate_change.product_name}' not found")
        return {"message": "Rate updated immediately", "type": "immediate"}
    else:
        # Future rate change
        await db.future_rate_changes.update_one(
            {"product_name": rate_change.product_name},
            {"$set": {
                "product_name": rate_change.product_name,
                "new_purchase_rate": rates["purchase_rate"],
                "effective_date": rate_change.effective_date,
                "margin1": rates["margin1"],
                "wholesale_rate": rates["wholesale_rate"],
                "margin2": rates["margin2"],
                "retail_rate": rates["retail_rate"],
                "modified_date": modified_date
            }},
            upsert=True
        )
        return {"message": f"Rate change scheduled for {rate_change.effective_date}", "type": "scheduled"}


@router.get("/rate-changes/pending", response_model=List[dict])
async def get_pending_rate_changes():
    """Get all pending future rate changes (and process due ones)"""
    from utils.rate_processor import process_pending_rate_changes
    await process_pending_rate_changes()
    
    db = get_db()
    changes = []
    async for change in db.future_rate_changes.find().sort("effective_date", 1):
        change["_id"] = str(change["_id"])
        changes.append(change)
    return changes
