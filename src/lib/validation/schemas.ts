import { z } from "zod";

// Trade Journal Validation
export const tradeSchema = z.object({
  stock: z.string().min(1, "Stock/Index is required").max(20),
  direction: z.enum(["long", "short"]),
  entry_price: z.number().positive("Entry price must be positive"),
  exit_price: z.number().positive("Exit price must be positive").optional(),
  stop_loss: z.number().positive("Stop loss must be positive").optional(),
  target_price: z.number().positive("Target must be positive").optional(),
  quantity: z.number().int().positive("Quantity must be positive"),
  emotion_before: z.string().max(50).optional(),
  emotion_after: z.string().max(50).optional(),
  followed_plan: z.boolean().default(true),
  notes: z.string().max(500).optional(),
});

// Assessment Answer Validation
export const assessmentAnswerSchema = z.object({
  question_id: z.string(),
  answer: z.union([z.string(), z.number()]),
});

export const assessmentSchema = z.object({
  answers: z.array(assessmentAnswerSchema).min(12, "All 12 questions must be answered"),
});

// Challenge Start Validation
export const challengeSchema = z.object({
  type: z.enum(["30", "60", "90"]),
  name: z.string().min(1).max(100),
});

// Profile Update Validation
export const profileUpdateSchema = z.object({
  full_name: z.string().min(1).max(120).optional(),
  phone: z.string().max(15).optional(),
  trading_capital: z.number().int().positive().optional(),
  trading_style: z.string().max(50).optional(),
});

// Position Calculator Validation
export const positionCalcSchema = z.object({
  capital: z.number().positive("Capital must be positive"),
  maxTrades: z.number().int().positive().max(20),
  entryPrice: z.number().positive("Entry price must be positive"),
  stopLossPrice: z.number().positive("Stop loss must be positive"),
  riskRewardRatio: z.number().positive().min(0.5).max(10),
  riskPercentage: z.number().positive().max(5, "Risk cannot exceed 5%"),
});

// Admin Settings Validation
export const pricingSchema = z.object({
  amount: z.number().int().positive().min(99).max(99999),
  amount_paise: z.number().int().positive(),
});

// Notification Validation
export const notificationSchema = z.object({
  title: z.string().min(1).max(100),
  message: z.string().min(1).max(500),
  type: z.enum(["info", "warning", "success", "alert"]),
  target: z.string(),
  target_user_id: z.string().uuid().optional(),
});

export type TradeInput = z.infer<typeof tradeSchema>;
export type AssessmentInput = z.infer<typeof assessmentSchema>;
export type ChallengeInput = z.infer<typeof challengeSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type PositionCalcInput = z.infer<typeof positionCalcSchema>;
export type PricingInput = z.infer<typeof pricingSchema>;
export type NotificationInput = z.infer<typeof notificationSchema>;
