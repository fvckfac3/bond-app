import { useState, useEffect, useCallback } from 'react';
import subscriptionService, {
  SubscriptionPackage,
  SubscriptionStatus,
} from '../services/subscription';

interface UsageState {
  assessments_used: number;
  assessments_limit: number;
  assessments_remaining: number;
  activities_used: number;
  activities_limit: number;
  activities_remaining: number;
  ai_insights_used: number;
  ai_insights_limit: number;
  ai_insights_remaining: number;
}

const DEFAULT_USAGE: UsageState = {
  assessments_used: 0,
  assessments_limit: 1,
  assessments_remaining: 1,
  activities_used: 0,
  activities_limit: 3,
  activities_remaining: 3,
  ai_insights_used: 0,
  ai_insights_limit: 0,
  ai_insights_remaining: 0,
};

export function useSubscription(userId?: string) {
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [usage, setUsage] = useState<UsageState>(DEFAULT_USAGE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      subscriptionService.setUserId(userId);
    }
    loadData();
  }, [userId]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [packagesData, subscriptionData, usageLimits] = await Promise.all([
        subscriptionService.getPackages(),
        subscriptionService.getUserSubscription(),
        subscriptionService.getUsageLimits(),
      ]);

      setPackages(packagesData);
      setSubscription(subscriptionData);
      setUsage({
        assessments_used: usageLimits.assessments_used,
        assessments_limit: usageLimits.assessments_limit,
        assessments_remaining: Math.max(
          0,
          usageLimits.assessments_limit - usageLimits.assessments_used
        ),
        activities_used: usageLimits.activities_used,
        activities_limit: usageLimits.activities_limit,
        activities_remaining: Math.max(
          0,
          usageLimits.activities_limit - usageLimits.activities_used
        ),
        // Free tier has no AI insight allowance today (subscriptionService.canUseFeature
        // gates 'ai_insights' on isPremium alone) — mirror that here rather than inventing
        // a partial free quota that nothing else in the app enforces.
        ai_insights_used: 0,
        ai_insights_limit: usageLimits.isPremium ? Infinity : 0,
        ai_insights_remaining: usageLimits.isPremium ? Infinity : 0,
      });
      setError(null);
    } catch (err) {
      setError('Failed to load subscription data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(() => {
    subscriptionService.clearCache();
    return loadData();
  }, [loadData]);

  const isPremium = subscription?.isActive || false;
  const isTrial = subscription?.isTrial || false;

  const canUseFeature = useCallback(
    (feature: 'assessment' | 'activity' | 'ai_insight') => {
      if (isPremium) return true;
      if (feature === 'assessment') {
        return usage.assessments_remaining > 0;
      }
      if (feature === 'activity') {
        return usage.activities_remaining > 0;
      }
      if (feature === 'ai_insight') {
        return usage.ai_insights_remaining > 0;
      }
      return false;
    },
    [isPremium, usage]
  );

  return {
    packages,
    subscription,
    loading,
    error,
    isPremium,
    isTrial,
    usage,
    canUseFeature,
    refresh,
  };
}
