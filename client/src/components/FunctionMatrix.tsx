/* =============================================================
   功能矩阵组件 - 只保留内容创作核心功能
   橘黄暖光主题
   ============================================================= */

import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";

interface FunctionItem {
  title: string;
  desc: string;
  icon: string;
}

// 只保留内容创作核心功能
const FUNCTIONS: FunctionItem[] = [
  {
    title: "爆款选题生成",
    desc: "AI自动生成多角度爆款文案选题方向",
    icon: "◈",
  },
  {
    title: "AI智能生成",
    desc: "基于薛辉方法论一键生成爆款文案",
    icon: "◆",
  },
  {
    title: "文案结构分析",
    desc: "多维度分析评分，精准优化文案质量",
    icon: "◇",
  },
  {
    title: "8种选题类型",
    desc: "对立/头牌/成本/最差/最贵/最好/情感/场景",
    icon: "⬡",
  },
  {
    title: "80+家居品类",
    desc: "全屋定制、系统门窗、地板、卫浴等全覆盖",
    icon: "⬡",
  },
  {
    title: "活动策划生成",
    desc: "AI生成完整活动方案、优惠政策、营销话术",
    icon: "⬢",
  },
];

function FunctionCard({ item, delay }: { item: FunctionItem; delay: number }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [, navigate] = useLocation();

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

  const handleClick = () => {
    if (item.title === "活动策划生成") {
      navigate("/activity-planning");
    } else {
      navigate("/generator");
    }
  };

  return (
    <div
      ref={ref}
      onClick={handleClick}
      className="dashed-card rounded-lg p-5 block group cursor-pointer"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        transition: `all 0.5s ease ${delay}s`,
      }}
    >
      <div className="text-[oklch(0.75_0.18_55)] text-xl mb-3 group-hover:scale-110 transition-transform">
        {item.icon}
      </div>
      <h4 className="text-white text-sm font-semibold mb-1.5 font-['Noto_Sans_SC'] group-hover:text-[oklch(0.75_0.18_55)] transition-colors">
        {item.title}
      </h4>
      <p className="text-gray-500 text-xs leading-relaxed font-['Noto_Sans_SC']">
        {item.desc}
      </p>
    </div>
  );
}

export default function FunctionMatrix() {
  const [titleVisible, setTitleVisible] = useState(false);
  const titleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setTitleVisible(true);
      },
      { threshold: 0.2 }
    );
    if (titleRef.current) observer.observe(titleRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="py-24 relative">
      <div className="absolute inset-0 bg-grid opacity-10" />
      <div className="container mx-auto px-4 relative z-10">
        {/* 标题 */}
        <div
          ref={titleRef}
          className="text-center mb-16"
          style={{
            opacity: titleVisible ? 1 : 0,
            transform: titleVisible ? "translateY(0)" : "translateY(30px)",
            transition: "all 0.6s ease",
          }}
        >
          <p className="text-xs font-['Orbitron'] tracking-[0.3em] text-[oklch(0.75_0.18_55)] mb-3 uppercase">
            Core Functions
          </p>
          <h2 className="text-3xl md:text-4xl font-['Noto_Sans_SC'] font-black text-white mb-4">
            核心功能
          </h2>
          <p className="text-gray-500 text-sm font-['Noto_Sans_SC']">
            专注内容创作 · AI驱动爆款文案生成
          </p>
          <hr className="neon-divider mt-6 max-w-xs mx-auto" />
        </div>

        {/* 功能卡片网格 */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {FUNCTIONS.map((item, i) => (
            <FunctionCard key={item.title} item={item} delay={i * 0.08} />
          ))}
        </div>
      </div>
    </section>
  );
}
