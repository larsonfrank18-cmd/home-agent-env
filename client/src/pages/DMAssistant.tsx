/* =============================================================
   私信话术生成器
   8大场景 × 3种风格 → AI生成3条可直接使用的话术
   帮助家居建材商家将私信流量转化为到店客户
   ============================================================= */

import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import { PurchaseModal } from "@/components/PurchaseModal";
import { QuotaBadge } from "@/components/QuotaBadge";
import MemberExpiryBanner from "@/components/MemberExpiryBanner";

// ─── 主色（与全站一致） ──────────────────────────────────────────
const ACCENT = "oklch(0.75 0.18 55)";
const ACCENT_DIM = "oklch(0.75 0.18 55 / 30%)";
const ACCENT_BG = "oklch(0.75 0.18 55 / 6%)";
const BG = "oklch(0.09 0.015 30)";
const BG2 = "oklch(0.12 0.015 30)";

type DMScene =
  | "价格询问"
  | "比较竞品"
  | "犹豫观望"
  | "质量疑虑"
  | "售后担忧"
  | "地址到店"
  | "催促紧迫"
  | "自定义场景";

type DMStyle = "亲切朋友式" | "专业顾问式" | "简洁高效式";
type Step = "select-scene" | "fill-info" | "result";

// ─── 场景数据 ────────────────────────────────────────────────────
const SCENES: Array<{ value: DMScene; icon: string; label: string; desc: string }> = [
  { value: "价格询问", icon: "💰", label: "价格询问", desc: "客户问多少钱、预算多少" },
  { value: "比较竞品", icon: "⚖️", label: "比较竞品", desc: "客户在货比三家、问差异" },
  { value: "犹豫观望", icon: "😐", label: "犹豫观望", desc: "客户说先看看、还没到那一步" },
  { value: "质量疑虑", icon: "🔍", label: "质量疑虑", desc: "客户问质量、耐用性、材料" },
  { value: "售后担忧", icon: "🛡️", label: "售后担忧", desc: "客户问保修、售后、出问题怎么办" },
  { value: "地址到店", icon: "📍", label: "地址到店", desc: "客户问地址、怎么去、在哪里" },
  { value: "催促紧迫", icon: "⏰", label: "催促紧迫", desc: "客户问活动、现在买划不划算" },
  { value: "自定义场景", icon: "✏️", label: "自定义场景", desc: "粘贴客户原始私信内容" },
];

// ─── 风格数据 ────────────────────────────────────────────────────
const STYLES: Array<{ value: DMStyle; label: string; desc: string; tag: string }> = [
  { value: "亲切朋友式", label: "亲切朋友式", desc: "口语化、有温度", tag: "小红书/微信" },
  { value: "专业顾问式", label: "专业顾问式", desc: "有数据、有逻辑", tag: "高客单价" },
  { value: "简洁高效式", label: "简洁高效式", desc: "短句直接、不废话", tag: "批量回复" },
];

// ─── 权限拦截组件 ────────────────────────────────────────────────
function AccessGate({ children }: { children: React.ReactNode }) {
  const [, navigate] = useLocation();
  const { data: user, isLoading } = trpc.auth.me.useQuery();
  const [showPurchase, setShowPurchase] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full animate-bounce"
              style={{ background: ACCENT, animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: BG }}>
        <PurchaseModal open={showPurchase} onClose={() => setShowPurchase(false)} />
        <div className="text-center max-w-sm">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: ACCENT_BG, border: `1px solid ${ACCENT_DIM}` }}
          >
            <svg className="w-8 h-8" style={{ color: ACCENT }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
          </div>
          <h2 className="text-xl font-black text-white mb-2 font-['Noto_Sans_SC']">请先登录</h2>
          <p className="text-gray-500 text-sm mb-6 font-['Noto_Sans_SC']">登录后开通会员即可使用私信话术功能</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => navigate("/login")} className="neon-btn-primary px-6 py-2.5 rounded text-sm font-semibold">
              登录 / 注册
            </button>
            <button onClick={() => setShowPurchase(true)} className="neon-btn px-6 py-2.5 rounded text-sm">
              了解会员
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!user.isPaid && user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: BG }}>
        <PurchaseModal open={showPurchase} onClose={() => setShowPurchase(false)} />
        <div className="text-center max-w-sm">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: ACCENT_BG, border: `1px solid ${ACCENT_DIM}` }}
          >
            <svg className="w-8 h-8" style={{ color: ACCENT }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-black text-white mb-2 font-['Noto_Sans_SC']">权限未开通</h2>
          <p className="text-gray-500 text-sm mb-2 font-['Noto_Sans_SC']">您好，<span className="text-white">{user.name || user.email || "用户"}</span></p>
          <p className="text-gray-500 text-sm mb-6 font-['Noto_Sans_SC']">开通会员后即可使用全部功能</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => setShowPurchase(true)} className="neon-btn-primary px-6 py-2.5 rounded text-sm font-semibold">
              开通会员
            </button>
            <button onClick={() => navigate("/")} className="neon-btn px-6 py-2.5 rounded text-sm">返回首页</button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// ─── 加载动画 ────────────────────────────────────────────────────
