import { useState, useEffect, useCallback } from 'react';
import subscriptionService, {
  SubscriptionPackage,
  SubscriptionStatus,
} from '../services/subscription';

export function useSubscription(userId?: string) {
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
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
      const [packagesData, subscriptionData] = await Promise.all([
        subscriptionService.getPackages(),
        subscriptionService.getUserSubscription(),
      ]);

      setPackages(packagesData);
      setSubscription(subscriptionData);
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

  const usage = {
    assessments_remaining: subscription?.isActive ? Infinity : 1,
    ai_insights_remaining: subscription?.isActive ? Infinity : 0,
  };

  const canUseFeature = useCallback(
    (feature: 'assessment' | 'ai_insight') => {
      if (isPremium) return true;
      if (feature === 'assessment') {
        return (usage.assessments_remaining || 0) > 0;
      }
      if (feature === 'ai_insight') {
        return (usage.ai_insights_remaining || 0) > 0;
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
