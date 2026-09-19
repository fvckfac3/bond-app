// Subscription Service for BOND App
// Handles Stripe Checkout integration for premium subscriptions

import { supabase } from './supabase';
import { Linking, Platform } from 'react-native';

// Singleton state
let _userId: string | null = null;

export interface SubscriptionPackage {
  id: string;
  name: string;
  description: string;
  amount: number; // in cents
  interval: 'month' | 'year';
  features: string[];
  stripePriceId: string;
}

export interface SubscriptionStatus {
  isActive: boolean;
  isTrial: boolean;
  plan: 'free' | 'monthly' | 'annual';
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  /** True when Premium comes from the partner's subscription (Premium is per couple). */
  coveredByPartner: boolean;
}

// Production Stripe Price IDs - Replace with your actual Stripe price IDs
export const SUBSCRIPTION_PACKAGES: SubscriptionPackage[] = [
  {
    id: 'premium_monthly',
    name: 'Premium Monthly',
    description: 'Full access to all features',
    amount: 1299, // $12.99
    interval: 'month',
    stripePriceId: process.env.EXPO_PUBLIC_STRIPE_MONTHLY_PRICE_ID || 'price_monthly_placeholder',
    features: [
      'Unlimited assessments',
      'Full activity library',
      'Full daily check-ins',
      'AI-generated insights',
      'Unlimited chat history',
      'Progress tracking',
      'Priority support',
    ],
  },
  {
    id: 'premium_annual',
    name: 'Premium Annual',
    description: 'Best value - save 36%',
    amount: 9900, // $99.00
    interval: 'year',
    stripePriceId: process.env.EXPO_PUBLIC_STRIPE_ANNUAL_PRICE_ID || 'price_annual_placeholder',
    features: [
      'Everything in Monthly',
      'Save 36% vs monthly',
      'Exclusive annual-only features',
      'Priority support',
    ],
  },
];

// Usage limits for free tier
export const FREE_TIER_LIMITS = {
  assessmentsPerMonth: 1,
  activitiesPerMonth: 3,
  chatHistoryDays: 30,
  includeAlwaysFree: ['love-languages'], // Love Languages always free
};

class SubscriptionService {
  private userId: string | null = null;
  private subscriptionCache: SubscriptionStatus | null = null;
  private cacheExpiry: number = 0;
  private CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  setUserId(userId: string) {
    _userId = userId;
    this.userId = userId;
    this.subscriptionCache = null;
  }

  /**
   * Get available subscription packages
   */
  async getPackages(): Promise<SubscriptionPackage[]> {
    return SUBSCRIPTION_PACKAGES;
  }

  /**
   * Premium is per couple: this reads the user's own subscription or their active
   * partner's via the `get_couple_subscription()` RPC (supabase/bond_schema.sql),
   * best subscription first.
   */
  private async fetchCoupleSubscription(userId: string): Promise<SubscriptionStatus | null> {
    const { data, error } = await supabase.rpc('get_couple_subscription');
    if (error || !data || data.length === 0) return null;

    const row = data[0];
    const expiresAt = row.expires_at ? new Date(row.expires_at) : null;
    const notExpired = !expiresAt || expiresAt.getTime() > Date.now();
    const isActive = ['active', 'trialing'].includes(row.status) && notExpired;

    return {
      isActive,
      isTrial: isActive && (row.status === 'trialing' || !!row.is_trial),
      plan: this.determinePlan(row.package_id),
      currentPeriodEnd: expiresAt,
      cancelAtPeriodEnd: row.status === 'canceled' && notExpired,
      coveredByPartner: isActive && row.owner_id !== userId,
    };
  }

  /**
   * Get current user's (couple's) subscription from database
   */
  async getUserSubscription(): Promise<SubscriptionStatus | null> {
    if (!_userId) return null;
    try {
      return await this.fetchCoupleSubscription(_userId);
    } catch {
      return null;
    }
  }

  /**
   * Get payment status from database after checkout
   * Called by success screen to verify payment went through
   */
  async getPaymentStatus(_sessionId: string): Promise<{ payment_status: string; status: string } | null> {
    if (!_userId) return null;
    try {
      const { data } = await supabase
        .from('subscriptions')
        .select('status')
        .eq('user_id', _userId)
        .single();
      if (!data) return { payment_status: 'unpaid', status: 'none' };
      return {
        payment_status: data.status === 'active' || data.status === 'trialing' ? 'paid' : 'unpaid',
        status: data.status,
      };
    } catch {
      return null;
    }
  }

  /**
   * Get current subscription status
   */
  async getStatus(): Promise<SubscriptionStatus> {
    if (this.subscriptionCache && Date.now() < this.cacheExpiry) {
      return this.subscriptionCache;
    }
    return await this.checkSubscriptionStatus();
  }

  /**
   * Check subscription status from database
   */
  private async checkSubscriptionStatus(): Promise<SubscriptionStatus> {
    if (!this.userId) {
      return this.getDefaultStatus();
    }

    try {
      const status = (await this.fetchCoupleSubscription(this.userId)) ?? this.getDefaultStatus();

      this.subscriptionCache = status;
      this.cacheExpiry = Date.now() + this.CACHE_TTL;
      return status;
    } catch (err) {
      console.error('Error checking subscription status:', err);
      return this.getDefaultStatus();
    }
  }

  /**
   * Determine plan type from the subscription's package id
   */
  private determinePlan(packageId: string | null): 'free' | 'monthly' | 'annual' {
    if (packageId === 'premium_annual') return 'annual';
    if (packageId === 'premium_monthly') return 'monthly';
    return 'free';
  }

