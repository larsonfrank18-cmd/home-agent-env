/**
 * 私信话术生成器 vitest 测试
 * 覆盖：场景验证 / 风格选择 / 权限控制 / 双模型切换 / 知识库联动
 */

import { describe, expect, it, vi } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";

// Mock invokeLLM
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
            "### 话术1：适合首次询价的客户\n亲～感谢关注！我们家全屋定制价格因户型和材质不同，建议您先来店里量个尺，我们会给您出一份详细的报价单，完全免费哦！\n💡 使用提示：客户第一次问价时使用\n\n### 话术2：适合价格敏感型客户\n您好！价格这个问题问得很好，我们家的全屋定制从1500元/平米起，具体要看您家的实际情况。现在量尺是免费的，来了我们帮您算一笔账，看看怎么做最划算～\n💡 使用提示：客户强调预算有限时使用\n\n### 话术3：适合高意向客户\n您好！我们现在有一个活动，本月量尺免费，签单还送全屋灯具。您方便哪天过来看看？我帮您预约一位专属设计师，一对一为您规划空间方案！\n💡 使用提示：客户表现出较强购买意向时使用",
        },
        finish_reason: "stop",
      },
    ],
  }),
}));

// Mock invokeDeepSeek
vi.mock("../_core/deepseek", () => ({
  invokeDeepSeek: vi.fn().mockResolvedValue({
    choices: [
      {
        message: {
          content:
            "### 话术1：直接回应价格\nDeepSeek测试话术1\n💡 使用提示：测试场景1\n\n### 话术2：引导到店\nDeepSeek测试话术2\n💡 使用提示：测试场景2\n\n### 话术3：制造紧迫感\nDeepSeek测试话术3\n💡 使用提示：测试场景3",
        },
      },
    ],
  }),
  isDeepSeekConfigured: vi.fn().mockReturnValue(true),
}));

// Mock 知识库
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

// ─── 测试上下文工厂 ──────────────────────────────────────────────
function createCtx(overrides: Partial<TrpcContext> = {}): TrpcContext {
  return {
    req: {} as any,
    res: {} as any,
    user: null,
    ...overrides,
  };
}

