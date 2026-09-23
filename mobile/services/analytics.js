import PostHog from 'posthog-react-native';

// PostHog configuration for BOND app
const POSTHOG_API_KEY = process.env.EXPO_PUBLIC_POSTHOG_API_KEY;
const POSTHOG_HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';

let posthogClient = null;

export async function initializeAnalytics() {
  // Only initialize if API key is provided and not in dev mode
  if (!POSTHOG_API_KEY || __DEV__) {
    console.log('Analytics not initialized (dev mode or missing API key)');
    return null;
  }

  try {
    posthogClient = new PostHog(
      POSTHOG_API_KEY,
      {
        host: POSTHOG_HOST,
        // Disable in development
        disabled: __DEV__,
      }
    );
    
    console.log('PostHog analytics initialized');
    return posthogClient;
  } catch (error) {
    console.error('Failed to initialize PostHog:', error);
    return null;
  }
}

// Track events
export function trackEvent(eventName, properties = {}) {
  if (!posthogClient || __DEV__) {
    console.log(`[Analytics] ${eventName}`, properties);
    return;
  }
  
  try {
    posthogClient.capture(eventName, properties);
  } catch (error) {
    console.error('Error tracking event:', error);
  }
}

// Identify user
export function identifyUser(userId, traits = {}) {
  if (!posthogClient || __DEV__) {
    console.log(`[Analytics] Identify user: ${userId}`, traits);
    return;
  }
  
  try {
    posthogClient.identify(userId, traits);
  } catch (error) {
    console.error('Error identifying user:', error);
  }
}

// Reset user (on logout)
export function resetUser() {
  if (!posthogClient) return;
  
  try {
    posthogClient.reset();
  } catch (error) {
    console.error('Error resetting user:', error);
  }
}

// Set user properties
export function setUserProperties(properties) {
  if (!posthogClient || __DEV__) {
    console.log('[Analytics] Set user properties:', properties);
    return;
  }
  
  try {
    posthogClient.setPersonProperties(properties);
  } catch (error) {
    console.error('Error setting user properties:', error);
  }
}

// Pre-defined events for BOND app
export const AnalyticsEvents = {
  // Authentication
  SIGNUP_STARTED: 'signup_started',
  SIGNUP_COMPLETED: 'signup_completed',
  LOGIN_COMPLETED: 'login_completed',
  LOGOUT: 'logout',
  
  // Partner
  PAIR_CODE_GENERATED: 'pair_code_generated',
  PARTNER_CONNECTION_INITIATED: 'partner_connection_initiated',
  PARTNER_CONNECTED: 'partner_connected',
  PARTNER_DISCONNECTED: 'partner_disconnected',
  
  // Assessments
  ASSESSMENT_STARTED: 'assessment_started',
  ASSESSMENT_QUESTION_ANSWERED: 'assessment_question_answered',
  ASSESSMENT_COMPLETED: 'assessment_completed',
  ASSESSMENT_RESULTS_VIEWED: 'assessment_results_viewed',
  AI_INSIGHTS_GENERATED: 'ai_insights_generated',
  AI_INSIGHTS_VIEWED: 'ai_insights_viewed',
  
  // Daily Check-ins
  DAILY_CHECKIN_OPENED: 'daily_checkin_opened',
  DAILY_CHECKIN_COMPLETED: 'daily_checkin_completed',
  
  // Activities
  ACTIVITY_VIEWED: 'activity_viewed',
  ACTIVITY_STARTED: 'activity_started',
  ACTIVITY_COMPLETED: 'activity_completed',
  ACTIVITY_SHARED: 'activity_shared',

  // Learning
  LEARNING_MODULE_COMPLETED: 'learning_module_completed',
  
  // Messages
  MESSAGE_SENT: 'message_sent',
  MESSAGE_READ: 'message_read',
  
  // Progress
  PROGRESS_VIEWED: 'progress_viewed',
  MILESTONE_ACHIEVED: 'milestone_achieved',
  STREAK_UPDATED: 'streak_updated',
  
  // App
  APP_OPENED: 'app_opened',
  APP_BACKGROUNDED: 'app_backgrounded',
  SCREEN_VIEWED: 'screen_viewed',
  
  // Errors
  ERROR_OCCURRED: 'error_occurred',
};

// Helper functions for common tracking patterns

export function trackScreenView(screenName) {
  trackEvent(AnalyticsEvents.SCREEN_VIEWED, {
    screen_name: screenName,
    timestamp: new Date().toISOString(),
  });
}

export function trackAssessmentProgress(assessmentId, questionNumber, totalQuestions) {
  trackEvent(AnalyticsEvents.ASSESSMENT_QUESTION_ANSWERED, {
    assessment_id: assessmentId,
    question_number: questionNumber,
    total_questions: totalQuestions,
    progress: (questionNumber / totalQuestions) * 100,
  });
}

export function trackError(error, context = {}) {
  trackEvent(AnalyticsEvents.ERROR_OCCURRED, {
    error_message: error.message,
    error_stack: error.stack,
    ...context,
  });
}

export default {
  init: initializeAnalytics,
  track: trackEvent,
  identify: identifyUser,
  reset: resetUser,
  setUserProperties,
  events: AnalyticsEvents,
  trackScreenView,
  trackAssessmentProgress,
  trackError,
};
