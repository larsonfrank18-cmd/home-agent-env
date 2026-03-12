/* =============================================================
   私域成交话术展示组件 - 赛博朋克极简主义
   展示六大成交阶段和话术体系
   ============================================================= */

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const STAGES = [
  {
    num: "01",
    title: "引流钩子",
    desc: "设计高转化引流钩子，吸引精准客户主动添加",
    tags: ["免费量房", "设计方案", "样品赠送"],
    color: "oklch(0.82 0.18 178)",
  },
  {
    num: "02",
    title: "初次接触",
    desc: "首次对话破冰话术，建立信任感和专业形象",
    tags: ["开场白", "需求挖掘", "痛点共鸣"],
    color: "oklch(0.75 0.18 200)",
  },
  {
    num: "03",
    title: "需求确认",
    desc: "深度了解客户预算、风格偏好和时间节点",
    tags: ["SPIN提问", "预算摸底", "决策链分析"],
    color: "oklch(0.70 0.18 220)",
  },
  {
    num: "04",
    title: "方案呈现",
    desc: "专业方案展示，突出产品差异化价值",
    tags: ["案例展示", "对比分析", "价值塑造"],
    color: "oklch(0.65 0.18 240)",
  },
  {
    num: "05",
    title: "异议处理",
    desc: "价格、质量、品牌等常见异议的标准话术",
    tags: ["价格异议", "竞品对比", "信任背书"],
    color: "oklch(0.78 0.15 55)",
  },
  {
    num: "06",
    title: "促单成交",
    desc: "限时优惠、稀缺性营造、临门一脚促成签单",
    tags: ["限时优惠", "稀缺营造", "签单技巧"],
    color: "oklch(0.82 0.18 178)",
  },
];

const PLATFORMS = [
  { name: "抖音", icon: "◈", desc: "短视频+直播" },
  { name: "小红书", icon: "◆", desc: "种草+笔记" },
  { name: "视频号", icon: "◇", desc: "私域+直播" },
  { name: "快手", icon: "⬡", desc: "下沉市场" },
  { name: "微信", icon: "◉", desc: "私域成交" },
];

export default function ConversionSection() {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const handleStageClick = (stage: typeof STAGES[0]) => {
    toast(`${stage.title}话术模板`, {
      description: `AI将为您生成${stage.title}阶段的专属话术`,
      duration: 2500,
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
            Conversion System
          </p>
          <h2 className="text-3xl md:text-4xl font-['Noto_Sans_SC'] font-black text-white mb-4">
            私域成交全链路话术体系
          </h2>
          <p className="text-gray-500 text-sm font-['Noto_Sans_SC']">
            六大成交阶段 · 覆盖家居建材全场景
          </p>
          <hr className="neon-divider mt-6 max-w-xs mx-auto" />
        </div>

        {/* 成交阶段 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-16">
          {STAGES.map((stage, i) => (
            <div
              key={stage.num}
              className="dashed-card rounded p-5 cursor-pointer group"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(20px)",
                transition: `all 0.5s ease ${i * 0.08}s`,
              }}
              onClick={() => handleStageClick(stage)}
            >
              <div className="flex items-start justify-between mb-3">
                <span
                  className="font-['Orbitron'] text-2xl font-black"
                  style={{ color: stage.color }}
                >
                  {stage.num}
                </span>
                <svg
                  className="w-4 h-4 text-gray-700 group-hover:text-[oklch(0.82_0.18_178)] transition-colors"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
              <h4 className="text-white text-base font-semibold mb-2 font-['Noto_Sans_SC'] group-hover:text-[oklch(0.82_0.18_178)] transition-colors">
                {stage.title}
              </h4>
              <p className="text-gray-500 text-xs mb-3 leading-relaxed font-['Noto_Sans_SC']">
                {stage.desc}
              </p>
              <div className="flex flex-wrap gap-1">
                {stage.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] px-1.5 py-0.5 rounded border font-['Noto_Sans_SC']"
                    style={{
                      borderColor: `${stage.color.replace(')', '/30%)')}`,
                      color: stage.color,
                      background: `${stage.color.replace(')', '/8%)')}`,
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 平台覆盖 */}
        <div
          className="border border-[oklch(0.82_0.18_178/20%)] rounded p-8 text-center"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(20px)",
            transition: "all 0.6s ease 0.5s",
          }}
        >
          <p className="text-xs font-['Orbitron'] tracking-[0.3em] text-[oklch(0.82_0.18_178)] mb-6 uppercase">
            Platform Coverage
          </p>
          <div className="flex flex-wrap justify-center gap-8">
            {PLATFORMS.map((p) => (
              <div key={p.name} className="text-center">
                <div className="text-2xl text-[oklch(0.82_0.18_178)] mb-1">{p.icon}</div>
                <div className="text-white text-sm font-semibold font-['Noto_Sans_SC']">{p.name}</div>
                <div className="text-gray-600 text-xs font-['Noto_Sans_SC']">{p.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
