/* =============================================================
   热点素材搜索页面
   关键词 + 平台选择 → YouTube真实数据 + AI热点分析报告
   ============================================================= */

import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

const PLATFORMS = ["抖音", "小红书", "视频号", "快手", "YouTube"] as const;
type Platform = (typeof PLATFORMS)[number];

const PLATFORM_ICONS: Record<Platform, string> = {
  抖音: "🎵",
  小红书: "📕",
  视频号: "📹",
  快手: "⚡",
  YouTube: "▶️",
};

const SORT_OPTIONS = ["综合", "播放量", "点赞量", "最新"] as const;

const PRESET_KEYWORDS = [
  "全屋定制", "系统门窗", "整体橱柜", "地板铺装",
  "卫浴改造", "智能家居", "墙面装饰", "灯光设计",
];

type SearchResult = {
  keyword: string;
  platforms: Platform[];
  youtubeVideos: Array<{
    title: string;
    videoId: string;
    url: string;
    thumbnail: string;
    channel: string;
    views: string;
    publishedAt: string;
    description: string;
  }>;
  aiAnalysis: string;
  searchedAt: string;
};

export default function Trends() {
  const [, navigate] = useLocation();
  const [keyword, setKeyword] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(["抖音", "小红书"]);
  const [sortBy, setSortBy] = useState<"综合" | "播放量" | "点赞量" | "最新">("综合");
  const [result, setResult] = useState<SearchResult | null>(null);
  const [activeTab, setActiveTab] = useState<"videos" | "analysis">("analysis");

  const { data: me } = trpc.auth.me.useQuery();

  const searchMutation = trpc.trends.search.useMutation({
    onSuccess: (data) => {
      setResult(data as SearchResult);
      setActiveTab("analysis");
      toast.success("热点分析完成！");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const togglePlatform = (p: Platform) => {
    setSelectedPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  };

  const handleSearch = () => {
    if (!keyword.trim()) {
      toast.error("请输入关键词");
      return;
    }
    if (selectedPlatforms.length === 0) {
      toast.error("请至少选择一个平台");
      return;
    }
    searchMutation.mutate({ keyword: keyword.trim(), platforms: selectedPlatforms, sortBy });
  };

  // 未登录
  if (!me) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🔍</div>
          <p className="text-gray-400 mb-4">请先登录后使用热点搜索功能</p>
          <button
            onClick={() => navigate("/login")}
            className="bg-[oklch(0.75_0.18_55)] text-black px-6 py-2 rounded-lg text-sm font-semibold hover:bg-[oklch(0.8_0.18_55)] transition-colors"
          >
            去登录
          </button>
        </div>
      </div>
    );
  }

  // 未付费
  if (!me.isPaid && me.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-white font-bold text-lg mb-2">需要开通权限</h2>
          <p className="text-gray-400 text-sm mb-6">
            热点素材搜索功能需要开通付费权限后使用，请联系管理员开通。
          </p>
          <button
            onClick={() => navigate("/")}
            className="border border-[oklch(0.75_0.18_55/50%)] text-[oklch(0.75_0.18_55)] px-6 py-2 rounded-lg text-sm hover:bg-[oklch(0.75_0.18_55/10%)] transition-colors"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* 导航栏 */}
      <nav className="glass-nav sticky top-0 z-50">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="text-gray-500 hover:text-[oklch(0.75_0.18_55)] transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <span className="text-white font-semibold text-sm">热点素材搜索</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-1 rounded-full bg-[oklch(0.75_0.18_55/15%)] text-[oklch(0.75_0.18_55)]">
              AI驱动
            </span>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* 搜索区域 */}
        <div className="mb-8 p-6 rounded-2xl border border-[oklch(0.75_0.18_55/20%)] bg-[oklch(0.12_0.015_30)]">
          {/* 标题 */}
          <div className="mb-5">
            <h1 className="text-white font-bold text-xl mb-1">全网热点素材分析</h1>
            <p className="text-gray-500 text-sm">
              输入品类关键词，AI自动分析各平台爆款内容规律，提炼可借鉴的标题模板和创作方向
            </p>
          </div>

          {/* 关键词输入 */}
          <div className="mb-4">
            <label className="block text-xs text-gray-400 mb-2 font-medium">关键词</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="例如：全屋定制、系统门窗、整体橱柜..."
                className="flex-1 bg-[oklch(0.09_0.01_30)] border border-[oklch(1_0_0/12%)] rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[oklch(0.75_0.18_55/60%)] transition-colors"
              />
            </div>
            {/* 快捷词 */}
            <div className="flex flex-wrap gap-2 mt-2">
              {PRESET_KEYWORDS.map((kw) => (
                <button
                  key={kw}
                  onClick={() => setKeyword(kw)}
                  className={`text-xs px-3 py-1 rounded-full border transition-all ${
                    keyword === kw
                      ? "border-[oklch(0.75_0.18_55)] text-[oklch(0.75_0.18_55)] bg-[oklch(0.75_0.18_55/10%)]"
                      : "border-[oklch(1_0_0/10%)] text-gray-500 hover:border-[oklch(0.75_0.18_55/40%)] hover:text-gray-300"
                  }`}
                >
                  {kw}
                </button>
              ))}
            </div>
          </div>

          {/* 平台选择 */}
          <div className="mb-4">
            <label className="block text-xs text-gray-400 mb-2 font-medium">
              分析平台 <span className="text-gray-600 font-normal">（可多选）</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((p) => (
                <button
                  key={p}
                  onClick={() => togglePlatform(p)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                    selectedPlatforms.includes(p)
                      ? "border-[oklch(0.75_0.18_55)] bg-[oklch(0.75_0.18_55/15%)] text-[oklch(0.75_0.18_55)]"
                      : "border-[oklch(1_0_0/10%)] text-gray-500 hover:border-[oklch(0.75_0.18_55/30%)] hover:text-gray-300"
                  }`}
                >
                  <span>{PLATFORM_ICONS[p]}</span>
                  <span>{p}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 排序方式 */}
          <div className="mb-5">
            <label className="block text-xs text-gray-400 mb-2 font-medium">分析侧重</label>
            <div className="flex gap-2">
              {SORT_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSortBy(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    sortBy === s
                      ? "border-[oklch(0.75_0.18_55)] bg-[oklch(0.75_0.18_55/15%)] text-[oklch(0.75_0.18_55)]"
                      : "border-[oklch(1_0_0/10%)] text-gray-500 hover:border-[oklch(0.75_0.18_55/30%)]"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* 搜索按钮 */}
          <button
            onClick={handleSearch}
            disabled={searchMutation.isPending}
            className="w-full py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-60 flex items-center justify-center gap-2 bg-[oklch(0.75_0.18_55)] text-black hover:bg-[oklch(0.8_0.18_55)] shadow-[0_0_20px_oklch(0.75_0.18_55/30%)]"
          >
            {searchMutation.isPending ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                正在分析热点，约需15-30秒...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                开始分析热点
              </>
            )}
          </button>
        </div>

        {/* 结果区域 */}
        {result && (
          <div>
            {/* 结果头部 */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-white font-bold text-lg">
                  「{result.keyword}」热点分析报告
                </h2>
                <p className="text-gray-500 text-xs mt-0.5">
                  分析平台：{result.platforms.join("、")} · 生成于 {new Date(result.searchedAt).toLocaleString("zh-CN")}
                </p>
              </div>
              {/* Tab切换 */}
              <div className="flex gap-1 p-1 rounded-lg bg-[oklch(0.12_0.015_30)] border border-[oklch(1_0_0/8%)]">
                <button
                  onClick={() => setActiveTab("analysis")}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    activeTab === "analysis"
                      ? "bg-[oklch(0.75_0.18_55)] text-black"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  AI分析报告
                </button>
                <button
                  onClick={() => setActiveTab("videos")}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    activeTab === "videos"
                      ? "bg-[oklch(0.75_0.18_55)] text-black"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  YouTube参考 ({result.youtubeVideos.length})
                </button>
              </div>
            </div>

            {/* AI分析报告 */}
            {activeTab === "analysis" && (
              <div className="rounded-2xl border border-[oklch(0.75_0.18_55/20%)] bg-[oklch(0.12_0.015_30)] p-6">
                <div className="prose prose-invert prose-sm max-w-none
                  prose-headings:text-[oklch(0.75_0.18_55)] prose-headings:font-bold
                  prose-p:text-gray-300 prose-p:leading-relaxed
                  prose-li:text-gray-300
                  prose-strong:text-white
                  prose-code:text-[oklch(0.75_0.18_55)] prose-code:bg-[oklch(0.75_0.18_55/10%)] prose-code:px-1 prose-code:rounded
                ">
                  <Streamdown>{result.aiAnalysis}</Streamdown>
                </div>
                {/* 操作按钮 */}
                <div className="flex gap-3 mt-6 pt-4 border-t border-[oklch(1_0_0/8%)]">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(result.aiAnalysis);
                      toast.success("报告已复制");
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs border border-[oklch(1_0_0/15%)] text-gray-400 hover:border-[oklch(0.75_0.18_55/40%)] hover:text-[oklch(0.75_0.18_55)] transition-all"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    复制报告
                  </button>
                  <button
                    onClick={() => navigate(`/generator?industry=${encodeURIComponent(result.keyword)}`)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs bg-[oklch(0.75_0.18_55/15%)] border border-[oklch(0.75_0.18_55/40%)] text-[oklch(0.75_0.18_55)] hover:bg-[oklch(0.75_0.18_55/25%)] transition-all"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                    </svg>
                    基于此热点生成文案
                  </button>
                </div>
              </div>
            )}

            {/* YouTube视频列表 */}
            {activeTab === "videos" && (
              <div>
                {result.youtubeVideos.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 rounded-2xl border border-[oklch(1_0_0/8%)] bg-[oklch(0.12_0.015_30)]">
                    <div className="text-3xl mb-2">🎬</div>
                    <p>暂无YouTube相关视频数据</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {result.youtubeVideos.map((video, idx) => (
                      <a
                        key={idx}
                        href={video.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group block rounded-xl border border-[oklch(1_0_0/8%)] bg-[oklch(0.12_0.015_30)] overflow-hidden hover:border-[oklch(0.75_0.18_55/40%)] transition-all"
                      >
                        {/* 缩略图 */}
                        {video.thumbnail ? (
                          <div className="relative aspect-video bg-[oklch(0.09_0.01_30)] overflow-hidden">
                            <img
                              src={video.thumbnail}
                              alt={video.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                              <div className="w-10 h-10 rounded-full bg-[oklch(0.75_0.18_55/90%)] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <svg className="w-4 h-4 text-black ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                                  <polygon points="5 3 19 12 5 21 5 3" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="aspect-video bg-[oklch(0.09_0.01_30)] flex items-center justify-center">
                            <span className="text-gray-600 text-2xl">▶</span>
                          </div>
                        )}

                        {/* 视频信息 */}
                        <div className="p-3">
                          <h3 className="text-white text-sm font-medium line-clamp-2 mb-2 group-hover:text-[oklch(0.75_0.18_55)] transition-colors">
                            {video.title}
                          </h3>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span className="truncate max-w-[60%]">{video.channel}</span>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {video.views !== "—" && (
                                <span className="flex items-center gap-1">
                                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                    <circle cx="12" cy="12" r="3" />
                                  </svg>
                                  {video.views}
                                </span>
                              )}
                              {video.publishedAt && <span>{video.publishedAt}</span>}
                            </div>
                          </div>
                          {video.description && (
                            <p className="text-gray-600 text-xs mt-1.5 line-clamp-2">
                              {video.description}
                            </p>
                          )}
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 空状态提示 */}
        {!result && !searchMutation.isPending && (
          <div className="text-center py-16 text-gray-600">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-sm">输入关键词，选择平台，开始分析热点素材</p>
            <p className="text-xs mt-1 text-gray-700">AI将为您提炼爆款标题模式、高频关键词和内容方向建议</p>
          </div>
        )}
      </div>
    </div>
  );
}
