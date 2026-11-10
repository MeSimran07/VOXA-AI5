import logging
import json
import re
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update
from app.models.memory import Memory

logger = logging.getLogger(__name__)

EXTRACTION_SYSTEM_PROMPT = """You are the Memory Knowledge Extraction Engine for Voxa AI.
Analyze the user's message (and conversation context) to detect persistent personal facts, goals, preferences, skills, constraints, or current projects.

Do NOT extract transient greetings, short questions, or momentary requests.
ONLY extract meaningful knowledge that should be remembered in future conversations.

Categories to use:
- "goal": Long-term objectives, upcoming exams, career milestones (e.g., preparing for GATE 2027, learning Rust).
- "preference": Coding styles, preferred frameworks, communication formats (e.g., prefers concise Python, dark mode).
- "skill": Known technologies, proficiency levels (e.g., intermediate in React, beginner in PyTorch).
- "project": What they are actively building (e.g., building Voxa AI multimodal platform).
- "constraint": Time limits, hardware specs, budget (e.g., 2 hours study daily, 16GB RAM laptop).
- "fact": General personal facts (e.g., lives in India, 3rd year CS student).

Return a strictly valid JSON array of objects with the following schema:
[
  {
    "category": "goal" | "preference" | "skill" | "project" | "constraint" | "fact",
    "subject": "Concise subject (2-4 words, e.g., 'GATE 2027', 'Preferred Code Style')",
    "predicate": "Relation verb (e.g., 'preparing_for', 'prefers', 'building', 'restricted_to')",
    "object_value": "Clear specific detail to remember",
    "confidence_score": 0.85, // float from 0.50 to 0.98 based on how certain/explicit the user was
    "tags": "comma-separated tags"
  }
]
If nothing long-term should be remembered, return an empty array: []
Do not include markdown fences or other text, only valid JSON.
"""

class MemoryService:
    async def extract_memories_from_text(self, text: str, user_name: str = "User") -> List[Dict[str, Any]]:
        """Extracts structured memories from a user statement using multi-tier AI."""
        if len(text.strip()) < 10:
            return []

        from app.services.ai import ai_service
        try:
            prompt = f"User ({user_name}) said: \"{text}\"\nExtract persistent memories if any exist."
            ai_out = await ai_service.generate_response(
                user_message=prompt,
                system_prompt=EXTRACTION_SYSTEM_PROMPT
            )

            # Strip markdown fences if present
            cleaned = re.sub(r'^```json\s*', '', ai_out.strip())
            cleaned = re.sub(r'\s*```$', '', cleaned.strip())
            
            data = json.loads(cleaned)
            if isinstance(data, list):
                # Sanitize extracted records
                valid_memories = []
                for item in data:
                    if isinstance(item, dict) and "subject" in item and "object_value" in item:
                        confidence = float(item.get("confidence_score", 0.85))
                        valid_memories.append({
                            "category": str(item.get("category", "fact")).lower(),
                            "subject": str(item.get("subject", "General")),
                            "predicate": str(item.get("predicate", "relates_to")),
                            "object_value": str(item.get("object_value", "")),
                            "confidence_score": max(0.4, min(1.0, confidence)),
                            "tags": str(item.get("tags", "")),
                            "source": "chat_extraction"
                        })
                return valid_memories
        except Exception as e:
            logger.warning(f"Memory extraction failed: {e}")
        return []

    async def get_personalized_context(self, user_id: str, db: AsyncSession, limit: int = 15) -> str:
        """Retrieves user memories and builds dynamic context for system prompt."""
        try:
            query = (
                select(Memory)
                .where(Memory.user_id == user_id, Memory.is_active == True, Memory.is_deleted == False)
                .order_by(Memory.confidence_score.desc(), Memory.access_count.desc())
                .limit(limit)
            )
            result = await db.execute(query)
            memories = result.scalars().all()

            if not memories:
                return ""

            # Update access counts and last_accessed_at in the background
            memory_ids = [m.id for m in memories]
            now = datetime.now(timezone.utc)
            await db.execute(
                update(Memory)
                .where(Memory.id.in_(memory_ids))
                .values(access_count=Memory.access_count + 1, last_accessed_at=now)
            )
            await db.commit()

            lines = ["[USER'S PERSONAL KNOWLEDGE GRAPH & ACTIVE MEMORY]:"]
            for m in memories:
                pct = int(m.confidence_score * 100)
                lines.append(f"- [{m.category.upper()}] {m.subject} ({m.predicate}): {m.object_value} (Confidence: {pct}%)")

            lines.append("Instruction: Seamlessly personalize tone, depth, and suggestions based on these confirmed user memories without unnecessarily regurgitating them.")
            return "\n".join(lines)
        except Exception as e:
            logger.error(f"Error fetching personalized memory context: {e}", exc_info=True)
            return ""

    def build_graph_structure(self, memories: List[Memory], user_name: str = "User") -> Dict[str, Any]:
        """Builds nodes and links for visual Knowledge Graph representation."""
        nodes = []
        links = []

        # 1. Root user node (Center of the universe)
        nodes.append({
            "id": "root-user",
            "label": f"{user_name}'s Brain",
            "category": "user",
            "type": "user",
            "confidence": 1.0,
            "description": "Central Mind Graph",
            "access_count": len(memories)
        })

        # 2. Category hubs
        categories = ["goal", "preference", "skill", "project", "constraint", "fact"]
        category_titles = {
            "goal": "Goals & Milestones",
            "preference": "Personal Preferences",
            "skill": "Skills & Tech",
            "project": "Active Projects",
            "constraint": "Rules & Limits",
            "fact": "Core Knowledge"
        }

        active_categories = set(m.category.lower() for m in memories)
        for cat in categories:
            if cat in active_categories:
                hub_id = f"hub-{cat}"
                nodes.append({
                    "id": hub_id,
                    "label": category_titles.get(cat, cat.title()),
                    "category": cat,
                    "type": "category_hub",
                    "confidence": 0.95,
                    "description": f"Cluster for {cat}s",
                    "access_count": 0
                })
                # Link hub to root user
                links.append({
                    "source": "root-user",
                    "target": hub_id,
                    "relationship": "has_dimension",
                    "strength": 0.8
                })

        # 3. Memory Nodes & Links
        for m in memories:
            node_id = f"mem-{m.id}"
            cat = m.category.lower() if m.category else "fact"
            nodes.append({
                "id": node_id,
                "label": m.subject,
                "category": cat,
                "type": "memory_node",
                "confidence": float(m.confidence_score or 0.85),
                "description": f"{m.predicate}: {m.object_value}",
                "access_count": int(m.access_count or 0)
            })

            # Link memory to its category hub
            hub_id = f"hub-{cat}"
            links.append({
                "source": hub_id,
                "target": node_id,
                "relationship": m.predicate or "includes",
                "strength": float(m.confidence_score or 0.8)
            })

        # 4. Compute Graph Stats
        avg_confidence = (
            sum(m.confidence_score for m in memories) / len(memories)
            if memories else 0.0
        )
        stats = {
            "total_memories": len(memories),
            "high_confidence_count": sum(1 for m in memories if m.confidence_score >= 0.85),
            "average_confidence": round(avg_confidence * 100, 1),
            "categories_active": len(active_categories),
            "total_connections": len(links)
        }

        return {
            "nodes": nodes,
            "links": links,
            "stats": stats
        }

memory_service = MemoryService()
