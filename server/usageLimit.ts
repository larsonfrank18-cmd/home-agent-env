/**
 * API调用次数限制工具
 *
 * 会员等级配额（每日 / 每月）：
 *   free       :   0 /    0  （未付费用户不可使用）
 *   quarterly  :  50 /  500  （季度会员 799元）
 *   annual     :  65 /  650  （年度会员 2699元，+30%）
 *   lifetime   :  80 /  800  （永久会员 6699元，+60%）
 *
 * 管理员可通过 customDailyLimit / customMonthlyLimit 覆盖默认值（null = 使用默认）
 */

import { getDb } from "./db";
import { apiUsageLogs, users } from "../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export type MemberType = "free" | "quarterly" | "annual" | "lifetime";
export type FeatureType = "copywriter" | "dm" | "disc";

/** 系统默认配额 */
export const DEFAULT_QUOTAS: Record<MemberType, { daily: number; monthly: number }> = {
  free:       { daily: 0,  monthly: 0   },
  quarterly:  { daily: 50, monthly: 500 },
  annual:     { daily: 65, monthly: 650 },
  lifetime:   { daily: 80, monthly: 800 },
};

/** 获取今日日期字符串 YYYY-MM-DD（UTC+8） */
function getTodayStr(): string {
  const now = new Date();
  const cst = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  return cst.toISOString().slice(0, 10);
}

/** 获取本月字符串 YYYY-MM */
function getMonthStr(): string {
  return getTodayStr().slice(0, 7);
}

/**
 * 检查用户是否超出调用限制，若未超出则记录本次调用
 * 超出则抛出 TRPCError FORBIDDEN
 */
export async function checkAndRecordUsage(userId: number, feature: FeatureType): Promise<void> {
  const db = await getDb();
  if (!db) {
    // 数据库不可用时放行（避免影响正常使用）
    console.warn("[UsageLimit] Database unavailable, skipping limit check");
    return;
  }

  // 1. 获取用户会员信息
  const userRows = await db
    .select({
      memberType: users.memberType,
      isPaid: users.isPaid,
      paidExpireAt: users.paidExpireAt,
      customDailyLimit: users.customDailyLimit,
      customMonthlyLimit: users.customMonthlyLimit,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!userRows.length) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "用户不存在" });
  }

  const user = userRows[0];

  // 2. 检查会员是否过期（lifetime 不过期）
  let effectiveMemberType: MemberType = user.memberType;
  if (
    effectiveMemberType !== "free" &&
    effectiveMemberType !== "lifetime" &&
    user.paidExpireAt &&
    new Date() > user.paidExpireAt
  ) {
    effectiveMemberType = "free";
    // 异步更新数据库（不阻塞响应）
    db.update(users)
      .set({ memberType: "free", isPaid: false })
      .where(eq(users.id, userId))
      .catch(console.error);
  }

  // 3. 确定有效配额
  const defaultQuota = DEFAULT_QUOTAS[effectiveMemberType];
  const dailyLimit =
    user.customDailyLimit !== null && user.customDailyLimit !== undefined
      ? user.customDailyLimit
      : defaultQuota.daily;
  const monthlyLimit =
    user.customMonthlyLimit !== null && user.customMonthlyLimit !== undefined
      ? user.customMonthlyLimit
      : defaultQuota.monthly;

  // free 用户直接拒绝
  if (dailyLimit === 0 && effectiveMemberType === "free") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "USAGE_LIMIT_FREE",
    });
  }

  const today = getTodayStr();
  const month = getMonthStr();

  // 4. 查询今日调用次数（所有功能合计）
  const todayRows = await db
    .select({ total: sql<number>`COALESCE(SUM(dailyCount), 0)` })
    .from(apiUsageLogs)
    .where(
      and(
        eq(apiUsageLogs.userId, userId),
        sql`DATE_FORMAT(${apiUsageLogs.usageDate}, '%Y-%m-%d') = ${today}`
      )
    );

  const todayTotal = Number(todayRows[0]?.total ?? 0);
  if (todayTotal >= dailyLimit) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `USAGE_LIMIT_DAILY:${dailyLimit}`,
    });
  }

  // 5. 查询本月调用次数（所有功能合计）
  const monthRows = await db
    .select({ total: sql<number>`COALESCE(SUM(dailyCount), 0)` })
    .from(apiUsageLogs)
    .where(
      and(
        eq(apiUsageLogs.userId, userId),
        sql`DATE_FORMAT(${apiUsageLogs.usageDate}, '%Y-%m') = ${month}`
      )
    );

  const monthTotal = Number(monthRows[0]?.total ?? 0);
  if (monthTotal >= monthlyLimit) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `USAGE_LIMIT_MONTHLY:${monthlyLimit}`,
    });
  }

  // 6. 记录本次调用（upsert）
  const existingRows = await db
    .select({ id: apiUsageLogs.id, dailyCount: apiUsageLogs.dailyCount })
    .from(apiUsageLogs)
    .where(
      and(
        eq(apiUsageLogs.userId, userId),
        sql`DATE_FORMAT(${apiUsageLogs.usageDate}, '%Y-%m-%d') = ${today}`,
        eq(apiUsageLogs.feature, feature)
      )
    )
    .limit(1);

  if (existingRows.length > 0) {
    await db
      .update(apiUsageLogs)
      .set({ dailyCount: (existingRows[0].dailyCount ?? 0) + 1 })
      .where(eq(apiUsageLogs.id, existingRows[0].id));
  } else {
    await db.insert(apiUsageLogs).values({
      userId,
      usageDate: today as unknown as Date,
      dailyCount: 1,
      feature,
    });
  }
}

/**
 * 获取用户当前使用情况摘要
 */
export async function getUsageSummary(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const userRows = await db
    .select({
      memberType: users.memberType,
      isPaid: users.isPaid,
      paidExpireAt: users.paidExpireAt,
      customDailyLimit: users.customDailyLimit,
      customMonthlyLimit: users.customMonthlyLimit,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!userRows.length) return null;

  const user = userRows[0];
  let effectiveMemberType: MemberType = user.memberType;
  if (
    effectiveMemberType !== "free" &&
    effectiveMemberType !== "lifetime" &&
    user.paidExpireAt &&
    new Date() > user.paidExpireAt
  ) {
    effectiveMemberType = "free";
  }

  const defaultQuota = DEFAULT_QUOTAS[effectiveMemberType];
  const dailyLimit = user.customDailyLimit ?? defaultQuota.daily;
  const monthlyLimit = user.customMonthlyLimit ?? defaultQuota.monthly;

  const today = getTodayStr();
  const month = getMonthStr();

  const todayRows = await db
    .select({ total: sql<number>`COALESCE(SUM(dailyCount), 0)` })
    .from(apiUsageLogs)
    .where(
      and(
        eq(apiUsageLogs.userId, userId),
        sql`DATE_FORMAT(${apiUsageLogs.usageDate}, '%Y-%m-%d') = ${today}`
      )
    );

  const monthRows = await db
    .select({ total: sql<number>`COALESCE(SUM(dailyCount), 0)` })
    .from(apiUsageLogs)
    .where(
      and(
        eq(apiUsageLogs.userId, userId),
        sql`DATE_FORMAT(${apiUsageLogs.usageDate}, '%Y-%m') = ${month}`
      )
    );

  return {
    memberType: effectiveMemberType,
    dailyUsed: Number(todayRows[0]?.total ?? 0),
    dailyLimit,
    monthlyUsed: Number(monthRows[0]?.total ?? 0),
    monthlyLimit,
  };
}
