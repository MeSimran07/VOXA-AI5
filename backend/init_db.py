import asyncio
from app.core.database import engine
from app.models.base import Base
import app.models  # registers all models with Base.metadata

async def init_db():
    async with engine.begin() as conn:
        print("Creating all tables (MVC structure)...")
        await conn.run_sync(Base.metadata.create_all)
        print("Done!")

if __name__ == "__main__":
    asyncio.run(init_db())
