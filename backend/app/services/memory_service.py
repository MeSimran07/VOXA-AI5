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

    async def detect_user_exams(self, user_id: str, db: AsyncSession) -> List[str]:
        """Detects exam goals and topics mentioned by user in past chats and memories."""
        exams = set()
        # 1. Check memories
        query = select(Memory).where(
            Memory.user_id == user_id, 
            Memory.is_active == True, 
            Memory.is_deleted == False
        )
        result = await db.execute(query)
        memories = result.scalars().all()
        for m in memories:
            txt = f"{m.subject} {m.object_value} {m.tags}".lower()
            for kw in ["gate", "upsc", "jee", "neet", "gre", "cat", "toefl", "ielts", "sat", "aws", "gmat"]:
                if kw in txt:
                    exams.add(m.subject)
            if m.category == "goal" and ("exam" in txt or "prep" in txt or "test" in txt):
                exams.add(m.subject)

        # 2. Check recent chat messages
        from app.models.message import Message
        from app.models.chat import Chat
        msg_q = (
            select(Message.content)
            .join(Chat, Chat.id == Message.chat_id)
            .where(Chat.user_id == user_id, Message.role == "user")
            .order_by(Message.created_at.desc())
            .limit(40)
        )
        res_msgs = await db.execute(msg_q)
        for row in res_msgs.scalars().all():
            row_l = row.lower()
            for kw in ["gate 2026", "gate 2027", "gate cs", "upsc", "jee mains", "jee advanced", "neet", "gre", "cat exam", "aws certified"]:
                if kw in row_l:
                    exams.add(kw.upper())

        # Defaults if none yet
        if not exams:
            return ["GATE 2027 CSE", "UPSC Civil Services", "JEE Advanced", "DSA & System Design"]
        return list(exams)[:6]

    async def generate_exam_preparation_map(self, user_id: str, exam_name: str, db: AsyncSession) -> Dict[str, Any]:
        """
        Analyzes all previous user queries, tutor sessions, notes, and memories 
        related to the specified exam, builds a comprehensive syllabus roadmap,
        maps past searches to specific subjects, and computes preparation readiness.
        """
        from app.models.message import Message
        from app.models.chat import Chat
        from app.models.ai_tutor_session import AITutorSession
        from app.models.analytics import Analytics
        from app.models.note import Note
        from app.services.ai import ai_service

        # 1. Gather all past user searches & interactions
        searches_raw = []

        # A. User chat messages
        msg_q = (
            select(Message.content, Message.created_at)
            .join(Chat, Chat.id == Message.chat_id)
            .where(Chat.user_id == user_id, Message.role == "user")
            .order_by(Message.created_at.desc())
            .limit(100)
        )
        msg_res = await db.execute(msg_q)
        for content, dt in msg_res.all():
            if content and len(content.strip()) > 3:
                searches_raw.append({
                    "text": content.strip()[:200],
                    "date": dt.strftime("%Y-%m-%d") if dt else "Recent",
                    "source": "Chat"
                })

        # B. AI Tutor session topics
        tutor_q = (
            select(AITutorSession.topic, AITutorSession.created_at)
            .where(AITutorSession.user_id == user_id)
            .order_by(AITutorSession.created_at.desc())
            .limit(40)
        )
        tutor_res = await db.execute(tutor_q)
        for topic, dt in tutor_res.all():
            if topic:
                searches_raw.append({
                    "text": f"Tutor Topic: {topic.strip()}",
                    "date": dt.strftime("%Y-%m-%d") if dt else "Recent",
                    "source": "AI Tutor"
                })

        # C. User notes
        note_q = (
            select(Note.title, Note.created_at)
            .where(Note.user_id == user_id, Note.is_deleted == False)
            .order_by(Note.created_at.desc())
            .limit(25)
        )
        note_res = await db.execute(note_q)
        for title, dt in note_res.all():
            if title:
                searches_raw.append({
                    "text": f"Note: {title.strip()}",
                    "date": dt.strftime("%Y-%m-%d") if dt else "Recent",
                    "source": "Notes"
                })

        # 2. Build AI prompt to parse & map searches to exam syllabus
        searches_snippet = "\n".join([f"- [{s['source']} | {s['date']}] {s['text']}" for s in searches_raw[:60]])
        if not searches_snippet.strip():
            searches_snippet = "(No previous searches found yet in this account)"

        ai_prompt = f"""You are the Exam Preparation Mastery & Knowledge Graph Engine for Voxa AI.
The user is preparing for the exam / domain: "{exam_name}".

Here are the user's previous search queries, chat questions, and study notes recorded across the platform:
{searches_snippet}

Tasks:
1. Identify 4 to 6 core official syllabus domains/subjects for "{exam_name}".
2. From the user's previous searches list above, match any questions or topics that correspond to each domain.
   - For matching searches, assign:
     - "topic": Clear standard topic title (e.g. "Dijkstra's Algorithm", "Virtual Memory & Paging", "Database Normalization").
     - "query": The user's query snippet.
     - "domain": The exact syllabus domain name.
     - "status": "covered".
     - "mastery": Integer between 65 and 95 based on search depth.
     - "date": Timestamp or "Recent".
     - "source": Source type.
3. For each domain, generate 2 to 3 critical pending topics that the user has NOT searched yet:
   - "topic": Topic title.
   - "domain": Domain name.
   - "status": "pending".
   - "mastery": 0.
4. Calculate an overall "preparation_score" (integer 0-100) representing their preparation progress based on covered vs pending topics.
5. Provide:
   - "readiness_level": "Beginner" (0-30%), "Developing" (31-60%), "Proficient" (61-85%), or "Exam Ready" (86-100%).
   - "summary": A 2-sentence encouraging analysis in natural English of what they've prepared and what they need to master next.
   - "recommended_next_topics": Array of 3 high-priority pending topics to study next.

Return strictly valid JSON matching this schema (no markdown fences, no code blocks):
{{
  "exam": "{exam_name}",
  "preparation_score": 45,
  "readiness_level": "Developing",
  "summary": "You have built strong foundations in Data Structures and OS. Focus next on Database Normalization and Computer Networks.",
  "domains": [
    {{
      "name": "Data Structures & Algorithms",
      "covered_count": 3,
      "total_count": 5,
      "percentage": 60
    }}
  ],
  "searches_mapped": [
    {{
      "query": "how to find shortest path using dijkstra",
      "topic": "Dijkstra's Shortest Path",
      "domain": "Data Structures & Algorithms",
      "status": "covered",
      "mastery": 85,
      "date": "Recent",
      "source": "Chat"
    }}
  ],
  "pending_topics": [
    {{
      "topic": "Dynamic Programming & Matrix Chain",
      "domain": "Data Structures & Algorithms",
      "status": "pending",
      "mastery": 0
    }}
  ],
  "recommended_next_topics": ["Database Normalization (BCNF)", "TCP Flow & Congestion Control", "Process Scheduling Algorithms"]
}}
"""
        parsed_data = {}
        try:
            ai_out = await ai_service.generate_response(user_message=ai_prompt)
            cleaned = re.sub(r'^```json\s*', '', ai_out.strip())
            cleaned = re.sub(r'\s*```$', '', cleaned.strip())
            parsed_data = json.loads(cleaned)
        except Exception as e:
            logger.warning(f"Exam map generation AI parsing error: {e}")
            # Fallback mock template if LLM is unavailable
            parsed_data = {
                "exam": exam_name,
                "preparation_score": 35,
                "readiness_level": "Developing",
                "summary": f"Your initial preparation roadmap for {exam_name} is active. Continue asking questions to increase your coverage.",
                "domains": [
                    {"name": "Core Concepts", "covered_count": 2, "total_count": 5, "percentage": 40},
                    {"name": "Advanced Theory", "covered_count": 1, "total_count": 4, "percentage": 25},
                    {"name": "Problem Solving", "covered_count": 1, "total_count": 4, "percentage": 25},
                    {"name": "System & Practical", "covered_count": 1, "total_count": 3, "percentage": 33}
                ],
                "searches_mapped": [
                    {
                        "query": s["text"],
                        "topic": s["text"][:30],
                        "domain": "Core Concepts",
                        "status": "covered",
                        "mastery": 75,
                        "date": s["date"],
                        "source": s["source"]
                    }
                    for s in searches_raw[:5]
                ],
                "pending_topics": [
                    {"topic": "Key Algorithms & Complexity", "domain": "Core Concepts", "status": "pending", "mastery": 0},
                    {"topic": "Practice Mock Questions", "domain": "Problem Solving", "status": "pending", "mastery": 0}
                ],
                "recommended_next_topics": ["Core Foundations", "Comprehensive Mock Tests"]
            }

        # 3. Assemble graph nodes and links for 2D/3D visualization
        nodes = []
        links = []

        # Center Root Node: The Exam Target
        exam_id = "exam-target"
        nodes.append({
            "id": exam_id,
            "label": parsed_data.get("exam", exam_name),
            "type": "exam_target",
            "category": "target",
            "score": parsed_data.get("preparation_score", 40),
            "readiness": parsed_data.get("readiness_level", "Developing"),
            "description": f"Target Goal: {exam_name}",
            "color": "#8b5cf6"
        })

        domains = parsed_data.get("domains", [])
        searches_mapped = parsed_data.get("searches_mapped", [])
        pending_topics = parsed_data.get("pending_topics", [])

        # Domain Hub Nodes
        for d_idx, d in enumerate(domains):
            d_id = f"domain-{d_idx}"
            d_name = d.get("name", f"Domain {d_idx+1}")
            pct = d.get("percentage", 50)
            nodes.append({
                "id": d_id,
                "label": d_name,
                "type": "domain_hub",
                "category": "domain",
                "score": pct,
                "covered_count": d.get("covered_count", 0),
                "total_count": d.get("total_count", 5),
                "description": f"{pct}% syllabus completed ({d.get('covered_count',0)}/{d.get('total_count',5)} topics)",
                "color": "#06b6d4" if pct >= 50 else "#f59e0b"
            })
            # Link domain to exam root
            links.append({
                "source": exam_id,
                "target": d_id,
                "relationship": "syllabus_domain",
                "strength": pct / 100.0,
                "status": "active"
            })

        # Covered Topic Nodes (Previous searches)
        for s_idx, item in enumerate(searches_mapped):
            t_id = f"covered-{s_idx}"
            topic_name = item.get("topic", f"Topic {s_idx+1}")
            dom_name = item.get("domain", "")
            # Find matching domain hub
            matching_domain_id = next(
                (f"domain-{i}" for i, d in enumerate(domains) if d.get("name", "").lower() == dom_name.lower()),
                "domain-0" if domains else exam_id
            )

            nodes.append({
                "id": t_id,
                "label": topic_name,
                "type": "covered_topic",
                "category": "covered",
                "domain": dom_name,
                "query": item.get("query", ""),
                "date": item.get("date", "Recent"),
                "source": item.get("source", "Chat"),
                "mastery": item.get("mastery", 80),
                "description": f"Covered in previous {item.get('source','search')}: \"{item.get('query','')[:60]}\"",
                "color": "#10b981"
            })

            links.append({
                "source": matching_domain_id,
                "target": t_id,
                "relationship": "covered_in_search",
                "strength": item.get("mastery", 80) / 100.0,
                "status": "covered"
            })

        # Pending Topic Nodes
        for p_idx, p_item in enumerate(pending_topics):
            p_id = f"pending-{p_idx}"
            topic_name = p_item.get("topic", f"Pending Topic {p_idx+1}")
            dom_name = p_item.get("domain", "")
            matching_domain_id = next(
                (f"domain-{i}" for i, d in enumerate(domains) if d.get("name", "").lower() == dom_name.lower()),
                "domain-0" if domains else exam_id
            )

            nodes.append({
                "id": p_id,
                "label": topic_name,
                "type": "pending_topic",
                "category": "pending",
                "domain": dom_name,
                "mastery": 0,
                "description": "Recommended high-yield topic not searched yet",
                "color": "#f43f5e"
            })

            links.append({
                "source": matching_domain_id,
                "target": p_id,
                "relationship": "pending_topic",
                "strength": 0.3,
                "status": "pending"
            })

        # 4. Auto-update user's active memory for this exam
        try:
            prep_score = parsed_data.get("preparation_score", 40)
            existing_goal_q = select(Memory).where(
                Memory.user_id == user_id,
                Memory.category == "goal",
                Memory.subject.ilike(f"%{exam_name[:15]}%"),
                Memory.is_deleted == False
            )
            g_res = await db.execute(existing_goal_q)
            existing_goal = g_res.scalars().first()

            obj_summary = f"{prep_score}% prepared. Covered {len(searches_mapped)} topics across {len(domains)} syllabus domains. Next focus: {', '.join(parsed_data.get('recommended_next_topics', [])[:2])}"

            if existing_goal:
                existing_goal.object_value = obj_summary
                existing_goal.confidence_score = 0.95
                existing_goal.tags = f"{exam_name},exam_prep,readiness_{prep_score}"
            else:
                new_goal = Memory(
                    user_id=user_id,
                    category="goal",
                    subject=f"{exam_name} Preparation",
                    predicate="readiness_score",
                    object_value=obj_summary,
                    confidence_score=0.95,
                    source="exam_roadmap_engine",
                    tags=f"{exam_name},exam_prep,readiness_{prep_score}",
                    is_active=True
                )
                db.add(new_goal)
            await db.commit()
        except Exception as save_err:
            logger.warning(f"Failed to auto-update memory with exam roadmap: {save_err}")

        return {
            "success": True,
            "exam": parsed_data.get("exam", exam_name),
            "preparation_score": parsed_data.get("preparation_score", 40),
            "readiness_level": parsed_data.get("readiness_level", "Developing"),
            "summary": parsed_data.get("summary", ""),
            "total_searches_found": len(searches_mapped),
            "domains": domains,
            "nodes": nodes,
            "links": links,
            "previous_searches": searches_mapped,
            "recommended_next_topics": parsed_data.get("recommended_next_topics", [])
        }

memory_service = MemoryService()
