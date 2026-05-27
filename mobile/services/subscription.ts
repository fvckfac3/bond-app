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
   * Get current user's subscription from database
   */
  async getUserSubscription(): Promise<SubscriptionStatus | null> {
    if (!_userId) return null;
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', _userId)
        .single();
      if (error || !data) return null;
      return {
        isActive: ['active', 'trialing'].includes(data.status),
        isTrial: data.status === 'trialing',
        plan: this.determinePlan(data.stripe_price_id),
        currentPeriodEnd: data.current_period_end ? new Date(data.current_period_end) : null,
        cancelAtPeriodEnd: data.cancel_at_period_end,
      };
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
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', this.userId)
        .single();

      if (error || !data) {
        return this.getDefaultStatus();
      }

      const status: SubscriptionStatus = {
        isActive: ['active', 'trialing'].includes(data.status),
        isTrial: data.status === 'trialing',
        plan: this.determinePlan(data.stripe_price_id),
        currentPeriodEnd: data.current_period_end ? new Date(data.current_period_end) : null,
        cancelAtPeriodEnd: data.cancel_at_period_end,
      };

      this.subscriptionCache = status;
      this.cacheExpiry = Date.now() + this.CACHE_TTL;
      return status;
    } catch (err) {
      console.error('Error checking subscription status:', err);
      return this.getDefaultStatus();
    }
  }

  /**
   * Determine plan type from Stripe price ID
   */
  private determinePlan(stripePriceId: string | null): 'free' | 'monthly' | 'annual' {
    if (!stripePriceId) return 'free';
    
    const annualPackage = SUBSCRIPTION_PACKAGES.find(p => p.id === 'premium_annual');
    const monthlyPackage = SUBSCRIPTION_PACKAGES.find(p => p.id === 'premium_monthly');
    
    if (annualPackage?.stripePriceId === stripePriceId) return 'annual';
    if (monthlyPackage?.stripePriceId === stripePriceId) return 'monthly';
    
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

      const table = type === 'assessment' ? 'assessment_sessions' : 'activity_completions';
      
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
        .eq('user_id', this.userId)
        .gte('created_at', startOfMonth.toISOString());

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
