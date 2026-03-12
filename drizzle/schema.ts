import {
  boolean,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  date,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extended with: phone, passwordHash, isPaid, paidAt, paidExpireAt,
 *                memberType, customDailyLimit, customMonthlyLimit
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId). For email/phone login users, we generate a synthetic openId. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  /** 手机号（可选，用于手机号登录） */
  phone: varchar("phone", { length: 20 }),
  /** 密码哈希（bcrypt），邮箱/手机号注册时使用 */
  passwordHash: varchar("passwordHash", { length: 255 }),
  /** 明文密码（仅管理员可见，用于帮助用户找回密码） */
  passwordPlain: varchar("passwordPlain", { length: 255 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  /** 是否已付费开通 */
  isPaid: boolean("isPaid").default(false).notNull(),
  /** 付费开通时间 */
  paidAt: timestamp("paidAt"),
  /** 付费到期时间（null 表示永久） */
  paidExpireAt: timestamp("paidExpireAt"),
  /**
   * 会员等级：
   * - free: 免费用户（未付费）
   * - quarterly: 季度会员（799元，90天）
   * - annual: 年度会员（2699元，365天）
   * - lifetime: 永久会员（6699元，无限期）
   */
  memberType: mysqlEnum("memberType", ["free", "quarterly", "annual", "lifetime"])
    .default("free")
    .notNull(),
  /**
   * 管理员自定义每日调用上限（null = 使用系统默认值）
   * 系统默认：free=0, quarterly=50, annual=65, lifetime=80
   */
  customDailyLimit: int("customDailyLimit"),
  /**
   * 管理员自定义每月调用上限（null = 使用系统默认值）
   * 系统默认：free=0, quarterly=500, annual=650, lifetime=800
   */
  customMonthlyLimit: int("customMonthlyLimit"),
  /** 管理员备注 */
  adminNote: text("adminNote"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * API调用次数记录表
 * 记录每个用户每天的调用次数，用于限流
 */
export const apiUsageLogs = mysqlTable("api_usage_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  /** 调用日期（YYYY-MM-DD），用于按天统计 */
  usageDate: date("usageDate").notNull(),
  /** 当天调用次数 */
  dailyCount: int("dailyCount").default(0).notNull(),
  /** 功能模块：copywriter=文案生成, dm=私信话术, disc=人格分析 */
  feature: mysqlEnum("feature", ["copywriter", "dm", "disc"]).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ApiUsageLog = typeof apiUsageLogs.$inferSelect;
export type InsertApiUsageLog = typeof apiUsageLogs.$inferInsert;

/**
 * 方法论知识库表
 * 管理员可随时追加新方法/案例/经验，AI生成文案时自动检索相关条目
 * 知识库只增不替换，与底座方法论（薛辉2.8）并行使用
 */
export const knowledgeEntries = mysqlTable("knowledge_entries", {
  id: int("id").autoincrement().primaryKey(),
  /** 条目标题，便于管理和检索 */
  title: varchar("title", { length: 200 }).notNull(),
  /** 知识内容（方法/案例/经验/话术等） */
  content: text("content").notNull(),
  /**
   * 分类：
   * - method: 方法论/技巧
   * - case: 真实案例（含数据）
   * - script: 话术模板
   * - insight: 行业洞察/趋势
   * - other: 其他
   */
  category: mysqlEnum("category", ["method", "case", "script", "insight", "other"])
    .default("method")
    .notNull(),
  /**
   * 适用品类标签（逗号分隔，如 "全屋定制,系统门窗"）
   * 空值表示通用，适用所有品类
   */
  tags: varchar("tags", { length: 500 }),
  /** 是否启用（禁用后不参与文案生成） */
  isActive: boolean("isActive").default(true).notNull(),
  /** 创建者（管理员ID） */
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type KnowledgeEntry = typeof knowledgeEntries.$inferSelect;
export type InsertKnowledgeEntry = typeof knowledgeEntries.$inferInsert;

/**
 * 生成历史记录表
 * 记录用户生成的文案、私信话术、DISC分析结果
 */
export const generationHistory = mysqlTable("generation_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  /** 功能类型：copywriter=文案生成, dm=私信话术, disc=DISC分析 */
  type: mysqlEnum("type", ["copywriter", "dm", "disc"]).notNull(),
  /** 输入参数（JSON格式） */
  inputParams: text("inputParams").notNull(),
  /** 生成结果（JSON格式） */
  result: text("result").notNull(),
  /** 使用的模型 */
  model: varchar("model", { length: 50 }),
  /** 生成耗时（毫秒） */
  duration: int("duration"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GenerationHistory = typeof generationHistory.$inferSelect;
export type InsertGenerationHistory = typeof generationHistory.$inferInsert;

/**
 * 行业趋势数据表
 * 缓存从外部API获取的热点数据
 */
export const trendData = mysqlTable("trend_data", {
  id: int("id").autoincrement().primaryKey(),
  /** 搜索关键词 */
  keyword: varchar("keyword", { length: 200 }).notNull(),
  /** 平台：douyin=抖音, xiaohongshu=小红书, videonumber=视频号, kuaishou=快手, youtube=YouTube */
  platform: varchar("platform", { length: 50 }).notNull(),
  /** 趋势数据（JSON格式） */
  data: text("data").notNull(),
  /** 数据来源URL */
  sourceUrl: varchar("sourceUrl", { length: 500 }),
  /** 缓存有效期 */
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TrendData = typeof trendData.$inferSelect;
export type InsertTrendData = typeof trendData.$inferInsert;
