/* =============================================================
   客户人格判断辅助工具 - DISC分析
   基于DISC模型 + 9种购买行为分析
   ============================================================= */

import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { PurchaseModal } from "@/components/PurchaseModal";
import { QuotaBadge } from "@/components/QuotaBadge";
import MemberExpiryBanner from "@/components/MemberExpiryBanner";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  Brain,
  User,
  MessageSquare,
  Image,
  Briefcase,
  Sparkles,
  Copy,
  Check,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Loader2,
  RotateCcw,
} from "lucide-react";

// ─── 类型定义 ────────────────────────────────────────────────────
interface DiscResult {
  discType: "D" | "I" | "S" | "C";
  discTypeLabel: string;
  discTypeDesc: string;
  confidence: number;
  secondaryType: "D" | "I" | "S" | "C" | null;
  behaviorTypes: string[];
  scores: { D: number; I: number; S: number; C: number };
  coreNeeds: string[];
  breakthrough: string;
  recommendedStyle: string;
  scriptSuggestions: Array<{ scenario: string; script: string; tip: string }>;
  taboos: string[];
  summary: string;
  modelUsed: string;
}

// ─── DISC类型配置 ────────────────────────────────────────────────
const DISC_CONFIG = {
  D: { label: "支配型", color: "#ef4444", bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-400", emoji: "🦁", desc: "强势理性" },
  I: { label: "影响型", color: "#f59e0b", bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-400", emoji: "🐒", desc: "强势感性" },
  S: { label: "稳健型", color: "#10b981", bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400", emoji: "🐑", desc: "优柔感性" },
  C: { label: "谨慎型", color: "#3b82f6", bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-400", emoji: "🦊", desc: "优柔理性" },
};

// ─── 复制按钮组件 ────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
      title="复制话术"
    >
      {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
    </button>
  );
}

// ─── 置信度颜色 ──────────────────────────────────────────────────
function getConfidenceColor(confidence: number) {
  if (confidence >= 80) return "text-green-400";
  if (confidence >= 60) return "text-amber-400";
  return "text-red-400";
}

// ─── 主页面组件 ──────────────────────────────────────────────────
export default function DiscAnalyzer() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();

  const [showPurchase, setShowPurchase] = useState(false);

  // 输入状态
  const [avatarDesc, setAvatarDesc] = useState("");
  const [momentContent, setMomentContent] = useState("");
  const [chatContent, setChatContent] = useState("");
  const [occupation, setOccupation] = useState("");
  const [gender, setGender] = useState<"男" | "女" | "未知">("未知");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [selectedModel, setSelectedModel] = useState<"manus" | "deepseek">("manus");

  // 结果状态
  const [result, setResult] = useState<DiscResult | null>(null);
  const [showInputs, setShowInputs] = useState(true);

  // tRPC mutation
  const analyzeMutation = trpc.discAnalyzer.analyzePersonality.useMutation({
    onSuccess: (data) => {
      setResult(data as DiscResult);
      setShowInputs(false);
      toast.success(`分析完成：${data.discTypeLabel}`);
    },
    onError: (err) => {
      toast.error(`分析失败：${err.message}`);
    },
  });

  const handleAnalyze = () => {
    if (!avatarDesc && !momentContent && !chatContent && !occupation && !additionalInfo) {
      toast.error("请至少填写一项客户信息（头像描述、朋友圈内容、聊天言论等）");
      return;
    }
    analyzeMutation.mutate({ avatarDesc, momentContent, chatContent, occupation, gender, additionalInfo, model: selectedModel });
  };

  const handleReset = () => {
    setResult(null);
    setShowInputs(true);
    setAvatarDesc("");
    setMomentContent("");
    setChatContent("");
    setOccupation("");
    setGender("未知");
    setAdditionalInfo("");
  };

  // 未登录提示
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "oklch(0.08 0.015 240)" }}>
        <PurchaseModal open={showPurchase} onClose={() => setShowPurchase(false)} />
        <Card className="max-w-md w-full mx-4 border-white/10 bg-white/5">
          <CardContent className="pt-8 pb-8 text-center">
            <Brain size={48} className="mx-auto mb-4 text-orange-400" />
            <h2 className="text-xl font-bold text-white mb-2">请先登录</h2>
            <p className="text-gray-400 mb-6">登录并开通会员即可使用客户人格分析工具</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => (window.location.href = getLoginUrl())} className="bg-orange-500 hover:bg-orange-600">
                立即登录
              </Button>
              <Button variant="outline" onClick={() => setShowPurchase(true)} className="border-orange-500/50 text-orange-400 hover:bg-orange-500/10">
                了解会员
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isPaid = user?.role === "admin" || (user as any)?.isPaid;
  if (!isPaid) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "oklch(0.08 0.015 240)" }}>
        <PurchaseModal open={showPurchase} onClose={() => setShowPurchase(false)} />
        <Card className="max-w-md w-full mx-4 border-orange-500/30 bg-orange-500/5">
          <CardContent className="pt-8 pb-8 text-center">
            <Brain size={48} className="mx-auto mb-4 text-orange-400" />
            <h2 className="text-xl font-bold text-white mb-2">功能需要开通权限</h2>
            <p className="text-gray-400 mb-2">您好，<span className="text-white">{user?.name || user?.email || "用户"}</span></p>
            <p className="text-gray-500 text-sm mb-6">开通会员后即可使用客户人格分析工具</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => setShowPurchase(true)} className="bg-orange-500 hover:bg-orange-600">
                开通会员
              </Button>
              <Button variant="outline" onClick={() => navigate("/")} className="border-white/20 text-gray-400 hover:bg-white/5">
                返回首页
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const discConf = result ? DISC_CONFIG[result.discType] : null;

  // 雷达图数据
  const radarData = result
    ? [
        { subject: "D 支配", value: result.scores.D, fullMark: 100 },
        { subject: "I 影响", value: result.scores.I, fullMark: 100 },
        { subject: "S 稳健", value: result.scores.S, fullMark: 100 },
        { subject: "C 谨慎", value: result.scores.C, fullMark: 100 },
      ]
    : [];

  return (
    <div className="min-h-screen pt-20 pb-12 px-4" style={{ background: "oklch(0.08 0.015 240)", color: "oklch(0.97 0 0)" }}>
      {/* 会员到期提醒横幅 */}
      <MemberExpiryBanner isAuthenticated={true} />
      <div className="max-w-4xl mx-auto">

        {/* 返回按鈕 */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 group text-sm text-gray-500 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            <span className="font-['Inter'] tracking-widest text-xs">
              BACK TO HOME
            </span>
          </button>
          <QuotaBadge accentColor="oklch(0.75 0.18 55)" />
        </div>

        {/* 页面标题 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-400 text-sm mb-4">
            <Brain size={14} />
            <span>AI 客户人格分析</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">DISC 人格判断工具</h1>
          <p className="text-gray-400">输入客户的头像、朋友圈、言论等信息，AI 秒判人格类型，给出专属话术策略</p>
        </div>

        {/* DISC类型说明卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {(Object.entries(DISC_CONFIG) as [string, typeof DISC_CONFIG.D][]).map(([type, conf]) => (
            <div key={type} className={`rounded-lg border p-3 ${conf.bg} ${conf.border}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{conf.emoji}</span>
                <span className={`font-bold text-sm ${conf.text}`}>{type}型 · {conf.label}</span>
              </div>
              <p className="text-gray-400 text-xs">{conf.desc}</p>
            </div>
          ))}
        </div>

        {/* 输入区域 */}
        <Card className={`border-white/10 bg-white/5 mb-6 transition-all ${!showInputs && result ? "opacity-70" : ""}`}>
          <CardHeader
            className="cursor-pointer"
            onClick={() => result && setShowInputs(!showInputs)}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <User size={18} className="text-orange-400" />
                填写客户信息
                <span className="text-sm font-normal text-gray-400">（至少填写一项）</span>
              </CardTitle>
              {result && (
                <button className="text-gray-400 hover:text-white">
                  {showInputs ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
              )}
            </div>
          </CardHeader>

          {showInputs && (
            <CardContent className="space-y-5">
              {/* 性别 + 职业 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-300 mb-2 block">性别</Label>
                  <div className="flex gap-2">
                    {(["未知", "男", "女"] as const).map((g) => (
                      <button
                        key={g}
                        onClick={() => setGender(g)}
                        className={`px-4 py-2 rounded-lg border text-sm transition-colors ${
                          gender === g
                            ? "border-orange-500 bg-orange-500/20 text-orange-400"
                            : "border-white/10 bg-white/5 text-gray-400 hover:border-white/20"
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-gray-300 mb-2 flex items-center gap-1">
                    <Briefcase size={14} />
                    职业 / 身份
                  </Label>
                  <input
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    placeholder="如：老板、设计师、装修公司采购..."
                    className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 text-sm"
                  />
                </div>
              </div>

              {/* 头像描述 */}
              <div>
                <Label className="text-gray-300 mb-2 flex items-center gap-1">
                  <Image size={14} />
                  头像描述
                </Label>
                <Textarea
                  value={avatarDesc}
                  onChange={(e) => setAvatarDesc(e.target.value)}
                  placeholder="描述客户头像内容，如：本人正装照、家庭合照、风景图、卡通头像、孩子照片..."
                  className="border-white/10 bg-white/5 text-white placeholder-gray-500 focus:border-orange-500/50 resize-none"
                  rows={2}
                />
              </div>

              {/* 朋友圈内容 */}
              <div>
                <Label className="text-gray-300 mb-2 flex items-center gap-1">
                  <Image size={14} />
                  朋友圈内容
                  <span className="text-gray-500 text-xs ml-1">（粘贴最近几条朋友圈文字）</span>
                </Label>
                <Textarea
                  value={momentContent}
                  onChange={(e) => setMomentContent(e.target.value)}
                  placeholder="粘贴客户最近的朋友圈内容，如：励志语录、美食照、孩子成长记录、工作成就、旅游打卡..."
                  className="border-white/10 bg-white/5 text-white placeholder-gray-500 focus:border-orange-500/50 resize-none"
                  rows={3}
                />
              </div>

              {/* 聊天言论 */}
              <div>
                <Label className="text-gray-300 mb-2 flex items-center gap-1">
                  <MessageSquare size={14} />
                  聊天言论 / 私信内容
                  <span className="text-gray-500 text-xs ml-1">（粘贴客户说过的话）</span>
                </Label>
                <Textarea
                  value={chatContent}
                  onChange={(e) => setChatContent(e.target.value)}
                  placeholder="粘贴客户在私信、评论区或聊天中说过的话，如：'先看看吧'、'你们家跟XX比怎么样'、'直接说价格'..."
                  className="border-white/10 bg-white/5 text-white placeholder-gray-500 focus:border-orange-500/50 resize-none"
                  rows={3}
                />
              </div>

              {/* 其他信息 */}
              <div>
                <Label className="text-gray-300 mb-2 flex items-center gap-1">
                  <Sparkles size={14} />
                  其他补充信息
                </Label>
                <Textarea
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                  placeholder="其他有助于判断的信息，如：说话语气、回复速度、关注点、提问方式..."
                  className="border-white/10 bg-white/5 text-white placeholder-gray-500 focus:border-orange-500/50 resize-none"
                  rows={2}
                />
              </div>

              {/* 模型选择 + 分析按钮 */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-2">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-sm">AI模型：</span>
                  <div className="flex gap-2">
                    {(["manus", "deepseek"] as const).map((m) => (
                      <button
                        key={m}
                        onClick={() => setSelectedModel(m)}
                        className={`px-3 py-1.5 rounded-lg border text-xs transition-colors ${
                          selectedModel === m
                            ? "border-orange-500 bg-orange-500/20 text-orange-400"
                            : "border-white/10 bg-white/5 text-gray-400 hover:border-white/20"
                        }`}
                      >
                        {m === "manus" ? "🌟 Manus 内置" : "💡 DeepSeek V3"}
                      </button>
                    ))}
                  </div>
                </div>
                <Button
                  onClick={handleAnalyze}
                  disabled={analyzeMutation.isPending}
                  className="bg-orange-500 hover:bg-orange-600 text-white ml-auto"
                >
                  {analyzeMutation.isPending ? (
                    <>
                      <Loader2 size={16} className="mr-2 animate-spin" />
                      AI 分析中...
                    </>
                  ) : (
                    <>
                      <Brain size={16} className="mr-2" />
                      开始分析
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          )}
        </Card>

        {/* 分析结果 */}
        {result && discConf && (
          <div className="space-y-5">

            {/* 主类型卡片 */}
            <Card className={`border ${discConf.border} ${discConf.bg}`}>
              <CardContent className="pt-6 pb-6">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                  {/* 类型标识 */}
                  <div className="text-center min-w-[120px]">
                    <div className="text-6xl mb-2">{discConf.emoji}</div>
                    <div className={`text-3xl font-black ${discConf.text}`}>{result.discType}型</div>
                    <div className="text-white font-semibold text-lg">{result.discTypeLabel}</div>
                    <div className="text-gray-400 text-sm">{discConf.desc}</div>
                  </div>

                  {/* 雷达图 */}
                  <div className="flex-1 h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="rgba(255,255,255,0.1)" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: "#9ca3af", fontSize: 12 }} />
                        <Radar
                          name="得分"
                          dataKey="value"
                          stroke={discConf.color}
                          fill={discConf.color}
                          fillOpacity={0.25}
                          strokeWidth={2}
                        />
                        <Tooltip
                          contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#fff" }}
                          formatter={(value: number) => [`${value}分`, "得分"]}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* 核心信息 */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 text-sm">置信度：</span>
                      <span className={`font-bold text-lg ${getConfidenceColor(result.confidence)}`}>
                        {result.confidence}%
                      </span>
                    </div>
                    {result.secondaryType && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-sm">次要类型：</span>
                        <Badge className={`${DISC_CONFIG[result.secondaryType].bg} ${DISC_CONFIG[result.secondaryType].text} border-0`}>
                          {result.secondaryType}型 · {DISC_CONFIG[result.secondaryType].label}
                        </Badge>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-400 text-sm block mb-1">购买行为类型：</span>
                      <div className="flex flex-wrap gap-2">
                        {result.behaviorTypes.map((bt) => (
                          <Badge key={bt} className="bg-white/10 text-gray-300 border-0">{bt}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400 text-sm block mb-1">核心心理需求：</span>
                      <div className="flex flex-wrap gap-2">
                        {result.coreNeeds.map((need) => (
                          <span key={need} className={`px-2 py-0.5 rounded text-xs ${discConf.bg} ${discConf.text} border ${discConf.border}`}>
                            {need}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400 text-sm">推荐话术风格：</span>
                      <span className="text-white font-medium ml-2">{result.recommendedStyle}</span>
                    </div>
                  </div>
                </div>

                {/* 综合说明 */}
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-gray-300 text-sm leading-relaxed">{result.summary}</p>
                </div>
              </CardContent>
            </Card>

            {/* 沟通突破口 */}
            <Card className="border-orange-500/20 bg-orange-500/5">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Sparkles size={16} className="text-orange-400" />
                  </div>
                  <div>
                    <div className="text-orange-400 font-semibold text-sm mb-1">沟通突破口</div>
                    <p className="text-white">{result.breakthrough}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 话术建议 */}
            <Card className="border-white/10 bg-white/5">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2 text-base">
                  <MessageSquare size={16} className="text-orange-400" />
                  专属话术建议（3个场景）
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {result.scriptSuggestions.map((s, i) => (
                  <div key={i} className="rounded-lg border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${discConf.bg} ${discConf.text}`}>
                          {i + 1}
                        </span>
                        <span className="text-white font-medium text-sm">{s.scenario}</span>
                      </div>
                      <CopyButton text={s.script} />
                    </div>
                    <p className="text-gray-200 text-sm leading-relaxed mb-2">{s.script}</p>
                    <p className="text-gray-500 text-xs">💡 {s.tip}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* 禁忌话术 */}
            <Card className="border-red-500/20 bg-red-500/5">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2 text-base">
                  <AlertTriangle size={16} className="text-red-400" />
                  对这类客户的禁忌话术
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.taboos.map((taboo, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-red-400 mt-0.5 flex-shrink-0">✕</span>
                      <span className="text-gray-300 text-sm">{taboo}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 操作按钮 */}
            <div className="flex gap-3 justify-center pt-2">
              <Button
                onClick={() => setShowInputs(true)}
                variant="outline"
                className="border-white/20 text-gray-300 hover:bg-white/10"
              >
                <ChevronUp size={16} className="mr-2" />
                修改信息重新分析
              </Button>
              <Button
                onClick={handleReset}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                <RotateCcw size={16} className="mr-2" />
                分析新客户
              </Button>
            </div>

            {/* 模型标注 */}
            <p className="text-center text-gray-600 text-xs">
              本次分析使用 {result.modelUsed === "deepseek" ? "DeepSeek V3" : "Manus 内置模型"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
