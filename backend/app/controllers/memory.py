import logging
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.memory import Memory
from app.views.memory import (
    MemoryCreate, MemoryUpdate, StandardMemoryResponse, 
    StandardMemoriesResponse, MemoryResponse, 
    MemoryExtractRequest, MemoryGraphResponse
)
from app.services.memory_service import memory_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/memories", tags=["Memory Graph"])

@router.get("", response_model=StandardMemoriesResponse)
async def list_memories(
    category: Optional[str] = None,
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve memories for the current user with optional filtering."""
    try:
        query = select(Memory).where(Memory.user_id == current_user.id, Memory.is_deleted == False)

        if category and category.lower() != "all":
            query = query.where(Memory.category == category.lower())

        if is_active is not None:
            query = query.where(Memory.is_active == is_active)

        if search:
            search_pattern = f"%{search}%"
            query = query.where(
                (Memory.subject.ilike(search_pattern)) | 
                (Memory.object_value.ilike(search_pattern)) |
                (Memory.tags.ilike(search_pattern))
            )

        query = query.order_by(Memory.confidence_score.desc(), Memory.created_at.desc())
        result = await db.execute(query)
        memories = result.scalars().all()

        validated = [MemoryResponse.model_validate(m) for m in memories]
        return StandardMemoriesResponse(data=validated, total=len(validated))
    except Exception as e:
        logger.error(f"Failed to fetch memories: {e}", exc_info=True)
        return StandardMemoriesResponse(data=[], total=0)

@router.post("", response_model=StandardMemoryResponse)
async def create_memory(
    mem_in: MemoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Manually add a memory into the user's Knowledge Graph."""
    try:
        new_mem = Memory(
            user_id=current_user.id,
            category=mem_in.category.lower(),
            subject=mem_in.subject.strip(),
            predicate=mem_in.predicate.strip(),
            object_value=mem_in.object_value.strip(),
            confidence_score=mem_in.confidence_score or 0.95,
            source=mem_in.source or "explicit_user",
            source_chat_id=mem_in.source_chat_id,
            tags=mem_in.tags or "",
            is_active=True
        )
        db.add(new_mem)
        await db.commit()
        await db.refresh(new_mem)
        return StandardMemoryResponse(data=MemoryResponse.model_validate(new_mem))
    except Exception as e:
        logger.error(f"Failed to create memory: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to save memory")

@router.put("/{memory_id}", response_model=StandardMemoryResponse)
async def update_memory(
    memory_id: str,
    mem_update: MemoryUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update or verify confidence score of an existing memory."""
    query = select(Memory).where(Memory.id == memory_id, Memory.user_id == current_user.id)
    result = await db.execute(query)
    mem = result.scalars().first()

    if not mem:
        raise HTTPException(status_code=404, detail="Memory not found")

    if mem_update.category is not None:
        mem.category = mem_update.category.lower()
    if mem_update.subject is not None:
        mem.subject = mem_update.subject.strip()
    if mem_update.predicate is not None:
        mem.predicate = mem_update.predicate.strip()
    if mem_update.object_value is not None:
        mem.object_value = mem_update.object_value.strip()
    if mem_update.confidence_score is not None:
        mem.confidence_score = max(0.0, min(1.0, mem_update.confidence_score))
    if mem_update.is_active is not None:
        mem.is_active = mem_update.is_active
    if mem_update.tags is not None:
        mem.tags = mem_update.tags

    await db.commit()
    await db.refresh(mem)
    return StandardMemoryResponse(data=MemoryResponse.model_validate(mem))

@router.patch("/{memory_id}/toggle", response_model=StandardMemoryResponse)
async def toggle_memory_active(
    memory_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Quickly toggle active/inactive status of a memory."""
    query = select(Memory).where(Memory.id == memory_id, Memory.user_id == current_user.id)
    result = await db.execute(query)
    mem = result.scalars().first()

    if not mem:
        raise HTTPException(status_code=404, detail="Memory not found")

    mem.is_active = not mem.is_active
    await db.commit()
    await db.refresh(mem)
    return StandardMemoryResponse(data=MemoryResponse.model_validate(mem))

@router.delete("/{memory_id}")
async def delete_memory(
    memory_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Permanently delete a memory node from user's Knowledge Graph."""
    query = select(Memory).where(Memory.id == memory_id, Memory.user_id == current_user.id)
    result = await db.execute(query)
    mem = result.scalars().first()

    if not mem:
        raise HTTPException(status_code=404, detail="Memory not found")

    await db.delete(mem)
    await db.commit()
    return {"success": True, "message": "Memory deleted successfully"}

@router.post("/extract")
async def extract_memories_endpoint(
    req: MemoryExtractRequest,
    auto_save: bool = Query(default=True, description="Automatically persist extracted memories to database"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Extract persistent memories from statement and optionally auto-save them."""
    user_display = current_user.name or current_user.email.split('@')[0]
    extracted = await memory_service.extract_memories_from_text(req.text, user_name=user_display)

    saved_records = []
    if auto_save and extracted:
        for item in extracted:
            new_mem = Memory(
                user_id=current_user.id,
                category=item["category"],
                subject=item["subject"],
                predicate=item["predicate"],
                object_value=item["object_value"],
                confidence_score=item["confidence_score"],
                source="chat_extraction",
                source_chat_id=req.chat_id,
                tags=item.get("tags", ""),
                is_active=True
            )
            db.add(new_mem)
            saved_records.append(new_mem)
        await db.commit()
        for r in saved_records:
            await db.refresh(r)

    return {
        "success": True,
        "extracted_count": len(extracted),
        "memories": [MemoryResponse.model_validate(m) for m in saved_records] if auto_save else extracted
    }

@router.get("/graph", response_model=MemoryGraphResponse)
async def get_memory_graph(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve full Knowledge Graph nodes and links for 2D/3D visualization."""
    try:
        query = (
            select(Memory)
            .where(Memory.user_id == current_user.id, Memory.is_deleted == False)
            .order_by(Memory.created_at.desc())
        )
        result = await db.execute(query)
        memories = result.scalars().all()

        user_display = current_user.name or current_user.email.split('@')[0]
        graph_data = memory_service.build_graph_structure(memories, user_name=user_display)

        return MemoryGraphResponse(
            success=True,
            nodes=graph_data["nodes"],
            links=graph_data["links"],
            stats=graph_data["stats"]
        )
    except Exception as e:
        logger.error(f"Failed to generate memory graph: {e}", exc_info=True)
        return MemoryGraphResponse(
            success=True,
            nodes=[],
            links=[],
            stats={"total_memories": 0, "high_confidence_count": 0, "average_confidence": 0, "categories_active": 0, "total_connections": 0}
        )
