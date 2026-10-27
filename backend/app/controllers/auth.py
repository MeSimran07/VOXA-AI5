from datetime import timedelta
import logging
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import get_db
from app.core.config import get_settings
from app.core.security import verify_password, get_password_hash, create_access_token
from app.models.user import User
from app.views.user import UserCreate, StandardUserResponse, UserResponse, UserLogin
from app.views.token import StandardTokenResponse, Token
from app.core.deps import get_current_user
from app.core.limiter import limiter

logger = logging.getLogger(__name__)
settings = get_settings()
router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", response_model=StandardUserResponse, status_code=status.HTTP_201_CREATED)
async def register(request: Request, user: UserCreate, db: AsyncSession = Depends(get_db)):
    email = user.email.lower().strip()
    
    # Check if user already exists
    query = select(User).where(User.email == email)
    result = await db.execute(query)
    existing_user = result.scalars().first()
    
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    new_user = User(
        name=user.name,
        email=email,
        hashed_password=hashed_password
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    return StandardUserResponse(data=UserResponse.model_validate(new_user))

@router.post("/login", response_model=StandardTokenResponse)
@limiter.limit("10/minute")
async def login(request: Request, user_login: UserLogin, db: AsyncSession = Depends(get_db)):
    email = user_login.email.lower().strip()
    logger.info(f"Login attempt for email: {email}")
    
    query = select(User).where(User.email == email)
    result = await db.execute(query)
    user = result.scalars().first()
    
    if not user:
        logger.warning(f"Login failed: User not found for {email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if not verify_password(user_login.password, user.hashed_password):
        logger.warning(f"Login failed: Incorrect password for {email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    logger.info(f"Login successful for user: {user.id}")
    
    if user_login.remember_me:
        access_token_expires = timedelta(days=30)
    else:
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        
    access_token = create_access_token(
        data={"sub": user.id}, expires_delta=access_token_expires
    )
    logger.info(f"JWT generated successfully for user: {user.id}")
    
    return StandardTokenResponse(data=Token(access_token=access_token, token_type="bearer"))

@router.post("/demo", response_model=StandardTokenResponse)
async def demo_login(db: AsyncSession = Depends(get_db)):
    """Instant login endpoint for demo users without entering credentials."""
    demo_email = "demo@voxa.ai"
    query = select(User).where(User.email == demo_email)
    result = await db.execute(query)
    user = result.scalars().first()

    if not user:
        # Check if test@gmail.com exists
        test_query = select(User).where(User.email == "test@gmail.com")
        test_res = await db.execute(test_query)
        user = test_res.scalars().first()

    if not user:
        hashed_password = get_password_hash("password123")
        user = User(
            name="Demo User",
            email=demo_email,
            hashed_password=hashed_password,
            is_active=True,
            is_verified=True,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    access_token_expires = timedelta(days=30)
    access_token = create_access_token(
        data={"sub": user.id}, expires_delta=access_token_expires
    )
    logger.info(f"Demo access granted for user: {user.id} ({user.email})")
    return StandardTokenResponse(data=Token(access_token=access_token, token_type="bearer"))

@router.get("/me", response_model=StandardUserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return StandardUserResponse(data=UserResponse.model_validate(current_user))

