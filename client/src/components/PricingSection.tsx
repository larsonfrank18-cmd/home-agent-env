/* =============================================================
   定价方案组件 - 赛博朋克极简主义
   参考用户提供的定价图片：个人版 ¥2980/年 + 企业版 ¥9800/年
   ============================================================= */

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const PLANS = [
  {
    num: "01",
    name: "个人获客版",
    price: "2,980",
    unit: "/年",
    color: "oklch(0.82 0.18 178)",
    borderColor: "oklch(0.82_0.18_178)",
    target: "实体店老板 · 个体IP创业者 · 短视频运营",
    coreValue: "拿结果 别再学理论了\n直接用工具产出",
    updateFreq: "每月更新",
    updateDot: "bg-red-500",
    benefits: [
      "智能体实战系统",
      "365天稳定使用权",
      "家居建材专属知识库",
      "20+品类爆款选题模板",
    ],
    quote: "让工具为你打工，一个人活成一支队伍",
    cta: "立即开通",
  },
  {
    num: "02",
    name: "公司尊享版",
    price: "9,800",
    unit: "/年",
    color: "oklch(0.78 0.15 55)",
    borderColor: "oklch(0.78_0.15_55)",
    target: "MCN机构 · 品牌方 · 高频迭代企业",
    coreValue: "用最快速度\n收割最新流量红利",
    updateFreq: "每周更新",
    updateDot: "bg-green-500",
    benefits: [
      "包含4个子账号（自带代理资格）",
      "解锁高阶商业板块（全功能商业闭环）",
      "周更频率 紧跟市场风向",
      "专属客服1对1支持",
    ],
    quote: "用最快的速度，收割最新的流量红利",
    cta: "联系客服",
    recommended: true,
  },
];

export default function PricingSection() {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.2 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const handleCta = (planName: string) => {
    toast(`${planName}`, {
      description: "请联系客服获取专属邀请码和开通方式",
      duration: 3000,
    });
  };

  return (
    <section className="py-24 relative">
      <div className="absolute inset-0 bg-grid opacity-10" />

      <div ref={ref} className="container mx-auto px-4 relative z-10">
        {/* 标题 */}
        <div
          className="text-center mb-16"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(30px)",
            transition: "all 0.6s ease",
          }}
        >
          <p className="text-xs font-['Orbitron'] tracking-[0.3em] text-[oklch(0.82_0.18_178)] mb-3 uppercase">
            Pricing Plans
          </p>
          <h2 className="text-3xl md:text-4xl font-['Noto_Sans_SC'] font-black text-white mb-4">
            版本对比 · 选择适合你的获客武器
          </h2>
          <p className="text-gray-500 text-sm font-['Noto_Sans_SC']">
            两种方案，满足不同规模的家居建材商家需求
          </p>
          <hr className="neon-divider mt-6 max-w-xs mx-auto" />
        </div>

        {/* 定价卡片 */}
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {PLANS.map((plan, i) => (
            <div
              key={plan.name}
              className="relative rounded border p-8"
              style={{
                borderColor: `${plan.color.replace('oklch', 'oklch').replace(')', '/40%)')}`,
                background: `oklch(0.11 0.015 240 / 90%)`,
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(30px)",
                transition: `all 0.6s ease ${i * 0.15}s`,
                boxShadow: plan.recommended
                  ? `0 0 30px ${plan.color.replace(')', '/20%)')}` 
                  : "none",
              }}
            >
              {/* 推荐标签 */}
              {plan.recommended && (
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-semibold font-['Noto_Sans_SC']"
                  style={{
                    background: plan.color,
                    color: "oklch(0.08 0.015 240)",
                  }}
                >
                  推荐
                </div>
              )}

              {/* 编号 + 名称 */}
              <div className="mb-6">
                <span
                  className="font-['Orbitron'] text-4xl font-black"
                  style={{ color: plan.color }}
                >
                  {plan.num}
                </span>
                <h3 className="text-white text-xl font-bold font-['Noto_Sans_SC'] mt-1">
                  {plan.name}
                </h3>
              </div>

              {/* 价格 */}
              <div className="mb-6">
                <span
                  className="font-['Orbitron'] text-5xl font-black"
                  style={{ color: plan.color }}
                >
                  ¥{plan.price}
                </span>
                <span className="text-gray-500 text-sm ml-1 font-['Inter']">
                  {plan.unit}
                </span>
              </div>

              {/* 适用人群 */}
              <div className="mb-4">
                <span className="text-xs text-gray-500 font-['Noto_Sans_SC'] border border-gray-700 rounded px-2 py-0.5">
                  适用人群：
                </span>
                <p className="text-gray-400 text-sm mt-1.5 font-['Noto_Sans_SC']">
                  {plan.target}
                </p>
              </div>

              {/* 核心价值 */}
              <div className="mb-4">
                <span className="text-xs text-gray-500 font-['Noto_Sans_SC'] border border-gray-700 rounded px-2 py-0.5">
                  核心价值：
                </span>
                <p
                  className="text-lg font-bold mt-1.5 font-['Noto_Sans_SC'] whitespace-pre-line"
                  style={{ color: plan.color }}
                >
                  {plan.coreValue}
                </p>
              </div>

              {/* 更新频率 */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs text-gray-500 font-['Noto_Sans_SC'] border border-gray-700 rounded px-2 py-0.5">
                  大脑迭代：
                </span>
                <span className={`w-2 h-2 rounded-full ${plan.updateDot}`} />
                <span className="text-gray-400 text-sm font-['Noto_Sans_SC']">
                  {plan.updateFreq}
                </span>
              </div>

              {/* 权益列表 */}
              <div className="mb-6">
                <span className="text-xs text-gray-500 font-['Noto_Sans_SC'] border border-gray-700 rounded px-2 py-0.5">
                  交付权益：
                </span>
                <ul className="mt-2 space-y-1.5">
                  {plan.benefits.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-sm text-gray-300 font-['Noto_Sans_SC']">
                      <svg
                        className="w-4 h-4 flex-shrink-0 mt-0.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        style={{ color: plan.color }}
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>

              {/* 金句 */}
              <p className="text-gray-500 text-xs italic text-center mb-6 font-['Noto_Sans_SC']">
                "{plan.quote}"
              </p>

              {/* CTA 按钮 */}
              <button
                onClick={() => handleCta(plan.name)}
                className="w-full py-3 rounded text-sm font-semibold font-['Noto_Sans_SC'] transition-all"
                style={{
                  background: plan.color,
                  color: "oklch(0.08 0.015 240)",
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLButtonElement).style.boxShadow = `0 0 20px ${plan.color.replace(')', '/50%)')}`;
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLButtonElement).style.boxShadow = "none";
                }}
              >
                {plan.cta} →
              </button>
            </div>
          ))}
        </div>

        {/* 底部说明 */}
        <p className="text-center text-gray-600 text-xs mt-8 font-['Noto_Sans_SC']">
          所有方案均包含专属邀请码 · 手机/电脑均可使用 · 推荐谷歌浏览器
        </p>
      </div>
    </section>
  );
}
