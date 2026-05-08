"""
Authentication routes - Login, token generation
"""
from fastapi import APIRouter, HTTPException, status, Depends
from models.user import UserLogin, UserCreate, Token, UserResponse
from utils.auth import verify_password, get_password_hash, create_access_token, get_current_user, require_admin
from database import get_db

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/login", response_model=Token)
async def login(user_data: UserLogin):
    """Authenticate user and return JWT token"""
    db = get_db()
    username = user_data.username.strip().lower()
    password = user_data.password.strip()
    
    print(f"Login attempt for username: '{username}'")
    
    user = await db.users.find_one({"username": username})
    
    if not user:
        print(f"User '{username}' not found in database")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )
        
    if not verify_password(password, user["password"]):
        print(f"Password verification failed for user '{username}'")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )
    
    access_token = create_access_token(
        data={"sub": user["username"], "role": user["role"]}
    )
    
    return Token(
        access_token=access_token,
        role=user["role"],
        username=user["username"],
        full_name=user.get("full_name", "")
    )


@router.post("/register", response_model=dict)
async def register(user_data: UserCreate, admin: dict = Depends(require_admin)):
    """Register a new user (admin only)"""
    db = get_db()
    
    existing = await db.users.find_one({"username": user_data.username})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists"
        )
    
    user_doc = {
        "username": user_data.username,
        "password": get_password_hash(user_data.password),
        "role": user_data.role.value,
        "full_name": user_data.full_name or user_data.username
    }
    
    result = await db.users.insert_one(user_doc)
    return {"message": "User registered successfully", "id": str(result.inserted_id)}


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get current user info"""
    return {
        "username": current_user["username"],
        "role": current_user["role"],
        "full_name": current_user.get("full_name", "")
    }


@router.get("/users", response_model=list)
async def get_users(admin: dict = Depends(require_admin)):
    """Get all users (admin only)"""
    db = get_db()
    users = []
    async for user in db.users.find({}, {"password": 0}):
        user["_id"] = str(user["_id"])
        users.append(user)
    return users
