import asyncio
from app.core.database import engine
from sqlalchemy import text

async def run():
    async with engine.begin() as conn:
        await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(512);"))
        await conn.execute(text("ALTER TABLE settings ADD COLUMN IF NOT EXISTS language VARCHAR(50) DEFAULT 'English';"))
        await conn.execute(text("ALTER TABLE settings ADD COLUMN IF NOT EXISTS ai_response_style VARCHAR(50) DEFAULT 'Professional';"))
        await conn.execute(text("ALTER TABLE settings ADD COLUMN IF NOT EXISTS voice_enabled BOOLEAN DEFAULT TRUE;"))
        await conn.execute(text("ALTER TABLE settings ADD COLUMN IF NOT EXISTS voice_gender VARCHAR(50) DEFAULT 'Female';"))
        await conn.execute(text("ALTER TABLE settings ADD COLUMN IF NOT EXISTS auto_save_chat BOOLEAN DEFAULT TRUE;"))
        await conn.execute(text("ALTER TABLE settings ADD COLUMN IF NOT EXISTS default_upload_folder VARCHAR(255) DEFAULT 'General';"))
    print("Database columns migrated successfully!")

if __name__ == "__main__":
    asyncio.run(run())
