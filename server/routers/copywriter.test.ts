/**
 * 文案生成路由测试
 * 测试输入验证、选题类型列表、方法论内容、权限控制
 */

import { describe, expect, it, vi } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";

// Mock invokeLLM to avoid real API calls in tests
vi.mock("../_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    id: "test-id",
    created: Date.now(),
    model: "gemini-2.5-flash",
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content:
            "1. 这个全屋定制竟然只要３万？\n2. 明星同款衣柜到底贵在哪里？\n3. 装修踩坑指南：千万别买这种衣柜\n4. 小户型收纳神器，这个衣柜设计太绝了\n5. 全屋定制vs成品家具，差距有多大？\n6. 我帮你算了一笔账，全屋定制到底值不值\n7. 还记得小时候家里的大木柜吗？\n8. 设计师不会告诉你的全屋定制秘密\n9. 为什么同样的空间，别人家比你好看10倍？\n10. 月薪5000也能拥有的高级感全屋定制",
        },
        finish_reason: "stop",
      },
    ],
  }),
}));

// Mock DeepSeek to avoid real API calls in tests
vi.mock("../_core/deepseek", () => ({
  invokeDeepSeek: vi.fn().mockResolvedValue({
    choices: [
      {
        message: {
          content: "1. DeepSeek测试选题\n2. 测试选题二\n3. 测试选题三",
        },
      },
    ],
  }),
  isDeepSeekConfigured: vi.fn().mockReturnValue(true),
}));

// Mock knowledge module to avoid DB calls
vi.mock("./knowledge", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./knowledge")>();
  return {
    ...actual,
    getRelevantKnowledge: vi.fn().mockResolvedValue([]),
  };
});

// Mock usageLimit to avoid DB calls in tests
vi.mock("../usageLimit", () => ({
  checkAndRecordUsage: vi.fn().mockResolvedValue(undefined),
  getUsageSummary: vi.fn().mockResolvedValue(null),
  DEFAULT_QUOTAS: {
    free:      { daily: 0,  monthly: 0   },
    quarterly: { daily: 50, monthly: 500 },
    annual:    { daily: 65, monthly: 650 },
    lifetime:  { daily: 80, monthly: 800 },
  },
}));

// Mock getDb to avoid real DB calls
vi.mock("../db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
}));

/** 未登录上下文 */
function createGuestCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

