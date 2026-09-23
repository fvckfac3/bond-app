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
from routes.payments import router as payments_router
from routes.analyzers import router as analyzers_router
from routes.stripe_webhook import router as stripe_webhook_router
from routes.insights import router as insights_router


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
    model_config = ConfigDict(extra="ignore")
    
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

# AI insights live in routes/insights.py (authenticated, generated from server-side data).
# The old unauthenticated /api/generate-insights endpoint was removed.

# Include the router in the main app
app.include_router(api_router)
app.include_router(payments_router)  # Include payments router
app.include_router(analyzers_router)
app.include_router(stripe_webhook_router)
app.include_router(insights_router)

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