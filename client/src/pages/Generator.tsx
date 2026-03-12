/* =============================================================
   AI爆款文案生成器 - 核心功能页面
   基于薛辉爆款文案方法论
   8种选题类型 × 家居建材全品类
   权限校验：需登录 + 管理员开通付费权限
   ============================================================= */

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import { PurchaseModal } from "@/components/PurchaseModal";
import { QuotaBadge } from "@/components/QuotaBadge";
import MemberExpiryBanner from "@/components/MemberExpiryBanner";

// ─── 行业品类数据 ────────────────────────────────────────────────
const INDUSTRIES = [
  {
    group: "定制类",
    items: [
      "全屋定制（整体）",
      "衣柜/衣帽间定制",
      "橱柜定制",
      "榻榻米定制",
      "阳台柜定制",
      "护墙板定制",
    ],
  },
  {
    group: "门窗类",
    items: [
      "系统门窗（整体）",
      "断桥铝门窗",
      "铝木复合门窗",
      "阳光房",
      "推拉门/折叠门",
      "入户门/防盗门",
    ],
  },
  {
    group: "地面材料",
    items: ["实木地板", "复合地板/强化地板", "瓷砖/地砖", "大理石/石材", "水磨石", "地毯"],
  },
  {
    group: "墙面材料",
    items: ["乳胶漆/涂料", "艺术涂料/硅藻泥", "墙纸/墙布", "岩板/大板", "木饰面板", "背景墙定制"],
  },
  {
    group: "卫浴洁具",
    items: ["智能马桶/坐便器", "浴室柜/洗手台", "花洒/淋浴系统", "浴缸/按摩浴缸", "淋浴房/隔断", "卫浴五金配件"],
  },
  {
    group: "厨房电器",
    items: ["油烟机/集成灶", "灶具/燃气灶", "洗碗机", "蒸烤箱/烤箱", "净水器/软水机", "冰箱/冰柜"],
  },
  {
    group: "灯光照明",
    items: ["无主灯设计方案", "筒灯/射灯", "磁吸轨道灯", "灯带/氛围灯", "吊灯/吸顶灯", "户外景观灯"],
  },
  {
    group: "软装配饰",
    items: ["窗帘/遮光帘", "沙发/布艺", "床垫/床架", "地毯/地垫", "装饰画/挂画", "绿植/花艺"],
  },
  {
    group: "智能家居",
    items: ["智能门锁", "全屋智能控制系统", "智能窗帘/电动窗帘", "安防监控系统", "智能照明控制", "新风系统/空净"],
  },
  {
    group: "装修服务",
    items: ["整装/全包装修", "半包装修", "旧房改造/翻新", "软装设计服务", "室内设计", "工装/商业空间"],
  },
];

// ─── 选题类型数据 ────────────────────────────────────────────────
const TOPIC_TYPES = [
  { value: "头牌选题", label: "头牌选题", desc: "世界最贵/明星同款，制造认知落差", icon: "👑" },
  { value: "怀旧选题", label: "怀旧选题", desc: "唤起集体记忆，以前vs现在", icon: "⏰" },
  { value: "对立选题", label: "对立选题", desc: "制造两极对比，激发站队讨论", icon: "⚡" },
  { value: "最差选题", label: "最差选题", desc: "踩坑避坑视角，建立专业信任", icon: "⚠️" },
  { value: "荷尔蒙选题", label: "荷尔蒙选题", desc: "颜值美感冲击，让人看了就想要", icon: "✨" },
  { value: "猎奇选题", label: "猎奇选题", desc: "反常识意外发现，激发好奇心", icon: "🔍" },
  { value: "圈人群选题", label: "圈人群选题", desc: "精准定位人群，说的就是我", icon: "🎯" },
  { value: "成本选题", label: "成本选题", desc: "价格透明揭秘，展示性价比", icon: "💰" },
] as const;

type TopicTypeValue = (typeof TOPIC_TYPES)[number]["value"];
type Step = "select-industry" | "select-topic" | "fill-info" | "topics" | "copy";