  /**
   * Get default free tier status
   */
  private getDefaultStatus(): SubscriptionStatus {
    return {
      isActive: false,
      isTrial: false,
      plan: 'free',
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      coveredByPartner: false,
    };
  }

  /**
   * Check if user can use a specific feature
   */
  async canUseFeature(feature: 'assessment' | 'activity' | 'chat' | 'ai_insights'): Promise<boolean> {
    const status = await this.getStatus();
    
    if (status.isActive) return true;

    switch (feature) {
      case 'assessment':
        // Free users get 1 assessment per month, Love Languages always free
        const usage = await this.getUsageCount('assessment');
        return usage < FREE_TIER_LIMITS.assessmentsPerMonth;
      
      case 'activity':
        const activityUsage = await this.getUsageCount('activity');
        return activityUsage < FREE_TIER_LIMITS.activitiesPerMonth;
      
      case 'chat':
      case 'ai_insights':
        return false; // Premium only
      
      default:
        return false;
    }
  }

  /**
   * Check if a specific assessment is always free
   */
  isAlwaysFreeAssessment(assessmentId: string): boolean {
    return FREE_TIER_LIMITS.includeAlwaysFree.includes(assessmentId);
  }

  /**
   * Get usage counts for current month
   */
  async getUsageCount(type: 'assessment' | 'activity'): Promise<number> {
    if (!this.userId) return 0;

    try {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      // `assessment_sessions` (written by app/assessment/[id].tsx) and
      // `activity_completions` are what the app actually reads/writes for
      // usage tracking — matches backend/routes/payments.py's get_user_usage(),
      // which counts the same tables the same way. Note `assessment_sessions`
      // is missing from supabase/bond_schema.sql (only defined in the older
      // supabase/schema.sql) — a schema-file gap, not a reason to point this
      // at a different table than the rest of the app uses.
      const table = type === 'assessment' ? 'assessment_sessions' : 'activity_completions';

      let query = supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
        .eq('user_id', this.userId)
        .gte('completed_at', startOfMonth.toISOString());

      // activity_completions has no `completed` column — a row's existence
      // is itself the completion record (see supabase/bond_schema.sql).
      if (type === 'assessment') {
        query = query.eq('completed', true);
      }

      const { count, error } = await query;

      if (error) {
        console.error(`Error getting ${type} usage:`, error);
        return 0;
      }

      return count || 0;
    } catch (err) {
      console.error(`Error getting ${type} usage:`, err);
      return 0;
    }
  }

  /**
   * Get usage limits for current user
   */
  async getUsageLimits(): Promise<{
    assessments_used: number;
    assessments_limit: number;
    activities_used: number;
    activities_limit: number;
    isPremium: boolean;
  }> {
    const status = await this.getStatus();
    const [assessmentsUsed, activitiesUsed] = await Promise.all([
      this.getUsageCount('assessment'),
      this.getUsageCount('activity'),
    ]);

    return {
      assessments_used: assessmentsUsed,
      assessments_limit: status.isActive ? Infinity : FREE_TIER_LIMITS.assessmentsPerMonth,
      activities_used: activitiesUsed,
      activities_limit: status.isActive ? Infinity : FREE_TIER_LIMITS.activitiesPerMonth,
      isPremium: status.isActive,
    };
  }

  /**
   * Start Stripe Checkout session
   */
  async createCheckoutSession(packageId: string): Promise<{ url: string } | null> {
    if (!this.userId) return null;

    try {
      const selectedPackage = SUBSCRIPTION_PACKAGES.find(p => p.id === packageId);
      if (!selectedPackage) return null;

      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user?.email) return null;

      const response = await fetch('https://senet.zo.space/api/stripe-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: selectedPackage.stripePriceId,
          userId: this.userId,
          userEmail: userData.user.email,
          packageId,
          successUrl: 'bond://subscription/success',
          cancelUrl: 'bond://subscription/cancel',
        }),
      });

      if (!response.ok) {
        console.error('Checkout session error:', response.status);
        return null;
      }

      const { url, error } = await response.json();
      if (error || !url) {
        console.error('Checkout error:', error);
        return null;
      }

      return { url };
    } catch (err) {
      console.error('Error creating checkout session:', err);
      return null;
    }
  }

  /**
   * Open Stripe Customer Portal for managing subscription
   */
  async openCustomerPortal(): Promise<boolean> {
    if (!this.userId) return false;

    try {
      const response = await fetch('https://senet.zo.space/api/stripe-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: this.userId }),
      });

      if (!response.ok) return false;

      const { url } = await response.json();
      if (url) {
        await Linking.openURL(url);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error opening customer portal:', err);
      return false;
    }
  }

  /**
   * Check if trial is available for user
   */
  async isTrialAvailable(): Promise<boolean> {
    if (!this.userId) return false;
    
    // Check if user has already used a trial
    try {
      const { data } = await supabase
        .from('subscriptions')
        .select('status')
        .eq('user_id', this.userId)
        .single();
      
      // If no subscription record or never been active/trialing, trial is available
      return !data || (!data.status.includes('active') && !data.status.includes('trial'));
    } catch {
      return true;
    }
  }

  /**
   * Clear subscription cache (call after updates)
   */
  clearCache(): void {
    this.subscriptionCache = null;
    this.cacheExpiry = 0;
  }
}

export default new SubscriptionService();
