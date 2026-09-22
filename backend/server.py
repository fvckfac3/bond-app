from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Dict, Any
import uuid
from datetime import datetime, timezone
from supabase import create_client, Client
from services.ai_insights import ai_insights_generator
from routes.payments import router as payments_router
from routes.analyzers import router as analyzers_router
from routes.features import router as features_router
from routes.stripe_webhook import router as stripe_webhook_router


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Supabase connection
supabase_url = os.environ['SUPABASE_URL']
supabase_key = os.environ['SUPABASE_SERVICE_ROLE_KEY']
supabase: Client = create_client(supabase_url, supabase_key)

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    # Serialize datetime to an ISO string for the Supabase insert
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    supabase.table('status_checks').insert(doc).execute()
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks(skip: int = 0, limit: int = 100):
    """Get status checks with pagination"""
    if limit > 1000:
        limit = 1000
    result = supabase.table('status_checks').select("*").range(skip, skip + limit - 1).execute()
    return result.data or []

# AI Insights Generation Endpoint
class AIInsightsRequest(BaseModel):
    assessment_name: str
    framework: str
    user1_scores: Dict[str, Any]
    user2_scores: Dict[str, Any]
    user1_name: str = "Partner 1"
    user2_name: str = "Partner 2"

@api_router.post("/generate-insights")
async def generate_insights(request: AIInsightsRequest):
    """Generate AI-powered insights for assessment results"""
    try:
        insights = await ai_insights_generator.generate_assessment_insights(
            assessment_name=request.assessment_name,
            framework=request.framework,
            user1_scores=request.user1_scores,
            user2_scores=request.user2_scores,
            user1_name=request.user1_name,
            user2_name=request.user2_name
        )
        return insights
    except Exception as e:
        logger.error(f"Error generating insights: {str(e)}")
        return {
            "error": str(e),
            "narrative": "We encountered an issue generating insights. Please try again later.",
            "growth_recommendations": [],
            "strength_affirmation": "",
            "communication_scripts": {},
            "framework_tags": []
        }

# Include the router in the main app
app.include_router(api_router)
app.include_router(payments_router)  # Include payments router
app.include_router(analyzers_router)
app.include_router(features_router)
app.include_router(stripe_webhook_router)

# Browser origins allowed to call the API. Native mobile requests send no Origin header,
# so CORS doesn't apply to the app; this only governs web clients. Never "*" in production.
cors_origins = [
    o.strip() for o in os.environ.get("CORS_ORIGINS", "http://localhost:3000").split(",") if o.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=cors_origins,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,  # Cache preflight requests for 1 hour
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)