const LoadingDots = () => (
  <div className="flex gap-1">
    {[0, 1, 2].map((i) => (
      <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce"
        style={{ background: ACCENT, animationDelay: `${i * 0.15}s` }} />
    ))}
  </div>
);

// ─── 主组件 ──────────────────────────────────────────────────────
export default function DMAssistant() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState<Step>("select-scene");
  const [selectedScene, setSelectedScene] = useState<DMScene>("价格询问");
  const [selectedStyle, setSelectedStyle] = useState<DMStyle>("亲切朋友式");
  const [selectedModel, setSelectedModel] = useState<"manus" | "deepseek">("manus");
  const [industry, setIndustry] = useState("");
  const [sellingPoints, setSellingPoints] = useState("");
  const [currentPromotion, setCurrentPromotion] = useState("");
  const [location, setLocation] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [generatedScripts, setGeneratedScripts] = useState("");
  const [knowledgeUsed, setKnowledgeUsed] = useState(0);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const generateMutation = trpc.dmAssistant.generateDMScript.useMutation({
    onSuccess: (data) => {
      setGeneratedScripts(data.scripts);
      setKnowledgeUsed(data.knowledgeUsed ?? 0);
      setStep("result");
      if (data.knowledgeUsed > 0) {
        toast.success(`✨ 已融入知识库 ${data.knowledgeUsed} 条参考内容`);
      }
    },
    onError: (err) => toast.error("话术生成失败：" + err.message),
  });

  const handleGenerate = () => {
    if (selectedScene === "自定义场景" && !customMessage.trim()) {
      toast.error("请粘贴客户的私信内容");
      return;
    }
    generateMutation.mutate({
      scene: selectedScene,
      style: selectedStyle,
      industry,
      sellingPoints,
      currentPromotion,
      location,
      customMessage,
      model: selectedModel,
    });
  };

  const handleCopy = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      toast.success("话术已复制到剪贴板");
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      toast.error("复制失败，请手动选择文字复制");
    }
  };

  // 解析生成的话术为3个独立块
  const parseScripts = (raw: string) => {
    const blocks = raw.split(/###\s*话术[123]/).filter((b) => b.trim());
    return blocks.map((b) => b.trim());
  };

  const STEPS = [
    { key: "select-scene", label: "选场景" },
    { key: "fill-info", label: "填信息" },
    { key: "result", label: "看话术" },
  ];
  const currentStepIndex = STEPS.findIndex((s) => s.key === step);

  return (
    <AccessGate>
      <div className="min-h-screen py-8 px-4" style={{ background: BG }}>
        {/* 会员到期提醒横幅 */}
        <MemberExpiryBanner isAuthenticated={true} />
        <div className="max-w-3xl mx-auto">

          {/* ─── 返回按鈕 ───────────────────────────────────────────────── */}
          <div className="mb-6 flex items-center justify-between">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 group text-sm"
              style={{ color: "oklch(0.5 0 0)" }}
            >
              <svg className="w-4 h-4 transition-colors group-hover:text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
              <span className="font-['Inter'] tracking-widest text-xs group-hover:text-white transition-colors">
                BACK TO HOME
              </span>
            </button>
            <QuotaBadge />
          </div>

          {/* ─── 页面标题 ───────────────────────────────────────────────── */}
          <div className="text-center mb-10">
            <p className="text-xs font-['Orbitron'] tracking-[0.3em] mb-3 uppercase" style={{ color: ACCENT }}>
              DM Assistant · 私信转化利器
            </p>
            <h1 className="text-3xl md:text-4xl font-['Noto_Sans_SC'] font-black text-white mb-3">
              私信话术生成器
            </h1>
            <p className="text-sm text-gray-500 font-['Noto_Sans_SC']">
              选择客户场景 → AI生成3条专业话术 → 一键复制发送
            </p>
          </div>

          {/* ─── 进度条 ──────────────────────────────────────────── */}
          <div className="flex items-center justify-center gap-2 mb-10">
            {STEPS.map((s, i) => (
              <div key={s.key} className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-['Orbitron'] transition-all"
                    style={{
                      background: i <= currentStepIndex ? ACCENT : "transparent",
                      border: `1px solid ${i <= currentStepIndex ? ACCENT : "oklch(1 0 0 / 15%)"}`,
                      color: i <= currentStepIndex ? "oklch(0.1 0 0)" : "oklch(0.4 0 0)",
                    }}
                  >
                    {i < currentStepIndex ? "✓" : i + 1}
                  </div>
                  <span
                    className="text-xs font-['Noto_Sans_SC'] hidden sm:block"
                    style={{ color: i <= currentStepIndex ? ACCENT : "oklch(0.4 0 0)" }}
                  >
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="w-8 h-px" style={{ background: i < currentStepIndex ? ACCENT : "oklch(1 0 0 / 10%)" }} />
                )}
              </div>
            ))}
          </div>

          {/* ─── STEP 1: 选择场景 ─────────────────────────────────── */}
          {step === "select-scene" && (
            <div className="animate-fadeIn">
              <div className="text-center mb-8">
                <h2 className="text-xl font-['Noto_Sans_SC'] font-black text-white mb-2">
                  客户发来的是什么类型的私信？
                </h2>
                <p className="text-sm text-gray-500 font-['Noto_Sans_SC']">选择最接近的场景，AI会针对性生成转化话术</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                {SCENES.map((scene) => (
                  <button
                    key={scene.value}
                    onClick={() => setSelectedScene(scene.value)}
                    className="p-4 rounded text-left transition-all duration-200 group"
                    style={{
                      background: selectedScene === scene.value ? ACCENT_BG : "transparent",
                      border: `1px solid ${selectedScene === scene.value ? ACCENT : "oklch(1 0 0 / 12%)"}`,
                    }}
                    onMouseEnter={(e) => {
                      if (selectedScene !== scene.value) {
                        (e.currentTarget as HTMLElement).style.borderColor = ACCENT_DIM;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedScene !== scene.value) {
                        (e.currentTarget as HTMLElement).style.borderColor = "oklch(1 0 0 / 12%)";
                      }
                    }}
                  >
                    <div className="text-2xl mb-2">{scene.icon}</div>
                    <div
                      className="text-sm font-semibold font-['Noto_Sans_SC'] mb-1"
                      style={{ color: selectedScene === scene.value ? ACCENT : "oklch(0.85 0 0)" }}
                    >
                      {scene.label}
                    </div>
                    <div className="text-xs text-gray-600 font-['Noto_Sans_SC'] leading-relaxed">
                      {scene.desc}
                    </div>
                    {selectedScene === scene.value && (
                      <div className="mt-2">
                        <svg className="w-4 h-4" style={{ color: ACCENT }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <div className="text-center">
                <button
                  onClick={() => setStep("fill-info")}
                  className="neon-btn-primary px-8 py-3 rounded text-sm font-semibold font-['Noto_Sans_SC'] inline-flex items-center gap-2"
                >
                  下一步：填写信息
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* ─── STEP 2: 填写信息 ─────────────────────────────────── */}
          {step === "fill-info" && (
            <div className="animate-fadeIn max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4"
                  style={{ background: ACCENT_BG, border: `1px solid ${ACCENT_DIM}` }}>
                  <span className="text-lg">{SCENES.find((s) => s.value === selectedScene)?.icon}</span>
                  <span className="text-sm font-['Noto_Sans_SC']" style={{ color: ACCENT }}>{selectedScene}</span>
                </div>
                <h2 className="text-xl font-['Noto_Sans_SC'] font-black text-white mb-2">
                  补充信息让话术更精准
                </h2>
                <p className="text-sm text-gray-500 font-['Noto_Sans_SC']">以下均为选填，填得越多话术越贴合你的实际情况</p>
              </div>

              <div className="space-y-5">
                {/* 自定义场景：客户原话 */}
                {selectedScene === "自定义场景" && (
                  <div>
                    <label className="block text-sm font-['Noto_Sans_SC'] text-gray-300 mb-2">
                      客户私信内容 <span className="text-red-400">*必填</span>
                    </label>
                    <textarea
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      placeholder="粘贴客户发来的私信原文，例如：你好，你们家的全屋定制大概多少钱？我家120平，预算10万左右，不知道够不够"
                      className="w-full px-4 py-3 rounded text-white placeholder-gray-600 focus:outline-none resize-none font-['Noto_Sans_SC'] text-sm transition-colors"
                      style={{ background: BG2, border: `1px solid ${ACCENT_DIM}` }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = ACCENT)}
                      onBlur={(e) => (e.currentTarget.style.borderColor = ACCENT_DIM)}
                      rows={4}
                    />
                  </div>
                )}

                {/* 行业品类 */}
                <div>
                  <label className="block text-sm font-['Noto_Sans_SC'] text-gray-300 mb-2">
                    行业品类 <span className="text-gray-600">（选填）</span>
                  </label>
                  <input
                    type="text"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    placeholder="例如：全屋定制、系统门窗、实木地板"
                    className="w-full px-4 py-3 rounded text-white placeholder-gray-600 focus:outline-none font-['Noto_Sans_SC'] text-sm transition-colors"
                    style={{ background: BG2, border: `1px solid oklch(1 0 0 / 10%)` }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = ACCENT_DIM)}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "oklch(1 0 0 / 10%)")}
                  />
                </div>

                {/* 核心卖点 */}
                <div>
                  <label className="block text-sm font-['Noto_Sans_SC'] text-gray-300 mb-2">
                    核心卖点 <span className="text-gray-600">（选填）</span>
                  </label>
                  <input
                    type="text"
                    value={sellingPoints}
                    onChange={(e) => setSellingPoints(e.target.value)}
                    placeholder="例如：进口五金、10年质保、免费上门量尺"
                    className="w-full px-4 py-3 rounded text-white placeholder-gray-600 focus:outline-none font-['Noto_Sans_SC'] text-sm transition-colors"
                    style={{ background: BG2, border: `1px solid oklch(1 0 0 / 10%)` }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = ACCENT_DIM)}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "oklch(1 0 0 / 10%)")}
                  />
                </div>

                {/* 当前活动 */}
                <div>
                  <label className="block text-sm font-['Noto_Sans_SC'] text-gray-300 mb-2">
                    当前活动 <span className="text-gray-600">（选填）</span>
                  </label>
                  <input
                    type="text"
                    value={currentPromotion}
                    onChange={(e) => setCurrentPromotion(e.target.value)}
                    placeholder="例如：本月量尺免费、签单送全屋灯具、3月底前下定享9折"
                    className="w-full px-4 py-3 rounded text-white placeholder-gray-600 focus:outline-none font-['Noto_Sans_SC'] text-sm transition-colors"
                    style={{ background: BG2, border: `1px solid oklch(1 0 0 / 10%)` }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = ACCENT_DIM)}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "oklch(1 0 0 / 10%)")}
                  />
                </div>

                {/* 门店位置 */}
                <div>
                  <label className="block text-sm font-['Noto_Sans_SC'] text-gray-300 mb-2">
                    门店位置 <span className="text-gray-600">（选填）</span>
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="例如：上海浦东新区XX建材城3楼A区"
                    className="w-full px-4 py-3 rounded text-white placeholder-gray-600 focus:outline-none font-['Noto_Sans_SC'] text-sm transition-colors"
                    style={{ background: BG2, border: `1px solid oklch(1 0 0 / 10%)` }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = ACCENT_DIM)}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "oklch(1 0 0 / 10%)")}
                  />
                </div>

                {/* 话术风格 */}
                <div>
                  <label className="block text-sm font-['Noto_Sans_SC'] text-gray-300 mb-3">
                    话术风格
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {STYLES.map((s) => (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => setSelectedStyle(s.value)}
                        className="p-3 rounded text-left transition-all duration-200"
                        style={{
                          background: selectedStyle === s.value ? ACCENT_BG : "transparent",
                          border: `1px solid ${selectedStyle === s.value ? ACCENT : "oklch(1 0 0 / 12%)"}`,
                        }}
                      >
                        <div
                          className="text-sm font-semibold font-['Noto_Sans_SC'] mb-1"
                          style={{ color: selectedStyle === s.value ? ACCENT : "oklch(0.8 0 0)" }}
                        >
                          {s.label}
                        </div>
                        <div className="text-xs text-gray-600 font-['Noto_Sans_SC']">{s.desc}</div>
                        <div
                          className="text-xs mt-1 px-1.5 py-0.5 rounded inline-block font-['Noto_Sans_SC']"
                          style={{
                            background: selectedStyle === s.value ? "oklch(0.75 0.18 55 / 15%)" : "oklch(1 0 0 / 5%)",
                            color: selectedStyle === s.value ? ACCENT : "oklch(0.5 0 0)",
                          }}
                        >
                          {s.tag}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* AI模型选择 */}
                <div>
                  <label className="block text-sm font-['Noto_Sans_SC'] text-gray-300 mb-3">
                    AI 模型
                  </label>
                  <div className="flex gap-3">
                    {[
                      { value: "manus" as const, label: "Gemini 2.5 Flash", desc: "内置模型", icon: "🌟" },
                      { value: "deepseek" as const, label: "DeepSeek V3", desc: "深度思考", icon: "💡" },
                    ].map((m) => (
                      <button
                        key={m.value}
                        type="button"
                        onClick={() => setSelectedModel(m.value)}
                        className="flex-1 px-4 py-3 rounded text-left transition-all duration-200"
                        style={{
                          background: selectedModel === m.value ? ACCENT_BG : "transparent",
                          border: `1px solid ${selectedModel === m.value ? ACCENT : "oklch(1 0 0 / 12%)"}`,
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base">{m.icon}</span>
                          <div>
                            <div className="text-sm font-semibold font-['Noto_Sans_SC']"
                              style={{ color: selectedModel === m.value ? ACCENT : "oklch(0.85 0 0)" }}>
                              {m.label}
                            </div>
                            <div className="text-xs text-gray-500 font-['Noto_Sans_SC']">{m.desc}</div>
                          </div>
                          {selectedModel === m.value && (
                            <svg className="w-4 h-4 ml-auto flex-shrink-0" style={{ color: ACCENT }}
                              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setStep("select-scene")}
                    className="neon-btn px-5 py-3 rounded text-sm font-['Noto_Sans_SC']"
                  >
                    ← 重选场景
                  </button>
                  <button
                    onClick={handleGenerate}
                    disabled={generateMutation.isPending}
                    className="flex-1 neon-btn-primary py-3 rounded text-sm font-semibold font-['Noto_Sans_SC'] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {generateMutation.isPending ? (
                      <><LoadingDots /><span>AI正在生成话术...</span></>
                    ) : (
                      <>
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                        </svg>
                        生成3条话术
                      </>
                    )}
                  </button>
                </div>

                {generateMutation.isPending && (
                  <div className="text-center py-4">
                    <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full"
                      style={{ border: `1px solid ${ACCENT_DIM}`, background: ACCENT_BG }}>
                      <LoadingDots />
                      <span className="text-sm font-['Noto_Sans_SC']" style={{ color: ACCENT }}>
                        AI正在思考最佳转化策略，预计10-15秒...
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─── STEP 3: 话术结果 ─────────────────────────────────── */}
          {step === "result" && (
            <div className="animate-fadeIn max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <p className="text-xs font-['Orbitron'] tracking-[0.3em] mb-3 uppercase" style={{ color: ACCENT }}>
                  Scripts Ready · 话术已生成
                </p>
                <h2 className="text-2xl font-['Noto_Sans_SC'] font-black text-white mb-3">
                  🎉 3条话术已就绪
                </h2>
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs"
                    style={{ background: ACCENT_BG, border: `1px solid ${ACCENT_DIM}`, color: ACCENT }}>
                    {SCENES.find((s) => s.value === selectedScene)?.icon}&nbsp;{selectedScene}
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs"
                    style={{ background: ACCENT_BG, border: `1px solid ${ACCENT_DIM}`, color: ACCENT }}>
                    {selectedStyle}
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs"
                    style={{ background: "oklch(0.65 0.18 55 / 0.08)", border: "1px solid oklch(0.65 0.18 55 / 0.25)", color: ACCENT }}>
                    {selectedModel === "deepseek" ? "💡 DeepSeek V3" : "🌟 Gemini 2.5 Flash"}
                  </div>
                  {knowledgeUsed > 0 && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs"
                      style={{ background: "oklch(0.65 0.18 55 / 0.1)", border: "1px solid oklch(0.65 0.18 55 / 0.3)", color: ACCENT }}>
                      ✨ 已融入知识库 {knowledgeUsed} 条
                    </div>
                  )}
                </div>
              </div>

              {/* 话术内容 */}
              {(() => {
                const blocks = parseScripts(generatedScripts);
                if (blocks.length >= 3) {
                  return (
                    <div className="space-y-4 mb-6">
                      {blocks.map((block, i) => {
                        // 提取标题行和正文
                        const lines = block.split("\n");
                        const titleLine = lines[0] || `话术 ${i + 1}`;
                        const bodyLines = lines.slice(1).join("\n").trim();
                        return (
                          <div
                            key={i}
                            className="rounded p-5 relative"
                            style={{ background: BG2, border: `1px solid ${ACCENT_DIM}` }}
                          >
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div className="flex items-center gap-2">
                                <span
                                  className="text-xs font-['Orbitron'] font-bold px-2 py-0.5 rounded"
                                  style={{ background: ACCENT_BG, color: ACCENT, border: `1px solid ${ACCENT_DIM}` }}
                                >
                                  {String(i + 1).padStart(2, "0")}
                                </span>
                                <span className="text-sm font-semibold text-white font-['Noto_Sans_SC']">
                                  {titleLine.replace(/^[:：\s]+/, "")}
                                </span>
                              </div>
                              <button
                                onClick={() => handleCopy(bodyLines || block, i)}
                                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition-all font-['Noto_Sans_SC']"
                                style={{ border: `1px solid ${ACCENT_DIM}`, color: ACCENT }}
                                onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = ACCENT_BG}
                                onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = "transparent"}
                              >
                                {copiedIndex === i ? (
                                  <><svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>已复制</>
                                ) : (
                                  <><svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>复制</>
                                )}
                              </button>
                            </div>
                            <div className="prose prose-invert prose-sm max-w-none">
                              <Streamdown>{bodyLines || block}</Streamdown>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                }
                // 解析失败时整体展示
                return (
                  <div className="rounded p-5 mb-6 relative" style={{ background: BG2, border: `1px solid ${ACCENT_DIM}` }}>
                    <button
                      onClick={() => handleCopy(generatedScripts, -1)}
                      className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition-all font-['Noto_Sans_SC']"
                      style={{ border: `1px solid ${ACCENT_DIM}`, color: ACCENT }}
                      onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = ACCENT_BG}
                      onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = "transparent"}
                    >
                      {copiedIndex === -1 ? "✓ 已复制" : "复制全部"}
                    </button>
                    <div className="prose prose-invert prose-sm max-w-none">
                      <Streamdown>{generatedScripts}</Streamdown>
                    </div>
                  </div>
                );
              })()}

              {/* 操作按钮 */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => setStep("fill-info")}
                  className="neon-btn py-3 rounded text-sm font-semibold font-['Noto_Sans_SC'] flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 12H5M12 5l-7 7 7 7" />
                  </svg>
                  修改信息
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={generateMutation.isPending}
                  className="neon-btn py-3 rounded text-sm font-semibold font-['Noto_Sans_SC'] flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {generateMutation.isPending ? <><LoadingDots /><span>生成中...</span></> : (
                    <><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
                    </svg>换一批</>
                  )}
                </button>
                <button
                  onClick={() => { setStep("select-scene"); setGeneratedScripts(""); }}
                  className="neon-btn-primary py-3 rounded text-sm font-semibold font-['Noto_Sans_SC'] flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12l7-7 7 7" />
                  </svg>
                  换个场景
                </button>
              </div>

              {/* 使用提示 */}
              <div className="mt-6 p-4 rounded" style={{ border: `1px solid ${ACCENT_DIM}`, background: ACCENT_BG }}>
                <p className="text-xs font-['Noto_Sans_SC'] mb-2 font-semibold" style={{ color: ACCENT }}>💡 使用建议</p>
                <ul className="text-xs text-gray-500 font-['Noto_Sans_SC'] space-y-1">
                  <li>• 3条话术覆盖不同客户心理，根据实际情况选择最合适的一条</li>
                  <li>• 建议在话术基础上加入你的真实案例或具体数字，效果更佳</li>
                  <li>• 回复后记得引导客户到店或加微信，不要让对话断掉</li>
                  <li>• 可多次生成，找到最适合你风格的表达方式</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </AccessGate>
  );
}
