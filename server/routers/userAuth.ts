/**
 * 用户认证路由 - 手机号+短信验证码注册，邮箱/手机号登录
 * 注册流程：昵称(必填) + 手机号(必填) + 短信验证码(必填) + 密码(必填) + 邮箱(可选)
 * 管理员开通/关闭用户付费权限
 */

import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { z } from "zod";
import {
  createLocalUser,
  getAllUsers,
  getUserByEmailOrPhone,
  getUserByPhone,
  setUserPaidStatus,
  setUserRole,
  getDb,
} from "../db";
import { getSessionCookieOptions } from "../_core/cookies";
import { sdk } from "../_core/sdk";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { COOKIE_NAME } from "../../shared/const";
import { sendSmsCode, verifySmsCode } from "../smsService";

// ─── 输入验证 ─────────────────────────────────────────────────────

const sendSmsInput = z.object({
  phone: z.string().regex(/^1[3-9]\d{9}$/, "请输入有效的11位手机号"),
});

const registerInput = z.object({
  nickname: z.string().min(1, "请输入昵称").max(50, "昵称最多50个字符"),
  phone: z.string().regex(/^1[3-9]\d{9}$/, "请输入有效的11位手机号"),
  smsCode: z.string().length(6, "验证码为6位数字"),
  password: z.string().min(6, "密码至少6位").max(64),
  email: z.string().email("请输入有效的邮箱地址").optional().or(z.literal("")),
});

const loginInput = z.object({
  account: z.string().min(1, "请输入手机号或邮箱"),
  password: z.string().min(1, "请输入密码"),
});

// ─── 辅助函数 ─────────────────────────────────────────────────────

function isEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function isPhone(s: string) {
  return /^1[3-9]\d{9}$/.test(s);
}

// ─── 路由 ─────────────────────────────────────────────────────────

