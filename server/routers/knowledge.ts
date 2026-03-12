/**
 * 方法论知识库路由
 * - 管理员：增删改查知识条目
 * - 文案生成：检索相关知识条目（内部调用）
 */

import { z } from "zod";
import { eq, desc, and, like, or } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { knowledgeEntries } from "../../drizzle/schema";

// ─── 分类标签映射 ──────────────────────────────────────────────────

export const CATEGORY_LABELS: Record<string, string> = {
  method: "方法论/技巧",
  case: "真实案例",
  script: "话术模板",
  insight: "行业洞察",
  other: "其他",
};

// ─── 内部工具：检索相关知识条目（供文案生成路由调用） ──────────────

export async function getRelevantKnowledge(
  industry: string,
  topicType: string,
  limit = 5
): Promise<Array<{ title: string; content: string; category: string }>> {
  const db = await getDb();
  if (!db) return [];

  try {
    // 按品类标签检索：匹配行业关键词 或 通用条目（tags为空）
    const rows = await db
      .select({
        title: knowledgeEntries.title,
        content: knowledgeEntries.content,
        category: knowledgeEntries.category,
        tags: knowledgeEntries.tags,
      })
      .from(knowledgeEntries)
      .where(
        and(
          eq(knowledgeEntries.isActive, true),
          or(
            like(knowledgeEntries.tags, `%${industry}%`),
            eq(knowledgeEntries.tags, ""),
            // tags为null的通用条目
            eq(knowledgeEntries.isActive, true)
          )
        )
      )
      .orderBy(desc(knowledgeEntries.createdAt))
      .limit(limit * 3); // 多取一些，再筛选

    // 优先返回有标签匹配的条目，其次是通用条目
    const matched = rows.filter(
      (r) => r.tags && r.tags.includes(industry)
    );
    const generic = rows.filter(
      (r) => !r.tags || r.tags === ""
    );

    const combined = [...matched, ...generic].slice(0, limit);
    return combined.map((r) => ({
      title: r.title,
      content: r.content,
      category: r.category,
    }));
  } catch (e) {
    console.error("[knowledge] getRelevantKnowledge error:", e);
    return [];
  }
}

// ─── 路由 ─────────────────────────────────────────────────────────

export const knowledgeRouter = router({
  /** 获取知识库列表（管理员） */
  list: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        category: z
          .enum(["method", "case", "script", "insight", "other", "all"])
          .default("all"),
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(50).default(20),
      })
    )
    .query(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "仅管理员可访问知识库" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "数据库不可用" });

      const conditions = [];

      if (input.search) {
        conditions.push(
          or(
            like(knowledgeEntries.title, `%${input.search}%`),
            like(knowledgeEntries.content, `%${input.search}%`),
            like(knowledgeEntries.tags, `%${input.search}%`)
          )
        );
      }

      if (input.category !== "all") {
        conditions.push(eq(knowledgeEntries.category, input.category));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const rows = await db
        .select()
        .from(knowledgeEntries)
        .where(whereClause)
        .orderBy(desc(knowledgeEntries.createdAt))
        .limit(input.pageSize)
        .offset((input.page - 1) * input.pageSize);

      // 统计总数
      const allRows = await db
        .select({ id: knowledgeEntries.id })
        .from(knowledgeEntries)
        .where(whereClause);

      return {
        entries: rows,
        total: allRows.length,
        page: input.page,
        pageSize: input.pageSize,
      };
    }),

  /** 新增知识条目（管理员） */
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1, "标题不能为空").max(200),
        content: z.string().min(1, "内容不能为空"),
        category: z.enum(["method", "case", "script", "insight", "other"]).default("method"),
        tags: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "仅管理员可添加知识条目" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "数据库不可用" });

      await db.insert(knowledgeEntries).values({
        title: input.title,
        content: input.content,
        category: input.category,
        tags: input.tags || "",
        isActive: true,
        createdBy: ctx.user.id,
      });

      return { success: true };
    }),

  /** 更新知识条目（管理员） */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        title: z.string().min(1).max(200).optional(),
        content: z.string().min(1).optional(),
        category: z.enum(["method", "case", "script", "insight", "other"]).optional(),
        tags: z.string().max(500).optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "仅管理员可修改知识条目" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "数据库不可用" });

      const { id, ...updates } = input;
      await db
        .update(knowledgeEntries)
        .set(updates)
        .where(eq(knowledgeEntries.id, id));

      return { success: true };
    }),

  /** 删除知识条目（管理员） */
  delete: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "仅管理员可删除知识条目" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "数据库不可用" });

      await db.delete(knowledgeEntries).where(eq(knowledgeEntries.id, input.id));
      return { success: true };
    }),

  /** 获取知识库统计（管理员） */
  stats: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }

    const db = await getDb();
    if (!db) return { total: 0, active: 0, byCategory: {} };

    const all = await db.select().from(knowledgeEntries);
    const active = all.filter((r) => r.isActive).length;
    const byCategory: Record<string, number> = {};
    for (const row of all) {
      byCategory[row.category] = (byCategory[row.category] || 0) + 1;
    }

    return { total: all.length, active, byCategory };
  }),
});
