import * as Sentry from '@sentry/react-native';

// Sentry configuration for BOND app
const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

export function initializeSentry() {
  // Only initialize if DSN is provided
  if (!SENTRY_DSN || __DEV__) {
    console.log('Sentry not initialized (dev mode or missing DSN)');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    
    // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
    // Adjust this value in production
    tracesSampleRate: 1.0,
    
    // Enable native crash reporting
    enableNative: true,
    
    // Capture 100% of errors in production
    sampleRate: 1.0,
    
    // Set environment
    environment: __DEV__ ? 'development' : 'production',
    
    // Attach stack trace to all messages
    attachStacktrace: true,
    
    // Don't send PII (Personally Identifiable Information)
    sendDefaultPii: false,
    
    // Before send hook - filter sensitive data
    beforeSend(event, hint) {
      // Remove sensitive data
      if (event.request) {
        delete event.request.cookies;
        delete event.request.headers;
      }
      
      // Remove password fields from breadcrumbs
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map(breadcrumb => {
          if (breadcrumb.data) {
            const sanitized = { ...breadcrumb.data };
            delete sanitized.password;
            delete sanitized.token;
            delete sanitized.auth;
            return { ...breadcrumb, data: sanitized };
          }
          return breadcrumb;
        });
      }
      
      return event;
    },
    
    // Integrations
    integrations: [
      new Sentry.ReactNativeTracing({
        // Pass instrumentation to be used as `routingInstrumentation`
        routingInstrumentation: new Sentry.ReactNavigationInstrumentation(),
        
        // How long to wait for the app to mount before timing out
        tracingOrigins: ['localhost', 'bondapp.com', /^\//],
      }),
    ],
  });
  
  console.log('Sentry initialized successfully');
}

// Helper functions for error tracking

export function logError(error, context = {}) {
  if (__DEV__) {
    console.error('Error:', error, context);
  }
  
  Sentry.captureException(error, {
    tags: context.tags || {},
    extra: context.extra || {},
    level: context.level || 'error',
  });
}

export function logMessage(message, level = 'info', context = {}) {
  if (__DEV__) {
    console.log(`[${level}]`, message, context);
  }
  
  Sentry.captureMessage(message, {
    level,
    tags: context.tags || {},
    extra: context.extra || {},
  });
}

export function setUserContext(user) {
  if (!user) {
    Sentry.setUser(null);
    return;
  }
  
  Sentry.setUser({
    id: user.id,
    email: user.email,
    // Don't send sensitive data
  });
}

export function addBreadcrumb(message, category = 'action', data = {}) {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
  });
}

// Wrap components with error boundary
export const SentryErrorBoundary = Sentry.ErrorBoundary;

export default {
  init: initializeSentry,
  logError,
  logMessage,
  setUserContext,
  addBreadcrumb,
  ErrorBoundary: SentryErrorBoundary,
};
