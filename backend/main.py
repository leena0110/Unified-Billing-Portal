"""
RITE ELECTRICALS - Billing System API
FastAPI entry point with all routes registered and CORS configured
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from database import Database, get_settings

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await Database.connect()
    
    # Process any rate changes due for today
    from utils.rate_processor import process_pending_rate_changes
    await process_pending_rate_changes()
    
    yield
    # Shutdown
    await Database.disconnect()


app = FastAPI(
    title=settings.app_name,
    description="Full-stack billing and inventory management system for RITE ELECTRICALS",
    version="2.0.0",
    lifespan=lifespan
)

# CORS Configuration
origins = [origin.strip() for origin in settings.cors_origins.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
from routes.auth import router as auth_router
from routes.products import router as products_router
from routes.customers import router as customers_router
from routes.bills import router as bills_router
from routes.purchases import router as purchases_router
from routes.reports import router as reports_router
from routes.payments import router as payments_router

app.include_router(auth_router)
app.include_router(payments_router)
app.include_router(products_router)
app.include_router(customers_router)
app.include_router(bills_router)
app.include_router(purchases_router)
app.include_router(reports_router)


@app.get("/")
async def root():
    return {
        "app": settings.app_name,
        "version": "2.0.0",
        "status": "running",
        "docs": "/docs"
    }


@app.get("/api/company")
async def get_company_info():
    return {
        "name": settings.company_name,
        "address": settings.company_address,
        "phone": settings.company_phone,
        "gstin": settings.company_gstin
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