/** 已付费普通用户上下文 */
function createPaidUserCtx(): TrpcContext {
  return {
    user: {
      id: 2,
      openId: "paid-user",
      name: "付费用户",
      email: "paid@test.com",
      loginMethod: "email",
      role: "user",
      isPaid: true,
      paidAt: new Date(),
      paidExpireAt: null,
      adminNote: null,
      phone: null,
      passwordHash: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    } as any,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

/** 未付费用户上下文 */
function createUnpaidUserCtx(): TrpcContext {
  return {
    user: {
      id: 3,
      openId: "unpaid-user",
      name: "未付费用户",
      email: "unpaid@test.com",
      loginMethod: "email",
      role: "user",
      isPaid: false,
      paidAt: null,
      paidExpireAt: null,
      adminNote: null,
      phone: null,
      passwordHash: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    } as any,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("copywriter router", () => {
  // ─── 公开接口 ──────────────────────────────────────────────────
  it("getTopicTypes returns 8 topic types (public)", async () => {
    const caller = appRouter.createCaller(createGuestCtx());
    const result = await caller.copywriter.getTopicTypes();
    expect(result).toHaveLength(8);
    expect(result.map((t) => t.value)).toContain("头牌选题");
    expect(result.map((t) => t.value)).toContain("对立选题");
    expect(result.map((t) => t.value)).toContain("最差选题");
    expect(result.map((t) => t.value)).toContain("成本选题");
  });

  it("getTopicTypes includes description for each type", async () => {
    const caller = appRouter.createCaller(createGuestCtx());
    const result = await caller.copywriter.getTopicTypes();
    for (const type of result) {
      expect(type.label).toBeTruthy();
      expect(type.description).toBeTruthy();
      expect(type.description.length).toBeGreaterThan(5);
    }
  });

  // ─── 权限控制 ──────────────────────────────────────────────────
  it("generateTopics throws UNAUTHORIZED for guest", async () => {
    const caller = appRouter.createCaller(createGuestCtx());
    await expect(
      caller.copywriter.generateTopics({
        industry: "全屋定制",
        ipPosition: "测试IP",
        topicType: "对立选题",
      })
    ).rejects.toThrow();
  });

  it("generateTopics throws FORBIDDEN for unpaid user", async () => {
    const caller = appRouter.createCaller(createUnpaidUserCtx());
    await expect(
      caller.copywriter.generateTopics({
        industry: "全屋定制",
        ipPosition: "测试IP",
        topicType: "对立选题",
      })
    ).rejects.toThrow();
  });

  it("generateCopy throws UNAUTHORIZED for guest", async () => {
    const caller = appRouter.createCaller(createGuestCtx());
    await expect(
      caller.copywriter.generateCopy({
        industry: "全屋定制",
        ipPosition: "测试IP",
        topicType: "头牌选题",
      })
    ).rejects.toThrow();
  });

  it("generateCopy throws FORBIDDEN for unpaid user", async () => {
    const caller = appRouter.createCaller(createUnpaidUserCtx());
    await expect(
      caller.copywriter.generateCopy({
        industry: "全屋定制",
        ipPosition: "测试IP",
        topicType: "头牌选题",
      })
    ).rejects.toThrow();
  });

  // ─── 付费用户正常使用 ──────────────────────────────────────────
  it("generateTopics returns topics for paid user", async () => {
    const caller = appRouter.createCaller(createPaidUserCtx());
    const result = await caller.copywriter.generateTopics({
      industry: "全屋定制（整体）",
      ipPosition: "我是做全屋定制的设计师，有8年经验",
      topicType: "对立选题",
    });
    expect(result.topics).toBeTruthy();
    expect(typeof result.topics).toBe("string");
    expect(result).toHaveProperty("knowledgeUsed");
  });

  it("generateTopics validates required fields", async () => {
    const caller = appRouter.createCaller(createPaidUserCtx());
    await expect(
      caller.copywriter.generateTopics({
        industry: "",
        ipPosition: "测试IP",
        topicType: "对立选题",
      })
    ).rejects.toThrow();
  });

  it("generateCopy returns copy for paid user", async () => {
    const caller = appRouter.createCaller(createPaidUserCtx());
    const result = await caller.copywriter.generateCopy({
      industry: "系统门窗（整体）",
      ipPosition: "我是做系统门窗的老板，专注断桥铝门窗10年",
      topicType: "头牌选题",
      selectedTopic: "明星同款门窗到底贵在哪里？",
      extraInfo: "主打进口五金，价格区间2-5万",
    });
    expect(result.copy).toBeTruthy();
    expect(typeof result.copy).toBe("string");
    expect(result).toHaveProperty("knowledgeUsed");
  });

  it("generateCopy works without optional fields for paid user", async () => {
    const caller = appRouter.createCaller(createPaidUserCtx());
    const result = await caller.copywriter.generateCopy({
      industry: "实木地板",
      ipPosition: "我是地板行业从业者",
      topicType: "成本选题",
    });
    expect(result.copy).toBeTruthy();
  });

  it("generateTopics rejects invalid topic type", async () => {
    const caller = appRouter.createCaller(createPaidUserCtx());
    await expect(
      caller.copywriter.generateTopics({
        industry: "全屋定制",
        ipPosition: "测试",
        topicType: "无效选题类型" as never,
      })
    ).rejects.toThrow();
  });

  // ─── 双模型切换测试 ────────────────────────────────────────────
  it("generateTopics with manus model returns result with modelUsed field", async () => {
    const caller = appRouter.createCaller(createPaidUserCtx());
    const result = await caller.copywriter.generateTopics({
      industry: "全屋定制（整体）",
      ipPosition: "测试IP",
      topicType: "对立选题",
      model: "manus",
    });
    expect(result.topics).toBeTruthy();
    expect(result.modelUsed).toBe("manus");
  });

  it("generateTopics with deepseek model returns result with modelUsed field", async () => {
    const caller = appRouter.createCaller(createPaidUserCtx());
    const result = await caller.copywriter.generateTopics({
      industry: "全屋定制（整体）",
      ipPosition: "测试IP",
      topicType: "对立选题",
      model: "deepseek",
    });
    expect(result.topics).toBeTruthy();
    expect(result.modelUsed).toBe("deepseek");
  });

  it("generateCopy with deepseek model returns result with modelUsed field", async () => {
    const caller = appRouter.createCaller(createPaidUserCtx());
    const result = await caller.copywriter.generateCopy({
      industry: "系统门窗（整体）",
      ipPosition: "测试IP",
      topicType: "头牌选题",
      model: "deepseek",
    });
    expect(result.copy).toBeTruthy();
    expect(result.modelUsed).toBe("deepseek");
  });

  it("generateCopy with manus model returns result with modelUsed field", async () => {
    const caller = appRouter.createCaller(createPaidUserCtx());
    const result = await caller.copywriter.generateCopy({
      industry: "系统门窗（整体）",
      ipPosition: "测试IP",
      topicType: "头牌选题",
      model: "manus",
    });
    expect(result.copy).toBeTruthy();
    expect(result.modelUsed).toBe("manus");
  });

  it("generateTopics defaults to manus model when model param omitted", async () => {
    const caller = appRouter.createCaller(createPaidUserCtx());
    const result = await caller.copywriter.generateTopics({
      industry: "全屋定制（整体）",
      ipPosition: "测试IP",
      topicType: "对立选题",
    });
    expect(result.modelUsed).toBe("manus");
  });
});
