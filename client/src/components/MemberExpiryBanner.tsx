/**
 * 会员到期提醒横幅
 * 当登录用户的会员距到期 ≤7天时，在页面顶部显示橙色提醒横幅
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, X, Crown } from "lucide-react";

interface MemberExpiryBannerProps {
  /** 是否已登录（未登录时不显示） */
  isAuthenticated: boolean;
}

export default function MemberExpiryBanner({ isAuthenticated }: MemberExpiryBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  const { data: usage } = trpc.adminUsers.getMyUsage.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5分钟缓存
  });

  if (!isAuthenticated || dismissed) return null;

  // 计算距到期天数
  const expireAt = usage?.paidExpireAt ? new Date(usage.paidExpireAt) : null;
  if (!expireAt) return null;

  const memberType = usage?.memberType ?? "free";
  if (memberType === "free" || memberType === "lifetime") return null;

  const now = new Date();
  const diffMs = expireAt.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  // 只在 ≤7天且未过期时显示
  if (diffDays > 7 || diffDays <= 0) return null;

  const memberLabel = memberType === "quarterly" ? "季度会员" : "年度会员";
  const expireStr = expireAt.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const urgencyColor =
    diffDays <= 1
      ? { bg: "oklch(0.35 0.15 20)", border: "oklch(0.55 0.2 20)", text: "oklch(0.97 0 0)", icon: "oklch(0.75 0.2 20)" }
      : diffDays <= 3
      ? { bg: "oklch(0.3 0.12 40)", border: "oklch(0.55 0.18 40)", text: "oklch(0.97 0 0)", icon: "oklch(0.75 0.2 40)" }
      : { bg: "oklch(0.25 0.08 55)", border: "oklch(0.5 0.15 55)", text: "oklch(0.95 0 0)", icon: "oklch(0.75 0.2 55)" };

  return (
    <div
      className="w-full px-4 py-2.5 flex items-center gap-3 text-sm relative"
      style={{
        background: urgencyColor.bg,
        borderBottom: `1px solid ${urgencyColor.border}`,
      }}
    >
      {/* 图标 */}
      <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: urgencyColor.icon }} />

      {/* 文字 */}
      <div className="flex-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
        <span style={{ color: urgencyColor.text }}>
          <Crown className="w-3.5 h-3.5 inline mr-1" style={{ color: urgencyColor.icon }} />
          您的
          <strong className="mx-1">{memberLabel}</strong>
          将于
          <strong className="mx-1">{expireStr}</strong>
          到期
          {diffDays === 1
            ? "（明天到期！）"
            : `（还剩 ${diffDays} 天）`}
        </span>
        <span style={{ color: "oklch(0.7 0.05 240)" }}>到期后将恢复免费额度限制</span>
      </div>

      {/* 联系续费按钮 */}
      <a
        href="https://work.weixin.qq.com/kfid/kfc1234567890"
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 px-3 py-1 rounded text-xs font-semibold transition-opacity hover:opacity-80"
        style={{
          background: urgencyColor.icon,
          color: "oklch(0.08 0.015 240)",
        }}
        onClick={(e) => {
          // 如果没有实际链接，弹出提示
          e.preventDefault();
          alert("请联系管理员微信：lb04001982 进行续费");
        }}
      >
        立即续费
      </a>

      {/* 关闭按钮 */}
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 p-1 rounded transition-opacity hover:opacity-70"
        style={{ color: urgencyColor.text }}
        aria-label="关闭提醒"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
