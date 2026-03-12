/**
 * 短信服务测试 - 验证码存储和验证逻辑
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock ENV to use test mode (no real SMS sending)
vi.mock("./_core/env", () => ({
  ENV: {
    smsAppCode: "test",
    smsSignId: "test-sign",
    smsTemplateId: "test-template",
  },
}));

// Import after mock
const { sendSmsCode, verifySmsCode, codeStore, lastSentAt } = await import("./smsService");

describe("smsService", () => {
  beforeEach(() => {
    codeStore.clear();
    lastSentAt.clear();
  });

  describe("sendSmsCode", () => {
    it("should send code successfully in test mode", async () => {
      const result = await sendSmsCode("13800138000");
      expect(result.success).toBe(true);
      expect(result.debugCode).toMatch(/^\d{6}$/);
      expect(codeStore.has("13800138000")).toBe(true);
    });

    it("should store code with 5-minute expiry", async () => {
      const before = Date.now();
      await sendSmsCode("13800138001");
      const entry = codeStore.get("13800138001");
      expect(entry).toBeDefined();
      expect(entry!.expiresAt).toBeGreaterThan(before + 4 * 60 * 1000);
      expect(entry!.expiresAt).toBeLessThanOrEqual(before + 5 * 60 * 1000 + 100);
    });

    it("should enforce 60-second cooldown", async () => {
      await sendSmsCode("13800138002");
      const result2 = await sendSmsCode("13800138002");
      expect(result2.success).toBe(false);
      expect(result2.message).toContain("频繁");
    });

    it("should allow resend after cooldown", async () => {
      await sendSmsCode("13800138003");
      // Manually expire the cooldown
      lastSentAt.set("13800138003", Date.now() - 61000);
      const result2 = await sendSmsCode("13800138003");
      expect(result2.success).toBe(true);
    });
  });

  describe("verifySmsCode", () => {
    it("should verify correct code", async () => {
      const sent = await sendSmsCode("13900139000");
      const result = verifySmsCode("13900139000", sent.debugCode!);
      expect(result.valid).toBe(true);
    });

    it("should reject wrong code", async () => {
      await sendSmsCode("13900139001");
      const result = verifySmsCode("13900139001", "000000");
      expect(result.valid).toBe(false);
      expect(result.message).toContain("错误");
    });

    it("should reject non-existent phone", () => {
      const result = verifySmsCode("13900139999", "123456");
      expect(result.valid).toBe(false);
      expect(result.message).toContain("不存在");
    });

    it("should reject expired code", async () => {
      await sendSmsCode("13900139002");
      // Manually expire the code
      const entry = codeStore.get("13900139002");
      if (entry) entry.expiresAt = Date.now() - 1000;
      const result = verifySmsCode("13900139002", entry!.code);
      expect(result.valid).toBe(false);
      expect(result.message).toContain("过期");
    });

    it("should delete code after successful verification (one-time use)", async () => {
      const sent = await sendSmsCode("13900139003");
      verifySmsCode("13900139003", sent.debugCode!);
      expect(codeStore.has("13900139003")).toBe(false);
    });

    it("should lock out after 5 failed attempts", async () => {
      await sendSmsCode("13900139004");
      for (let i = 0; i < 5; i++) {
        verifySmsCode("13900139004", "000000");
      }
      // After 5 failures, code should be deleted
      const result = verifySmsCode("13900139004", "000000");
      expect(result.valid).toBe(false);
    });
  });
});
