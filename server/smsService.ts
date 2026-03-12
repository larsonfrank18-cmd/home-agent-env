/**
 * 短信验证码服务
 * 使用国阳云（杭州国阳科技）三网106短信，通过阿里云市场APPCode鉴权
 * API: https://gyytz.market.alicloudapi.com/sms/smsSend
 */

import { ENV } from "./_core/env";

// ─── 内存验证码存储 ────────────────────────────────────────────────
// 格式: { phone: { code, expiresAt, attempts } }
// 生产环境建议改用 Redis，但内存存储对单实例已足够

interface CodeEntry {
  code: string;
  expiresAt: number; // Unix timestamp ms
  attempts: number;  // 验证尝试次数（防暴力破解）
}

const codeStore = new Map<string, CodeEntry>();

// 每隔10分钟清理过期条目，防止内存泄漏
setInterval(() => {
  const now = Date.now();
  Array.from(codeStore.entries()).forEach(([phone, entry]) => {
    if (entry.expiresAt < now) {
      codeStore.delete(phone);
    }
  });
}, 10 * 60 * 1000);

// ─── 生成验证码 ────────────────────────────────────────────────────

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ─── 发送频率限制 ──────────────────────────────────────────────────
// 同一手机号1分钟内不可重复发送

const lastSentAt = new Map<string, number>();

function canSend(phone: string): boolean {
  const last = lastSentAt.get(phone);
  if (!last) return true;
  return Date.now() - last > 60 * 1000; // 60秒冷却
}

// ─── 发送短信验证码 ────────────────────────────────────────────────

export interface SendSmsResult {
  success: boolean;
  message: string;
  /** 仅在开发环境下返回，方便调试 */
  debugCode?: string;
}

export async function sendSmsCode(phone: string): Promise<SendSmsResult> {
  // 频率限制检查
  if (!canSend(phone)) {
    return { success: false, message: "发送太频繁，请1分钟后再试" };
  }

  const code = generateCode();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5分钟有效期

  // 开发环境：跳过真实发送，直接存储
  if (!ENV.smsAppCode || ENV.smsAppCode === "test") {
    codeStore.set(phone, { code, expiresAt, attempts: 0 });
    lastSentAt.set(phone, Date.now());
    return {
      success: true,
      message: "验证码已发送（开发模式）",
      debugCode: code,
    };
  }

  // 生产环境：调用国阳云API
  const appCode = ENV.smsAppCode;
  const smsSignId = ENV.smsSignId || "2e65b1bb3d054466b82f0c9d125465e2";
  const templateId = ENV.smsTemplateId || "908e94ccf08b4476ba6c876d13f084ad";

  // param格式: **code**:123456,**minute**:5
  const param = encodeURIComponent(`**code**:${code},**minute**:5`);
  const url = `https://gyytz.market.alicloudapi.com/sms/smsSend?mobile=${phone}&param=${param}&smsSignId=${smsSignId}&templateId=${templateId}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `APPCODE ${appCode}`,
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
    });

    const body = await response.json() as { code: string; msg: string; balance?: string };

    if (response.ok && body.code === "0") {
      // 发送成功，存储验证码
      codeStore.set(phone, { code, expiresAt, attempts: 0 });
      lastSentAt.set(phone, Date.now());
      return { success: true, message: "验证码已发送，请注意查收" };
    } else {
      console.error("[SMS] 发送失败:", body);
      return {
        success: false,
        message: `短信发送失败：${body.msg || "未知错误"}`,
      };
    }
  } catch (err) {
    console.error("[SMS] 请求异常:", err);
    return { success: false, message: "短信服务暂时不可用，请稍后重试" };
  }
}

// ─── 验证验证码 ────────────────────────────────────────────────────

export interface VerifyCodeResult {
  valid: boolean;
  message: string;
}

export function verifySmsCode(phone: string, inputCode: string): VerifyCodeResult {
  const entry = codeStore.get(phone);

  if (!entry) {
    return { valid: false, message: "验证码不存在或已过期，请重新获取" };
  }

  if (Date.now() > entry.expiresAt) {
    codeStore.delete(phone);
    return { valid: false, message: "验证码已过期，请重新获取" };
  }

  if (entry.attempts >= 5) {
    codeStore.delete(phone);
    return { valid: false, message: "验证码错误次数过多，请重新获取" };
  }

  if (entry.code !== inputCode.trim()) {
    entry.attempts += 1;
    return { valid: false, message: "验证码错误，请检查后重试" };
  }

  // 验证成功，立即删除（一次性使用）
  codeStore.delete(phone);
  return { valid: true, message: "验证成功" };
}

// ─── 导出 store（仅用于测试） ──────────────────────────────────────
export { codeStore, lastSentAt };
