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

/** 获取今日 Date 对象（UTC+8 的午夜） */
function getTodayDate(): Date {
  const todayStr = getTodayStr();
  return new Date(todayStr + 'T00:00:00Z');
}

/** 获取下一天 Date 对象 */
function getTomorrowDate(): Date {
  const todayDate = getTodayDate();
  return new Date(todayDate.getTime() + 24 * 60 * 60 * 1000);
}

/** 获取本月开始日期 Date 对象 */
function getMonthStartDate(): Date {
  const monthStr = getMonthStr();
  return new Date(monthStr + '-01T00:00:00Z');
}

/** 获取下个月开始日期 Date 对象 */
function getNextMonthStartDate(): Date {
  const today = getTodayDate();
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  return nextMonth;
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
      const today = getTodayStr();
      const month = getMonthStr();

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
      const todayDate = getTodayDate();
      const tomorrowDate = getTomorrowDate();
      const todayUsage = await db
        .select({
          userId: apiUsageLogs.userId,
          total: sql<number>`COALESCE(SUM(dailyCount), 0)`,
        })
        .from(apiUsageLogs)
        .where(
          and(
            sql`${apiUsageLogs.usageDate} >= ${todayDate}`,
            sql`${apiUsageLogs.usageDate} < ${tomorrowDate}`
          )
        )
        .groupBy(apiUsageLogs.userId);

      // 查询本月使用量
      const monthStart = getMonthStartDate();
      const monthEnd = getNextMonthStartDate();
      const monthUsage = await db
        .select({
          userId: apiUsageLogs.userId,
          total: sql<number>`COALESCE(SUM(dailyCount), 0)`,
        })
        .from(apiUsageLogs)
        .where(
          and(
            sql`${apiUsageLogs.usageDate} >= ${monthStart}`,
            sql`${apiUsageLogs.usageDate} < ${monthEnd}`
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
        return {
          ...u,
          effectiveMemberType: effectiveMember,
          dailyUsed: todayMap.get(u.id) ?? 0,
          monthlyUsed: monthMap.get(u.id) ?? 0,
          effectiveDailyLimit: u.customDailyLimit ?? defaultQuota.daily,
          effectiveMonthlyLimit: u.customMonthlyLimit ?? defaultQuota.monthly,
        };
      });

      return { users: result, total, page, pageSize };
    }),

  /**
   * 获取单个用户详情（含使用历史）
   */
  getUserDetail: adminProcedure
    .input(z.object({ userId: z.number().int() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "数据库不可用" });

      const userRows = await db
        .select()
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);

      if (!userRows.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "用户不存在" });
      }

      // 最近30天使用记录
      const usageLogs = await db
        .select()
        .from(apiUsageLogs)
        .where(
          and(
            eq(apiUsageLogs.userId, input.userId),
            sql`${apiUsageLogs.usageDate} >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`
          )
        )
        .orderBy(desc(apiUsageLogs.usageDate));

      return { user: userRows[0], usageLogs };
    }),

  /**
   * 开通/修改会员等级
   */
  setMembership: adminProcedure
    .input(
      z.object({
        userId: z.number().int(),
        memberType: z.enum(["free", "quarterly", "annual", "lifetime"]),
        /** 到期时间（lifetime 传 null） */
        expireAt: z.string().nullable().optional(),
        adminNote: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "数据库不可用" });

      const { userId, memberType, expireAt, adminNote } = input;

      let paidExpireAt: Date | null = null;
      if (memberType === "lifetime") {
        paidExpireAt = null;
      } else if (memberType === "free") {
        paidExpireAt = null;
      } else if (expireAt) {
        paidExpireAt = new Date(expireAt);
      } else {
        // 自动计算到期时间
        const now = new Date();
        if (memberType === "quarterly") {
          paidExpireAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
        } else if (memberType === "annual") {
          paidExpireAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
        }
      }

      await db
        .update(users)
        .set({
          memberType,
          isPaid: memberType !== "free",
          paidAt: memberType !== "free" ? new Date() : undefined,
          paidExpireAt,
          adminNote: adminNote ?? undefined,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      return { success: true, memberType, paidExpireAt };
    }),

  /**
   * 自定义用户调用配额
   * 传 null 表示恢复默认值
   */
  setUserQuota: adminProcedure
    .input(
      z.object({
        userId: z.number().int(),
        customDailyLimit: z.number().int().min(0).nullable(),
        customMonthlyLimit: z.number().int().min(0).nullable(),
        adminNote: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "数据库不可用" });

      const { userId, customDailyLimit, customMonthlyLimit, adminNote } = input;

      await db
        .update(users)
        .set({
          customDailyLimit,
          customMonthlyLimit,
          adminNote: adminNote ?? undefined,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      return { success: true };
    }),

  /**
   * 获取使用统计概览（管理员仪表盘）
   */
  getStats: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "数据库不可用" });

    const today = getTodayStr();
    const month = getMonthStr();
    const todayDate = getTodayDate();
    const tomorrowDate = getTomorrowDate();
    const monthStart = getMonthStartDate();
    const monthEnd = getNextMonthStartDate();

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
    const todayCallsResult = await db
      .select({ total: sql<number>`COALESCE(SUM(dailyCount), 0)` })
      .from(apiUsageLogs)
      .where(
        and(
          sql`${apiUsageLogs.usageDate} >= ${todayDate}`,
          sql`${apiUsageLogs.usageDate} < ${tomorrowDate}`
        )
      );

    // 本月总调用次数
    const monthCallsResult = await db
      .select({ total: sql<number>`COALESCE(SUM(dailyCount), 0)` })
      .from(apiUsageLogs)
      .where(
        and(
          sql`${apiUsageLogs.usageDate} >= ${monthStart}`,
          sql`${apiUsageLogs.usageDate} < ${monthEnd}`
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
          sql`${apiUsageLogs.usageDate} >= ${monthStart}`,
          sql`${apiUsageLogs.usageDate} < ${monthEnd}`
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
        count: Number(r.total),
      })),
    };
  }),

  /**
   * 获取当前用户的使用情况（给前端展示）
   */
  getMyUsage: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;

    const today = getTodayStr();
    const month = getMonthStr();
    const todayDate = getTodayDate();
    const tomorrowDate = getTomorrowDate();
    const monthStart = getMonthStartDate();
    const monthEnd = getNextMonthStartDate();

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

    const todayRows = await db
      .select({ total: sql<number>`COALESCE(SUM(dailyCount), 0)` })
      .from(apiUsageLogs)
      .where(
        and(
          eq(apiUsageLogs.userId, ctx.user.id),
          sql`${apiUsageLogs.usageDate} >= ${todayDate}`,
          sql`${apiUsageLogs.usageDate} < ${tomorrowDate}`
        )
      );

    const monthRows = await db
      .select({ total: sql<number>`COALESCE(SUM(dailyCount), 0)` })
      .from(apiUsageLogs)
      .where(
        and(
          eq(apiUsageLogs.userId, ctx.user.id),
          sql`${apiUsageLogs.usageDate} >= ${monthStart}`,
          sql`${apiUsageLogs.usageDate} < ${monthEnd}`
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
