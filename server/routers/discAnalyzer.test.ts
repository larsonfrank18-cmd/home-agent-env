/**
 * discAnalyzer 路由测试
 * 测试 DISC 人格分析接口的权限控制、输入验证和 AI 调用
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { discAnalyzerRouter } from "./discAnalyzer";
import { TRPCError } from "@trpc/server";

// ─── Mock LLM 调用 ───────────────────────────────────────────────
vi.mock("../_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [
      {
        message: {
          content: JSON.stringify({
            discType: "D",
            discTypeLabel: "支配型",
            discTypeDesc: "强势理性，追求效率",
            confidence: 85,
            secondaryType: "C",
            behaviorTypes: ["暴躁型", "率直型"],
            scores: { D: 80, I: 30, S: 20, C: 60 },
            coreNeeds: ["效率", "结果", "数据"],
            breakthrough: "直接给出数据和案例，不废话",
            recommendedStyle: "简洁高效式",
            scriptSuggestions: [
              {
                scenario: "初次接触",
                script: "您好，我们的产品已服务500+家居品牌，平均降本20%，方便看一下具体数据吗？",
                tip: "开门见山，用数据说话",
              },
              {
                scenario: "价格谈判",
                script: "价格方面我直接给您最优方案，批量采购可以享受8折，您这边大概需要多少量？",
                tip: "快速进入实质，避免废话",
              },
              {
                scenario: "促成到店",
                script: "我把详细方案发您，您看完觉得合适，周三下午过来30分钟就能定下来。",
                tip: "给出明确时间节点",
              },
            ],
            taboos: ["不要说'我们质量很好'", "不要过度寒暄", "不要说'您慢慢考虑'"],
            summary: "该客户为典型D型，果断直接，重视效率和结果，建议开门见山，用数据说话。",
          }),
        },
      },
    ],
  }),
}));

vi.mock("../_core/deepseek", () => ({
  invokeDeepSeek: vi.fn().mockResolvedValue({
    choices: [
      {
        message: {
          content: JSON.stringify({
            discType: "I",
            discTypeLabel: "影响型",
            discTypeDesc: "强势感性，热情开朗",
            confidence: 78,
            secondaryType: null,
            behaviorTypes: ["独尊型"],
            scores: { D: 40, I: 85, S: 35, C: 20 },
            coreNeeds: ["被认可", "社交价值", "新鲜感"],
            breakthrough: "先夸赞认可，再分享成功案例",
            recommendedStyle: "亲切朋友式",
            scriptSuggestions: [
              {
                scenario: "初次接触",
                script: "看您朋友圈对家居品质很有要求，我们最近刚出了一款超火的新品，很多设计师都在用！",
                tip: "先认可，再引发好奇",
              },
              {
                scenario: "价格谈判",
                script: "这款是我们今年最受欢迎的，很多客户抢着要，给您留一个名额？",
                tip: "制造稀缺感和被选中感",
              },
              {
                scenario: "促成到店",
                script: "来店里看看，我给您拍几张效果图，发朋友圈超好看！",
                tip: "用社交价值吸引",
              },
            ],
            taboos: ["不要太正式", "不要只讲数据", "不要忽视情感需求"],
            summary: "该客户为I型，热情外向，重视被认可和社交价值，建议用情感共鸣和成功案例打动。",
          }),
        },
      },
    ],
  }),
  isDeepSeekConfigured: vi.fn().mockReturnValue(true),
}));

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

// ─── 辅助函数 ────────────────────────────────────────────────────
function createCaller(user: any) {
  const ctx = {
    user,
    req: {} as any,
    res: {} as any,
  };
  return discAnalyzerRouter.createCaller(ctx);
}

const paidUser = { id: 1, name: "付费用户", role: "user", isPaid: true, paidExpireAt: null };
const adminUser = { id: 2, name: "管理员", role: "admin", isPaid: false, paidExpireAt: null };
const freeUser = { id: 3, name: "免费用户", role: "user", isPaid: false, paidExpireAt: null };
const expiredUser = {
  id: 4,
  name: "过期用户",
  role: "user",
  isPaid: true,
  paidExpireAt: new Date("2020-01-01"),
};

// ─── 测试套件 ────────────────────────────────────────────────────
describe("discAnalyzer.getDiscTypes", () => {
  it("应返回4种DISC类型", async () => {
    const caller = createCaller(null);
    const types = await caller.getDiscTypes();
    expect(types).toHaveLength(4);
    expect(types.map((t) => t.type)).toEqual(["D", "I", "S", "C"]);
  });

  it("每种类型应包含必要字段", async () => {
    const caller = createCaller(null);
    const types = await caller.getDiscTypes();
    for (const t of types) {
      expect(t).toHaveProperty("type");
      expect(t).toHaveProperty("label");
      expect(t).toHaveProperty("color");
      expect(t).toHaveProperty("emoji");
      expect(t).toHaveProperty("keywords");
      expect(t).toHaveProperty("desc");
    }
  });
});

describe("discAnalyzer.analyzePersonality - 权限控制", () => {
  it("未登录用户应抛出 UNAUTHORIZED 错误", async () => {
    const caller = createCaller(null);
    await expect(
      caller.analyzePersonality({ chatContent: "你好，想了解一下价格" })
    ).rejects.toThrow();
  });

  it("免费用户应抛出 FORBIDDEN 错误", async () => {
    const caller = createCaller(freeUser);
    await expect(
      caller.analyzePersonality({ chatContent: "你好，想了解一下价格" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("过期用户应抛出 FORBIDDEN 错误", async () => {
    const caller = createCaller(expiredUser);
    await expect(
      caller.analyzePersonality({ chatContent: "你好，想了解一下价格" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("付费用户应可以正常调用", async () => {
    const caller = createCaller(paidUser);
    const result = await caller.analyzePersonality({
      chatContent: "直接说价格，别废话",
      occupation: "老板",
    });
    expect(result).toHaveProperty("discType");
    expect(result).toHaveProperty("discTypeLabel");
    expect(result).toHaveProperty("confidence");
  });

  it("管理员应可以正常调用", async () => {
    const caller = createCaller(adminUser);
    const result = await caller.analyzePersonality({
      avatarDesc: "正装商务照",
    });
    expect(result).toHaveProperty("discType");
  });
});

describe("discAnalyzer.analyzePersonality - 输入验证", () => {
  it("所有输入为空时应抛出 BAD_REQUEST 错误", async () => {
    const caller = createCaller(paidUser);
    await expect(
      caller.analyzePersonality({})
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("只填写头像描述也应可以分析", async () => {
    const caller = createCaller(paidUser);
    const result = await caller.analyzePersonality({
      avatarDesc: "本人正装照，西装革履",
    });
    expect(result).toHaveProperty("discType");
  });

  it("只填写朋友圈内容也应可以分析", async () => {
    const caller = createCaller(paidUser);
    const result = await caller.analyzePersonality({
      momentContent: "今天又签了一个大单，感谢团队！",
    });
    expect(result).toHaveProperty("discType");
  });

  it("只填写聊天言论也应可以分析", async () => {
    const caller = createCaller(paidUser);
    const result = await caller.analyzePersonality({
      chatContent: "你们家跟XX比怎么样，有没有数据？",
    });
    expect(result).toHaveProperty("discType");
  });

  it("性别字段应接受 男/女/未知", async () => {
    const caller = createCaller(paidUser);
    for (const gender of ["男", "女", "未知"] as const) {
      const result = await caller.analyzePersonality({
        chatContent: "测试",
        gender,
      });
      expect(result).toHaveProperty("discType");
    }
  });
});

describe("discAnalyzer.analyzePersonality - 模型选择", () => {
  it("使用 manus 模型应返回正确结果", async () => {
    const caller = createCaller(paidUser);
    const result = await caller.analyzePersonality({
      chatContent: "直接说价格",
      model: "manus",
    });
    expect(result.modelUsed).toBe("manus");
    expect(result.discType).toBe("D");
  });

  it("使用 deepseek 模型应返回正确结果", async () => {
    const caller = createCaller(paidUser);
    const result = await caller.analyzePersonality({
      chatContent: "太棒了，超级喜欢",
      model: "deepseek",
    });
    expect(result.modelUsed).toBe("deepseek");
    expect(result.discType).toBe("I");
  });
});

describe("discAnalyzer.analyzePersonality - 返回结构验证", () => {
  it("应返回完整的分析结果结构", async () => {
    const caller = createCaller(paidUser);
    const result = await caller.analyzePersonality({
      chatContent: "直接说重点，效率第一",
      occupation: "总经理",
      model: "manus",
    });

    expect(result).toHaveProperty("discType");
    expect(result).toHaveProperty("discTypeLabel");
    expect(result).toHaveProperty("discTypeDesc");
    expect(result).toHaveProperty("confidence");
    expect(result).toHaveProperty("secondaryType");
    expect(result).toHaveProperty("behaviorTypes");
    expect(result).toHaveProperty("scores");
    expect(result).toHaveProperty("coreNeeds");
    expect(result).toHaveProperty("breakthrough");
    expect(result).toHaveProperty("recommendedStyle");
    expect(result).toHaveProperty("scriptSuggestions");
    expect(result).toHaveProperty("taboos");
    expect(result).toHaveProperty("summary");
    expect(result).toHaveProperty("modelUsed");
  });

  it("scores 应包含 D/I/S/C 四个维度", async () => {
    const caller = createCaller(paidUser);
    const result = await caller.analyzePersonality({
      chatContent: "测试",
      model: "manus",
    });
    expect(result.scores).toHaveProperty("D");
    expect(result.scores).toHaveProperty("I");
    expect(result.scores).toHaveProperty("S");
    expect(result.scores).toHaveProperty("C");
  });

  it("scriptSuggestions 应包含 3 条话术", async () => {
    const caller = createCaller(paidUser);
    const result = await caller.analyzePersonality({
      chatContent: "测试",
      model: "manus",
    });
    expect(result.scriptSuggestions).toHaveLength(3);
    for (const s of result.scriptSuggestions) {
      expect(s).toHaveProperty("scenario");
      expect(s).toHaveProperty("script");
      expect(s).toHaveProperty("tip");
    }
  });

  it("taboos 应包含 3 条禁忌", async () => {
    const caller = createCaller(paidUser);
    const result = await caller.analyzePersonality({
      chatContent: "测试",
      model: "manus",
    });
    expect(result.taboos).toHaveLength(3);
  });
});
