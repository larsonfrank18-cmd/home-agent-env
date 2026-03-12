/* =============================================================
   首屏 Hero 区域 - 赛博朋克极简主义
   星空背景 + 霓虹大标题 + 打字机效果
   ============================================================= */

import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import AgreementModal from "@/components/AgreementModal";

const HERO_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663424321294/HS8qgRakRiSQeDBKf2ngfC/hero-bg-CD5UQPMr8TgZ992Lu2mJqA.webp";

const TYPING_TEXTS = [
  "AI爆款文案生成器",
  "家居建材营销专家",
  "客户分析精准话术",
  "爆款引流一键生成",
];

const STATS = [
  { value: "80+", label: "覆盖品类", icon: "◈" },
  { value: "10000+", label: "爆款选题", icon: "◆" },
  { value: "7", label: "获客步骤", icon: "◇" },
  { value: "5", label: "平台覆盖", icon: "◉" },
];

export default function HeroSection() {
  const [displayText, setDisplayText] = useState("");
  const [textIndex, setTextIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statsVisible, setStatsVisible] = useState(false);
  const [showAgreement, setShowAgreement] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);

  // 打字机效果
  useEffect(() => {
    const currentText = TYPING_TEXTS[textIndex];
    const speed = isDeleting ? 50 : 100;

    const timer = setTimeout(() => {
      if (!isDeleting) {
        if (charIndex < currentText.length) {
          setDisplayText(currentText.slice(0, charIndex + 1));
          setCharIndex(charIndex + 1);
        } else {
          setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        if (charIndex > 0) {
          setDisplayText(currentText.slice(0, charIndex - 1));
          setCharIndex(charIndex - 1);
        } else {
          setIsDeleting(false);
          setTextIndex((textIndex + 1) % TYPING_TEXTS.length);
        }
      }
    }, speed);

    return () => clearTimeout(timer);
  }, [charIndex, isDeleting, textIndex]);

  // 统计数字出现动画
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setStatsVisible(true);
      },
      { threshold: 0.3 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  const [, navigate] = useLocation();

  const handleStart = () => {
    navigate("/generator");
  };

  return (
    <>
      {/* 用户协议弹窗（只读模式） */}
      {showAgreement && (
        <AgreementModal
          readOnly
          onClose={() => setShowAgreement(false)}
        />
      )}

      <section
        className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
        style={{
          backgroundImage: `url(${HERO_BG})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* 深色遮罩 */}
        <div className="absolute inset-0 bg-[oklch(0.08_0.015_240/75%)]" />
        {/* 网格叠加 */}
        <div className="absolute inset-0 bg-grid opacity-30" />

        {/* 内容区 */}
        <div className="relative z-10 container mx-auto px-4 text-center pt-20">
          {/* 状态指示器 */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 rounded-full border border-[oklch(0.82_0.18_178/30%)] bg-[oklch(0.82_0.18_178/8%)]">
            <span className="status-dot" />
            <span className="text-xs font-['Inter'] tracking-widest text-[oklch(0.82_0.18_178)]">
              SYSTEM ONLINE · 智源-家居建材AI营销引擎
            </span>
          </div>

          {/* 主标题 */}
          <h1 className="mb-4">
            <span
              className="block text-5xl md:text-7xl lg:text-8xl font-['Noto_Sans_SC'] font-black text-white leading-tight"
              style={{ letterSpacing: "-0.02em" }}
            >
              <span className="neon-text">{displayText}</span>
              <span className="typing-cursor" />
            </span>
          </h1>

          {/* 副标题流程 */}
          <p className="text-base md:text-lg text-gray-400 mb-4 font-['Inter'] tracking-wide">
            选品类
            <span className="mx-2 text-[oklch(0.82_0.18_178)]">→</span>
            选选题
            <span className="mx-2 text-[oklch(0.82_0.18_178)]">→</span>
            生文案
            <span className="mx-2 text-[oklch(0.82_0.18_178)]">→</span>
            拿流量
          </p>

          {/* 金句 */}
          <p className="text-sm text-gray-500 mb-10 italic font-['Noto_Sans_SC']">
            "一键生成，让每一篇文案都是爆款"
          </p>

          {/* 小字说明 */}
          <p className="text-xs text-gray-600 mb-8 font-['Inter'] tracking-widest uppercase">
            POWERED BY ADVANCED AI · HOME MATERIALS COPYWRITING ENGINE
          </p>

          {/* CTA 按钮 */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <button
              onClick={handleStart}
              className="neon-btn-primary px-8 py-3 rounded text-sm font-semibold tracking-wide flex items-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
              立即启动
            </button>
            <button
              onClick={() => setShowAgreement(true)}
              className="neon-btn px-8 py-3 rounded text-sm font-semibold tracking-wide flex items-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              使用说明
            </button>
          </div>

          {/* 统计数字 */}
          <div
            ref={statsRef}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto"
          >
            {STATS.map((stat, i) => (
              <div
                key={stat.label}
                className="text-center"
                style={{
                  opacity: statsVisible ? 1 : 0,
                  transform: statsVisible ? "translateY(0)" : "translateY(20px)",
                  transition: `all 0.6s ease ${i * 0.1}s`,
                }}
              >
                <div className="text-[oklch(0.82_0.18_178)] text-xs mb-1 font-['Orbitron']">
                  {stat.icon}
                </div>
                <div className="text-3xl md:text-4xl font-['Orbitron'] font-bold neon-text">
                  {stat.value}
                </div>
                <div className="text-xs text-gray-500 mt-1 font-['Noto_Sans_SC']">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 向下滚动提示 */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
          <span className="text-xs text-gray-600 tracking-widest font-['Inter']">SCROLL</span>
          <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </section>
    </>
  );
}
