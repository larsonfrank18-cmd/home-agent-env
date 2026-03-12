/* =============================================================
   工作流程组件 - 赛博朋克极简主义
   横向步骤流程 + 数字序号 + 连接线
   ============================================================= */

import { useEffect, useRef, useState } from "react";

const WORKFLOW_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663424321294/HS8qgRakRiSQeDBKf2ngfC/workflow-bg-gPgtfQdqdfe6STRwuZtSQP.webp";

const STEPS = [
  { num: "01", title: "选择赛道", desc: "确定品类方向" },
  { num: "02", title: "分析竞品", desc: "找到标杆账号" },
  { num: "03", title: "制定方案", desc: "设计获客模型" },
  { num: "04", title: "抓取爆款", desc: "学习成功套路" },
  { num: "05", title: "创作文案", desc: "AI一键生成" },
  { num: "06", title: "制作视频", desc: "分镜脚本输出" },
  { num: "07", title: "私域成交", desc: "话术转化闭环" },
];

export default function WorkflowSection() {
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

  return (
    <section
      className="py-24 relative overflow-hidden"
      style={{
        backgroundImage: `url(${WORKFLOW_BG})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-[oklch(0.08_0.015_240/90%)]" />

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
            Workflow
          </p>
          <h2 className="text-3xl md:text-4xl font-['Noto_Sans_SC'] font-black text-white mb-4">
            按照流程从零到一
          </h2>
          <p className="text-gray-500 text-sm font-['Noto_Sans_SC']">
            打造你的家居建材短视频获客体系
          </p>
          <hr className="neon-divider mt-6 max-w-xs mx-auto" />
        </div>

        {/* 步骤流程 - 桌面端横向 */}
        <div className="hidden md:flex items-start justify-between relative">
          {/* 连接线 */}
          <div className="absolute top-6 left-[6%] right-[6%] h-px bg-gradient-to-r from-transparent via-[oklch(0.82_0.18_178/40%)] to-transparent" />

          {STEPS.map((step, i) => (
            <div
              key={step.num}
              className="flex flex-col items-center text-center w-[13%]"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(20px)",
                transition: `all 0.5s ease ${i * 0.1}s`,
              }}
            >
              {/* 数字圆圈 */}
              <div className="relative mb-4">
                <div className="w-12 h-12 rounded border border-[oklch(0.82_0.18_178/60%)] flex items-center justify-center bg-[oklch(0.08_0.015_240)] z-10 relative">
                  <span className="font-['Orbitron'] text-sm font-bold text-[oklch(0.82_0.18_178)]">
                    {step.num}
                  </span>
                </div>
                {/* 发光效果 */}
                <div className="absolute inset-0 rounded blur-sm bg-[oklch(0.82_0.18_178/20%)]" />
              </div>
              <h4 className="text-white text-sm font-semibold mb-1 font-['Noto_Sans_SC']">
                {step.title}
              </h4>
              <p className="text-gray-600 text-xs font-['Noto_Sans_SC']">
                {step.desc}
              </p>
            </div>
          ))}
        </div>

        {/* 步骤流程 - 移动端纵向 */}
        <div className="md:hidden space-y-4">
          {STEPS.map((step, i) => (
            <div
              key={step.num}
              className="flex items-center gap-4"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "translateX(0)" : "translateX(-20px)",
                transition: `all 0.5s ease ${i * 0.08}s`,
              }}
            >
              <div className="w-10 h-10 rounded border border-[oklch(0.82_0.18_178/60%)] flex items-center justify-center flex-shrink-0 bg-[oklch(0.08_0.015_240)]">
                <span className="font-['Orbitron'] text-xs font-bold text-[oklch(0.82_0.18_178)]">
                  {step.num}
                </span>
              </div>
              <div>
                <h4 className="text-white text-sm font-semibold font-['Noto_Sans_SC']">
                  {step.title}
                </h4>
                <p className="text-gray-500 text-xs font-['Noto_Sans_SC']">
                  {step.desc}
                </p>
              </div>
              {i < STEPS.length - 1 && (
                <div className="ml-auto">
                  <svg className="w-4 h-4 text-[oklch(0.82_0.18_178/40%)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
