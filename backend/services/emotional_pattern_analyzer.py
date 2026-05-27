"""
Emotional Pattern Analyzer Service
Detects and analyzes emotional patterns between partners.
"""

import os
import json
import logging
from datetime import datetime
from typing import Optional, Dict, Any, List

from emergentintegrations.llm.chat import LlmChat

logger = logging.getLogger(__name__)


class EmotionalPatternAnalyzer:
    """Analyzes emotional patterns and responses in relationships."""

    def __init__(self):
        api_key = os.getenv("EMERGENT_LLM_KEY", "")
        self.llm = LlmChat(api_key=api_key)
        self._default_response = {
            "overall_score": 70,
            "emotional_awareness_score": 68,
            "empathy_score": 72,
            "emotional_regulation_score": 68,
            "stress_response_score": 65,
            "dominant_emotions": ["anxiety", "contentment"],
            "emotional_triggers": ["work stress", "communication gaps"],
            "patterns_detected": [
                "Partners retreat during high-stress periods",
                "Difficulty expressing vulnerability"
            ],
            "growth_areas": [
                "Improve emotional awareness",
                "Develop better stress management"
            ],
            "coping_strategies": [
                "Schedule regular check-ins",
                "Practice active listening"
            ]
        }

    async def analyze_emotional_patterns(
        self,
        user_id: str,
        couple_id: str,
        emotional_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Perform comprehensive analysis of emotional patterns.

        Args:
            user_id: ID of the requesting user
            couple_id: ID of the couple
            emotional_data: Dict containing:
                - message_history: List of messages with emotional content
                - interaction_summaries: Summary of key interactions
                - known_events: Major events that may affect emotions
                - time_period: Period being analyzed

        Returns:
            Dict containing comprehensive emotional pattern analysis
        """
        logger.info(f"Analyzing emotional patterns for couple {couple_id}, user {user_id}")

        try:
            messages = emotional_data.get("message_history", [])
            interactions = emotional_data.get("interaction_summaries", [])
            events = emotional_data.get("known_events", [])
            period = emotional_data.get("time_period", "")

            prompt = f"""Analyze emotional patterns between partners.

Time Period: {period}

Major Events:
{json.dumps(events, indent=2)}

Interaction Summaries:
{json.dumps(interactions, indent=2)}

Message History (last 50 messages with emotional context):
{self._format_messages(messages[-50:])}

Provide a comprehensive analysis:
- overall_score (1-100): Overall emotional intelligence and pattern health
- emotional_awareness_score (1-100): How well partners recognize emotions
- empathy_score (1-100): Level of empathic understanding between partners
- emotional_regulation_score (1-100): How well emotions are managed
- stress_response_score (1-100): How partners respond to stress together
- dominant_emotions (array): Most frequently occurring emotions for each partner
- emotional_triggers (array): Events/topics that trigger strong emotional responses
- patterns_detected (array): Specific emotional patterns identified
- growth_areas (array): Areas needing emotional development
- coping_strategies (array): Recommended strategies for better emotional health

Return as valid JSON only."""

            response = await self.llm.chat(prompt)
            parsed = self._parse_response(response)

            result = {
                "user_id": user_id,
                "couple_id": couple_id,
                "analysis_date": datetime.utcnow().isoformat(),
                "time_period": period,
                **parsed
            }

            logger.info(f"Emotional pattern analysis complete for couple {couple_id}")
            return result

        except Exception as e:
            logger.error(f"Error in analyze_emotional_patterns: {str(e)}")
            return self._build_error_response(user_id, couple_id, str(e))

    async def score_emotional_awareness(
        self,
        user_id: str,
        couple_id: str,
        interaction_data: list
    ) -> Dict[str, Any]:
        """
        Score emotional awareness in recent interactions.

        Args:
            user_id: ID of the requesting user
            couple_id: ID of the couple
            interaction_data: List of interactions with emotional content

        Returns:
            Dict with emotional awareness scoring
        """
        logger.info(f"Scoring emotional awareness for couple {couple_id}")

        try:
            prompt = f"""Assess emotional awareness in these interactions.

{self._format_interactions(interaction_data)}

Evaluate:
- emotional_awareness_score (1-100): Overall awareness level
- partner_a_awareness (int): Partner A's emotional awareness
- partner_b_awareness (int): Partner B's emotional awareness
- aware_moments (array): Times when emotions were well-recognized
- unaware_moments (array): Times when emotions were missed
- awareness_opportunities (array): Areas to improve awareness

Return as valid JSON only."""

            response = await self.llm.chat(prompt)
            parsed = self._parse_response(response, awareness_only=True)

            return {
                "user_id": user_id,
                "couple_id": couple_id,
                "analysis_date": datetime.utcnow().isoformat(),
                **parsed
            }

        except Exception as e:
            logger.error(f"Error in score_emotional_awareness: {str(e)}")
            return {
                "user_id": user_id,
                "couple_id": couple_id,
                "analysis_date": datetime.utcnow().isoformat(),
                "emotional_awareness_score": 68,
                "partner_a_awareness": 65,
                "partner_b_awareness": 71,
                "error_occurred": True,
                "error_message": str(e)
            }

    async def measure_empathy(
        self,
        user_id: str,
        couple_id: str,
        conversation_data: list
    ) -> Dict[str, Any]:
        """
        Measure empathy levels between partners.

        Args:
            user_id: ID of the requesting user
            couple_id: ID of the couple
            conversation_data: List of conversations with empathic content

        Returns:
            Dict with empathy measurement
        """
        logger.info(f"Measuring empathy for couple {couple_id}")

        try:
            prompt = f"""Measure empathy between partners in these conversations.

{self._format_interactions(conversation_data)}

Assess:
- empathy_score (1-100): Overall empathy level
- empathic_responses (array): Times when partners showed understanding
- dismissive_moments (array): Times when empathy was lacking
- perspective_taking (string): How well partners see each other's viewpoint
- empathy_opportunities (array): Times when more empathy could have helped

Return as valid JSON only."""

            response = await self.llm.chat(prompt)
            parsed = self._parse_response(response, empathy_only=True)

            return {
                "user_id": user_id,
                "couple_id": couple_id,
                "analysis_date": datetime.utcnow().isoformat(),
                **parsed
            }

        except Exception as e:
            logger.error(f"Error in measure_empathy: {str(e)}")
            return {
                "user_id": user_id,
                "couple_id": couple_id,
                "analysis_date": datetime.utcnow().isoformat(),
                "empathy_score": 72,
                "empathic_responses": [],
                "dismissive_moments": [],
                "error_occurred": True,
                "error_message": str(e)
            }

    async def detect_emotional_triggers(
        self,
        user_id: str,
        couple_id: str,
        historical_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Detect emotional triggers from historical data.

        Args:
            user_id: ID of the requesting user
            couple_id: ID of the couple
            historical_data: Dict with messages, events, conflicts

        Returns:
            Dict with trigger detection
        """
        logger.info(f"Detecting emotional triggers for couple {couple_id}")

        try:
            messages = historical_data.get("messages", [])
            events = historical_data.get("events", [])
            conflicts = historical_data.get("conflicts", [])

            prompt = f"""Detect emotional triggers from this historical data.

Major Events:
{json.dumps(events, indent=2)}

Conflicts:
{json.dumps(conflicts, indent=2)}

Message History Sample:
{self._format_messages(messages[-100:])}

Identify:
- emotional_triggers (array): Topics/events that trigger strong emotions
- trigger_severity (array): How intense each trigger is
- trigger_frequency (array): How often each trigger occurs
- partner_a_triggers (array): Triggers more relevant to Partner A
- partner_b_triggers (array): Triggers more relevant to Partner B
- trigger_patterns (array): Patterns in how triggers manifest
- trigger_management_strategies (array): How to handle each trigger

Return as valid JSON only."""

            response = await self.llm.chat(prompt)
            parsed = self._parse_response(response, triggers_only=True)

            return {
                "user_id": user_id,
                "couple_id": couple_id,
                "analysis_date": datetime.utcnow().isoformat(),
                **parsed
            }

        except Exception as e:
            logger.error(f"Error in detect_emotional_triggers: {str(e)}")
            return {
                "user_id": user_id,
                "couple_id": couple_id,
                "analysis_date": datetime.utcnow().isoformat(),
                "emotional_triggers": [],
                "trigger_severity": [],
                "error_occurred": True,
                "error_message": str(e)
            }

    async def quick_score(
        self,
        user_id: str,
        couple_id: str,
        recent_interactions: list
    ) -> Dict[str, Any]:
        """
        Perform quick emotional pattern scoring.

        Args:
            user_id: ID of the requesting user
            couple_id: ID of the couple
            recent_interactions: List of recent interaction summaries

        Returns:
            Dict with quick score and summary
        """
        logger.info(f"Quick emotional scoring for couple {couple_id}")

        try:
            prompt = f"""Quickly assess emotional patterns from these interactions.

{json.dumps(recent_interactions, indent=2)}

Provide:
- quick_score (int 1-100)
- emotional_summary (string)
- one_growth_area (string)

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
                "quick_score": 70,
                "emotional_summary": "Generally healthy emotional patterns",
                "one_growth_area": "Practice expressing emotions more openly"
            }

    def _format_messages(self, messages: list) -> str:
        """Format messages for prompt inclusion."""
        formatted = []
        for msg in messages:
            sender = msg.get("sender", "unknown")
            content = msg.get("content", "")
            emotional_tags = msg.get("emotional_tags", [])
            tags_str = f" [{', '.join(emotional_tags)}]" if emotional_tags else ""
            formatted.append(f"[{sender}]: {content}{tags_str}")
        return "\n".join(formatted)

    def _format_interactions(self, interactions: list) -> str:
        """Format interaction summaries."""
        formatted = []
        for i, interaction in enumerate(interactions[-20:], 1):
            summary = interaction.get("summary", "")
            emotional_tone = interaction.get("emotional_tone", "")
            outcome = interaction.get("outcome", "")
            formatted.append(f"{i}. [{emotional_tone}] {summary} -> {outcome}")
        return "\n".join(formatted)

    def _parse_response(self, response: str, minimal: bool = False,
                       awareness_only: bool = False, empathy_only: bool = False,
                       triggers_only: bool = False) -> dict:
        """Parse LLM response into structured format."""
        try:
            json_str = self._extract_json(response)
            if json_str:
                parsed = json.loads(json_str)

                if minimal:
                    return {
                        "quick_score": parsed.get("quick_score", 70),
                        "emotional_summary": parsed.get("emotional_summary", "Stable patterns"),
                        "one_growth_area": parsed.get("one_growth_area", "Continue building awareness")
                    }
                if awareness_only:
                    return {
                        "emotional_awareness_score": parsed.get("emotional_awareness_score", 68),
                        "partner_a_awareness": parsed.get("partner_a_awareness", 65),
                        "partner_b_awareness": parsed.get("partner_b_awareness", 71),
                        "aware_moments": parsed.get("aware_moments", []),
                        "unaware_moments": parsed.get("unaware_moments", []),
                        "awareness_opportunities": parsed.get("awareness_opportunities", [])
                    }
                if empathy_only:
                    return {
                        "empathy_score": parsed.get("empathy_score", 72),
                        "empathic_responses": parsed.get("empathic_responses", []),
                        "dismissive_moments": parsed.get("dismissive_moments", []),
                        "perspective_taking": parsed.get("perspective_taking", "moderate"),
                        "empathy_opportunities": parsed.get("empathy_opportunities", [])
                    }
                if triggers_only:
                    return {
                        "emotional_triggers": parsed.get("emotional_triggers", []),
                        "trigger_severity": parsed.get("trigger_severity", []),
                        "trigger_frequency": parsed.get("trigger_frequency", []),
                        "partner_a_triggers": parsed.get("partner_a_triggers", []),
                        "partner_b_triggers": parsed.get("partner_b_triggers", []),
                        "trigger_patterns": parsed.get("trigger_patterns", []),
                        "trigger_management_strategies": parsed.get("trigger_management_strategies", [])
                    }
                return parsed
        except json.JSONDecodeError as e:
            logger.warning(f"JSON parsing failed: {e}")

        if minimal:
            return {"quick_score": 70, "emotional_summary": "Healthy emotional exchange", "one_growth_area": "Keep developing awareness"}
        if awareness_only:
            return {"emotional_awareness_score": 68, "partner_a_awareness": 65, "partner_b_awareness": 71, "aware_moments": [], "unaware_moments": [], "awareness_opportunities": []}
        if empathy_only:
            return {"empathy_score": 72, "empathic_responses": [], "dismissive_moments": [], "perspective_taking": "moderate", "empathy_opportunities": []}
        if triggers_only:
            return {"emotional_triggers": [], "trigger_severity": [], "trigger_frequency": [], "partner_a_triggers": [], "partner_b_triggers": [], "trigger_patterns": [], "trigger_management_strategies": []}
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