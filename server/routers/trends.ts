/**
 * 热点素材搜索路由
 * - YouTube/search: 获取真实视频数据（播放量、标题、频道）
 * - AI分析: 针对抖音/小红书/视频号生成热点分析报告
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { callDataApi } from "../_core/dataApi";
import { invokeLLM } from "../_core/llm";

// ─── 类型定义 ─────────────────────────────────────────────────────

type YouTubeVideo = {
  title: string;
  videoId: string;
  url: string;
  thumbnail: string;
  channel: string;
  views: string;
  publishedAt: string;
  description: string;
};

// ─── 辅助函数 ─────────────────────────────────────────────────────

function formatViews(n: number | undefined): string {
  if (!n) return "—";
  if (n >= 10000) return `${(n / 10000).toFixed(1)}万`;
  return n.toString();
}

async function searchYouTube(keyword: string): Promise<YouTubeVideo[]> {
  try {
    const result = await callDataApi("Youtube/search", {
      query: { q: keyword, hl: "zh-CN", gl: "CN" },
    }) as { contents?: Array<{ type: string; video?: Record<string, unknown> }> };

    if (!result?.contents) return [];

    return result.contents
      .filter((item) => item.type === "video" && item.video)
      .slice(0, 12)
      .map((item) => {
        const v = item.video as Record<string, unknown>;
        const stats = v.stats as Record<string, number> | undefined;
        const thumbnails = v.thumbnails as Array<{ url: string }> | undefined;
        const richThumbnail = v.richThumbnail as { url?: string } | undefined;
        return {
          title: (v.title as string) || "无标题",
          videoId: (v.videoId as string) || "",
          url: `https://www.youtube.com/watch?v=${v.videoId}`,
          thumbnail: thumbnails?.[0]?.url || richThumbnail?.url || "",
          channel: ((v.author as Record<string, string>)?.title) || "未知频道",
          views: formatViews(stats?.views),
          publishedAt: (v.publishedTimeText as string) || "",
          description: (v.descriptionSnippet as string) || "",
        };
      });
  } catch (e) {
    console.error("[trends] YouTube search error:", e);
    return [];
  }
}

async function analyzeWithAI(
  keyword: string,
  platforms: string[],
  ytVideos: YouTubeVideo[]
): Promise<string> {
  const ytSummary =
    ytVideos.length > 0
      ? ytVideos
          .slice(0, 8)
          .map((v, i) => `${i + 1}. 《${v.title}》 | 频道：${v.channel} | 播放：${v.views}`)
          .join("\n")
      : "（暂无YouTube数据）";

  const platformList = platforms.join("、");

  const prompt = `你是一位专注于家居建材行业的内容营销专家，精通${platformList}等平台的爆款内容规律。

用户正在研究关键词「${keyword}」在各平台的热点内容。

以下是YouTube上相关视频的真实数据供参考：
${ytSummary}

请基于你对家居建材行业内容营销的深度理解，结合上述YouTube数据，为用户提供一份实用的热点分析报告，包含以下内容：

## 📊 当前热点趋势分析
分析「${keyword}」在${platformList}上的内容热点方向（2-3个主要方向）

## 🔥 爆款标题模式
列出8-10个可直接借鉴的爆款标题模板，要符合各平台风格：
- 抖音/视频号风格（短视频标题，15字以内，有冲击力）
- 小红书风格（种草笔记标题，带emoji，有情绪感）

## 💡 高频关键词
列出当前该品类内容中出现频率最高的10-15个关键词/词组

## 📝 内容方向建议
给出3-5个具体的内容创作方向，每个方向说明：选题角度、目标人群、核心卖点

## ⚡ 可直接使用的爆款开头
提供3个可直接用于视频/文章开头的爆款句式

请用简洁专业的语言输出，重点突出可操作性。`;

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content:
          "你是家居建材行业内容营销专家，擅长分析各平台爆款内容规律，输出实用的创作参考报告。",
      },
      { role: "user", content: prompt },
    ],
  });

  return (
    (response as { choices?: Array<{ message?: { content?: string } }> })?.choices?.[0]?.message
      ?.content || "分析失败，请重试"
  );
}

// ─── 路由 ─────────────────────────────────────────────────────────

export const trendsRouter = router({
  /** 搜索热点素材 */
  search: protectedProcedure
    .input(
      z.object({
        keyword: z.string().min(1, "请输入关键词").max(50),
        platforms: z
          .array(z.enum(["抖音", "小红书", "视频号", "快手", "YouTube"]))
          .min(1, "请至少选择一个平台"),
        sortBy: z.enum(["综合", "播放量", "点赞量", "最新"]).default("综合"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // 权限校验：需要付费用户
      if (!ctx.user.isPaid && ctx.user.role !== "admin") {
        const { TRPCError } = await import("@trpc/server");
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "请先开通权限后使用热点搜索功能",
        });
      }

      const { keyword, platforms } = input;

      // 构建YouTube搜索关键词（加上平台词汇增强相关性）
      const ytKeyword = `${keyword} 家居 装修`;

      // 并行执行：YouTube搜索 + AI分析
      const [ytVideos, aiAnalysis] = await Promise.all([
        searchYouTube(ytKeyword),
        analyzeWithAI(keyword, platforms, []),
      ]);

      // 用真实YouTube数据再次请求AI分析（如果有数据）
      const finalAnalysis =
        ytVideos.length > 0 ? await analyzeWithAI(keyword, platforms, ytVideos) : aiAnalysis;

      return {
        keyword,
        platforms,
        youtubeVideos: ytVideos,
        aiAnalysis: finalAnalysis,
        searchedAt: new Date().toISOString(),
      };
    }),
});
