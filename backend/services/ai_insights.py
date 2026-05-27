"""
AI Insights Generation Service for BOND App
Generates narrative insights, recommendations, and communication scripts
using OpenAI via emergentintegrations library
"""

from emergentintegrations.llm.chat import LlmChat, UserMessage
import os
import json
from dotenv import load_dotenv

load_dotenv()

# Get Emergent LLM Key - REQUIRED
EMERGENT_LLM_KEY = os.getenv('EMERGENT_LLM_KEY')
if not EMERGENT_LLM_KEY:
    raise ValueError("EMERGENT_LLM_KEY environment variable is required. Please set it in .env or environment.")


class AIInsightsGenerator:
    """Generate AI-powered insights for relationship assessments"""
    
    def __init__(self):
        self.api_key = EMERGENT_LLM_KEY
        
    async def generate_assessment_insights(
        self,
        assessment_name: str,
        framework: str,
        user1_scores: dict,
        user2_scores: dict,
        user1_name: str = "Partner 1",
        user2_name: str = "Partner 2"
    ) -> dict:
        """
        Generate comprehensive AI insights for an assessment
        
        Args:
            assessment_name: Name of the assessment (e.g., "Love Languages")
            framework: Psychological framework (e.g., "Chapman's Five Love Languages")
            user1_scores: Dictionary of scores for user 1
            user2_scores: Dictionary of scores for user 2
            user1_name: Name of user 1
            user2_name: Name of user 2
            
        Returns:
            dict with keys: narrative, growth_recommendations, strength_affirmation, communication_scripts
        """
        
        # Create the prompt
        prompt = self._create_insights_prompt(
            assessment_name, framework, user1_scores, user2_scores, user1_name, user2_name
        )
        
        # Initialize chat
        chat = LlmChat(
            api_key=self.api_key,
            session_id=f"assessment-insights-{assessment_name}",
            system_message="You are a relationship wellness expert trained in evidence-based psychological frameworks. Provide warm, actionable, and science-backed insights."
        ).with_model("openai", "gpt-5.1")
        
        # Send message
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        # Parse response
        insights = self._parse_insights_response(response)
        
        return insights
    
    def _create_insights_prompt(
        self,
        assessment_name: str,
        framework: str,
        user1_scores: dict,
        user2_scores: dict,
        user1_name: str,
        user2_name: str
    ) -> str:
        """Create the prompt for AI insights generation"""
        
        prompt = f"""You are analyzing results from the "{assessment_name}" assessment based on {framework}.

**{user1_name}'s Results:**
{json.dumps(user1_scores, indent=2)}

**{user2_name}'s Results:**
{json.dumps(user2_scores, indent=2)}

Please provide comprehensive insights in the following JSON format:

{{
  "narrative": "A warm, encouraging 2-3 paragraph narrative summary that highlights their unique dynamic, areas of alignment, and areas for growth. Use their names. Be specific to their results.",
  
  "growth_recommendations": [
    "Specific, actionable recommendation 1",
    "Specific, actionable recommendation 2",
    "Specific, actionable recommendation 3"
  ],
  
  "strength_affirmation": "A positive, affirming statement about their relationship strengths based on the results",
  
  "communication_scripts": {{
    "divergence_conversation": "A suggested opening line for discussing areas where they differ",
    "appreciation_expression": "A script for expressing appreciation based on their results"
  }},
  
  "framework_tags": ["tag1", "tag2", "tag3"]
}}

Guidelines:
- Be warm and encouraging
- Avoid clinical jargon
- Focus on growth mindset
- Provide specific, actionable advice
- Reference the psychological framework appropriately
- Keep recommendations realistic and achievable
- Celebrate their strengths

Respond ONLY with valid JSON, no markdown or extra text."""

        return prompt
    
    def _parse_insights_response(self, response: str) -> dict:
        """Parse the AI response into structured insights"""
        try:
            # Try to parse as JSON
            insights = json.loads(response)
            
            # Validate required fields
            required_fields = ['narrative', 'growth_recommendations', 'strength_affirmation', 'communication_scripts']
            for field in required_fields:
                if field not in insights:
                    insights[field] = self._get_fallback_value(field)
            
            return insights
        except json.JSONDecodeError:
            # Fallback to structured response
            return {
                'narrative': response[:500] if len(response) > 500 else response,
                'growth_recommendations': [
                    'Continue taking assessments together',
                    'Have open conversations about your results',
                    'Practice active listening'
                ],
                'strength_affirmation': 'Your willingness to explore your relationship together is a strength.',
                'communication_scripts': {
                    'divergence_conversation': "I noticed we have different perspectives on this. Can we talk about it?",
                    'appreciation_expression': "I appreciate you taking the time to do this assessment with me."
                },
                'framework_tags': []
            }
    
    def _get_fallback_value(self, field: str):
        """Get fallback values for missing fields"""
        fallbacks = {
            'narrative': 'Your results show unique perspectives that can strengthen your relationship through understanding.',
            'growth_recommendations': [
                'Continue exploring your relationship together',
                'Practice open communication',
                'Celebrate your differences'
            ],
            'strength_affirmation': 'Your commitment to growth is a relationship strength.',
            'communication_scripts': {
                'divergence_conversation': "Let's talk about our different perspectives",
                'appreciation_expression': "I appreciate our journey together"
            },
            'framework_tags': []
        }
        return fallbacks.get(field, '')


# Singleton instance
ai_insights_generator = AIInsightsGenerator()
