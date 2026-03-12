/* =============================================================
   主页面 - 家居建材爆款文案智能体
   简化版：Hero + 核心功能 + 行业类目 + CTA
   ============================================================= */

import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FunctionMatrix from "@/components/FunctionMatrix";
import IndustrySection from "@/components/IndustrySection";
import CtaSection from "@/components/CtaSection";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* 固定导航 */}
      <Navbar />

      {/* 首屏英雄区 */}
      <HeroSection />

      {/* 核心功能 */}
      <FunctionMatrix />

      {/* 行业类目 */}
      <IndustrySection />

      {/* CTA + Footer */}
      <CtaSection />
    </div>
  );
}
