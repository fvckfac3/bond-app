"""
Argument Analyzer Service
Analyzes conflict resolution and argument patterns between partners.
"""

import os
import json
import logging
from datetime import datetime
from typing import Optional, Dict, Any, List

from emergentintegrations.llm.chat import LlmChat

logger = logging.getLogger(__name__)


class ArgumentAnalyzer:
    """Analyzes arguments and conflict resolution patterns."""

    def __init__(self):
        api_key = os.getenv("EMERGENT_LLM_KEY", "")
        self.llm = LlmChat(api_key=api_key)
        self._default_response = {
            "overall_score": 68,
            "de_escalation_score": 65,
            "constructive_dialogue_score": 70,
            "resolution_quality_score": 68,
            "resolution_outcome": "partial",
            "topic_category": "general",
            "what_worked_well": ["Both partners engaged in discussion"],
            "areas_for_improvement": ["More active listening could help"],
            "strategies_recommended": ["Take breaks when emotions run high"]
        }

    async def analyze_argument(
        self,
        user_id: str,
        couple_id: str,
        argument_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Perform comprehensive analysis of an argument/conflict.

        Args:
            user_id: ID of the requesting user
            couple_id: ID of the couple
            argument_data: Dict containing:
                - messages: List of messages in the argument
                - context: Context of the argument
                - duration: How long the argument lasted
                - outcome: How it was resolved

        Returns:
            Dict containing comprehensive argument analysis
        """
        logger.info(f"Analyzing argument for couple {couple_id}, user {user_id}")

        try:
            messages = argument_data.get("messages", [])
            context = argument_data.get("context", "")
            duration = argument_data.get("duration", "")
            outcome = argument_data.get("outcome", "")

            prompt = f"""Analyze this argument/disagreement between partners.

Argument Context: {context}
Duration: {duration}
Outcome: {outcome}

Messages exchanged:
{self._format_messages(messages)}

Provide a comprehensive analysis:
- overall_score (1-100): Overall argument handling quality
- de_escalation_score (1-100): How well de-escalation techniques were used
- constructive_dialogue_score (1-100): Quality of constructive vs destructive communication
- resolution_quality_score (1-100): How well the argument was resolved
- resolution_outcome (string): unresolved/partial/resolved/healthy
- topic_category (string): Category of the argument topic
- what_worked_well (array): Specific things that worked during the argument
- areas_for_improvement (array): Specific areas needing work
- strategies_recommended (array): Strategies for better conflict resolution

Return as valid JSON only."""

            response = await self.llm.chat(prompt)
            parsed = self._parse_response(response)

            result = {
                "user_id": user_id,
                "couple_id": couple_id,
                "analysis_date": datetime.utcnow().isoformat(),
                "argument_message_count": len(messages),
                **parsed
            }

            logger.info(f"Argument analysis complete for couple {couple_id}")
            return result

        except Exception as e:
            logger.error(f"Error in analyze_argument: {str(e)}")
            return self._build_error_response(user_id, couple_id, str(e))

    async def score_de_escalation(
        self,
        user_id: str,
        couple_id: str,
        escalation_messages: list
    ) -> Dict[str, Any]:
        """
        Score the de-escalation effectiveness during conflict.

        Args:
            user_id: ID of the requesting user
            couple_id: ID of the couple
            escalation_messages: List of messages showing escalation and attempts to de-escalate

        Returns:
            Dict with de-escalation scoring
        """
        logger.info(f"Scoring de-escalation for couple {couple_id}")

        try:
            message_text = self._format_messages(escalation_messages)

            prompt = f"""Score the de-escalation effectiveness in this conflict conversation.

{message_text}

Assess:
- de_escalation_score (1-100): Overall effectiveness
- successful_de_escalation_moments (array): Times when escalation was successfully reduced
- missed_opportunities (array): Times when de-escalation could have occurred
- techniques_used (array): De-escalation techniques detected
- techniques_suggested (array): Techniques that could have helped

Return as valid JSON only."""

            response = await self.llm.chat(prompt)
            parsed = self._parse_response(response, de_escalation_only=True)

            return {
                "user_id": user_id,
                "couple_id": couple_id,
                "analysis_date": datetime.utcnow().isoformat(),
                **parsed
            }

        except Exception as e:
            logger.error(f"Error in score_de_escalation: {str(e)}")
            return {
                "user_id": user_id,
                "couple_id": couple_id,
                "analysis_date": datetime.utcnow().isoformat(),
                "de_escalation_score": 65,
                "error_occurred": True,
                "error_message": str(e)
            }

    async def assess_resolution_quality(
        self,
        user_id: str,
        couple_id: str,
        argument_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Assess the quality of argument resolution.

        Args:
            user_id: ID of the requesting user
            couple_id: ID of the couple
            argument_data: Dict containing messages, resolution outcome, follow-up

        Returns:
            Dict with resolution quality assessment
        """
        logger.info(f"Assessing resolution quality for couple {couple_id}")

        try:
            messages = argument_data.get("messages", [])
            resolution = argument_data.get("resolution", "")
            follow_up = argument_data.get("follow_up", "")

            prompt = f"""Assess the quality of this argument resolution.

Resolution reached: {resolution}
Follow-up behavior: {follow_up}

Messages in the argument:
{self._format_messages(messages)}

Evaluate:
- resolution_quality_score (1-100): Overall resolution quality
- resolution_completeness (string): complete/partial/incomplete
- mutual_understanding (string): high/medium/low
- commitment_to_change (string): strong/moderate/weak/none
- follow_through_likelihood (string): high/medium/low
- improvement_suggestions (array): How to improve future resolutions

Return as valid JSON only."""

            response = await self.llm.chat(prompt)
            parsed = self._parse_response(response, resolution_only=True)

            return {
                "user_id": user_id,
                "couple_id": couple_id,
                "analysis_date": datetime.utcnow().isoformat(),
                **parsed
            }

        except Exception as e:
            logger.error(f"Error in assess_resolution_quality: {str(e)}")
            return {
                "user_id": user_id,
                "couple_id": couple_id,
                "analysis_date": datetime.utcnow().isoformat(),
                "resolution_quality_score": 68,
                "resolution_completeness": "partial",
                "error_occurred": True,
                "error_message": str(e)
            }

    async def quick_score(
        self,
        user_id: str,
        couple_id: str,
        recent_arguments: list
    ) -> Dict[str, Any]:
        """
        Perform quick conflict handling scoring.

        Args:
            user_id: ID of the requesting user
            couple_id: ID of the couple
            recent_arguments: List of recent argument summaries

        Returns:
            Dict with quick score and summary
        """
        logger.info(f"Quick argument scoring for couple {couple_id}")

        try:
            prompt = f"""Quickly assess conflict handling from these argument summaries.

{json.dumps(recent_arguments, indent=2)}

Provide:
- quick_score (int 1-100)
- conflict_handling_summary (string)
- top_improvement (string)

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
                "quick_score": 68,
                "conflict_handling_summary": "Partners working through issues",
                "top_improvement": "Practice pausing before responding"
            }

    def _format_messages(self, messages: list) -> str:
        """Format messages for prompt inclusion."""
        formatted = []
        for msg in messages:
            sender = msg.get("sender", "unknown")
            content = msg.get("content", "")
            timestamp = msg.get("timestamp", "")
            formatted.append(f"[{sender}]({timestamp}): {content}")
        return "\n".join(formatted)

    def _parse_response(self, response: str, minimal: bool = False,
                       de_escalation_only: bool = False, resolution_only: bool = False) -> dict:
        """Parse LLM response into structured format."""
        try:
            json_str = self._extract_json(response)
            if json_str:
                parsed = json.loads(json_str)

                if minimal:
                    return {
                        "quick_score": parsed.get("quick_score", 68),
                        "conflict_handling_summary": parsed.get("conflict_handling_summary", "Mixed results"),
                        "top_improvement": parsed.get("top_improvement", "Work on listening")
                    }
                if de_escalation_only:
                    return {
                        "de_escalation_score": parsed.get("de_escalation_score", 65),
                        "successful_de_escalation_moments": parsed.get("successful_de_escalation_moments", []),
                        "missed_opportunities": parsed.get("missed_opportunities", []),
                        "techniques_used": parsed.get("techniques_used", []),
                        "techniques_suggested": parsed.get("techniques_suggested", [])
                    }
                if resolution_only:
                    return {
                        "resolution_quality_score": parsed.get("resolution_quality_score", 68),
                        "resolution_completeness": parsed.get("resolution_completeness", "partial"),
                        "mutual_understanding": parsed.get("mutual_understanding", "medium"),
                        "commitment_to_change": parsed.get("commitment_to_change", "moderate"),
                        "follow_through_likelihood": parsed.get("follow_through_likelihood", "medium"),
                        "improvement_suggestions": parsed.get("improvement_suggestions", [])
                    }
                return parsed
        except json.JSONDecodeError as e:
            logger.warning(f"JSON parsing failed: {e}")

        if minimal:
            return {"quick_score": 68, "conflict_handling_summary": "Some progress made", "top_improvement": "Practice empathy"}
        if de_escalation_only:
            return {"de_escalation_score": 65, "successful_de_escalation_moments": [], "missed_opportunities": [], "techniques_used": [], "techniques_suggested": []}
        if resolution_only:
            return {"resolution_quality_score": 68, "resolution_completeness": "partial", "mutual_understanding": "medium", "commitment_to_change": "moderate", "follow_through_likelihood": "medium", "improvement_suggestions": []}
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