export const userAuthRouter = router({
  /** 发送短信验证码 */
  sendSmsCode: publicProcedure.input(sendSmsInput).mutation(async ({ input }) => {
    const { phone } = input;

    // 检查手机号是否已注册
    const existing = await getUserByPhone(phone);
    if (existing) {
      throw new TRPCError({ code: "CONFLICT", message: "该手机号已注册，请直接登录" });
    }

    const result = await sendSmsCode(phone);
    if (!result.success) {
      throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: result.message });
    }

    return {
      success: true,
      message: result.message,
      // 仅开发环境返回调试验证码
      ...(result.debugCode ? { debugCode: result.debugCode } : {}),
    };
  }),

  /** 注册 - 手机号+短信验证码+昵称+密码，邮箱可选 */
  register: publicProcedure.input(registerInput).mutation(async ({ input, ctx }) => {
    const { nickname, phone, smsCode, password, email } = input;

    // 验证短信验证码
    const verifyResult = verifySmsCode(phone, smsCode);
    if (!verifyResult.valid) {
      throw new TRPCError({ code: "BAD_REQUEST", message: verifyResult.message });
    }

    // 检查手机号是否已注册
    const existingByPhone = await getUserByPhone(phone);
    if (existingByPhone) {
      throw new TRPCError({ code: "CONFLICT", message: "该手机号已注册，请直接登录" });
    }

    // 检查邮箱是否已注册（如果填写了邮箱）
    const cleanEmail = email && email.trim() !== "" ? email.trim() : undefined;
    if (cleanEmail) {
      const existingByEmail = await getUserByEmailOrPhone(cleanEmail);
      if (existingByEmail) {
        throw new TRPCError({ code: "CONFLICT", message: "该邮箱已被注册" });
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const openId = `local_${nanoid(16)}`;

    const user = await createLocalUser({
      openId,
      email: cleanEmail,
      phone,
      name: nickname,
      passwordHash,
      passwordPlain: password, // 明文密码，仅管理员可见
    });

    // 注册成功后自动登录
    const token = await sdk.createSessionToken(user.openId, { name: user.name ?? "" });
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.cookie(COOKIE_NAME, token, cookieOptions);

    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isPaid: user.isPaid,
      },
    };
  }),

  /** 登录 - 手机号或邮箱 + 密码 */
  login: publicProcedure.input(loginInput).mutation(async ({ input, ctx }) => {
    const { account, password } = input;

    if (!isEmail(account) && !isPhone(account)) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "请输入有效的手机号或邮箱地址",
      });
    }

    const user = await getUserByEmailOrPhone(account);
    if (!user || !user.passwordHash) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "账号不存在或密码错误" });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "账号不存在或密码错误" });
    }

    const token = await sdk.createSessionToken(user.openId, { name: user.name ?? "" });
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.cookie(COOKIE_NAME, token, cookieOptions);

    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isPaid: user.isPaid,
      },
    };
  }),

  // ─── 管理员接口 ───────────────────────────────────────────────────

  /** 获取所有用户列表（仅管理员） */
  adminListUsers: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "仅管理员可访问" });
    }
    const allUsers = await getAllUsers();
    return allUsers.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      isPaid: u.isPaid,
      memberType: (u.memberType ?? "free") as "free" | "quarterly" | "annual" | "lifetime",
      paidAt: u.paidAt,
      paidExpireAt: u.paidExpireAt,
      customDailyLimit: u.customDailyLimit ?? null,
      customMonthlyLimit: u.customMonthlyLimit ?? null,
      adminNote: u.adminNote,
      createdAt: u.createdAt,
      lastSignedIn: u.lastSignedIn,
      loginMethod: u.loginMethod,
      passwordPlain: u.passwordPlain ?? null,
    }));
  }),

  /** 开通/关闭用户付费权限（仅管理员） */
  adminSetPaid: protectedProcedure
    .input(
      z.object({
        userId: z.number().int().positive(),
        isPaid: z.boolean(),
        expireAt: z.string().datetime().nullable().optional(),
        note: z.string().max(200).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "仅管理员可访问" });
      }

      const expireDate = input.expireAt ? new Date(input.expireAt) : null;
      await setUserPaidStatus(input.userId, input.isPaid, expireDate, input.note);
      return { success: true };
    }),

  /** 保存用户备注和到期时间（仅管理员，不改变isPaid状态） */
  adminSaveInfo: protectedProcedure
    .input(
      z.object({
        userId: z.number().int().positive(),
        expireAt: z.string().datetime().nullable().optional(),
        note: z.string().max(200).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "仅管理员可访问" });
      }
      const db = await (await import("../db")).getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "数据库不可用" });
      const { users } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const updateData: Record<string, unknown> = {};
      if (input.note !== undefined) updateData.adminNote = input.note;
      if (input.expireAt !== undefined) updateData.paidExpireAt = input.expireAt ? new Date(input.expireAt) : null;
      if (Object.keys(updateData).length > 0) {
        await db.update(users).set(updateData).where(eq(users.id, input.userId));
      }
      return { success: true };
    }),

  /** 设置用户角色（仅管理员） */
  adminSetRole: protectedProcedure
    .input(
      z.object({
        userId: z.number().int().positive(),
        role: z.enum(["user", "admin"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "仅管理员可访问" });
      }
      await setUserRole(input.userId, input.role);
      return { success: true };
    }),

  // ─── 密码找回 ─────────────────────────────────────────────────────

  /** 发送找回密码短信验证码（仅已注册手机号可发送） */
  sendResetSmsCode: publicProcedure
    .input(z.object({
      phone: z.string().regex(/^1[3-9]\d{9}$/, "请输入有效的11位手机号"),
    }))
    .mutation(async ({ input }) => {
      const { phone } = input;

      // 必须是已注册手机号才能发送
      const existing = await getUserByPhone(phone);
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "该手机号未注册" });
      }
      if (!existing.passwordHash) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "该账号通过第三方登录，无需密码找回" });
      }

      const result = await sendSmsCode(phone);
      if (!result.success) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: result.message });
      }

      return {
        success: true,
        message: result.message,
        ...(result.debugCode ? { debugCode: result.debugCode } : {}),
      };
    }),

  /** 重置密码（验证短信验证码后设置新密码） */
  resetPassword: publicProcedure
    .input(z.object({
      phone: z.string().regex(/^1[3-9]\d{9}$/, "请输入有效的11位手机号"),
      smsCode: z.string().length(6, "验证码为6位数字"),
      newPassword: z.string().min(6, "密码至少6位").max(64),
    }))
    .mutation(async ({ input }) => {
      const { phone, smsCode, newPassword } = input;

      // 验证短信验证码
      const verifyResult = verifySmsCode(phone, smsCode);
      if (!verifyResult.valid) {
        throw new TRPCError({ code: "BAD_REQUEST", message: verifyResult.message });
      }

      // 确认手机号已注册
      const user = await getUserByPhone(phone);
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "该手机号未注册" });
      }

      // 更新密码（哈希 + 明文）
      const passwordHash = await bcrypt.hash(newPassword, 10);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "数据库不可用" });
      const { users } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      await db.update(users)
        .set({ passwordHash, passwordPlain: newPassword })
        .where(eq(users.id, user.id));

      return { success: true, message: "密码重置成功，请使用新密码登录" };
    }),
});
