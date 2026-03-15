// Database type definitions matching supabase/schema.sql

export type UserRole = "user" | "admin";
export type RiskLevel = "low" | "medium" | "high";
export type TraderLevel = "beginner" | "intermediate" | "advanced";
export type TradeDirection = "long" | "short";
export type ChallengeType = "30" | "60" | "90";
export type ChallengeStatus = "active" | "completed" | "abandoned";
export type SubscriptionPlan = "monthly" | "yearly";
export type SubscriptionStatus = "active" | "expired" | "cancelled" | "pending";
export type NotificationType = "info" | "warning" | "success" | "alert";

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  trading_capital: number;
  trading_style: string;
  years_experience: number;
  role: UserRole;
  referral_code: string | null;
  avatar_url: string | null;
  is_suspended: boolean;
  preferred_instruments: string | null;
  default_risk: number | null;
  created_at: string;
  updated_at: string;
}

export interface Assessment {
  id: string;
  user_id: string;
  answers: Record<string, unknown>[];
  discipline_score: number;
  risk_level: RiskLevel;
  trader_level: TraderLevel;
  created_at: string;
}

export interface PersonalizedRule {
  id: string;
  user_id: string;
  assessment_id: string;
  rules: {
    category: string;
    rule: string;
    severity: "critical" | "important" | "recommended";
    description: string;
  }[];
  created_at: string;
}

export interface Trade {
  id: string;
  user_id: string;
  date: string;
  stock: string;
  direction: TradeDirection;
  entry_price: number;
  exit_price: number | null;
  stop_loss: number | null;
  target_price: number | null;
  quantity: number;
  emotion_before: string | null;
  emotion_after: string | null;
  followed_plan: boolean;
  pnl: number;
  risk_pct: number;
  sl_followed: boolean;
  mistakes: string[];
  notes: string | null;
  created_at: string;
}

export interface Challenge {
  id: string;
  user_id: string;
  type: ChallengeType;
  name: string;
  start_date: string;
  current_day: number;
  status: ChallengeStatus;
  daily_progress: {
    day: number;
    completed: boolean;
    rules_followed: number;
    total_rules: number;
  }[];
  rules_to_follow: string[];
  created_at: string;
  completed_at: string | null;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  razorpay_subscription_id: string | null;
  amount_paid: number;
  currency: string;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
  cancelled_at: string | null;
}

export interface LoyaltyPoint {
  id: string;
  user_id: string;
  action: string;
  points: number;
  description: string | null;
  expires_at: string;
  created_at: string;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string | null;
  referred_email: string | null;
  status: "pending" | "completed" | "rewarded";
  points_awarded: number;
  created_at: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  target: string;
  target_user_id: string | null;
  sent_by: string | null;
  is_read: boolean;
  created_at: string;
}

export interface DailyReport {
  id: string;
  user_id: string;
  date: string;
  trades_taken: number;
  rules_followed: number;
  total_rules: number;
  mistakes_count: number;
  discipline_score: number;
  total_pnl: number;
  updated_capital: number;
  feedback: {
    positive: string[];
    negative: string[];
    suggestions: string[];
    encouragement: string;
  };
  created_at: string;
}
