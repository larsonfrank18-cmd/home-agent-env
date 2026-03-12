/**
 * 知识库路由测试
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";

// Mock getDb to avoid real DB calls
vi.mock("../db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
}));

// Mock knowledge module DB calls
vi.mock("./knowledge", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./knowledge")>();
  return {
    ...actual,
    getRelevantKnowledge: vi.fn().mockResolvedValue([]),
  };
});

function makeAdminCtx(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "admin-open-id",
      name: "Admin",
      email: "admin@test.com",
      loginMethod: "email",
      role: "admin",
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
    req: { protocol: "https", headers: {} } as any,
    res: { clearCookie: vi.fn() } as any,
  };
}

function makeUserCtx(isPaid = true): TrpcContext {
  return {
    user: {
      id: 2,
      openId: "user-open-id",
      name: "User",
      email: "user@test.com",
      loginMethod: "email",
      role: "user",
      isPaid,
      paidAt: isPaid ? new Date() : null,
      paidExpireAt: null,
      adminNote: null,
      phone: null,
      passwordHash: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    } as any,
    req: { protocol: "https", headers: {} } as any,
    res: { clearCookie: vi.fn() } as any,
  };
}

describe("knowledge router", () => {
  describe("getTopicTypes (public)", () => {
    it("returns 8 topic types", async () => {
      const ctx = makeAdminCtx();
      const caller = appRouter.createCaller(ctx);
      const types = await caller.copywriter.getTopicTypes();
      expect(types).toHaveLength(8);
      expect(types[0]).toHaveProperty("value");
      expect(types[0]).toHaveProperty("label");
      expect(types[0]).toHaveProperty("description");
    });
  });

  describe("copywriter.generateTopics access control", () => {
    it("throws UNAUTHORIZED when user is not logged in", async () => {
      const ctx: TrpcContext = {
        user: null,
        req: { protocol: "https", headers: {} } as any,
        res: { clearCookie: vi.fn() } as any,
      };
      const caller = appRouter.createCaller(ctx);
      await expect(
        caller.copywriter.generateTopics({
          industry: "全屋定制",
          ipPosition: "全屋定制老板",
          topicType: "头牌选题",
        })
      ).rejects.toThrow();
    });

    it("throws FORBIDDEN when user is not paid", async () => {
      const ctx = makeUserCtx(false);
      const caller = appRouter.createCaller(ctx);
      await expect(
        caller.copywriter.generateTopics({
          industry: "全屋定制",
          ipPosition: "全屋定制老板",
          topicType: "头牌选题",
        })
      ).rejects.toThrow();
    });
  });

  describe("copywriter.generateCopy access control", () => {
    it("throws UNAUTHORIZED when user is not logged in", async () => {
      const ctx: TrpcContext = {
        user: null,
        req: { protocol: "https", headers: {} } as any,
        res: { clearCookie: vi.fn() } as any,
      };
      const caller = appRouter.createCaller(ctx);
      await expect(
        caller.copywriter.generateCopy({
          industry: "全屋定制",
          ipPosition: "全屋定制老板",
          topicType: "头牌选题",
        })
      ).rejects.toThrow();
    });

    it("throws FORBIDDEN when user is not paid", async () => {
      const ctx = makeUserCtx(false);
      const caller = appRouter.createCaller(ctx);
      await expect(
        caller.copywriter.generateCopy({
          industry: "全屋定制",
          ipPosition: "全屋定制老板",
          topicType: "头牌选题",
        })
      ).rejects.toThrow();
    });
  });

  describe("knowledge.stats access control", () => {
    it("throws UNAUTHORIZED when user is not logged in", async () => {
      const ctx: TrpcContext = {
        user: null,
        req: { protocol: "https", headers: {} } as any,
        res: { clearCookie: vi.fn() } as any,
      };
      const caller = appRouter.createCaller(ctx);
      await expect(caller.knowledge.stats()).rejects.toThrow();
    });

    it("throws FORBIDDEN when user is not admin", async () => {
      const ctx = makeUserCtx(true);
      const caller = appRouter.createCaller(ctx);
      await expect(caller.knowledge.stats()).rejects.toThrow();
    });
  });

  describe("knowledge.create access control", () => {
    it("throws FORBIDDEN when user is not admin", async () => {
      const ctx = makeUserCtx(true);
      const caller = appRouter.createCaller(ctx);
      await expect(
        caller.knowledge.create({
          title: "测试条目",
          content: "测试内容",
          category: "method",
        })
      ).rejects.toThrow();
    });
  });
});