// ─── 主色 ────────────────────────────────────────────────────────
const ACCENT = "oklch(0.75 0.18 55)";
const ACCENT_DIM = "oklch(0.75 0.18 55 / 30%)";
const ACCENT_BG = "oklch(0.75 0.18 55 / 6%)";
const BG = "oklch(0.09 0.015 30)";
const BG2 = "oklch(0.12 0.015 30)";

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

  // 未登录 - 显示购买弹窗入口
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
          <p className="text-gray-500 text-sm mb-6 font-['Noto_Sans_SC']">
            登录后开通会员即可使用AI文案生成功能
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate("/login")}
              className="neon-btn-primary px-6 py-2.5 rounded text-sm font-semibold"
            >
              登录 / 注册
            </button>
            <button
              onClick={() => setShowPurchase(true)}
              className="neon-btn px-6 py-2.5 rounded text-sm"
            >
              了解会员
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 已登录但未付费（管理员跳过）
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
          <p className="text-gray-500 text-sm mb-2 font-['Noto_Sans_SC']">
            您好，<span className="text-white">{user.name || user.email || "用户"}</span>
          </p>
          <p className="text-gray-500 text-sm mb-6 font-['Noto_Sans_SC']">
            开通会员后即可使用全部功能
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setShowPurchase(true)}
              className="neon-btn-primary px-6 py-2.5 rounded text-sm font-semibold"
            >
              开通会员
            </button>
            <button
              onClick={() => navigate("/")}
              className="neon-btn px-6 py-2.5 rounded text-sm"
            >
              返回首页
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// ─── 主组件 ──────────────────────────────────────────────────────
export default function Generator() {
  const [step, setStep] = useState<Step>("select-industry");
  const [selectedIndustry, setSelectedIndustry] = useState("");
  const [selectedTopicType, setSelectedTopicType] = useState<TopicTypeValue>("对立选题");
  const [ipPosition, setIpPosition] = useState("");
  const [extraInfo, setExtraInfo] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [generatedTopics, setGeneratedTopics] = useState("");
  const [generatedCopy, setGeneratedCopy] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [selectedModel, setSelectedModel] = useState<"manus" | "deepseek">("manus");
  const [, navigate] = useLocation();

  // 读取URL参数预填行业
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const industry = params.get("industry");
    if (industry) {
      setSelectedIndustry(decodeURIComponent(industry));
      setStep("select-topic");
    }
  }, []);

  // ─── tRPC mutations ────────────────────────────────────────────
  const [knowledgeUsed, setKnowledgeUsed] = useState(0);

  const generateTopicsMutation = trpc.copywriter.generateTopics.useMutation({
    onSuccess: (data) => {
      setGeneratedTopics(data.topics);
      setKnowledgeUsed(data.knowledgeUsed ?? 0);
      setStep("topics");
      if (data.knowledgeUsed > 0) {
        toast.success(`✨ 已融入知识库 ${data.knowledgeUsed} 条参考内容`);
      }
    },
    onError: (err) => toast.error("选题生成失败：" + err.message),
  });

  const generateCopyMutation = trpc.copywriter.generateCopy.useMutation({
    onSuccess: (data) => {
      setGeneratedCopy(data.copy);
      setKnowledgeUsed(data.knowledgeUsed ?? 0);
      setStep("copy");
      if (data.knowledgeUsed > 0) {
        toast.success(`✨ 已融入知识库 ${data.knowledgeUsed} 条参考内容`);
      }
    },
    onError: (err) => toast.error("文案生成失败：" + err.message),
  });

  // ─── 处理函数 ──────────────────────────────────────────────────
  const handleIndustrySelect = (industry: string) => {
    setSelectedIndustry(industry);
    setStep("select-topic");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleTopicTypeSelect = (type: TopicTypeValue) => {
    setSelectedTopicType(type);
    setStep("fill-info");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleGenerateTopics = () => {
    if (!ipPosition.trim()) { toast.error("请先填写您的IP定位"); return; }
    generateTopicsMutation.mutate({ industry: selectedIndustry, ipPosition, topicType: selectedTopicType, model: selectedModel });
  };

  const handleSelectTopic = (topic: string) => {
    setSelectedTopic(topic);
    generateCopyMutation.mutate({ industry: selectedIndustry, ipPosition, topicType: selectedTopicType, selectedTopic: topic, extraInfo, model: selectedModel });
  };

  const handleDirectGenerate = () => {
    if (!ipPosition.trim()) { toast.error("请先填写您的IP定位"); return; }
    generateCopyMutation.mutate({ industry: selectedIndustry, ipPosition, topicType: selectedTopicType, extraInfo, model: selectedModel });
  };

  const handleCopy = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      toast.success("文案已复制到剪贴板");
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch { toast.error("复制失败，请手动选择文字复制"); }
  };

  const handleReset = () => {
    setStep("select-industry");
    setSelectedIndustry(""); setSelectedTopicType("对立选题");
    setIpPosition(""); setExtraInfo(""); setSelectedTopic("");
    setGeneratedTopics(""); setGeneratedCopy("");
  };

  // ─── 进度步骤 ─────────────────────────────────────────────────
  const STEPS = [
    { key: "select-industry", label: "选品类" },
    { key: "select-topic", label: "选选题" },
    { key: "fill-info", label: "填信息" },
    { key: "topics", label: "选方向" },
    { key: "copy", label: "看文案" },
  ];
  const currentStepIndex = STEPS.findIndex((s) => s.key === step);

  // ─── 加载动画 ─────────────────────────────────────────────────
  const LoadingDots = () => (
    <div className="flex gap-1">
      {[0, 1, 2].map((i) => (
        <div key={i} className="w-2 h-2 rounded-full animate-bounce"
          style={{ background: ACCENT, animationDelay: `${i * 0.15}s` }} />
      ))}
    </div>
  );

  return (
    <AccessGate>
      <div className="min-h-screen" style={{ background: BG, color: "oklch(0.97 0 0)" }}>
        {/* 会员到期提醒横幅 */}
        <MemberExpiryBanner isAuthenticated={true} />

        {/* 顶部导航 */}
        <nav
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4"
          style={{ background: `${BG}f5`, backdropFilter: "blur(12px)", borderBottom: `1px solid ${ACCENT_DIM}` }}
        >
          <button onClick={() => navigate("/")} className="flex items-center gap-2 group">
            <svg className="w-5 h-5 transition-colors" style={{ color: ACCENT }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            <span className="text-xs text-gray-500 group-hover:text-gray-300 transition-colors font-['Inter'] tracking-widest">
              BACK TO HOME
            </span>
          </button>

          <div className="flex items-center gap-2">
            <span className="status-dot" />
            <span className="text-xs font-['Orbitron'] tracking-widest" style={{ color: ACCENT }}>
              AI COPYWRITER
            </span>
          </div>

          <div className="flex items-center gap-2">
            <QuotaBadge />
            {step !== "select-industry" && (
              <button onClick={handleReset} className="text-xs text-gray-500 hover:text-gray-300 transition-colors font-['Noto_Sans_SC']">
                重新开始
              </button>
            )}
          </div>
        </nav>

        {/* 进度条 */}
        <div
          className="fixed top-[61px] left-0 right-0 z-40 px-6 py-3"
          style={{ background: `${BG}f5`, backdropFilter: "blur(12px)", borderBottom: `1px solid ${ACCENT_DIM}` }}
        >
          <div className="flex items-center justify-center gap-2 max-w-2xl mx-auto">
            {STEPS.map((s, i) => (
              <div key={s.key} className="flex items-center gap-2">
                <div className="flex flex-col items-center">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-['Orbitron'] transition-all duration-300"
                    style={{
                      background: i <= currentStepIndex ? ACCENT : "oklch(0.18 0.01 30)",
                      color: i <= currentStepIndex ? BG : "oklch(0.4 0 0)",
                      border: `2px solid ${i === currentStepIndex ? ACCENT : "oklch(0.22 0.01 30)"}`,
                      boxShadow: i === currentStepIndex ? `0 0 10px ${ACCENT_DIM}` : "none",
                    }}
                  >
                    {i < currentStepIndex ? "✓" : i + 1}
                  </div>
                  <span
                    className="text-[9px] mt-1 font-['Noto_Sans_SC'] hidden sm:block"
                    style={{ color: i <= currentStepIndex ? ACCENT : "oklch(0.35 0 0)" }}
                  >
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="w-8 sm:w-16 h-px transition-all duration-500"
                    style={{ background: i < currentStepIndex ? ACCENT : "oklch(0.22 0.01 30)" }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 主内容区 */}
        <div className="pt-32 pb-20 px-4 max-w-4xl mx-auto">

          {/* ─── STEP 1: 选择行业品类 ─────────────────────────────── */}
          {step === "select-industry" && (
            <div className="animate-fadeIn">
              <div className="text-center mb-10">
                <p className="text-xs font-['Orbitron'] tracking-[0.3em] mb-3 uppercase" style={{ color: ACCENT }}>
                  Step 01 · Select Industry
                </p>
                <h1 className="text-3xl md:text-4xl font-['Noto_Sans_SC'] font-black text-white mb-3">
                  选择你的行业赛道
                </h1>
                <p className="text-gray-500 text-sm font-['Noto_Sans_SC']">
                  AI将根据你的品类特性，生成最适合的爆款文案
                </p>
              </div>

              <div className="space-y-8">
                {INDUSTRIES.map((group) => (
                  <div key={group.group}>
                    <h3 className="text-xs font-['Orbitron'] tracking-widest mb-3" style={{ color: ACCENT }}>
                      {group.group.toUpperCase()}
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {group.items.map((item) => (
                        <button
                          key={item}
                          onClick={() => handleIndustrySelect(item)}
                          className="px-4 py-3 rounded text-left text-sm font-['Noto_Sans_SC'] text-gray-300 transition-all duration-200 hover:text-white"
                          style={{
                            background: ACCENT_BG,
                            border: `1px solid ${ACCENT_DIM}`,
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.borderColor = ACCENT;
                            (e.currentTarget as HTMLElement).style.background = `oklch(0.75 0.18 55 / 12%)`;
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.borderColor = ACCENT_DIM;
                            (e.currentTarget as HTMLElement).style.background = ACCENT_BG;
                          }}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── STEP 2: 选择选题类型 ─────────────────────────────── */}
          {step === "select-topic" && (
            <div className="animate-fadeIn max-w-2xl mx-auto">
              <div className="text-center mb-10">
                <p className="text-xs font-['Orbitron'] tracking-[0.3em] mb-3 uppercase" style={{ color: ACCENT }}>
                  Step 02 · Select Topic Type
                </p>
                <h1 className="text-3xl md:text-4xl font-['Noto_Sans_SC'] font-black text-white mb-3">
                  选择爆款选题类型
                </h1>
                <p className="text-sm font-['Noto_Sans_SC']" style={{ color: ACCENT }}>
                  {selectedIndustry}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {TOPIC_TYPES.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => handleTopicTypeSelect(type.value)}
                    className="p-5 rounded text-left transition-all duration-200 group"
                    style={{
                      background: ACCENT_BG,
                      border: `1px solid ${ACCENT_DIM}`,
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = ACCENT;
                      (e.currentTarget as HTMLElement).style.background = `oklch(0.75 0.18 55 / 12%)`;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = ACCENT_DIM;
                      (e.currentTarget as HTMLElement).style.background = ACCENT_BG;
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{type.icon}</span>
                      <div>
                        <p className="text-white font-semibold font-['Noto_Sans_SC'] mb-1">{type.label}</p>
                        <p className="text-gray-500 text-xs font-['Noto_Sans_SC'] group-hover:text-gray-400 transition-colors">{type.desc}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="text-center mt-6">
                <button onClick={() => setStep("select-industry")} className="text-sm text-gray-600 hover:text-gray-400 transition-colors font-['Noto_Sans_SC']">
                  ← 重新选择品类
                </button>
              </div>
            </div>
          )}

          {/* ─── STEP 3: 填写IP信息 ───────────────────────────────── */}
          {step === "fill-info" && (
            <div className="animate-fadeIn max-w-2xl mx-auto">
              <div className="text-center mb-10">
                <p className="text-xs font-['Orbitron'] tracking-[0.3em] mb-3 uppercase" style={{ color: ACCENT }}>
                  Step 03 · Your IP Profile
                </p>
                <h1 className="text-3xl md:text-4xl font-['Noto_Sans_SC'] font-black text-white mb-3">
                  填写你的IP信息
                </h1>
                <p className="text-sm font-['Noto_Sans_SC'] text-gray-500">
                  <span style={{ color: ACCENT }}>{selectedIndustry}</span>
                  &nbsp;·&nbsp;
                  <span className="text-gray-400">{selectedTopicType}</span>
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-['Noto_Sans_SC'] text-gray-300 mb-2">
                    IP定位 <span className="text-red-400">*必填</span>
                  </label>
                  <textarea
                    value={ipPosition}
                    onChange={(e) => setIpPosition(e.target.value)}
                    placeholder="例如：我是做全屋定制的设计师，有8年经验，专注于小户型空间改造，帮助业主实现收纳最大化"
                    className="w-full px-4 py-3 rounded text-white placeholder-gray-600 focus:outline-none resize-none font-['Noto_Sans_SC'] text-sm transition-colors"
                    style={{ background: BG2, border: `1px solid ${ACCENT_DIM}` }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = ACCENT)}
                    onBlur={(e) => (e.currentTarget.style.borderColor = ACCENT_DIM)}
                    rows={3}
                  />
                  <p className="text-xs text-gray-600 mt-1 font-['Noto_Sans_SC']">描述你是谁、有什么经验、你的优势是什么</p>
                </div>

                <div>
                  <label className="block text-sm font-['Noto_Sans_SC'] text-gray-300 mb-2">
                    补充信息 <span className="text-gray-600">（可选）</span>
                  </label>
                  <textarea
                    value={extraInfo}
                    onChange={(e) => setExtraInfo(e.target.value)}
                    placeholder="例如：主打产品是进口实木衣柜，价格区间3-8万，主要客户是改善型住房业主，门店在上海浦东"
                    className="w-full px-4 py-3 rounded text-white placeholder-gray-600 focus:outline-none resize-none font-['Noto_Sans_SC'] text-sm transition-colors"
                    style={{ background: BG2, border: `1px solid oklch(1 0 0 / 10%)` }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = ACCENT_DIM)}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "oklch(1 0 0 / 10%)")}
                    rows={3}
                  />
                  <p className="text-xs text-gray-600 mt-1 font-['Noto_Sans_SC']">产品特色、价格区间、目标客户、门店特色等</p>
                </div>

                {/* ─── AI模型选择器 ───────────────────────────────────────── */}
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
                            <div className="text-sm font-semibold font-['Noto_Sans_SC']" style={{ color: selectedModel === m.value ? ACCENT : "oklch(0.85 0 0)" }}>
                              {m.label}
                            </div>
                            <div className="text-xs text-gray-500 font-['Noto_Sans_SC']">{m.desc}</div>
                          </div>
                          {selectedModel === m.value && (
                            <svg className="w-4 h-4 ml-auto flex-shrink-0" style={{ color: ACCENT }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    onClick={handleGenerateTopics}
                    disabled={generateTopicsMutation.isPending}
                    className="flex-1 neon-btn-primary py-3 rounded text-sm font-semibold font-['Noto_Sans_SC'] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {generateTopicsMutation.isPending ? (
                      <><LoadingDots /><span>AI正在生成选题...</span></>
                    ) : (
                      <>
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                        </svg>
                        先生成10个选题方向
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleDirectGenerate}
                    disabled={generateCopyMutation.isPending}
                    className="flex-1 neon-btn py-3 rounded text-sm font-semibold font-['Noto_Sans_SC'] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {generateCopyMutation.isPending ? (
                      <><LoadingDots /><span>AI正在创作...</span></>
                    ) : (
                      <>
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                        直接生成爆款文案
                      </>
                    )}
                  </button>
                </div>

                {(generateTopicsMutation.isPending || generateCopyMutation.isPending) && (
                  <div className="text-center py-6">
                    <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full"
                      style={{ border: `1px solid ${ACCENT_DIM}`, background: ACCENT_BG }}>
                      <LoadingDots />
                      <span className="text-sm font-['Noto_Sans_SC']" style={{ color: ACCENT }}>
                        AI正在思考，预计需要10-20秒...
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─── STEP 4: 选题列表 ─────────────────────────────────── */}
          {step === "topics" && (
            <div className="animate-fadeIn max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <p className="text-xs font-['Orbitron'] tracking-[0.3em] mb-3 uppercase" style={{ color: ACCENT }}>
                  Step 04 · Select Topic
                </p>
                <h1 className="text-2xl md:text-3xl font-['Noto_Sans_SC'] font-black text-white mb-3">
                  选择你最喜欢的选题
                </h1>
                <p className="text-gray-500 text-sm font-['Noto_Sans_SC']">点击任意选题，AI将为你生成完整爆款文案</p>
              </div>

              <div className="space-y-2 mb-6">
                {generatedTopics
                  .split("\n")
                  .filter((line) => line.trim() && /^\d+\./.test(line.trim()))
                  .map((line, i) => {
                    const topic = line.replace(/^\d+\.\s*/, "").trim();
                    return (
                      <button
                        key={i}
                        onClick={() => handleSelectTopic(topic)}
                        disabled={generateCopyMutation.isPending}
                        className="w-full text-left px-5 py-4 rounded transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ background: ACCENT_BG, border: `1px solid ${ACCENT_DIM}` }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.borderColor = ACCENT;
                          (e.currentTarget as HTMLElement).style.background = `oklch(0.75 0.18 55 / 12%)`;
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.borderColor = ACCENT_DIM;
                          (e.currentTarget as HTMLElement).style.background = ACCENT_BG;
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-xs font-['Orbitron'] mt-0.5 flex-shrink-0" style={{ color: ACCENT }}>
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <span className="text-sm text-gray-300 group-hover:text-white font-['Noto_Sans_SC'] transition-colors">
                            {topic}
                          </span>
                          <svg className="w-4 h-4 text-gray-600 group-hover:text-[oklch(0.75_0.18_55)] transition-colors ml-auto flex-shrink-0 mt-0.5"
                            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                          </svg>
                        </div>
                      </button>
                    );
                  })}
              </div>

              {generateCopyMutation.isPending && (
                <div className="text-center py-8">
                  <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full"
                    style={{ border: `1px solid ${ACCENT_DIM}`, background: ACCENT_BG }}>
                    <LoadingDots />
                    <span className="text-sm font-['Noto_Sans_SC']" style={{ color: ACCENT }}>AI正在创作爆款文案...</span>
                  </div>
                </div>
              )}

              <div className="text-center mt-4">
                <button onClick={handleGenerateTopics} disabled={generateTopicsMutation.isPending}
                  className="text-sm text-gray-500 hover:text-gray-300 transition-colors font-['Noto_Sans_SC'] disabled:opacity-50">
                  ↻ 不满意？重新生成10个选题
                </button>
              </div>
            </div>
          )}

          {/* ─── STEP 5: 文案展示 ─────────────────────────────────── */}
          {step === "copy" && (
            <div className="animate-fadeIn max-w-3xl mx-auto">
              <div className="text-center mb-8">
                <p className="text-xs font-['Orbitron'] tracking-[0.3em] mb-3 uppercase" style={{ color: ACCENT }}>
                  Step 05 · Your Copy is Ready
                </p>
                <h1 className="text-2xl md:text-3xl font-['Noto_Sans_SC'] font-black text-white mb-3">
                  🎉 爆款文案已生成
                </h1>
                <div className="flex items-center justify-center gap-3 text-sm text-gray-500 font-['Noto_Sans_SC']">
                  <span style={{ color: ACCENT }}>{selectedIndustry}</span>
                  <span>·</span>
                  <span className="text-gray-400">{selectedTopicType}</span>
                  {selectedTopic && (
                    <><span>·</span><span className="text-gray-400 max-w-xs truncate">{selectedTopic}</span></>
                  )}
                </div>
                <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs"
                    style={{ background: 'oklch(0.65 0.18 55 / 0.08)', border: '1px solid oklch(0.65 0.18 55 / 0.25)', color: 'oklch(0.75 0.18 55)' }}>
                    {selectedModel === "deepseek" ? "💡" : "🌟"}
                    &nbsp;{selectedModel === "deepseek" ? "DeepSeek V3" : "Gemini 2.5 Flash"}
                  </div>
                  {knowledgeUsed > 0 && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs"
                      style={{ background: 'oklch(0.65 0.18 55 / 0.1)', border: '1px solid oklch(0.65 0.18 55 / 0.3)', color: 'oklch(0.75 0.18 55)' }}>
                      ✨ 已融入知识库 {knowledgeUsed} 条参考内容
                    </div>
                  )}
                </div>
              </div>

              {/* 文案内容 */}
              <div className="rounded p-6 mb-6 relative" style={{ background: BG2, border: `1px solid ${ACCENT_DIM}` }}>
                <button
                  onClick={() => handleCopy(generatedCopy, -1)}
                  className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition-all font-['Noto_Sans_SC']"
                  style={{ border: `1px solid ${ACCENT_DIM}`, color: ACCENT }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = ACCENT_BG}
                  onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = "transparent"}
                >
                  {copiedIndex === -1 ? (
                    <><svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>已复制</>
                  ) : (
                    <><svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>复制全文</>
                  )}
                </button>

                <div className="prose prose-invert prose-sm max-w-none">
                  <Streamdown>{generatedCopy}</Streamdown>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button onClick={() => { setStep("topics"); setGeneratedCopy(""); }}
                  className="neon-btn py-3 rounded text-sm font-semibold font-['Noto_Sans_SC'] flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 12H5M12 5l-7 7 7 7" />
                  </svg>
                  换个选题
                </button>
                <button onClick={handleDirectGenerate} disabled={generateCopyMutation.isPending}
                  className="neon-btn py-3 rounded text-sm font-semibold font-['Noto_Sans_SC'] flex items-center justify-center gap-2 disabled:opacity-50">
                  {generateCopyMutation.isPending ? <><LoadingDots /><span>生成中...</span></> : (
                    <><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
                    </svg>重新生成</>
                  )}
                </button>
                <button onClick={handleReset}
                  className="neon-btn-primary py-3 rounded text-sm font-semibold font-['Noto_Sans_SC'] flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12l7-7 7 7" />
                  </svg>
                  生成新文案
                </button>
              </div>

              {/* 使用提示 */}
              <div className="mt-6 p-4 rounded" style={{ border: `1px solid ${ACCENT_DIM}`, background: ACCENT_BG }}>
                <p className="text-xs font-['Noto_Sans_SC'] mb-2 font-semibold" style={{ color: ACCENT }}>💡 使用建议</p>
                <ul className="text-xs text-gray-500 font-['Noto_Sans_SC'] space-y-1">
                  <li>• 文案仅供参考，建议根据你的实际情况进行个性化修改</li>
                  <li>• 将门店地址、真实案例、具体数据替换进文案效果更佳</li>
                  <li>• 建议配合真实的门店/产品照片或视频使用</li>
                  <li>• 可多次生成，选择最适合你风格的版本</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </AccessGate>
  );
}
