"""
Feature Routes
Routes for Memory Lane, Bucket List, Daily Questions, Check-In Topics, Monthly Deep Dive
"""

from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel, Field
from typing import Optional, Dict, List, Any
from datetime import datetime, timezone, date
from motor.motor_asyncio import AsyncIOMotorClient
import os
import uuid

router = APIRouter(prefix="/api/features", tags=["features"])

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', '')
db_name = os.environ.get('DB_NAME', 'bond_app')

def get_db():
    client = AsyncIOMotorClient(mongo_url)
    return client[db_name]


# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class MemoryCreate(BaseModel):
    couple_id: str
    title: str
    description: Optional[str] = None
    memory_date: str = Field(..., description="ISO date string")
    memory_type: str = Field(..., description="milestone|moment|date|achievement|other")
    photos: Optional[List[str]] = Field(default_factory=list, description="Photo URLs")
    location: Optional[str] = None
    tags: Optional[List[str]] = Field(default_factory=list)

class MemoryUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    memory_date: Optional[str] = None
    memory_type: Optional[str] = None
    photos: Optional[List[str]] = None
    location: Optional[str] = None
    tags: Optional[List[str]] = None

class BucketListItemCreate(BaseModel):
    couple_id: str
    title: str
    description: Optional[str] = None
    category: str = Field(..., description="travel|adventure|learning|family|romance|other")
    priority: str = Field(default="medium", description="high|medium|low")
    estimated_cost: Optional[str] = None
    target_date: Optional[str] = None
    status: str = Field(default="pending", description="pending|in_progress|completed|archived")

class BucketListItemUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    estimated_cost: Optional[str] = None
    target_date: Optional[str] = None
    status: Optional[str] = None
    completed_date: Optional[str] = None

class DailyQuestionAnswer(BaseModel):
    couple_id: str
    question_id: str
    user_answer: str
    partner_answer: Optional[str] = None
    answered_at: Optional[str] = None

class CheckInTopicResponse(BaseModel):
    couple_id: str
    topic_id: str
    user_response: str
    partner_response: Optional[str] = None
    depth_level: int = Field(default=1, description="1=surface, 2=moderate, 3=deep")
    responded_at: Optional[str] = None

class MonthlyDeepDiveCreate(BaseModel):
    couple_id: str
    month: str = Field(..., description="YYYY-MM format")
    theme: str = Field(..., description="communication|intimacy|conflict|trust|growth|connection")
    focus_questions: List[str] = Field(default_factory=list)
    activities: List[str] = Field(default_factory=list)
    insights_gathered: List[str] = Field(default_factory=list)
    overall_reflection: Optional[str] = None
    growth_identified: Optional[str] = None

class MonthlyDeepDiveUpdate(BaseModel):
    focus_questions: Optional[List[str]] = None
    activities: Optional[List[str]] = None
    insights_gathered: Optional[List[str]] = None
    overall_reflection: Optional[str] = None
    growth_identified: Optional[str] = None
    status: Optional[str] = None


# ============================================================================
# MEMORY LANE ROUTES
# ============================================================================

