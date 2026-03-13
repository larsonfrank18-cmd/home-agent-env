/* =============================================================
   底部 CTA + Footer - 橘黄暖光主题
   ============================================================= */

import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

export default function CtaSection() {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [, navigate] = useLocation();
  const { data: user } = trpc.auth.me.useQuery();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const handleStart = () => {
    if (user) {
      navigate("/generator");
    } else {
      navigate("/login");
    }
  };

  const handleActivityPlanning = () => {
    if (user) {
      navigate("/activity-planning");
    } else {
      navigate("/login");
    }
  };

  return (
    <>
      {/* CTA 区域 */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-10" />
        {/* 中心发光 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-96 h-96 rounded-full bg-[oklch(0.75_0.18_55/8%)] blur-3xl" />
        </div>

        <div
          ref={ref}
          className="container mx-auto px-4 text-center relative z-10"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(30px)",
            transition: "all 0.8s ease",
          }}
        >
          <p className="text-xs font-['Orbitron'] tracking-[0.3em] text-[oklch(0.75_0.18_55)] mb-6 uppercase">
            Ready To Start?
          </p>
          <h2 className="text-4xl md:text-6xl font-['Noto_Sans_SC'] font-black text-white mb-6">
            全套工具
            <br />
            <span className="neon-text">一站式营销增长</span>
          </h2>
          <p className="text-gray-500 text-sm mb-10 font-['Noto_Sans_SC'] max-w-md mx-auto">
            家居建材行业的流量红利正在爆发，现在入场，用AI工具抢占先机
          </p>

          {/* 四个入口按钮 */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 flex-wrap">
            <button
              onClick={handleStart}
              className="neon-btn-primary px-8 py-3.5 rounded text-sm font-semibold tracking-wide inline-flex items-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
              {user ? "立即生成文案" : "注册 · 立即体验"}
            </button>
            <button
              onClick={() => navigate("/dm-assistant")}
              className="neon-btn px-8 py-3.5 rounded text-sm font-semibold tracking-wide inline-flex items-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
              私信话术生成
            </button>
            <button
              onClick={() => navigate("/disc-analyzer")}
              className="neon-btn px-8 py-3.5 rounded text-sm font-semibold tracking-wide inline-flex items-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="8" r="4" />
                <path d="M6 20v-2a6 6 0 0112 0v2" />
              </svg>
              客户人格分析
            </button>
            <button
              onClick={handleActivityPlanning}
              className="neon-btn px-8 py-3.5 rounded text-sm font-semibold tracking-wide inline-flex items-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
              活动策划
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[oklch(0.75_0.18_55/10%)] py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded border border-[oklch(0.75_0.18_55/40%)] flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="oklch(0.75 0.18 55)" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                  <polyline points="9,22 9,12 15,12 15,22" />
                </svg>
              </div>
              <span className="font-['Orbitron'] text-xs font-bold tracking-widest text-gray-500">
                智源AI
              </span>
            </div>
            <p className="text-gray-700 text-xs font-['Inter'] tracking-widest">
              AI驱动家居建材爆款文案引擎
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
