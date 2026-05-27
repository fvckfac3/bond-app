"""
Communication Analyzer Service
Analyzes communication patterns between partners in conversations.
"""

import os
import json
import logging
from datetime import datetime
from typing import Optional, Dict, Any, List

from emergentintegrations.llm.chat import LlmChat

logger = logging.getLogger(__name__)


class CommunicationAnalyzer:
    """Analyzes communication patterns between partners."""

    def __init__(self):
        api_key = os.getenv("EMERGENT_LLM_KEY", "")
        self.llm = LlmChat(api_key=api_key)
        self._default_response = {
            "overall_score": 75,
            "response_time_score": 72,
            "listening_score": 78,
            "tone_consistency_score": 70,
            "strengths": ["Active engagement in conversation"],
            "areas_for_growth": ["More responsive to non-verbal cues"],
            "recommendations": ["Practice active listening techniques"]
        }

    async def analyze_conversation(
        self,
        user_id: str,
        couple_id: str,
        message_history: list,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Perform a full analysis of conversation patterns between partners.

        Args:
            user_id: ID of the requesting user
            couple_id: ID of the couple
            message_history: List of message objects with content, sender, timestamp
            context: Optional additional context (relationship duration, etc.)

        Returns:
            Dict containing comprehensive communication analysis
        """
        logger.info(f"Analyzing conversation for couple {couple_id}, user {user_id}")

        try:
            conversation_text = self._format_message_history(message_history)
            context_prompt = self._build_context_prompt(context)

            prompt = f"""Analyze the communication patterns between partners based on this conversation history.

Conversation:
{conversation_text}

{context_prompt}

Provide a comprehensive analysis including:
- Overall communication score (1-100)
- Response time patterns
- Listening indicators
- Tone consistency
- Strengths and growth areas
- Specific recommendations

Return as valid JSON with these keys:
- overall_score (int 1-100)
- response_time_score (int 1-100)
- listening_score (int 1-100)
- tone_consistency_score (int 1-100)
- strengths (array of strings)
- areas_for_growth (array of strings)
- recommendations (array of strings)

Only return JSON, no additional text."""

            response = await self.llm.chat(prompt)
            parsed = self._parse_response(response)

            result = {
                "user_id": user_id,
                "couple_id": couple_id,
                "analysis_date": datetime.utcnow().isoformat(),
                "message_count": len(message_history),
                **parsed
            }

            logger.info(f"Communication analysis complete for couple {couple_id}")
            return result

        except Exception as e:
            logger.error(f"Error in analyze_conversation: {str(e)}")
            return self._build_error_response(user_id, couple_id, str(e))

    async def quick_score(
        self,
        user_id: str,
        couple_id: str,
        recent_messages: list
    ) -> Dict[str, Any]:
        """
        Perform a quick lightweight scoring of recent messages.
        Used for real-time feedback without full analysis overhead.

        Args:
            user_id: ID of the requesting user
            couple_id: ID of the couple
            recent_messages: List of recent message objects

        Returns:
            Dict containing quick communication score and key insights
        """
        logger.info(f"Quick scoring for couple {couple_id}, user {user_id}")

        try:
            conversation_text = self._format_message_history(recent_messages)

            prompt = f"""Quickly assess the communication quality in this recent conversation.

Recent messages:
{conversation_text}

Provide a fast assessment:
- quick_score (int 1-100)
- key_positive (string, single main positive)
- key_negative (string, single main area for improvement)
- sentiment (string: positive/neutral/negative)

Return as valid JSON only."""

            response = await self.llm.chat(prompt)
            parsed = self._parse_response(response, minimal=True)

            return {
                "user_id": user_id,
                "couple_id": couple_id,
                "analysis_date": datetime.utcnow().isoformat(),
                "is_quick_scan": True,
                "message_count": len(recent_messages),
                **parsed
            }

        except Exception as e:
            logger.error(f"Error in quick_score: {str(e)}")
            return {
                "user_id": user_id,
                "couple_id": couple_id,
                "analysis_date": datetime.utcnow().isoformat(),
                "is_quick_scan": True,
                "error_occurred": True,
                "quick_score": 75,
                "key_positive": "Active engagement",
                "key_negative": "Unable to analyze",
                "sentiment": "neutral"
            }

    def _format_message_history(self, messages: list) -> str:
        """Format message history for prompt inclusion."""
        formatted = []
        for msg in messages[-50:]:  # Limit to last 50 messages
            sender = msg.get("sender", "unknown")
            content = msg.get("content", "")
            timestamp = msg.get("timestamp", "")
            formatted.append(f"[{sender}]({timestamp}): {content}")
        return "\n".join(formatted)

    def _build_context_prompt(self, context: Optional[Dict[str, Any]]) -> str:
        """Build context section for the prompt."""
        if not context:
            return ""
        parts = []
        if context.get("relationship_duration_months"):
            parts.append(f"- Relationship duration: {context['relationship_duration_months']} months")
        if context.get("communication_medium"):
            parts.append(f"- Communication medium: {context['communication_medium']}")
        if context.get("known_issues"):
            parts.append(f"- Known issues: {context['known_issues']}")
        return "\nAdditional context:\n" + "\n".join(parts) if parts else ""

    def _parse_response(self, response: str, minimal: bool = False) -> dict:
        """Parse LLM response into structured format."""
        try:
            # Try to find JSON in the response
            json_str = self._extract_json(response)
            if json_str:
                parsed = json.loads(json_str)
                if minimal:
                    return {
                        "quick_score": parsed.get("quick_score", 75),
                        "key_positive": parsed.get("key_positive", "Good engagement"),
                        "key_negative": parsed.get("key_negative", "Room for improvement"),
                        "sentiment": parsed.get("sentiment", "neutral")
                    }
                return parsed
        except json.JSONDecodeError as e:
            logger.warning(f"JSON parsing failed: {e}")

        # Return defaults
        if minimal:
            return {
                "quick_score": 75,
                "key_positive": "Active engagement",
                "key_negative": "More responsiveness could help",
                "sentiment": "neutral"
            }
        return self._default_response.copy()

    def _extract_json(self, text: str) -> Optional[str]:
        """Extract JSON object from text, handling markdown code blocks."""
        import re
        # Handle markdown code blocks
        match = re.search(r'```(?:json)?\s*({.*?})\s*```', text, re.DOTALL)
        if match:
            return match.group(1)
        # Try finding raw JSON
        match = re.search(r'({.*})', text, re.DOTALL)
        if match:
            return match.group(1)
        return None

    def _build_error_response(self, user_id: str, couple_id: str, error: str) -> Dict[str, Any]:
        """Build error response with defaults."""
        logger.error(f"Returning error response for couple {couple_id}: {error}")
        return {
            "user_id": user_id,
            "couple_id": couple_id,
            "analysis_date": datetime.utcnow().isoformat(),
            "error_occurred": True,
            "error_message": error,
            **self._default_response.copy()
        }