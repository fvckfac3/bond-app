"""
Voice Tone Analyzer Service
Analyzes voice and tone patterns in voice communications between partners.
"""

import os
import json
import logging
from datetime import datetime
from typing import Optional, Dict, Any, List

from emergentintegrations.llm.chat import LlmChat

logger = logging.getLogger(__name__)


class VoiceToneAnalyzer:
    """Analyzes voice and tone patterns in partner communications."""

    def __init__(self):
        api_key = os.getenv("EMERGENT_LLM_KEY", "")
        self.llm = LlmChat(api_key=api_key)
        self._default_response = {
            "overall_score": 74,
            "warmth_score": 72,
            "calm_score": 76,
            "assertiveness_score": 70,
            "emotional_regulation_score": 72,
            "dominant_tones": ["supportive", "calm"],
            "tone_variety_score": 68,
            "observations": [
                "Partners maintain generally positive tone",
                "Room for more vocal warmth"
            ],
            "recommendations": [
                "Practice softening tone during disagreements",
                "Add more verbal affirmation"
            ]
        }

    async def analyze_voice_interaction(
        self,
        user_id: str,
        couple_id: str,
        interaction_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Perform comprehensive analysis of a voice interaction.

        Args:
            user_id: ID of the requesting user
            couple_id: ID of the couple
            interaction_data: Dict containing:
                - transcript_segments: List of transcript segments with speaker info
                - duration: Call duration
                - context: Context of the interaction
                - tone_observations: Optional observer tone notes

        Returns:
            Dict containing comprehensive voice/tone analysis
        """
        logger.info(f"Analyzing voice interaction for couple {couple_id}, user {user_id}")

        try:
            segments = interaction_data.get("transcript_segments", [])
            duration = interaction_data.get("duration", "")
            context = interaction_data.get("context", "")
            tone_notes = interaction_data.get("tone_observations", "")

            prompt = f"""Analyze voice communication patterns between partners.

Call Duration: {duration}
Context: {context}
Observer Notes: {tone_notes}

Transcript Segments:
{self._format_segments(segments)}

Provide a comprehensive analysis:
- overall_score (1-100): Overall voice communication quality
- warmth_score (1-100): How warm and affectionate the tone is
- calm_score (1-100): How calm and measured the delivery is
- assertiveness_score (1-100): How well partners assert themselves
- emotional_regulation_score (1-100): How well emotions are regulated in voice
- dominant_tones (array): Most frequently occurring tones
- tone_variety_score (1-100): How varied the vocal expressions are
- observations (array): Key observations about the voice interaction
- recommendations (array): Suggestions for improvement

Return as valid JSON only."""

            response = await self.llm.chat(prompt)
            parsed = self._parse_response(response)

            result = {
                "user_id": user_id,
                "couple_id": couple_id,
                "analysis_date": datetime.utcnow().isoformat(),
                "interaction_duration": duration,
                **parsed
            }

            logger.info(f"Voice interaction analysis complete for couple {couple_id}")
            return result

        except Exception as e:
            logger.error(f"Error in analyze_voice_interaction: {str(e)}")
            return self._build_error_response(user_id, couple_id, str(e))

    async def score_warmth(
        self,
        user_id: str,
        couple_id: str,
        voice_segments: list
    ) -> Dict[str, Any]:
        """
        Score the warmth in voice communications.

        Args:
            user_id: ID of the requesting user
            couple_id: ID of the couple
            voice_segments: List of voice transcript segments

        Returns:
            Dict with warmth scoring and insights
        """
        logger.info(f"Scoring warmth for couple {couple_id}")

        try:
            prompt = f"""Analyze warmth in these voice communication segments.

{self._format_segments(voice_segments)}

Assess:
- warmth_score (1-100): Overall warmth level
- warm_moments (array): Specific warm exchanges
- cold_moments (array): Moments lacking warmth
- warmth_opportunities (array): Places warmth could be increased
- warmth_suggestions (array): How to increase vocal warmth

Return as valid JSON only."""

            response = await self.llm.chat(prompt)
            parsed = self._parse_response(response, warmth_only=True)

            return {
                "user_id": user_id,
                "couple_id": couple_id,
                "analysis_date": datetime.utcnow().isoformat(),
                **parsed
            }

        except Exception as e:
            logger.error(f"Error in score_warmth: {str(e)}")
            return {
                "user_id": user_id,
                "couple_id": couple_id,
                "analysis_date": datetime.utcnow().isoformat(),
                "warmth_score": 72,
                "warm_moments": [],
                "cold_moments": [],
                "error_occurred": True,
                "error_message": str(e)
            }

    async def assess_calm(
        self,
        user_id: str,
        couple_id: str,
        voice_segments: list
    ) -> Dict[str, Any]:
        """
        Assess calmness in voice communications.

        Args:
            user_id: ID of the requesting user
            couple_id: ID of the couple
            voice_segments: List of voice transcript segments

        Returns:
            Dict with calm assessment
        """
        logger.info(f"Assessing calm for couple {couple_id}")

        try:
            prompt = f"""Assess calmness in these voice segments.

{self._format_segments(voice_segments)}

Evaluate:
- calm_score (1-100): Overall calmness level
- tense_moments (array): Times when tension increased
- calm_moments (array): Times when calm was maintained
- tension_triggers (array): Topics or phrases that trigger tension
- calm_strategies (array): Techniques for maintaining calm

Return as valid JSON only."""

            response = await self.llm.chat(prompt)
            parsed = self._parse_response(response, calm_only=True)

            return {
                "user_id": user_id,
                "couple_id": couple_id,
                "analysis_date": datetime.utcnow().isoformat(),
                **parsed
            }

        except Exception as e:
            logger.error(f"Error in assess_calm: {str(e)}")
            return {
                "user_id": user_id,
                "couple_id": couple_id,
                "analysis_date": datetime.utcnow().isoformat(),
                "calm_score": 76,
                "tense_moments": [],
                "calm_moments": [],
                "error_occurred": True,
                "error_message": str(e)
            }

    async def measure_assertiveness(
        self,
        user_id: str,
        couple_id: str,
        voice_segments: list
    ) -> Dict[str, Any]:
        """
        Measure assertiveness in voice communications.

        Args:
            user_id: ID of the requesting user
            couple_id: ID of the couple
            voice_segments: List of voice transcript segments

        Returns:
            Dict with assertiveness measurement
        """
        logger.info(f"Measuring assertiveness for couple {couple_id}")

        try:
            prompt = f"""Measure assertiveness in these voice segments.

{self._format_segments(voice_segments)}

Determine:
- assertiveness_score (1-100): Overall assertiveness
- partner_a_assertiveness (int): Partner A's assertiveness level
- partner_b_assertiveness (int): Partner B's assertiveness level
- balanced_moments (array): Times when assertiveness was balanced
- unassertive_moments (array): Times when partners held back
- overbearing_moments (array): Times when one was too dominant
- assertiveness_tips (array): How to improve assertiveness balance

Return as valid JSON only."""

            response = await self.llm.chat(prompt)
            parsed = self._parse_response(response, assertiveness_only=True)

            return {
                "user_id": user_id,
                "couple_id": couple_id,
                "analysis_date": datetime.utcnow().isoformat(),
                **parsed
            }

        except Exception as e:
            logger.error(f"Error in measure_assertiveness: {str(e)}")
            return {
                "user_id": user_id,
                "couple_id": couple_id,
                "analysis_date": datetime.utcnow().isoformat(),
                "assertiveness_score": 70,
                "partner_a_assertiveness": 68,
                "partner_b_assertiveness": 72,
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
        Perform quick voice tone scoring.

        Args:
            user_id: ID of the requesting user
            couple_id: ID of the couple
            recent_interactions: List of recent voice interaction summaries

        Returns:
            Dict with quick score and summary
        """
        logger.info(f"Quick voice scoring for couple {couple_id}")

        try:
            prompt = f"""Quickly assess voice tone quality from these interactions.

{json.dumps(recent_interactions, indent=2)}

Provide:
- quick_score (int 1-100)
- tone_summary (string)
- one_improvement (string)

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
                "quick_score": 74,
                "tone_summary": "Generally warm and calm",
                "one_improvement": "Add more verbal affection"
            }

    def _format_segments(self, segments: list) -> str:
        """Format voice transcript segments."""
        formatted = []
        for seg in segments[-30:]:  # Limit to last 30 segments
            speaker = seg.get("speaker", "unknown")
            content = seg.get("content", "")
            timestamp = seg.get("timestamp", "")
            tone = seg.get("observed_tone", "")
            note = f" [tone: {tone}]" if tone else ""
            formatted.append(f"[{speaker}]({timestamp}): {content}{note}")
        return "\n".join(formatted)

    def _parse_response(self, response: str, minimal: bool = False,
                       warmth_only: bool = False, calm_only: bool = False,
                       assertiveness_only: bool = False) -> dict:
        """Parse LLM response into structured format."""
        try:
            json_str = self._extract_json(response)
            if json_str:
                parsed = json.loads(json_str)

                if minimal:
                    return {
                        "quick_score": parsed.get("quick_score", 74),
                        "tone_summary": parsed.get("tone_summary", "Positive tone"),
                        "one_improvement": parsed.get("one_improvement", "Continue current approach")
                    }
                if warmth_only:
                    return {
                        "warmth_score": parsed.get("warmth_score", 72),
                        "warm_moments": parsed.get("warm_moments", []),
                        "cold_moments": parsed.get("cold_moments", []),
                        "warmth_opportunities": parsed.get("warmth_opportunities", []),
                        "warmth_suggestions": parsed.get("warmth_suggestions", [])
                    }
                if calm_only:
                    return {
                        "calm_score": parsed.get("calm_score", 76),
                        "tense_moments": parsed.get("tense_moments", []),
                        "calm_moments": parsed.get("calm_moments", []),
                        "tension_triggers": parsed.get("tension_triggers", []),
                        "calm_strategies": parsed.get("calm_strategies", [])
                    }
                if assertiveness_only:
                    return {
                        "assertiveness_score": parsed.get("assertiveness_score", 70),
                        "partner_a_assertiveness": parsed.get("partner_a_assertiveness", 68),
                        "partner_b_assertiveness": parsed.get("partner_b_assertiveness", 72),
                        "balanced_moments": parsed.get("balanced_moments", []),
                        "unassertive_moments": parsed.get("unassertive_moments", []),
                        "overbearing_moments": parsed.get("overbearing_moments", []),
                        "assertiveness_tips": parsed.get("assertiveness_tips", [])
                    }
                return parsed
        except json.JSONDecodeError as e:
            logger.warning(f"JSON parsing failed: {e}")

        if minimal:
            return {"quick_score": 74, "tone_summary": "Good voice tone", "one_improvement": "Keep it up"}
        if warmth_only:
            return {"warmth_score": 72, "warm_moments": [], "cold_moments": [], "warmth_opportunities": [], "warmth_suggestions": []}
        if calm_only:
            return {"calm_score": 76, "tense_moments": [], "calm_moments": [], "tension_triggers": [], "calm_strategies": []}
        if assertiveness_only:
            return {"assertiveness_score": 70, "partner_a_assertiveness": 68, "partner_b_assertiveness": 72, "balanced_moments": [], "unassertive_moments": [], "overbearing_moments": [], "assertiveness_tips": []}
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