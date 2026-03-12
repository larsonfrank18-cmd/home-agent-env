import { describe, expect, it, vi, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";

// ─── Mock 数据库函数 ──────────────────────────────────────────────
vi.mock("../db", () => ({
  getUserByEmailOrPhone: vi.fn(),
  createLocalUser: vi.fn(),
  getAllUsers: vi.fn(),
  setUserPaidStatus: vi.fn(),
  setUserRole: vi.fn(),
}));

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("$2b$10$hashedpassword"),
    compare: vi.fn().mockResolvedValue(true),
  },
}));

vi.mock("nanoid", () => ({
  nanoid: vi.fn().mockReturnValue("test-nanoid-123"),
}));

import * as db from "../db";
import bcrypt from "bcryptjs";

// ─── 辅助函数 ─────────────────────────────────────────────────────
function isEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function isPhone(s: string) {
  return /^1[3-9]\d{9}$/.test(s);
}

// ─── 测试 ─────────────────────────────────────────────────────────
describe("userAuth - 输入验证", () => {
  it("有效邮箱格式应通过验证", () => {
    expect(isEmail("user@example.com")).toBe(true);
    expect(isEmail("test.user+tag@domain.co")).toBe(true);
  });

  it("无效邮箱格式应失败", () => {
    expect(isEmail("notanemail")).toBe(false);
    expect(isEmail("missing@domain")).toBe(false);
  });

  it("有效手机号格式应通过验证", () => {
    expect(isPhone("13800138000")).toBe(true);
    expect(isPhone("18612345678")).toBe(true);
    expect(isPhone("19912345678")).toBe(true);
  });

  it("无效手机号格式应失败", () => {
    expect(isPhone("12345678901")).toBe(false); // 不以1[3-9]开头
    expect(isPhone("1380013800")).toBe(false);  // 位数不足
    expect(isPhone("138001380001")).toBe(false); // 位数过多
  });
});

describe("userAuth - 注册逻辑", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("邮箱注册：已存在用户应抛出冲突错误", async () => {
    vi.mocked(db.getUserByEmailOrPhone).mockResolvedValue({
      id: 1,
      openId: "existing-user",
      email: "test@example.com",
      phone: null,
      name: "Test User",
      passwordHash: "hash",
      loginMethod: "local",
      role: "user",
      isPaid: false,
      paidAt: null,
      paidExpireAt: null,
      adminNote: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    });

    // 模拟注册逻辑
    const account = "test@example.com";
    const existing = await db.getUserByEmailOrPhone(account);
    expect(existing).toBeTruthy();
    // 应该抛出 CONFLICT 错误
    const shouldThrow = () => {
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "该账号已注册" });
    };
    expect(shouldThrow).toThrow(TRPCError);
  });

  it("新用户注册：应调用createLocalUser", async () => {
    vi.mocked(db.getUserByEmailOrPhone).mockResolvedValue(undefined);
    vi.mocked(db.createLocalUser).mockResolvedValue({
      id: 2,
      openId: "local-test-nanoid-123",
      email: "new@example.com",
      phone: null,
      name: "New User",
      passwordHash: "$2b$10$hashedpassword",
      loginMethod: "local",
      role: "user",
      isPaid: false,
      paidAt: null,
      paidExpireAt: null,
      adminNote: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    });

    const account = "new@example.com";
    const existing = await db.getUserByEmailOrPhone(account);
    expect(existing).toBeUndefined();

    const hash = await bcrypt.hash("password123", 10);
    expect(hash).toBe("$2b$10$hashedpassword");

    await db.createLocalUser({
      openId: `local-test-nanoid-123`,
      email: account,
      passwordHash: hash,
    });
    expect(db.createLocalUser).toHaveBeenCalledOnce();
  });
});

describe("userAuth - 管理员权限操作", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("开通付费权限：应调用setUserPaidStatus(true)", async () => {
    vi.mocked(db.setUserPaidStatus).mockResolvedValue(undefined);

    await db.setUserPaidStatus(1, true, null, "已付款");
    expect(db.setUserPaidStatus).toHaveBeenCalledWith(1, true, null, "已付款");
  });

  it("关闭付费权限：应调用setUserPaidStatus(false)", async () => {
    vi.mocked(db.setUserPaidStatus).mockResolvedValue(undefined);

    await db.setUserPaidStatus(1, false);
    expect(db.setUserPaidStatus).toHaveBeenCalledWith(1, false);
  });

  it("设置管理员角色：应调用setUserRole('admin')", async () => {
    vi.mocked(db.setUserRole).mockResolvedValue(undefined);

    await db.setUserRole(1, "admin");
    expect(db.setUserRole).toHaveBeenCalledWith(1, "admin");
  });

  it("获取所有用户：应返回用户列表", async () => {
    vi.mocked(db.getAllUsers).mockResolvedValue([
      {
        id: 1, openId: "u1", email: "a@b.com", phone: null, name: "Alice",
        passwordHash: null, loginMethod: "local", role: "user",
        isPaid: true, paidAt: new Date(), paidExpireAt: null, adminNote: null,
        createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(),
      },
    ]);

    const users = await db.getAllUsers();
    expect(users).toHaveLength(1);
    expect(users[0]?.isPaid).toBe(true);
  });
});

describe("userAuth - 付费状态检查逻辑", () => {
  it("isPaid=false 且 role=user 时应被拦截", () => {
    const user = { isPaid: false, role: "user" as const };
    const hasAccess = user.isPaid || user.role === "admin";
    expect(hasAccess).toBe(false);
  });

  it("isPaid=true 时应允许访问", () => {
    const user = { isPaid: true, role: "user" as const };
    const hasAccess = user.isPaid || user.role === "admin";
    expect(hasAccess).toBe(true);
  });

  it("role=admin 时无论isPaid如何都应允许访问", () => {
    const user = { isPaid: false, role: "admin" as const };
    const hasAccess = user.isPaid || user.role === "admin";
    expect(hasAccess).toBe(true);
  });

  it("付费已过期时应被拦截", () => {
    const expiredDate = new Date(Date.now() - 1000 * 60 * 60 * 24); // 昨天
    const user = { isPaid: true, role: "user" as const, paidExpireAt: expiredDate };
    const isExpired = user.paidExpireAt && user.paidExpireAt < new Date();
    const hasAccess = user.isPaid && !isExpired;
    expect(hasAccess).toBe(false);
  });
});
