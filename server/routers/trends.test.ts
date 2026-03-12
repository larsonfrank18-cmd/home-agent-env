import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";

// Mock dataApi
vi.mock("../_core/dataApi", () => ({
  callDataApi: vi.fn().mockResolvedValue({
    contents: [
      {
        type: "video",
        video: {
          title: "全屋定制装修全攻略",
          videoId: "abc123",
          thumbnails: [{ url: "https://example.com/thumb.jpg" }],
          author: { title: "装修频道" },
          stats: { views: 50000 },
          publishedTimeText: "3天前",
          descriptionSnippet: "全屋定制装修攻略",
        },
      },
      {
        type: "shelf",
        shelf: { title: "相关视频" },
      },
    ],
  }),
}));

// Mock LLM
vi.mock("../_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [
      {
        message: {
          content:
            "## 热点趋势分析\n全屋定制在抖音和小红书上热度持续上升...\n## 爆款标题模式\n1. 《装修必看！全屋定制省钱攻略》",
        },
      },
    ],
  }),
}));

function createPaidUserCtx(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "paid-user",
      email: "user@test.com",
      name: "付费用户",
      loginMethod: "email",
      role: "user",
      isPaid: true,
      paidExpireAt: null,
      phone: null,
      passwordHash: null,
      adminNote: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createFreeUserCtx(): TrpcContext {
  return {
    user: {
      id: 2,
      openId: "free-user",
      email: "free@test.com",
      name: "免费用户",
      loginMethod: "email",
      role: "user",
      isPaid: false,
      paidExpireAt: null,
      phone: null,
      passwordHash: null,
      adminNote: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createAdminCtx(): TrpcContext {
  return {
    user: {
      id: 3,
      openId: "admin-user",
      email: "admin@test.com",
      name: "管理员",
      loginMethod: "email",
      role: "admin",
      isPaid: false,
      paidExpireAt: null,
      phone: null,
      passwordHash: null,
      adminNote: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("trends.search", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("付费用户可以正常搜索热点", async () => {
    const caller = appRouter.createCaller(createPaidUserCtx());
    const result = await caller.trends.search({
      keyword: "全屋定制",
      platforms: ["抖音", "小红书"],
      sortBy: "综合",
    });

    expect(result.keyword).toBe("全屋定制");
    expect(result.platforms).toContain("抖音");
    expect(result.youtubeVideos).toBeDefined();
    expect(Array.isArray(result.youtubeVideos)).toBe(true);
    expect(result.aiAnalysis).toBeTruthy();
    expect(result.searchedAt).toBeTruthy();
  });

  it("管理员可以搜索热点（无需付费）", async () => {
    const caller = appRouter.createCaller(createAdminCtx());
    const result = await caller.trends.search({
      keyword: "系统门窗",
      platforms: ["视频号"],
      sortBy: "播放量",
    });

    expect(result.keyword).toBe("系统门窗");
    expect(result.youtubeVideos).toBeDefined();
  });

  it("免费用户被拒绝访问", async () => {
    const caller = appRouter.createCaller(createFreeUserCtx());
    await expect(
      caller.trends.search({
        keyword: "全屋定制",
        platforms: ["抖音"],
        sortBy: "综合",
      })
    ).rejects.toThrow("请先开通权限后使用热点搜索功能");
  });

  it("正确过滤非视频类型的YouTube结果", async () => {
    const caller = appRouter.createCaller(createPaidUserCtx());
    const result = await caller.trends.search({
      keyword: "全屋定制",
      platforms: ["YouTube"],
      sortBy: "综合",
    });

    // shelf类型应被过滤，只保留video类型
    expect(result.youtubeVideos.every((v) => v.videoId)).toBe(true);
  });

  it("YouTube视频包含正确的URL格式", async () => {
    const caller = appRouter.createCaller(createPaidUserCtx());
    const result = await caller.trends.search({
      keyword: "整体橱柜",
      platforms: ["抖音", "YouTube"],
      sortBy: "综合",
    });

    if (result.youtubeVideos.length > 0) {
      expect(result.youtubeVideos[0].url).toMatch(/^https:\/\/www\.youtube\.com\/watch\?v=/);
    }
  });

  it("关键词不能为空", async () => {
    const caller = appRouter.createCaller(createPaidUserCtx());
    await expect(
      caller.trends.search({
        keyword: "",
        platforms: ["抖音"],
        sortBy: "综合",
      })
    ).rejects.toThrow();
  });

  it("至少选择一个平台", async () => {
    const caller = appRouter.createCaller(createPaidUserCtx());
    await expect(
      caller.trends.search({
        keyword: "全屋定制",
        platforms: [],
        sortBy: "综合",
      })
    ).rejects.toThrow();
  });
});
