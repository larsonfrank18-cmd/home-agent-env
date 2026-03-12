/**
 * 管理员用户管理路由
 * - 查看所有用户列表（含使用统计）
 * - 开通/修改会员等级
 * - 自定义用户配额
 * - 查看用户调用历史
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { users, apiUsageLogs } from "../../drizzle/schema";
import { eq, desc, sql, and } from "drizzle-orm";
import { DEFAULT_QUOTAS, type MemberType } from "../usageLimit";

/** 管理员权限中间件 */
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "仅管理员可操作" });
  }
  return next({ ctx });
});

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

/** 获取下一天的日期字符串 YYYY-MM-DD */
function getTomorrowStr(): string {
  const todayStr = getTodayStr();
  const today = new Date(todayStr + 'T00:00:00Z');
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  return tomorrow.toISOString().slice(0, 10);
}

/** 获取下一个月的日期字符串 YYYY-MM-DD */
function getNextMonthStr(): string {
  const monthStr = getMonthStr();
  const [year, month] = monthStr.split('-').map(Number);
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  return `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;
}

export const adminUsersRouter = router({
  /**
   * 获取用户列表（含今日/本月使用量）
   */
  listUsers: adminProcedure
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(100).default(20),
        search: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "数据库不可用" });

      const { page, pageSize, search } = input;
      const offset = (page - 1) * pageSize;

      // 查询用户列表
      const userList = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          phone: users.phone,
          openId: users.openId,
          role: users.role,
          isPaid: users.isPaid,
          memberType: users.memberType,
          paidAt: users.paidAt,
          paidExpireAt: users.paidExpireAt,
          customDailyLimit: users.customDailyLimit,
          customMonthlyLimit: users.customMonthlyLimit,
          adminNote: users.adminNote,
          createdAt: users.createdAt,
          lastSignedIn: users.lastSignedIn,
          passwordPlain: users.passwordPlain,
        })
        .from(users)
        .orderBy(desc(users.createdAt))
        .limit(pageSize)
        .offset(offset);

      // 查询今日使用量
      const todayStr = getTodayStr();
      const tomorrowStr = getTomorrowStr();
      const todayUsage = await db
        .select({
          userId: apiUsageLogs.userId,
          total: sql<number>`COALESCE(SUM(dailyCount), 0)`,
        })
        .from(apiUsageLogs)
        .where(
          and(
            sql`${apiUsageLogs.usageDate} >= ${todayStr}`,
            sql`${apiUsageLogs.usageDate} < ${tomorrowStr}`
          )
        )
        .groupBy(apiUsageLogs.userId);

      // 查询本月使用量
      const monthStr = getMonthStr();
      const nextMonthStr = getNextMonthStr();
      const monthUsage = await db
        .select({
          userId: apiUsageLogs.userId,
          total: sql<number>`COALESCE(SUM(dailyCount), 0)`,
        })
        .from(apiUsageLogs)
        .where(
          and(
            sql`${apiUsageLogs.usageDate} >= ${monthStr}`,
            sql`${apiUsageLogs.usageDate} < ${nextMonthStr}`
          )
        )
        .groupBy(apiUsageLogs.userId);

      const todayMap = new Map(todayUsage.map((r) => [r.userId, Number(r.total)]));
      const monthMap = new Map(monthUsage.map((r) => [r.userId, Number(r.total)]));

      // 查询总数
      const countResult = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(users);
      const total = Number(countResult[0]?.count ?? 0);

      const result = userList.map((u) => {
        const effectiveMember: MemberType =
          u.memberType !== "free" &&
          u.memberType !== "lifetime" &&
          u.paidExpireAt &&
          new Date() > u.paidExpireAt
            ? "free"
            : u.memberType;

        const defaultQuota = DEFAULT_QUOTAS[effectiveMember];
        const dailyLimit = u.customDailyLimit ?? defaultQuota.daily;
        const monthlyLimit = u.customMonthlyLimit ?? defaultQuota.monthly;

        return {
          id: u.id,
          name: u.name,
          email: u.email,
          phone: u.phone,
          openId: u.openId,
          role: u.role,
          isPaid: u.isPaid,
          memberType: u.memberType,
          effectiveMember,
          paidAt: u.paidAt,
          paidExpireAt: u.paidExpireAt,
          adminNote: u.adminNote,
          createdAt: u.createdAt,
          lastSignedIn: u.lastSignedIn,
          passwordPlain: u.passwordPlain,
          todayUsed: todayMap.get(u.id) ?? 0,
          dailyLimit,
          monthlyUsed: monthMap.get(u.id) ?? 0,
          monthlyLimit,
        };
      });

      return {
        data: result,
        total,
        page,
        pageSize,
      };
    }),

  /**
   * 开通或修改用户会员等级
   */
  setMemberType: adminProcedure
    .input(
      z.object({
        userId: z.number(),
        memberType: z.enum(["free", "quarterly", "annual", "lifetime"]),
        daysValid: z.number().optional(), // 仅对 quarterly/annual 有效，指定有效天数
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "数据库不可用" });

      const { userId, memberType, daysValid } = input;

      let paidAt: Date | null = null;
      let paidExpireAt: Date | null = null;
      let isPaid = false;

      if (memberType !== "free") {
        paidAt = new Date();
        isPaid = true;

        if (memberType === "lifetime") {
          paidExpireAt = null; // 永久
        } else {
          // quarterly 或 annual
          const days = daysValid ?? (memberType === "quarterly" ? 90 : 365);
          paidExpireAt = new Date(paidAt.getTime() + days * 24 * 60 * 60 * 1000);
        }
      }

      await db
        .update(users)
        .set({
          memberType,
          isPaid,
          paidAt,
          paidExpireAt,
        })
        .where(eq(users.id, userId));

      return { success: true };
    }),

  /**
   * 设置用户自定义配额
   */
  setCustomQuota: adminProcedure
    .input(
      z.object({
        userId: z.number(),
        dailyLimit: z.number().int().min(0).optional(),
        monthlyLimit: z.number().int().min(0).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "数据库不可用" });

      const { userId, dailyLimit, monthlyLimit } = input;

      const updateSet: Record<string, any> = {};
      if (dailyLimit !== undefined) updateSet.customDailyLimit = dailyLimit;
      if (monthlyLimit !== undefined) updateSet.customMonthlyLimit = monthlyLimit;

      if (Object.keys(updateSet).length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "至少需要设置一个配额" });
      }

      await db.update(users).set(updateSet).where(eq(users.id, userId));

      return { success: true };
    }),

  /**
   * 获取使用统计概览（管理员仪表盘）
   */
  getStats: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "数据库不可用" });

    // 用户总数
    const totalUsersResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(users);

    // 付费用户数
    const paidUsersResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(users)
      .where(eq(users.isPaid, true));

    // 各会员类型分布
    const memberTypeStats = await db
      .select({
        memberType: users.memberType,
        count: sql<number>`COUNT(*)`,
      })
      .from(users)
      .groupBy(users.memberType);

    // 今日总调用次数
    const todayStr = getTodayStr();
    const tomorrowStr = getTomorrowStr();
    const todayCallsResult = await db
      .select({ total: sql<number>`COALESCE(SUM(dailyCount), 0)` })
      .from(apiUsageLogs)
      .where(
        and(
          sql`${apiUsageLogs.usageDate} >= ${todayStr}`,
          sql`${apiUsageLogs.usageDate} < ${tomorrowStr}`
        )
      );

    // 本月总调用次数
    const monthStr = getMonthStr();
    const nextMonthStr = getNextMonthStr();
    const monthCallsResult = await db
      .select({ total: sql<number>`COALESCE(SUM(dailyCount), 0)` })
      .from(apiUsageLogs)
      .where(
        and(
          sql`${apiUsageLogs.usageDate} >= ${monthStr}`,
          sql`${apiUsageLogs.usageDate} < ${nextMonthStr}`
        )
      );

    // 各功能调用分布（本月）
    const featureStats = await db
      .select({
        feature: apiUsageLogs.feature,
        total: sql<number>`COALESCE(SUM(dailyCount), 0)`,
      })
      .from(apiUsageLogs)
      .where(
        and(
          sql`${apiUsageLogs.usageDate} >= ${monthStr}`,
          sql`${apiUsageLogs.usageDate} < ${nextMonthStr}`
        )
      )
      .groupBy(apiUsageLogs.feature);

    return {
      totalUsers: Number(totalUsersResult[0]?.count ?? 0),
      paidUsers: Number(paidUsersResult[0]?.count ?? 0),
      memberTypeStats: memberTypeStats.map((r) => ({
        type: r.memberType,
        count: Number(r.count),
      })),
      todayCalls: Number(todayCallsResult[0]?.total ?? 0),
      monthCalls: Number(monthCallsResult[0]?.total ?? 0),
      featureStats: featureStats.map((r) => ({
        feature: r.feature,
        total: Number(r.total),
      })),
    };
  }),

  /**
   * 获取当前用户的使用情况（给前端展示）
   */
  getMyUsage: protectedProcedure.query(async ({ ctx }) => {
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
      .where(eq(users.id, ctx.user.id))
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

    const todayStr = getTodayStr();
    const tomorrowStr = getTomorrowStr();
    const monthStr = getMonthStr();
    const nextMonthStr = getNextMonthStr();

    const todayRows = await db
      .select({ total: sql<number>`COALESCE(SUM(dailyCount), 0)` })
      .from(apiUsageLogs)
      .where(
        and(
          eq(apiUsageLogs.userId, ctx.user.id),
          sql`${apiUsageLogs.usageDate} >= ${todayStr}`,
          sql`${apiUsageLogs.usageDate} < ${tomorrowStr}`
        )
      );

    const monthRows = await db
      .select({ total: sql<number>`COALESCE(SUM(dailyCount), 0)` })
      .from(apiUsageLogs)
      .where(
        and(
          eq(apiUsageLogs.userId, ctx.user.id),
          sql`${apiUsageLogs.usageDate} >= ${monthStr}`,
          sql`${apiUsageLogs.usageDate} < ${nextMonthStr}`
        )
      );

    return {
      memberType: effectiveMemberType,
      isPaid: user.isPaid,
      paidExpireAt: user.paidExpireAt,
      dailyUsed: Number(todayRows[0]?.total ?? 0),
      dailyLimit,
      monthlyUsed: Number(monthRows[0]?.total ?? 0),
      monthlyLimit,
    };
  }),
});
