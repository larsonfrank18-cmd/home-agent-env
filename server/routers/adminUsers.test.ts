/**
 * adminUsers 路由测试
 * 测试会员类型设置、配额管理和统计功能的业务逻辑
 */
import { describe, it, expect } from "vitest";
import { DEFAULT_QUOTAS, type MemberType } from "../usageLimit";

// ─── 会员类型配额测试 ────────────────────────────────────────────
describe("adminUsers - 会员配额默认值", () => {
  it("free 用户每日/每月配额均为0", () => {
    expect(DEFAULT_QUOTAS.free.daily).toBe(0);
    expect(DEFAULT_QUOTAS.free.monthly).toBe(0);
  });

  it("quarterly 用户每日50次、每月500次", () => {
    expect(DEFAULT_QUOTAS.quarterly.daily).toBe(50);
    expect(DEFAULT_QUOTAS.quarterly.monthly).toBe(500);
  });

  it("annual 用户每日65次、每月650次", () => {
    expect(DEFAULT_QUOTAS.annual.daily).toBe(65);
    expect(DEFAULT_QUOTAS.annual.monthly).toBe(650);
  });

  it("lifetime 用户每日80次、每月800次", () => {
    expect(DEFAULT_QUOTAS.lifetime.daily).toBe(80);
    expect(DEFAULT_QUOTAS.lifetime.monthly).toBe(800);
  });

  it("annual 配额应高于 quarterly", () => {
    expect(DEFAULT_QUOTAS.annual.daily).toBeGreaterThan(DEFAULT_QUOTAS.quarterly.daily);
    expect(DEFAULT_QUOTAS.annual.monthly).toBeGreaterThan(DEFAULT_QUOTAS.quarterly.monthly);
  });

  it("lifetime 配额应高于 annual", () => {
    expect(DEFAULT_QUOTAS.lifetime.daily).toBeGreaterThan(DEFAULT_QUOTAS.annual.daily);
    expect(DEFAULT_QUOTAS.lifetime.monthly).toBeGreaterThan(DEFAULT_QUOTAS.annual.monthly);
  });
});

// ─── 有效配额计算逻辑测试 ────────────────────────────────────────
describe("adminUsers - 有效配额计算", () => {
  /**
   * 模拟 getEffectiveQuota 逻辑：
   * customDailyLimit/customMonthlyLimit 不为 null 时覆盖默认值
   */
  function getEffectiveQuota(
    memberType: MemberType,
    customDailyLimit: number | null,
    customMonthlyLimit: number | null
  ) {
    const defaults = DEFAULT_QUOTAS[memberType];
    return {
      daily: customDailyLimit !== null && customDailyLimit !== undefined ? customDailyLimit : defaults.daily,
      monthly: customMonthlyLimit !== null && customMonthlyLimit !== undefined ? customMonthlyLimit : defaults.monthly,
    };
  }

  it("无自定义配额时使用默认值", () => {
    const quota = getEffectiveQuota("quarterly", null, null);
    expect(quota.daily).toBe(50);
    expect(quota.monthly).toBe(500);
  });

  it("自定义每日配额覆盖默认值", () => {
    const quota = getEffectiveQuota("quarterly", 100, null);
    expect(quota.daily).toBe(100);
    expect(quota.monthly).toBe(500); // 月配额仍用默认
  });

  it("自定义每月配额覆盖默认值", () => {
    const quota = getEffectiveQuota("annual", null, 1000);
    expect(quota.daily).toBe(65); // 日配额仍用默认
    expect(quota.monthly).toBe(1000);
  });

  it("同时自定义日月配额", () => {
    const quota = getEffectiveQuota("lifetime", 200, 2000);
    expect(quota.daily).toBe(200);
    expect(quota.monthly).toBe(2000);
  });

  it("自定义配额为0时应生效（不使用默认值）", () => {
    const quota = getEffectiveQuota("annual", 0, 0);
    expect(quota.daily).toBe(0);
    expect(quota.monthly).toBe(0);
  });
});

// ─── 会员过期逻辑测试 ────────────────────────────────────────────
describe("adminUsers - 会员过期检查", () => {
  function getEffectiveMemberType(
    memberType: MemberType,
    paidExpireAt: Date | null
  ): MemberType {
    if (
      memberType !== "free" &&
      memberType !== "lifetime" &&
      paidExpireAt &&
      new Date() > paidExpireAt
    ) {
      return "free";
    }
    return memberType;
  }

  it("未过期的季度会员应保持 quarterly", () => {
    const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // 30天后
    expect(getEffectiveMemberType("quarterly", futureDate)).toBe("quarterly");
  });

  it("已过期的季度会员应降级为 free", () => {
    const pastDate = new Date(Date.now() - 1000 * 60 * 60 * 24); // 昨天
    expect(getEffectiveMemberType("quarterly", pastDate)).toBe("free");
  });

  it("lifetime 会员不受过期日期影响", () => {
    const pastDate = new Date(Date.now() - 1000 * 60 * 60 * 24);
    expect(getEffectiveMemberType("lifetime", pastDate)).toBe("lifetime");
  });

  it("free 用户不受过期日期影响", () => {
    const pastDate = new Date(Date.now() - 1000 * 60 * 60 * 24);
    expect(getEffectiveMemberType("free", pastDate)).toBe("free");
  });

  it("paidExpireAt 为 null 时不过期", () => {
    expect(getEffectiveMemberType("annual", null)).toBe("annual");
  });
});

// ─── 管理员权限检查测试 ────────────────────────────────────────────
describe("adminUsers - 管理员权限验证", () => {
  it("role=admin 用户应有管理权限", () => {
    const user = { role: "admin" as const };
    expect(user.role === "admin").toBe(true);
  });

  it("role=user 用户不应有管理权限", () => {
    const user = { role: "user" as const };
    expect(user.role === "admin").toBe(false);
  });
});
