export const USER_PLANS = ["free", "pro", "enterprise"] as const;

export type UserPlan = (typeof USER_PLANS)[number];

export interface PlanLimits {
  formLimit: number;
  responseLimit: number;
}

export const PLAN_LIMITS: Record<UserPlan, PlanLimits> = {
  free: {
    formLimit: 5,
    responseLimit: 100,
  },
  pro: {
    formLimit: 50,
    responseLimit: 10_000,
  },
  enterprise: {
    formLimit: -1, // unlimited
    responseLimit: -1, // unlimited
  },
} as const;
