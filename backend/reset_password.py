import sys
import asyncio
from app.core.database import AsyncSessionLocal
from app.core.security import get_password_hash
from app.models.user import User
from sqlalchemy import select

async def reset_user_password(email: str, new_password: str):
    email = email.lower().strip()
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.email == email))
        user = result.scalars().first()
        if not user:
            print(f"[ERROR] User with email '{email}' not found.")
            return False

        user.hashed_password = get_password_hash(new_password)
        session.add(user)
        await session.commit()
        print(f"[SUCCESS] Password for '{email}' has been successfully reset to: {new_password}")
        return True

if __name__ == "__main__":
    email = sys.argv[1] if len(sys.argv) > 1 else "test@gmail.com"
    new_pwd = sys.argv[2] if len(sys.argv) > 2 else "password123"
    asyncio.run(reset_user_password(email, new_pwd))
