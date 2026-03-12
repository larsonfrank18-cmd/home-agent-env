/* =============================================================
   配额显示徽章组件
   显示用户当前的每日/每月调用剩余次数
   ============================================================= */

import { trpc } from "@/lib/trpc";

const MEMBER_TYPE_LABELS: Record<string, string> = {
  free:      "免费",
  quarterly: "季度会员",
  annual:    "年度会员",
  lifetime:  "永久会员",
};

interface QuotaBadgeProps {
  /** 主题色，默认为橘黄色 */
  accentColor?: string;
}

export function QuotaBadge({ accentColor = "oklch(0.75 0.18 55)" }: QuotaBadgeProps) {
  const { data: usage } = trpc.adminUsers.getMyUsage.useQuery(undefined, {
    staleTime: 30_000, // 30秒缓存
  });

  if (!usage) return null;

  const dailyRemain = Math.max(0, usage.dailyLimit - usage.dailyUsed);
  const monthlyRemain = Math.max(0, usage.monthlyLimit - usage.monthlyUsed);
  const dailyPct = usage.dailyLimit > 0 ? (usage.dailyUsed / usage.dailyLimit) * 100 : 0;

  const isLow = dailyRemain <= 5 && usage.dailyLimit > 0;
  const memberLabel = MEMBER_TYPE_LABELS[usage.memberType] ?? usage.memberType;

  return (
    <div
      className="inline-flex items-center gap-3 px-3 py-1.5 rounded-lg text-xs"
      style={{
        background: `${accentColor.replace(")", " / 6%)")}`,
        border: `1px solid ${accentColor.replace(")", " / 20%)")}`,
      }}
    >
      {/* 会员类型 */}
      <span className="font-medium" style={{ color: accentColor }}>
        {memberLabel}
      </span>

      {/* 分隔 */}
      <span className="text-gray-600">|</span>

      {/* 今日剩余 */}
      <span className={isLow ? "text-red-400" : "text-gray-400"}>
        今日剩余{" "}
        <span className={`font-semibold ${isLow ? "text-red-400" : "text-white"}`}>
          {dailyRemain}
        </span>
        /{usage.dailyLimit}
      </span>

      {/* 本月剩余 */}
      <span className="text-gray-400 hidden sm:inline">
        本月{" "}
        <span className="font-semibold text-white">{monthlyRemain}</span>
        /{usage.monthlyLimit}
      </span>

      {/* 进度条 */}
      <div
        className="w-12 h-1 rounded-full overflow-hidden hidden sm:block"
        style={{ background: `${accentColor.replace(")", " / 15%)")}` }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${Math.min(100, dailyPct)}%`,
            background: isLow ? "#ef4444" : accentColor,
          }}
        />
      </div>
    </div>
  );
}
