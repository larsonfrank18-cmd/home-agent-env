/**
 * fileParser 路由测试
 * 测试文件类型检测、权限校验、格式限制等逻辑
 */

import { describe, it, expect } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";

// ─── 测试上下文工厂 ────────────────────────────────────────────────

function makeAdminCtx(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "admin-openid",
      name: "Admin",
      email: "admin@test.com",
      loginMethod: "email",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

function makeUserCtx(): TrpcContext {
  return {
    user: {
      id: 2,
      openId: "user-openid",
      name: "User",
      email: "user@test.com",
      loginMethod: "email",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

// ─── 测试用例 ─────────────────────────────────────────────────────

describe("fileParser.parse", () => {
  it("非管理员调用应返回 FORBIDDEN 错误", async () => {
    const caller = appRouter.createCaller(makeUserCtx());
    await expect(
      caller.fileParser.parse({
        filename: "test.pdf",
        mimeType: "application/pdf",
        data: Buffer.from("test").toString("base64"),
        size: 4,
      })
    ).rejects.toThrow("仅管理员可上传文件");
  });

  it("文件大小超过20MB应返回错误", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const oversizeBytes = 21 * 1024 * 1024; // 21MB
    await expect(
      caller.fileParser.parse({
        filename: "big.pdf",
        mimeType: "application/pdf",
        data: Buffer.from("x").toString("base64"),
        size: oversizeBytes,
      })
    ).rejects.toThrow("文件大小不能超过20MB");
  });

  it("不支持的文件格式应返回错误", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    await expect(
      caller.fileParser.parse({
        filename: "test.exe",
        mimeType: "application/x-msdownload",
        data: Buffer.from("test").toString("base64"),
        size: 4,
      })
    ).rejects.toThrow("不支持的文件格式");
  });

  it("CSV 文件应能直接解析为文本", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const csvContent = "姓名,年龄,城市\n张三,25,北京\n李四,30,上海";
    const base64 = Buffer.from(csvContent, "utf-8").toString("base64");

    const result = await caller.fileParser.parse({
      filename: "data.csv",
      mimeType: "text/csv",
      data: base64,
      size: Buffer.byteLength(csvContent, "utf-8"),
    });

    expect(result.success).toBe(true);
    expect(result.fileType).toBe("csv");
    expect(result.extractedText).toContain("张三");
    expect(result.extractedText).toContain("北京");
    expect(result.charCount).toBeGreaterThan(0);
  });

  it("纯文本文件应能直接解析", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const textContent = "这是一段测试文本\n包含多行内容\n用于验证文本解析功能";
    const base64 = Buffer.from(textContent, "utf-8").toString("base64");

    const result = await caller.fileParser.parse({
      filename: "notes.txt",
      mimeType: "text/plain",
      data: base64,
      size: Buffer.byteLength(textContent, "utf-8"),
    });

    expect(result.success).toBe(true);
    expect(result.fileType).toBe("text");
    expect(result.extractedText).toContain("测试文本");
    expect(result.truncated).toBe(false);
  });

  it("超长文本内容应被截断并标注", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    // 生成超过50000字的内容
    const longContent = "这是一段很长的文本内容。".repeat(5000);
    const base64 = Buffer.from(longContent, "utf-8").toString("base64");

    const result = await caller.fileParser.parse({
      filename: "long.txt",
      mimeType: "text/plain",
      data: base64,
      size: Buffer.byteLength(longContent, "utf-8"),
    });

    expect(result.success).toBe(true);
    expect(result.truncated).toBe(true);
    expect(result.extractedText).toContain("[内容已截断");
    expect(result.charCount).toBeLessThanOrEqual(50100); // 50000 + 截断提示
  });

  it("Markdown 文件应被识别为 text 类型", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const mdContent = "# 爆款文案技巧\n\n## 开头公式\n1. 痛点开头\n2. 数字开头";
    const base64 = Buffer.from(mdContent, "utf-8").toString("base64");

    const result = await caller.fileParser.parse({
      filename: "tips.md",
      mimeType: "text/markdown",
      data: base64,
      size: Buffer.byteLength(mdContent, "utf-8"),
    });

    expect(result.success).toBe(true);
    expect(result.fileType).toBe("text");
    expect(result.extractedText).toContain("爆款文案技巧");
  });
});
