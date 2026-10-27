from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.core.config import get_settings

import re

settings = get_settings()

db_url = settings.DATABASE_URL or "sqlite+aiosqlite:///:memory:"

# Normalize PostgreSQL URLs for SQLAlchemy asyncpg
if db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
if "asyncpg" in db_url:
    # asyncpg expects ssl=require instead of sslmode=require and does not take channel_binding
    db_url = re.sub(r'sslmode=[^&]+', 'ssl=require', db_url)
    db_url = re.sub(r'&?channel_binding=[^&]+', '', db_url)

connect_args = {}
if "asyncpg" in db_url:
    connect_args["statement_cache_size"] = 0
    connect_args["prepared_statement_cache_size"] = 0

engine = create_async_engine(
    db_url, 
    echo=(settings.ENVIRONMENT == "development"),
    pool_size=10,
    max_overflow=5,
    pool_pre_ping=True,
    pool_recycle=300,
    connect_args=connect_args,
)

AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
