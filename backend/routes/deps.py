"""Shared request dependencies: the service-role Supabase client and the caller's identity."""

import os
import uuid
from typing import Optional

from fastapi import Header, HTTPException


def get_supabase():
    """Service-role Supabase client (bypasses RLS, so every route must authorize explicitly)."""
    from supabase import create_client

    return create_client(
        os.environ.get("SUPABASE_URL", ""), os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
    )


async def current_user_id(authorization: Optional[str] = Header(None)) -> str:
    """Identify the caller from their Supabase session JWT (never from a client-supplied ID)."""
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Authentication required")
    token = authorization[7:].strip()
    try:
        user_id = get_supabase().auth.get_user(token).user.id
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    return user_id


def valid_uuid(value: str) -> bool:
    try:
        uuid.UUID(str(value))
        return True
    except (ValueError, AttributeError, TypeError):
        return False
