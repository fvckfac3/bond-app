"""
Text Analyzer Service
Analyzes text message patterns between partners.
"""

import os
import json
import logging
from datetime import datetime
from typing import Optional, Dict, Any, List

from emergentintegrations.llm.chat import LlmChat

logger = logging.getLogger(__name__)


class TextAnalyzer:
    """Analyzes text message patterns and emotional content."""

    def __init__(self):
        api_key = os.getenv("EMERGENT_LLM_KEY", "")
        self.llm = LlmChat(api_key=api_key)
        self._default_response = {
            "overall_score": 72,
            "tone_variety_score": 68,
            "emotional_expression_score": 74,
            "clarity_score": 76,
            "engagement_score": 70,
            "patterns": {},
            "tone_breakdown": {},
            "growth_suggestions": [
                "Vary emotional expression to enhance connection",
                "Practice clear and direct communication"
            ]
        }

    async def analyze_messages(
        self,
        user_id: str,
        couple_id: str,
        messages: list,
        time_period: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Perform comprehensive analysis of text message patterns.

        Args:
            user_id: ID of the requesting user
            couple_id: ID of the couple
            messages: List of message objects with content, sender, timestamp
            time_period: Optional time period context (e.g., "last week")

        Returns:
            Dict containing text analysis with scores and patterns
        """
        logger.info(f"Analyzing text messages for couple {couple_id}, user {user_id}")

        try:
            message_text = self._format_messages(messages)
            time_context = f"Time period: {time_period}" if time_period else "Recent messages"

            prompt = f"""Analyze text message patterns between partners.

{time_context}:
{message_text}

Provide a comprehensive text analysis including:
- overall_score (1-100): Overall text communication quality
- tone_variety_score (1-100): How varied the emotional tones are
- emotional_expression_score (1-100): How well emotions are expressed
- clarity_score (1-100): How clear and understandable the messages are
- engagement_score (1-100): Level of engagement and responsiveness
- patterns (JSON object): Detected patterns like greeting patterns, response styles, etc.
- tone_breakdown (JSON object): Breakdown of positive/negative/neutral tones
- growth_suggestions (array): Specific suggestions for improvement

Return as valid JSON only."""

            response = await self.llm.chat(prompt)
            parsed = self._parse_response(response)

            result = {
                "user_id": user_id,
                "couple_id": couple_id,
                "analysis_date": datetime.utcnow().isoformat(),
                "message_count": len(messages),
                **parsed
            }

            logger.info(f"Text analysis complete for couple {couple_id}")
            return result

        except Exception as e:
            logger.error(f"Error in analyze_messages: {str(e)}")
            return self._build_error_response(user_id, couple_id, str(e))

    async def calculate_tone_variety(
        self,
        user_id: str,
        couple_id: str,
        messages: list
    ) -> Dict[str, Any]:
        """
        Calculate tone variety score from messages.

        Args:
            user_id: ID of the requesting user
            couple_id: ID of the couple
            messages: List of message objects

        Returns:
            Dict with tone variety analysis
        """
        logger.info(f"Calculating tone variety for couple {couple_id}")

        try:
            message_text = self._format_messages(messages)

            prompt = f"""Analyze the variety of tones used in these text messages.

{message_text}

Assess:
- tone_variety_score (1-100): How diverse are the emotional tones
- dominant_tones (array): Most common tones
- unique_expressions (array): Unique ways emotions are expressed
- suggestions_for_variety (array): Ways to add more tone variety

Return as valid JSON only."""

            response = await self.llm.chat(prompt)
            parsed = self._parse_response(response, variety_only=True)

            return {
                "user_id": user_id,
                "couple_id": couple_id,
                "analysis_date": datetime.utcnow().isoformat(),
                "message_count": len(messages),
                **parsed
            }

        except Exception as e:
            logger.error(f"Error in calculate_tone_variety: {str(e)}")
            return {
                "user_id": user_id,
                "couple_id": couple_id,
                "analysis_date": datetime.utcnow().isoformat(),
                "tone_variety_score": 68,
                "error_occurred": True,
                "error_message": str(e)
            }

    async def detect_emotional_patterns(
        self,
        user_id: str,
        couple_id: str,
        messages: list
    ) -> Dict[str, Any]:
        """
        Detect emotional patterns in text messages.

        Args:
            user_id: ID of the requesting user
            couple_id: ID of the couple
            messages: List of message objects

        Returns:
            Dict with emotional pattern detection
        """
        logger.info(f"Detecting emotional patterns for couple {couple_id}")

        try:
            message_text = self._format_messages(messages)

            prompt = f"""Detect emotional patterns in these text messages.

{message_text}

Identify:
- emotional_patterns_detected (array): List of emotional patterns found
- trigger_words (array): Words that tend to trigger emotional responses
- emotional_arc (string): Overall emotional trajectory
- positive_triggers (array): Topics that lead to positive exchanges
- negative_triggers (array): Topics that lead to negative exchanges
- patterns_over_time (JSON): How emotions ebb and flow

Return as valid JSON only."""

            response = await self.llm.chat(prompt)
            parsed = self._parse_response(response, patterns_only=True)

            return {
                "user_id": user_id,
                "couple_id": couple_id,
                "analysis_date": datetime.utcnow().isoformat(),
                **parsed
            }

        except Exception as e:
            logger.error(f"Error in detect_emotional_patterns: {str(e)}")
            return {
                "user_id": user_id,
                "couple_id": couple_id,
                "analysis_date": datetime.utcnow().isoformat(),
                "emotional_patterns_detected": [],
                "error_occurred": True,
                "error_message": str(e)
            }

    async def quick_score(
        self,
        user_id: str,
        couple_id: str,
        recent_messages: list
    ) -> Dict[str, Any]:
        """
        Perform quick text communication scoring.

        Args:
            user_id: ID of the requesting user
            couple_id: ID of the couple
            recent_messages: List of recent messages

        Returns:
            Dict with quick score and summary
        """
        logger.info(f"Quick text scoring for couple {couple_id}")

        try:
            message_text = self._format_messages(recent_messages)

            prompt = f"""Quickly assess text communication quality.

{message_text}

Provide:
- quick_score (int 1-100)
- tone_summary (string: brief description)
- one_growth_tip (string: single actionable suggestion)

Return as valid JSON only."""

            response = await self.llm.chat(prompt)
            parsed = self._parse_response(response, minimal=True)

            return {
                "user_id": user_id,
                "couple_id": couple_id,
                "analysis_date": datetime.utcnow().isoformat(),
                "is_quick_scan": True,
                **parsed
            }

        except Exception as e:
            logger.error(f"Error in quick_score: {str(e)}")
            return {
                "user_id": user_id,
                "couple_id": couple_id,
                "analysis_date": datetime.utcnow().isoformat(),
                "is_quick_scan": True,
                "quick_score": 72,
                "tone_summary": "Generally positive communication",
                "one_growth_tip": "Continue expressing appreciation"
            }

    def _format_messages(self, messages: list) -> str:
        """Format messages for prompt inclusion."""
        formatted = []
        for msg in messages[-100:]:  # Limit to last 100 messages
            sender = msg.get("sender", "unknown")
            content = msg.get("content", "")
            timestamp = msg.get("timestamp", "")
            formatted.append(f"[{sender}]({timestamp}): {content}")
        return "\n".join(formatted)

    def _parse_response(self, response: str, minimal: bool = False, 
                       variety_only: bool = False, patterns_only: bool = False) -> dict:
        """Parse LLM response into structured format."""
        try:
            json_str = self._extract_json(response)
            if json_str:
                parsed = json.loads(json_str)
                
                if minimal:
                    return {
                        "quick_score": parsed.get("quick_score", 72),
                        "tone_summary": parsed.get("tone_summary", "Mixed tones"),
                        "one_growth_tip": parsed.get("one_growth_tip", "Keep communicating")
                    }
                if variety_only:
                    return {
                        "tone_variety_score": parsed.get("tone_variety_score", 68),
                        "dominant_tones": parsed.get("dominant_tones", []),
                        "unique_expressions": parsed.get("unique_expressions", []),
                        "suggestions_for_variety": parsed.get("suggestions_for_variety", [])
                    }
                if patterns_only:
                    return {
                        "emotional_patterns_detected": parsed.get("emotional_patterns_detected", []),
                        "trigger_words": parsed.get("trigger_words", []),
                        "emotional_arc": parsed.get("emotional_arc", "stable"),
                        "positive_triggers": parsed.get("positive_triggers", []),
                        "negative_triggers": parsed.get("negative_triggers", []),
                        "patterns_over_time": parsed.get("patterns_over_time", {})
                    }
                return parsed
        except json.JSONDecodeError as e:
            logger.warning(f"JSON parsing failed: {e}")

        if minimal:
            return {"quick_score": 72, "tone_summary": "Good communication", "one_growth_tip": "Continue current approach"}
        if variety_only:
            return {"tone_variety_score": 68, "dominant_tones": [], "unique_expressions": [], "suggestions_for_variety": []}
        if patterns_only:
            return {"emotional_patterns_detected": [], "trigger_words": [], "emotional_arc": "stable", "positive_triggers": [], "negative_triggers": [], "patterns_over_time": {}}
        return self._default_response.copy()

    def _extract_json(self, text: str) -> Optional[str]:
        """Extract JSON object from text."""
        import re
        match = re.search(r'```(?:json)?\s*({.*?})\s*```', text, re.DOTALL)
        if match:
            return match.group(1)
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