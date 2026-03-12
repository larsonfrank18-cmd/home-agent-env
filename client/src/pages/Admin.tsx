/* =============================================================
   管理员后台 - 用户管理 & 权限开通
   统一"确认保存"按钮，自动计算到期时间
   ============================================================= */

import { useState } from "react";
import { useLocation, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

type MemberType = "free" | "quarterly" | "annual" | "lifetime";

type UserRow = {
  id: number;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: "user" | "admin";
  isPaid: boolean;
  memberType: MemberType;
  paidAt: Date | null;
  paidExpireAt: Date | null;
  customDailyLimit: number | null;
  customMonthlyLimit: number | null;
  adminNote: string | null;
  createdAt: Date;
  lastSignedIn: Date;
  loginMethod: string | null;
  passwordPlain: string | null;
};

const MEMBER_TYPE_LABELS: Record<MemberType, { label: string; color: string; daily: number; monthly: number }> = {
  free:      { label: "免费",     color: "text-gray-500",                   daily: 0,  monthly: 0   },
  quarterly: { label: "季度会员", color: "text-[oklch(0.75_0.18_55)]",      daily: 50, monthly: 500 },
  annual:    { label: "年度会员", color: "text-[oklch(0.75_0.18_160)]",     daily: 65, monthly: 650 },
  lifetime:  { label: "永久会员", color: "text-[oklch(0.75_0.18_300)]",     daily: 80, monthly: 800 },
};

function formatDate(d: Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

/** 根据会员类型自动计算到期日期（操作当天 + 偏移 + 1天） */
function calcExpireDate(type: MemberType): string {
  if (type === "free" || type === "lifetime") return "";
  const now = new Date();
  const result = new Date(now);
  if (type === "quarterly") {
    result.setMonth(result.getMonth() + 3);
  } else if (type === "annual") {
    result.setFullYear(result.getFullYear() + 1);
  }
  result.setDate(result.getDate() + 1); // 额外加1天
  return result.toISOString().split("T")[0];
}

function UserCard({ user, onRefresh }: { user: UserRow; onRefresh: () => void }) {
  const [note, setNote] = useState(user.adminNote ?? "");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedMemberType, setSelectedMemberType] = useState<MemberType>(user.memberType ?? "free");
  const [expireAt, setExpireAt] = useState(
    user.paidExpireAt ? new Date(user.paidExpireAt).toISOString().split("T")[0] : ""
  );
  const [customDaily, setCustomDaily] = useState(user.customDailyLimit?.toString() ?? "");
  const [customMonthly, setCustomMonthly] = useState(user.customMonthlyLimit?.toString() ?? "");

  /** 切换会员类型时自动填充到期时间 */
  const handleMemberTypeChange = (type: MemberType) => {
    setSelectedMemberType(type);
    const auto = calcExpireDate(type);
    if (auto) setExpireAt(auto);
    else if (type === "free" || type === "lifetime") setExpireAt("");
  };

  // 合并保存：会员类型 + 配额 + 备注，一次提交
  const setMembershipMutation = trpc.adminUsers.setMembership.useMutation({
    onError: (err) => toast.error(`会员设置失败：${err.message}`),
  });
  const setQuotaMutation = trpc.adminUsers.setUserQuota.useMutation({
    onError: (err) => toast.error(`配额更新失败：${err.message}`),
  });

  const setRoleMutation = trpc.userAuth.adminSetRole.useMutation({
    onSuccess: () => {
      toast.success("角色已更新");
      onRefresh();
    },
    onError: (err) => toast.error(err.message),
  });

  const isPending = setMembershipMutation.isPending || setQuotaMutation.isPending;

  const handleConfirmSave = async () => {
    try {
      // 1. 保存会员类型 + 到期时间 + 备注
      await setMembershipMutation.mutateAsync({
        userId: user.id,
        memberType: selectedMemberType,
        expireAt:
          selectedMemberType !== "lifetime" && selectedMemberType !== "free" && expireAt
            ? new Date(expireAt + "T23:59:59+08:00").toISOString()
            : null,
        adminNote: note || undefined,
      });

      // 2. 保存自定义配额（无论是否有值都更新，null 表示恢复默认）
      await setQuotaMutation.mutateAsync({
        userId: user.id,
        customDailyLimit: customDaily ? parseInt(customDaily) : null,
        customMonthlyLimit: customMonthly ? parseInt(customMonthly) : null,
        adminNote: note || undefined,
      });

      toast.success("✅ 已保存");
      onRefresh();
    } catch {
      // 错误已在各自的 onError 中处理
    }
  };

  const displayName = user.name || user.email || user.phone || `用户#${user.id}`;
  const account = user.email || user.phone || "—";
  const memberConf = MEMBER_TYPE_LABELS[user.memberType ?? "free"];
  const effectiveDaily = user.customDailyLimit ?? MEMBER_TYPE_LABELS[user.memberType ?? "free"].daily;
  const effectiveMonthly = user.customMonthlyLimit ?? MEMBER_TYPE_LABELS[user.memberType ?? "free"].monthly;

  return (
    <div
      className={`rounded-xl p-5 transition-all border ${
        user.isPaid
          ? "border-[oklch(0.75_0.18_55/50%)] bg-[oklch(0.75_0.18_55/5%)]"
          : "border-[oklch(1_0_0/10%)] bg-[oklch(0.12_0.015_30)]"
      }`}
    >
      {/* 顶部：用户信息 + 会员状态 */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-white font-semibold text-sm truncate">{displayName}</span>
            {user.role === "admin" && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[oklch(0.75_0.18_55/20%)] text-[oklch(0.75_0.18_55)] font-medium">
                管理员
              </span>
            )}
          </div>
          <p className="text-gray-500 text-xs truncate">{account}</p>
          {/* 密码显示 */}
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-gray-600 text-xs">密码：</span>
            {user.passwordPlain ? (
              <>
                <span className="text-xs font-mono text-gray-400">
                  {showPassword ? user.passwordPlain : "•".repeat(Math.min(user.passwordPlain.length, 8))}
                </span>
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-600 hover:text-gray-300 transition-colors ml-1"
                  title={showPassword ? "隐藏密码" : "显示密码"}
                >
                  {showPassword ? (
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </>
            ) : (
              <span className="text-gray-600 text-xs italic">未设置（OAuth登录）</span>
            )}
          </div>
          <p className="text-gray-600 text-xs mt-0.5">
            注册：{formatDate(user.createdAt)} · 最近登录：{formatDate(user.lastSignedIn)}
          </p>
        </div>

        {/* 会员状态徽章 */}
        <div className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold ${
          user.isPaid
            ? "bg-[oklch(0.75_0.18_55/20%)] text-[oklch(0.75_0.18_55)]"
            : "bg-[oklch(1_0_0/6%)] text-gray-500"
        }`}>
          {user.isPaid ? `✓ ${memberConf.label}` : "未开通"}
        </div>
      </div>

      {/* 付费信息（已开通时显示） */}
      {user.isPaid && (
        <div className="text-xs text-gray-500 mb-3 flex flex-wrap gap-3 bg-[oklch(0.75_0.18_55/8%)] rounded-lg px-3 py-2">
          <span>开通：{formatDate(user.paidAt)}</span>
          <span>到期：{user.paidExpireAt ? formatDate(user.paidExpireAt) : "永久"}</span>
          <span className={memberConf.color}>每日：{effectiveDaily}次 · 每月：{effectiveMonthly}次</span>
        </div>
      )}

      {/* ─── 信息填写区 ─────────────────────────────────────── */}
      <div className="space-y-3 mb-4">
        {/* 会员类型选择 */}
        <div>
          <label className="block text-xs text-gray-400 mb-1.5 font-medium">会员类型</label>
          <div className="grid grid-cols-4 gap-1.5">
            {(["free", "quarterly", "annual", "lifetime"] as MemberType[]).map((type) => {
              const conf = MEMBER_TYPE_LABELS[type];
              return (
                <button
                  key={type}
                  onClick={() => handleMemberTypeChange(type)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all border ${
                    selectedMemberType === type
                      ? "border-[oklch(0.75_0.18_55/60%)] bg-[oklch(0.75_0.18_55/15%)] text-white"
                      : "border-[oklch(1_0_0/10%)] text-gray-500 hover:border-[oklch(1_0_0/20%)]"
                  }`}
                >
                  {conf.label}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-gray-600 mt-1">
            默认配额：每日 {MEMBER_TYPE_LABELS[selectedMemberType].daily} 次 · 每月 {MEMBER_TYPE_LABELS[selectedMemberType].monthly} 次
          </p>
        </div>

        {/* 到期时间（季度/年度时显示，自动填充，可手动修改） */}
        {selectedMemberType !== "lifetime" && selectedMemberType !== "free" && (
          <div>
            <label className="block text-xs text-gray-400 mb-1.5 font-medium">
              到期时间
              <span className="text-gray-600 font-normal ml-1">
                （自动计算，可手动修改）
              </span>
            </label>
            <input
              type="date"
              value={expireAt}
              onChange={(e) => setExpireAt(e.target.value)}
              className="w-full bg-[oklch(0.09_0.01_30)] border border-[oklch(1_0_0/12%)] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[oklch(0.75_0.18_55/60%)] transition-colors"
            />
            {expireAt && (
              <p className="text-xs text-gray-600 mt-1">
                到期日：{new Date(expireAt).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })}
              </p>
            )}
          </div>
        )}

        {/* 自定义配额（可选） */}
        <div>
          <label className="block text-xs text-gray-400 mb-1.5 font-medium">
            自定义配额 <span className="text-gray-600 font-normal">（留空 = 使用默认值）</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              value={customDaily}
              onChange={(e) => setCustomDaily(e.target.value)}
              placeholder={`每日（默认${MEMBER_TYPE_LABELS[selectedMemberType].daily}）`}
              min="0"
              className="w-full bg-[oklch(0.09_0.01_30)] border border-[oklch(1_0_0/12%)] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[oklch(0.75_0.18_55/60%)] transition-colors"
            />
            <input
              type="number"
              value={customMonthly}
              onChange={(e) => setCustomMonthly(e.target.value)}
              placeholder={`每月（默认${MEMBER_TYPE_LABELS[selectedMemberType].monthly}）`}
              min="0"
              className="w-full bg-[oklch(0.09_0.01_30)] border border-[oklch(1_0_0/12%)] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[oklch(0.75_0.18_55/60%)] transition-colors"
            />
          </div>
        </div>

        {/* 备注 */}
        <div>
          <label className="block text-xs text-gray-400 mb-1.5 font-medium">
            管理备注 <span className="text-gray-600 font-normal">（如：已付款799元）</span>
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="可记录付款金额、日期、备注等..."
            rows={2}
            className="w-full bg-[oklch(0.09_0.01_30)] border border-[oklch(1_0_0/12%)] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[oklch(0.75_0.18_55/60%)] resize-none transition-colors"
          />
        </div>
      </div>

      {/* 分割线 */}
      <div className="border-t border-[oklch(1_0_0/8%)] mb-4" />

      {/* ─── 操作按钮区 ─────────────────────────────────────── */}
      <div className="space-y-2">
        {/* 统一确认保存按钮 */}
        <button
          onClick={handleConfirmSave}
          disabled={isPending}
          className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 ${
            selectedMemberType === "free"
              ? "border border-[oklch(1_0_0/20%)] text-gray-300 hover:bg-[oklch(1_0_0/5%)]"
              : "bg-[oklch(0.75_0.18_55)] text-black hover:bg-[oklch(0.8_0.18_55)] shadow-[0_0_12px_oklch(0.75_0.18_55/40%)]"
          }`}
        >
          {isPending ? (
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 11-6.219-8.56" />
              </svg>
              保存中...
            </span>
          ) : (
            <>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {selectedMemberType === "free" ? "确认（设为免费）" : `确认开通 ${MEMBER_TYPE_LABELS[selectedMemberType].label}`}
            </>
          )}
        </button>

        {/* 设为管理员 */}
        {user.role !== "admin" && (
          <button
            onClick={() => setRoleMutation.mutate({ userId: user.id, role: "admin" })}
            disabled={setRoleMutation.isPending}
            className="w-full py-2 rounded-lg text-xs border border-[oklch(1_0_0/15%)] text-gray-400 hover:border-[oklch(0.75_0.18_55/40%)] hover:text-[oklch(0.75_0.18_55)] transition-all disabled:opacity-50"
          >
            {setRoleMutation.isPending ? "更新中..." : "设为管理员"}
          </button>
        )}
      </div>
    </div>
  );
}

export default function Admin() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [filterMember, setFilterMember] = useState<"all" | MemberType>("all");
  const [filterExpiry, setFilterExpiry] = useState<"all" | "expiring" | "expired">("all");

  const { data: me } = trpc.auth.me.useQuery();
  const { data: users, isLoading, refetch } = trpc.userAuth.adminListUsers.useQuery(undefined, {
    enabled: me?.role === "admin",
  });
  const { data: stats } = trpc.adminUsers.getStats.useQuery(undefined, {
    enabled: me?.role === "admin",
  });

  // 未登录
  if (!me) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">请先登录</p>
          <button
            onClick={() => navigate("/login")}
            className="bg-[oklch(0.75_0.18_55)] text-black px-6 py-2 rounded-lg text-sm font-semibold hover:bg-[oklch(0.8_0.18_55)] transition-colors"
          >
            去登录
          </button>
        </div>
      </div>
    );
  }

  // 非管理员
  if (me.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-2">无权限访问</p>
          <p className="text-gray-600 text-sm mb-4">此页面仅管理员可访问</p>
          <button
            onClick={() => navigate("/")}
            className="border border-[oklch(1_0_0/15%)] text-gray-400 px-6 py-2 rounded-lg text-sm hover:border-[oklch(0.75_0.18_55/40%)] hover:text-[oklch(0.75_0.18_55)] transition-colors"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  const filtered = (users ?? []).filter((u) => {
    // 文字搜索
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phone?.includes(q);

    // 会员类型筛选
    const matchMember = filterMember === "all" || u.memberType === filterMember;

    // 到期状态筛选
    let matchExpiry = true;
    if (filterExpiry !== "all") {
      const now = new Date();
      const expire = u.paidExpireAt ? new Date(u.paidExpireAt) : null;
      if (filterExpiry === "expired") {
        matchExpiry = !!expire && expire < now;
      } else if (filterExpiry === "expiring") {
        const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        matchExpiry = !!expire && expire >= now && expire <= sevenDays;
      }
    }

    return matchSearch && matchMember && matchExpiry;
  });

  const paidCount = (users ?? []).filter((u) => u.isPaid).length;
  const totalCount = (users ?? []).length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* 顶部导航 */}
      <nav className="glass-nav sticky top-0 z-50">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="text-gray-500 hover:text-[oklch(0.75_0.18_55)] transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <span className="text-white font-semibold text-sm">管理后台</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500">
              共{" "}
              <span className="text-[oklch(0.75_0.18_55)] font-semibold">{totalCount}</span>{" "}
              位用户 · 已开通{" "}
              <span className="text-[oklch(0.75_0.18_55)] font-semibold">{paidCount}</span>{" "}
              人
            </span>
            <Link
              href="/knowledge"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-orange-500/30 text-orange-300 hover:bg-orange-500/10 transition-all"
            >
              📚 知识库
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* 统计概览 */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="rounded-xl border border-[oklch(1_0_0/10%)] bg-[oklch(0.12_0.015_30)] p-4 text-center">
              <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
              <p className="text-xs text-gray-500 mt-1">总用户</p>
            </div>
            <div className="rounded-xl border border-[oklch(0.75_0.18_55/30%)] bg-[oklch(0.75_0.18_55/5%)] p-4 text-center">
              <p className="text-2xl font-bold text-[oklch(0.75_0.18_55)]">{stats.paidUsers}</p>
              <p className="text-xs text-gray-500 mt-1">付费会员</p>
            </div>
            <div className="rounded-xl border border-[oklch(1_0_0/10%)] bg-[oklch(0.12_0.015_30)] p-4 text-center">
              <p className="text-2xl font-bold text-white">{stats.todayCalls}</p>
              <p className="text-xs text-gray-500 mt-1">今日调用</p>
            </div>
            <div className="rounded-xl border border-[oklch(1_0_0/10%)] bg-[oklch(0.12_0.015_30)] p-4 text-center">
              <p className="text-2xl font-bold text-white">{stats.monthCalls}</p>
              <p className="text-xs text-gray-500 mt-1">本月调用</p>
            </div>
          </div>
        )}

        {/* 操作说明 */}
        <div className="mb-6 p-4 rounded-xl border border-[oklch(0.75_0.18_55/20%)] bg-[oklch(0.75_0.18_55/5%)]">
          <p className="text-xs text-gray-400 leading-relaxed">
            <span className="text-[oklch(0.75_0.18_55)] font-semibold">操作流程：</span>
            ① 选择会员类型 → ② 确认到期时间（自动计算，可修改）→ ③ 填写备注 → ④ 点击「确认」一键保存所有信息
          </p>
          <p className="text-xs text-gray-600 mt-1">
            到期时间自动计算：季度会员 = 今天 + 3个月 + 1天 · 年度会员 = 今天 + 1年 + 1天
          </p>
        </div>

        {/* 搜索 + 筛选 */}
        <div className="mb-6 space-y-3">
          {/* 文字搜索 */}
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索用户（姓名 / 邮箱 / 手机号）"
            className="w-full bg-[oklch(0.12_0.015_30)] border border-[oklch(1_0_0/10%)] rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[oklch(0.75_0.18_55/50%)] transition-colors"
          />

          {/* 筛选按钮行 */}
          <div className="flex flex-wrap gap-2 items-center">
            {/* 会员类型筛选 */}
            <div className="flex gap-1.5 flex-wrap">
              {([
                { value: "all", label: "全部" },
                { value: "free", label: "免费" },
                { value: "quarterly", label: "季度" },
                { value: "annual", label: "年度" },
                { value: "lifetime", label: "永久" },
              ] as const).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFilterMember(opt.value)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    filterMember === opt.value
                      ? "bg-[oklch(0.75_0.18_55)] text-black"
                      : "border border-[oklch(1_0_0/12%)] text-gray-400 hover:border-[oklch(0.75_0.18_55/40%)] hover:text-[oklch(0.75_0.18_55)]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* 分隔线 */}
            <div className="w-px h-5 bg-[oklch(1_0_0/10%)]" />

            {/* 到期状态筛选 */}
            <div className="flex gap-1.5 flex-wrap">
              {([
                { value: "all", label: "全部状态" },
                { value: "expiring", label: "即将到期≤7天" },
                { value: "expired", label: "已过期" },
              ] as const).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFilterExpiry(opt.value)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    filterExpiry === opt.value
                      ? opt.value === "expired"
                        ? "bg-red-500/80 text-white"
                        : opt.value === "expiring"
                        ? "bg-orange-500/80 text-white"
                        : "bg-[oklch(0.75_0.18_55)] text-black"
                      : "border border-[oklch(1_0_0/12%)] text-gray-400 hover:border-[oklch(0.75_0.18_55/40%)] hover:text-[oklch(0.75_0.18_55)]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* 结果计数 */}
            <span className="ml-auto text-xs text-gray-500">
              显示 {filtered.length} / {(users ?? []).length} 位用户
            </span>
          </div>
        </div>

        {/* 用户列表 */}
        {isLoading ? (
          <div className="text-center py-20 text-gray-500">加载中...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            {search ? "没有找到匹配的用户" : "暂无注册用户"}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((user) => (
              <UserCard
                key={user.id}
                user={user as UserRow}
                onRefresh={() => refetch()}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