function createPaidUserCtx(): TrpcContext {
  return createCtx({
    user: {
      id: 1,
      openId: "test-open-id",
      name: "测试用户",
      email: "test@example.com",
      phone: null,
      role: "user",
      isPaid: true,
      paidExpireAt: null,
      note: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
}

function createAdminCtx(): TrpcContext {
  return createCtx({
    user: {
      id: 99,
      openId: "admin-open-id",
      name: "管理员",
      email: "admin@example.com",
      phone: null,
      role: "admin",
      isPaid: false,
      paidExpireAt: null,
      note: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
}

function createUnpaidUserCtx(): TrpcContext {
  return createCtx({
    user: {
      id: 2,
      openId: "unpaid-open-id",
      name: "未付费用户",
      email: "unpaid@example.com",
      phone: null,
      role: "user",
      isPaid: false,
      paidExpireAt: null,
      note: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
}

function createExpiredUserCtx(): TrpcContext {
  return createCtx({
    user: {
      id: 3,
      openId: "expired-open-id",
      name: "过期用户",
      email: "expired@example.com",
      phone: null,
      role: "user",
      isPaid: true,
      paidExpireAt: new Date("2020-01-01"), // 已过期
      note: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
}

// ─── 测试套件 ────────────────────────────────────────────────────
describe("dmAssistant router", () => {
  // ─── 公开接口测试 ──────────────────────────────────────────────
  it("getScenes returns 8 scene options", async () => {
    const caller = appRouter.createCaller(createCtx());
    const scenes = await caller.dmAssistant.getScenes();
    expect(scenes).toHaveLength(8);
    const values = scenes.map((s) => s.value);
    expect(values).toContain("价格询问");
    expect(values).toContain("比较竞品");
    expect(values).toContain("犹豫观望");
    expect(values).toContain("质量疑虑");
    expect(values).toContain("售后担忧");
    expect(values).toContain("地址到店");
    expect(values).toContain("催促紧迫");
    expect(values).toContain("自定义场景");
  });

  it("getStyles returns 3 style options", async () => {
    const caller = appRouter.createCaller(createCtx());
    const styles = await caller.dmAssistant.getStyles();
    expect(styles).toHaveLength(3);
    const values = styles.map((s) => s.value);
    expect(values).toContain("亲切朋友式");
    expect(values).toContain("专业顾问式");
    expect(values).toContain("简洁高效式");
  });

  // ─── 权限控制测试 ──────────────────────────────────────────────
  it("generateDMScript rejects unauthenticated users", async () => {
    const caller = appRouter.createCaller(createCtx());
    await expect(
      caller.dmAssistant.generateDMScript({ scene: "价格询问" })
    ).rejects.toThrow();
  });

  it("generateDMScript rejects unpaid users", async () => {
    const caller = appRouter.createCaller(createUnpaidUserCtx());
    await expect(
      caller.dmAssistant.generateDMScript({ scene: "价格询问" })
    ).rejects.toThrow();
  });

  it("generateDMScript rejects expired users", async () => {
    const caller = appRouter.createCaller(createExpiredUserCtx());
    await expect(
      caller.dmAssistant.generateDMScript({ scene: "价格询问" })
    ).rejects.toThrow();
  });

  it("generateDMScript allows admin users regardless of isPaid", async () => {
    const caller = appRouter.createCaller(createAdminCtx());
    const result = await caller.dmAssistant.generateDMScript({ scene: "价格询问" });
    expect(result.scripts).toBeTruthy();
  });

  // ─── 核心功能测试 ──────────────────────────────────────────────
  it("generateDMScript returns scripts and metadata for paid user", async () => {
    const caller = appRouter.createCaller(createPaidUserCtx());
    const result = await caller.dmAssistant.generateDMScript({
      scene: "价格询问",
      style: "亲切朋友式",
    });
    expect(result.scripts).toBeTruthy();
    expect(result.scene).toBe("价格询问");
    expect(result.style).toBe("亲切朋友式");
    expect(result.modelUsed).toBe("manus");
  });

  it("generateDMScript with all optional fields works correctly", async () => {
    const caller = appRouter.createCaller(createPaidUserCtx());
    const result = await caller.dmAssistant.generateDMScript({
      scene: "比较竞品",
      style: "专业顾问式",
      industry: "全屋定制",
      sellingPoints: "进口五金、10年质保",
      currentPromotion: "本月量尺免费",
      location: "上海浦东XX建材城",
    });
    expect(result.scripts).toBeTruthy();
    expect(result.scene).toBe("比较竞品");
  });

  it("generateDMScript custom scene requires customMessage content", async () => {
    const caller = appRouter.createCaller(createPaidUserCtx());
    const result = await caller.dmAssistant.generateDMScript({
      scene: "自定义场景",
      customMessage: "你好，你们家全屋定制多少钱？我家120平，预算10万",
    });
    expect(result.scripts).toBeTruthy();
  });

  // ─── 双模型切换测试 ────────────────────────────────────────────
  it("generateDMScript with manus model returns modelUsed=manus", async () => {
    const caller = appRouter.createCaller(createPaidUserCtx());
    const result = await caller.dmAssistant.generateDMScript({
      scene: "犹豫观望",
      model: "manus",
    });
    expect(result.modelUsed).toBe("manus");
  });

  it("generateDMScript with deepseek model returns modelUsed=deepseek", async () => {
    const caller = appRouter.createCaller(createPaidUserCtx());
    const result = await caller.dmAssistant.generateDMScript({
      scene: "质量疑虑",
      model: "deepseek",
    });
    expect(result.scripts).toBeTruthy();
    expect(result.modelUsed).toBe("deepseek");
  });

  it("generateDMScript defaults to manus model when model param omitted", async () => {
    const caller = appRouter.createCaller(createPaidUserCtx());
    const result = await caller.dmAssistant.generateDMScript({
      scene: "售后担忧",
    });
    expect(result.modelUsed).toBe("manus");
  });

  // ─── 各场景覆盖测试 ────────────────────────────────────────────
  it.each([
    "价格询问",
    "比较竞品",
    "犹豫观望",
    "质量疑虑",
    "售后担忧",
    "地址到店",
    "催促紧迫",
  ] as const)("generateDMScript works for scene: %s", async (scene) => {
    const caller = appRouter.createCaller(createPaidUserCtx());
    const result = await caller.dmAssistant.generateDMScript({ scene });
    expect(result.scripts).toBeTruthy();
    expect(result.scene).toBe(scene);
  });
});