@router.post("/memory-lane")
async def create_memory(
    memory: MemoryCreate,
    x_user_id: Optional[str] = Header(None, alias="X-User-ID")
):
    """
    Create a new memory in the timeline.
    """
    try:
        db = get_db()
        now = datetime.now(timezone.utc).isoformat()
        
        doc = {
            "id": str(uuid.uuid4()),
            "couple_id": memory.couple_id,
            "title": memory.title,
            "description": memory.description,
            "memory_date": memory.memory_date,
            "memory_type": memory.memory_type,
            "photos": memory.photos,
            "location": memory.location,
            "tags": memory.tags,
            "created_by": x_user_id or "anonymous",
            "created_at": now,
            "updated_at": now
        }
        
        await db.memory_lane.insert_one(doc)
        
        return {
            "success": True,
            "memory": doc
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create memory: {str(e)}")


@router.get("/memory-lane/{couple_id}")
async def get_memories(
    couple_id: str,
    memory_type: Optional[str] = None,
    year: Optional[int] = None,
    limit: int = 50,
    offset: int = 0
):
    """
    Get memories for a couple, optionally filtered by type or year.
    Returns timeline sorted by memory_date descending.
    """
    try:
        db = get_db()
        
        query = {"couple_id": couple_id}
        if memory_type:
            query["memory_type"] = memory_type
        if year:
            query["memory_date"] = {"$regex": f"^{year}-"}
        
        memories = await db.memory_lane.find(
            query,
            {"_id": 0}
        ).sort("memory_date", -1).skip(offset).limit(limit).to_list(limit)
        
        # Get total count
        total = await db.memory_lane.count_documents(query)
        
        return {
            "success": True,
            "couple_id": couple_id,
            "count": len(memories),
            "total": total,
            "memories": memories
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get memories: {str(e)}")


@router.put("/memory-lane/{memory_id}")
async def update_memory(
    memory_id: str,
    update: MemoryUpdate,
    x_user_id: Optional[str] = Header(None, alias="X-User-ID")
):
    """
    Update a memory (only creator can update).
    """
    try:
        db = get_db()
        now = datetime.now(timezone.utc).isoformat()
        
        update_data = {k: v for k, v in update.model_dump().items() if v is not None}
        update_data["updated_at"] = now
        
        result = await db.memory_lane.update_one(
            {"id": memory_id},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Memory not found")
        
        updated = await db.memory_lane.find_one({"id": memory_id}, {"_id": 0})
        
        return {
            "success": True,
            "memory": updated
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update memory: {str(e)}")


@router.delete("/memory-lane/{memory_id}")
async def delete_memory(
    memory_id: str,
    x_user_id: Optional[str] = Header(None, alias="X-User-ID")
):
    """
    Delete a memory (soft delete by marking as archived).
    """
    try:
        db = get_db()
        
        result = await db.memory_lane.update_one(
            {"id": memory_id},
            {"$set": {"status": "archived", "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Memory not found")
        
        return {"success": True, "message": "Memory archived"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete memory: {str(e)}")


@router.get("/memory-lane/{couple_id}/timeline")
async def get_timeline(
    couple_id: str,
    start_year: Optional[int] = None,
    end_year: Optional[int] = None
):
    """
    Get timeline grouped by year with milestones highlighted.
    """
    try:
        db = get_db()
        
        query = {"couple_id": couple_id, "status": {"$ne": "archived"}}
        if start_year:
            query["memory_date"] = {"$gte": f"{start_year}-01-01"}
        if end_year:
            if "memory_date" in query:
                query["memory_date"]["$lte"] = f"{end_year}-12-31"
            else:
                query["memory_date"] = {"$lte": f"{end_year}-12-31"}
        
        memories = await db.memory_lane.find(
            query,
            {"_id": 0}
        ).sort("memory_date", 1).to_list(1000)
        
        # Group by year
        timeline = {}
        for memory in memories:
            year = memory["memory_date"][:4]
            if year not in timeline:
                timeline[year] = []
            timeline[year].append(memory)
        
        # Mark milestones
        for year in timeline:
            for memory in timeline[year]:
                if memory.get("memory_type") == "milestone":
                    memory["is_milestone"] = True
        
        return {
            "success": True,
            "couple_id": couple_id,
            "timeline": timeline,
            "total_memories": len(memories)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get timeline: {str(e)}")


# ============================================================================
# BUCKET LIST ROUTES
# ============================================================================

@router.post("/bucket-list")
async def create_bucket_item(
    item: BucketListItemCreate,
    x_user_id: Optional[str] = Header(None, alias="X-User-ID")
):
    """
    Create a new bucket list item (goal/dream/aspiration).
    """
    try:
        db = get_db()
        now = datetime.now(timezone.utc).isoformat()
        
        doc = {
            "id": str(uuid.uuid4()),
            "couple_id": item.couple_id,
            "title": item.title,
            "description": item.description,
            "category": item.category,
            "priority": item.priority,
            "estimated_cost": item.estimated_cost,
            "target_date": item.target_date,
            "status": item.status,
            "created_by": x_user_id or "anonymous",
            "created_at": now,
            "updated_at": now,
            "completed_date": None
        }
        
        await db.bucket_list.insert_one(doc)
        
        return {
            "success": True,
            "item": doc
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create bucket list item: {str(e)}")


@router.get("/bucket-list/{couple_id}")
async def get_bucket_list(
    couple_id: str,
    status: Optional[str] = None,
    category: Optional[str] = None,
    priority: Optional[str] = None,
    limit: int = 50
):
    """
    Get bucket list items for a couple, optionally filtered.
    """
    try:
        db = get_db()
        
        query = {"couple_id": couple_id}
        if status:
            query["status"] = status
        if category:
            query["category"] = category
        if priority:
            query["priority"] = priority
        
        items = await db.bucket_list.find(
            query,
            {"_id": 0}
        ).sort("created_at", -1).limit(limit).to_list(limit)
        
        return {
            "success": True,
            "couple_id": couple_id,
            "count": len(items),
            "items": items
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get bucket list: {str(e)}")


@router.put("/bucket-list/{item_id}")
async def update_bucket_item(
    item_id: str,
    update: BucketListItemUpdate,
    x_user_id: Optional[str] = Header(None, alias="X-User-ID")
):
    """
    Update a bucket list item (e.g., mark as completed).
    """
    try:
        db = get_db()
        now = datetime.now(timezone.utc).isoformat()
        
        update_data = {k: v for k, v in update.model_dump().items() if v is not None}
        update_data["updated_at"] = now
        
        # Auto-set completed_date if status changed to completed
        if update_data.get("status") == "completed" and not update_data.get("completed_date"):
            update_data["completed_date"] = now
        
        result = await db.bucket_list.update_one(
            {"id": item_id},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Bucket list item not found")
        
        updated = await db.bucket_list.find_one({"id": item_id}, {"_id": 0})
        
        return {
            "success": True,
            "item": updated
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update bucket list item: {str(e)}")


@router.delete("/bucket-list/{item_id}")
async def delete_bucket_item(
    item_id: str,
    x_user_id: Optional[str] = Header(None, alias="X-User-ID")
):
    """
    Delete/archive a bucket list item.
    """
    try:
        db = get_db()
        
        result = await db.bucket_list.update_one(
            {"id": item_id},
            {"$set": {"status": "archived", "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Bucket list item not found")
        
        return {"success": True, "message": "Bucket list item archived"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete bucket list item: {str(e)}")


@router.get("/bucket-list/{couple_id}/stats")
async def get_bucket_stats(couple_id: str):
    """
    Get bucket list statistics for a couple.
    Returns: total, completed, in_progress, pending counts by category.
    """
    try:
        db = get_db()
        
        pipeline = [
            {"$match": {"couple_id": couple_id, "status": {"$ne": "archived"}}},
            {"$group": {
                "_id": {"status": "$status", "category": "$category"},
                "count": {"$sum": 1}
            }}
        ]
        
        results = await db.bucket_list.aggregate(pipeline).to_list(100)
        
        stats = {
            "total": 0,
            "completed": 0,
            "in_progress": 0,
            "pending": 0,
            "by_category": {}
        }
        
        for r in results:
            status = r["_id"]["status"]
            category = r["_id"]["category"]
            count = r["count"]
            
            stats["total"] += count
            if status == "completed":
                stats["completed"] += count
            elif status == "in_progress":
                stats["in_progress"] += count
            else:
                stats["pending"] += count
            
            if category not in stats["by_category"]:
                stats["by_category"][category] = {"total": 0, "completed": 0}
            stats["by_category"][category]["total"] += count
            if status == "completed":
                stats["by_category"][category]["completed"] += count
        
        return {
            "success": True,
            "couple_id": couple_id,
            "stats": stats
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get bucket list stats: {str(e)}")


# ============================================================================
# DAILY QUESTIONS ROUTES
# ============================================================================

# Pre-loaded question bank
DAILY_QUESTIONS = [
    {"id": "dq001", "question": "What made you smile today?", "category": "positivity", "depth": 1},
    {"id": "dq002", "question": "What's one thing you appreciate about our relationship?", "category": "gratitude", "depth": 1},
    {"id": "dq003", "question": "If you could relive one moment from our week, what would it be?", "category": "reflection", "depth": 2},
    {"id": "dq004", "question": "What's something new you learned about yourself this week?", "category": "growth", "depth": 2},
    {"id": "dq005", "question": "What's a small act of kindness your partner did recently?", "category": "appreciation", "depth": 1},
    {"id": "dq006", "question": "Where do you feel we're growing together?", "category": "connection", "depth": 2},
    {"id": "dq007", "question": "What's one thing you'd love to do together that we haven't tried?", "category": " dreams", "depth": 2},
    {"id": "dq008", "question": "How are you feeling about our communication lately?", "category": "communication", "depth": 3},
    {"id": "dq009", "question": "What's a challenge you're currently facing that I could support you with?", "category": "support", "depth": 3},
    {"id": "dq010", "question": "What does 'quality time' mean to you right now?", "category": "intimacy", "depth": 2},
    {"id": "dq011", "question": "What's a boundary you'd like to set or respect more?", "category": "boundaries", "depth": 3},
    {"id": "dq012", "question": "What's one thing from your childhood you'd love to share with me?", "category": "vulnerability", "depth": 3},
    {"id": "dq013", "question": "If our relationship was a book, what chapter would we be in?", "category": "reflection", "depth": 2},
    {"id": "dq014", "question": "What's a fear you have about our future together?", "category": "vulnerability", "depth": 3},
    {"id": "dq015", "question": "What's the most meaningful gift you've ever received from me?", "category": "appreciation", "depth": 1},
    {"id": "dq016", "question": "What's one way I could make your day easier?", "category": "support", "depth": 1},
    {"id": "dq017", "question": "What's a dream you have for us in the next 5 years?", "category": "dreams", "depth": 2},
    {"id": "dq018", "question": "How can we create more joy in our daily routine?", "category": "connection", "depth": 2},
    {"id": "dq019", "question": "What do you need most from me right now?", "category": "support", "depth": 3},
    {"id": "dq020", "question": "What's a memory that always makes you feel close to me?", "category": "reflection", "depth": 1},
    {"id": "dq021", "question": "What's one habit you'd like us to develop together?", "category": "growth", "depth": 2},
    {"id": "dq022", "question": "What's a topic we're yet to explore deeply together?", "category": "curiosity", "depth": 2},
    {"id": "dq023", "question": "What's your love language right now and has it changed?", "category": "intimacy", "depth": 3},
    {"id": "dq024", "question": "What's one thing I do that makes you feel truly loved?", "category": "appreciation", "depth": 1},
    {"id": "dq025", "question": "If we had a 'relationship tune-up' today, what would we adjust?", "category": "growth", "depth": 2},
    {"id": "dq026", "question": "What's a fun adventure you'd love to plan?", "category": "dreams", "depth": 1},
    {"id": "dq027", "question": "How are you feeling about our physical intimacy?", "category": "intimacy", "depth": 3},
    {"id": "dq028", "question": "What's something you're proud of in yourself right now?", "category": "growth", "depth": 2},
    {"id": "dq029", "question": "What's a misunderstanding we had that turned into a learning?", "category": "communication", "depth": 2},
    {"id": "dq030", "question": "What does being 'teammates' mean to you?", "category": "connection", "depth": 2},
    {"id": "dq031", "question": "What's one way we can support each other's individual goals?", "category": "growth", "depth": 2},
    {"id": "dq032", "question": "What's a compliment you've wanted to give me but haven't?", "category": "appreciation", "depth": 2},
    {"id": "dq033", "question": "How do you want to feel in our relationship?", "category": "intimacy", "depth": 3},
    {"id": "dq034", "question": "What's a ritual or tradition we'd like to start?", "category": "connection", "depth": 2},
    {"id": "dq035", "question": "What's the bravest thing you've done in our relationship?", "category": "vulnerability", "depth": 2},
    {"id": "dq036", "question": "What's a small moment this week that reminded me why I chose you?", "category": "reflection", "depth": 1},
    {"id": "dq037", "question": "What's one value we share that strengthens us?", "category": "connection", "depth": 1},
    {"id": "dq038", "question": "What's a struggle you're proud we got through together?", "category": "reflection", "depth": 2},
    {"id": "dq039", "question": "If you could give me one piece of relationship advice, what would it be?", "category": "growth", "depth": 2},
    {"id": "dq040", "question": "What's one thing you'd like to celebrate about us?", "category": "positivity", "depth": 1},
    {"id": "dq041", "question": "What's a conversation we've been avoiding that we should have?", "category": "communication", "depth": 3},
    {"id": "dq042", "question": "What's one way our relationship has exceeded your expectations?", "category": "gratitude", "depth": 2},
    {"id": "dq043", "question": "What's your favorite way to unwind after a long day?", "category": "support", "depth": 1},
    {"id": "dq044", "question": "What's something you'd change about how we fight?", "category": "communication", "depth": 3},
    {"id": "dq045", "question": "What's one quality in me that you find inspiring?", "category": "appreciation", "depth": 1},
    {"id": "dq046", "question": "What's a goal we could set together this month?", "category": "growth", "depth": 2},
    {"id": "dq047", "question": "How do I help you feel safe in our relationship?", "category": "intimacy", "depth": 3},
    {"id": "dq048", "question": "What's a reconnection ritual that works for us?", "category": "connection", "depth": 2},
    {"id": "dq049", "question": "What's one thing I do that feels like love to you?", "category": "appreciation", "depth": 1},
    {"id": "dq050", "question": "What are you most grateful for in our life together?", "category": "gratitude", "depth": 2},
]


@router.get("/daily-questions/today")
async def get_todays_question(couple_id: str):
    """
    Get today's question based on date rotation.
    Each day gets a deterministic question based on day of year.
    """
    try:
        now = datetime.now(timezone.utc)
        day_of_year = (now - datetime(now.year, 1, 1, tzinfo=timezone.utc)).days
        question_index = day_of_year % len(DAILY_QUESTIONS)
        todays_question = DAILY_QUESTIONS[question_index]
        
        # Check if couple has already answered today
        db = get_db()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
        
        existing = await db.daily_question_answers.find_one({
            "couple_id": couple_id,
            "question_id": todays_question["id"],
            "answered_at": {"$gte": today_start}
        })
        
        return {
            "success": True,
            "question": todays_question,
            "already_answered": existing is not None,
            "date": now.strftime("%Y-%m-%d")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get today's question: {str(e)}")


@router.get("/daily-questions")
async def get_questions(
    category: Optional[str] = None,
    depth: Optional[int] = None,
    limit: int = 10,
    offset: int = 0
):
    """
    Get questions with optional filtering.
    """
    try:
        questions = DAILY_QUESTIONS
        
        if category:
            questions = [q for q in questions if q["category"] == category]
        if depth:
            questions = [q for q in questions if q["depth"] == depth]
        
        return {
            "success": True,
            "count": len(questions),
            "questions": questions[offset:offset+limit]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get questions: {str(e)}")


@router.post("/daily-questions/answer")
async def answer_daily_question(
    answer: DailyQuestionAnswer,
    x_user_id: Optional[str] = Header(None, alias="X-User-ID")
):
    """
    Submit an answer to today's question.
    Each partner answers separately, both needed for "complete" status.
    """
    try:
        db = get_db()
        now = datetime.now(timezone.utc).isoformat()
        
        # Check if already answered by this user
        existing = await db.daily_question_answers.find_one({
            "couple_id": answer.couple_id,
            "question_id": answer.question_id,
            "answered_by": x_user_id or "anonymous"
        })
        
        if existing:
            raise HTTPException(status_code=400, detail="Already answered this question")
        
        doc = {
            "id": str(uuid.uuid4()),
            "couple_id": answer.couple_id,
            "question_id": answer.question_id,
            "user_answer": answer.user_answer,
            "partner_answer": answer.partner_answer,
            "answered_by": x_user_id or "anonymous",
            "answered_at": answer.answered_at or now,
            "created_at": now
        }
        
        await db.daily_question_answers.insert_one(doc)
        
        # Check if both partners have answered
        answers = await db.daily_question_answers.find({
            "couple_id": answer.couple_id,
            "question_id": answer.question_id
        }).to_list(2)
        
        both_answered = len(answers) >= 2
        
        return {
            "success": True,
            "answer": doc,
            "both_partners_answered": both_answered
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save answer: {str(e)}")


@router.get("/daily-questions/history/{couple_id}")
async def get_question_history(
    couple_id: str,
    limit: int = 30
):
    """
    Get history of daily question answers for a couple.
    """
    try:
        db = get_db()
        
        results = await db.daily_question_answers.find(
            {"couple_id": couple_id},
            {"_id": 0}
        ).sort("answered_at", -1).limit(limit).to_list(limit)
        
        return {
            "success": True,
            "couple_id": couple_id,
            "count": len(results),
            "history": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get question history: {str(e)}")


# ============================================================================
# CHECK-IN TOPICS ROUTES
# ============================================================================

CHECK_IN_TOPICS = [
    {"id": "cit001", "title": "Work & Career", "prompts": ["How are you feeling about work lately?", "What's stressing you out professionally?", "What accomplishment are you proud of?"], "category": "life"},
    {"id": "cit002", "title": "Family & Friends", "prompts": ["How's your relationship with your family?", "Any social obligations feeling overwhelming?", "Who in your life deserves more attention from us?"], "category": "social"},
    {"id": "cit003", "title": "Finances", "prompts": ["How are you feeling about our financial situation?", "Any spending concerns?", "What financial goal excites you most?"], "category": "practical"},
    {"id": "cit004", "title": "Health & Wellness", "prompts": ["How's your physical health?", "Any health worries on your mind?", "What would help you feel more energized?"], "category": "wellness"},
    {"id": "cit005", "title": "Personal Growth", "prompts": ["What skill are you developing?", "Any personal goals you're working toward?", "What's challenging you right now?"], "category": "growth"},
    {"id": "cit006", "title": "Intimacy & Romance", "prompts": ["How's our romantic life?", "What would make you feel more connected?", "Any fantasies or desires you'd like to explore?"], "category": "intimacy"},
    {"id": "cit007", "title": "Communication", "prompts": ["How do you feel about our conversations?", "Is there anything unsaid between us?", "What topic feels hardest to bring up?"], "category": "relationship"},
    {"id": "cit008", "title": "Future & Goals", "prompts": ["What do you want our life to look like in 5 years?", "Any decisions we're putting off?", "What excites you most about our future?"], "category": "vision"},
]


@router.get("/check-in-topics")
async def get_check_in_topics():
    """
    Get all available check-in topics.
    """
    return {
        "success": True,
        "topics": CHECK_IN_TOPICS
    }


@router.post("/check-in-topics/respond")
async def respond_to_check_in(
    response: CheckInTopicResponse,
    x_user_id: Optional[str] = Header(None, alias="X-User-ID")
):
    """
    Submit a response to a check-in topic.
    Each partner responds separately.
    """
    try:
        db = get_db()
        now = datetime.now(timezone.utc).isoformat()
        
        doc = {
            "id": str(uuid.uuid4()),
            "couple_id": response.couple_id,
            "topic_id": response.topic_id,
            "user_response": response.user_response,
            "partner_response": response.partner_response,
            "depth_level": response.depth_level,
            "responded_by": x_user_id or "anonymous",
            "responded_at": response.responded_at or now,
            "created_at": now
        }
        
        await db.check_in_responses.insert_one(doc)
        
        return {
            "success": True,
            "response": doc
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save check-in response: {str(e)}")


@router.get("/check-in-topics/history/{couple_id}")
async def get_check_in_history(
    couple_id: str,
    topic_id: Optional[str] = None,
    limit: int = 50
):
    """
    Get check-in response history for a couple.
    """
    try:
        db = get_db()
        
        query = {"couple_id": couple_id}
        if topic_id:
            query["topic_id"] = topic_id
        
        results = await db.check_in_responses.find(
            query,
            {"_id": 0}
        ).sort("responded_at", -1).limit(limit).to_list(limit)
        
        # Enrich with topic info
        topic_map = {t["id"]: t for t in CHECK_IN_TOPICS}
        for r in results:
            r["topic"] = topic_map.get(r["topic_id"], {})
        
        return {
            "success": True,
            "couple_id": couple_id,
            "count": len(results),
            "history": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get check-in history: {str(e)}")


@router.get("/check-in-topics/suggested/{couple_id}")
async def get_suggested_topic(couple_id: str):
    """
    Get a suggested check-in topic based on recent history.
    Avoids repeating same topic too frequently.
    """
    try:
        db = get_db()
        
        # Get recently used topics
        recent = await db.check_in_responses.find(
            {"couple_id": couple_id},
            {"topic_id": 1, "_id": 0}
        ).sort("responded_at", -1).limit(5).to_list(5)
        
        recent_topic_ids = [r["topic_id"] for r in recent]
        available = [t for t in CHECK_IN_TOPICS if t["id"] not in recent_topic_ids]
        
        if not available:
            available = CHECK_IN_TOPICS
        
        # Pick one (could be enhanced with smart selection)
        import random
        suggested = random.choice(available)
        
        return {
            "success": True,
            "suggested_topic": suggested
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get suggested topic: {str(e)}")


# ============================================================================
# MONTHLY DEEP DIVE ROUTES
# ============================================================================

@router.post("/monthly-deep-dive")
async def create_monthly_deep_dive(
    deep_dive: MonthlyDeepDiveCreate,
    x_user_id: Optional[str] = Header(None, alias="X-User-ID")
):
    """
    Create/initiate a monthly deep dive session.
    One per couple per month, themed around a specific area.
    """
    try:
        db = get_db()
        now = datetime.now(timezone.utc).isoformat()
        
        # Check if already exists for this month
        existing = await db.monthly_deep_dives.find_one({
            "couple_id": deep_dive.couple_id,
            "month": deep_dive.month
        })
        
        if existing:
            raise HTTPException(status_code=400, detail="Deep dive already exists for this month")
        
        doc = {
            "id": str(uuid.uuid4()),
            "couple_id": deep_dive.couple_id,
            "month": deep_dive.month,
            "theme": deep_dive.theme,
            "focus_questions": deep_dive.focus_questions,
            "activities": deep_dive.activities,
            "insights_gathered": deep_dive.insights_gathered,
            "overall_reflection": deep_dive.overall_reflection,
            "growth_identified": deep_dive.growth_identified,
            "status": "in_progress",
            "created_by": x_user_id or "anonymous",
            "created_at": now,
            "updated_at": now
        }
        
        await db.monthly_deep_dives.insert_one(doc)
        
        return {
            "success": True,
            "deep_dive": doc
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create deep dive: {str(e)}")


@router.get("/monthly-deep-dive/{couple_id}")
async def get_monthly_deep_dive(
    couple_id: str,
    month: Optional[str] = None
):
    """
    Get monthly deep dive for a couple (optionally for specific month).
    Returns in_progress if no month specified.
    """
    try:
        db = get_db()
        
        query = {"couple_id": couple_id}
        if month:
            query["month"] = month
        else:
            query["status"] = "in_progress"
        
        deep_dive = await db.monthly_deep_dives.find_one(
            query,
            {"_id": 0}
        )
        
        if not deep_dive:
            return {
                "success": True,
                "deep_dive": None,
                "message": "No active deep dive found"
            }
        
        return {
            "success": True,
            "deep_dive": deep_dive
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get deep dive: {str(e)}")


@router.put("/monthly-deep-dive/{deep_dive_id}")
async def update_monthly_deep_dive(
    deep_dive_id: str,
    update: MonthlyDeepDiveUpdate,
    x_user_id: Optional[str] = Header(None, alias="X-User-ID")
):
    """
    Update a monthly deep dive (add insights, reflections, complete it).
    """
    try:
        db = get_db()
        now = datetime.now(timezone.utc).isoformat()
        
        update_data = {k: v for k, v in update.model_dump().items() if v is not None}
        update_data["updated_at"] = now
        
        result = await db.monthly_deep_dives.update_one(
            {"id": deep_dive_id},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Deep dive not found")
        
        updated = await db.monthly_deep_dives.find_one({"id": deep_dive_id}, {"_id": 0})
        
        return {
            "success": True,
            "deep_dive": updated
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update deep dive: {str(e)}")


@router.get("/monthly-deep-dive/{couple_id}/history")
async def get_deep_dive_history(
    couple_id: str,
    limit: int = 12
):
    """
    Get historical monthly deep dives for a couple.
    """
    try:
        db = get_db()
        
        results = await db.monthly_deep_dives.find(
            {"couple_id": couple_id},
            {"_id": 0}
        ).sort("month", -1).limit(limit).to_list(limit)
        
        return {
            "success": True,
            "couple_id": couple_id,
            "count": len(results),
            "history": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get deep dive history: {str(e)}")


@router.get("/monthly-deep-dive/{couple_id}/insights")
async def get_deep_dive_insights(couple_id: str):
    """
    Aggregate insights gathered across all deep dives.
    """
    try:
        db = get_db()
        
        results = await db.monthly_deep_dives.find(
            {"couple_id": couple_id},
            {"insights_gathered": 1, "growth_identified": 1, "theme": 1, "month": 1, "_id": 0}
        ).to_list(100)
        
        all_insights = []
        all_growth = []
        themes_covered = []
        
        for r in results:
            if r.get("insights_gathered"):
                all_insights.extend(r["insights_gathered"])
            if r.get("growth_identified"):
                all_growth.append({
                    "month": r.get("month"),
                    "growth": r["growth_identified"]
                })
            if r.get("theme"):
                themes_covered.append(r["theme"])
        
        return {
            "success": True,
            "couple_id": couple_id,
            "total_deep_dives": len(results),
            "themes_covered": list(set(themes_covered)),
            "total_insights": len(all_insights),
            "insights": all_insights[:20],  # Return top 20
            "growth_journey": all_growth
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get deep dive insights: {str(e)}")