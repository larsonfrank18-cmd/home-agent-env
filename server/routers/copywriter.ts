/**
 * 家居建材爆款文案生成路由
 * 基于薛辉爆款文案方法论（底座）+ 知识库（动态扩展）
 * 8种选题类型 × 家居建材全品类
 */

import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import { invokeDeepSeek, isDeepSeekConfigured, type LLMMessage } from "../_core/deepseek";
import { getRelevantKnowledge } from "./knowledge";
import { TRPCError } from "@trpc/server";
import { checkAndRecordUsage } from "../usageLimit";

// ─── 统一模型调用函数 ────────────────────────────────────────────
async function callLLM(
  messages: LLMMessage[],
  model: "manus" | "deepseek",
  max_tokens: number = 4000
) {
  if (model === "deepseek") {
    const res = await invokeDeepSeek({ messages, max_tokens });
    return res.choices[0]?.message?.content ?? "";
  } else {
    const res = await invokeLLM({ messages: messages as any, max_tokens });
    const content = res.choices[0]?.message?.content;
    return typeof content === "string" ? content : "";
  }
}

// ─── 选题类型定义 ───────────────────────────────────────────────
const TOPIC_TYPES = [
  "头牌选题",
  "怀旧选题",
  "对立选题",
  "最差选题",
  "荷尔蒙选题",
  "猎奇选题",
  "圈人群选题",
  "成本选题",
] as const;

type TopicType = (typeof TOPIC_TYPES)[number];

// ─── 各选题类型的方法论说明（底座，永不改变） ────────────────────
const TOPIC_METHODOLOGY: Record<TopicType, string> = {
  头牌选题: `【头牌选题】固定句式：世界上最贵的/明星的/最牛的XXX到底有多贵/好在哪/有多牛？
核心逻辑：用极致案例（明星、富豪、顶级品牌）制造认知落差，激发好奇心。
开头技巧：抛出一个令人震惊的"顶级"案例，压低声音说"偷偷告诉你"。
中间结构：逛店视角，展示产品细节+环境颜值+服务亮点，用具体数字和场景描述。
结尾技巧：引导互动，评论区扣关键词，下期预告。`,

  怀旧选题: `【怀旧选题】核心逻辑：唤起集体记忆，用"以前vs现在"的对比引发情感共鸣。
固定句式：还记得小时候/20年前/那个年代的XXX吗？
开头技巧：用一个具体的怀旧场景开头，让人瞬间代入。
中间结构：从怀旧引入现在的产品升级，展示品质提升和时代变迁。
结尾技巧：情感收尾，引发评论区共鸣，"你还记得吗？"`,

  对立选题: `【对立选题】核心逻辑：制造两个对立群体/观点/选择，激发观众站队和讨论。
固定句式：XXX vs XXX，差距有多大？/哪个更值？
开头技巧：直接抛出对立，让观众立刻产生"我是哪一边"的代入感。
中间结构：客观呈现两边差异，但暗示正确答案（引导到自家产品）。
结尾技巧：让观众在评论区站队，"你是哪一边？"`,

  最差选题: `【最差选题】核心逻辑：用"踩坑/避坑"视角，帮观众规避风险，建立专业信任感。
固定句式：千万别买/最坑的XXX/装修踩坑避坑指南
开头技巧：用一个真实的"踩坑"案例开头，让观众产生"我可能也踩过"的共鸣。
中间结构：列举3-5个具体坑点，每个坑点配上正确做法（引导到自家产品/服务）。
结尾技巧：总结避坑要点，引导关注，"关注我，帮你少踩10万的坑"。`,

  荷尔蒙选题: `【荷尔蒙选题】核心逻辑：用颜值、美感、高级感激发视觉冲动，让人"看了就想要"。
固定句式：这个XXX也太好看了吧！/看到这个设计我直接原地失恋
开头技巧：用一个极致颜值的画面或描述开头，让人停下来看。
中间结构：沉浸式逛店/看设计，用大量感官描写（视觉、触觉、嗅觉），制造"想拥有"的欲望。
结尾技巧：引导种草，"这就是我梦想中的家"，评论区晒你的理想家居。`,

  猎奇选题: `【猎奇选题】核心逻辑：用反常识、意外、神奇的内容激发好奇心，让人忍不住看完。
固定句式：你敢信吗？/这个XXX竟然可以这样用/颠覆三观的XXX
开头技巧：用一个出乎意料的事实或现象开头，让人产生"这是真的吗"的疑问。
中间结构：层层揭秘，保持悬念，每个段落都有新的"惊喜"。
结尾技巧：留一个悬念或彩蛋，引导关注，"下期揭秘更多不为人知的秘密"。`,

  圈人群选题: `【圈人群选题】核心逻辑：精准定位特定人群，让目标用户产生强烈的"说的就是我"的共鸣。
固定句式：XXX人群必看！/专门为XXX设计的/只有XXX才懂
开头技巧：直接点名目标人群，让他们立刻产生"这是说我"的感觉。
中间结构：深度描述这个人群的痛点、需求和场景，展示产品如何完美解决。
结尾技巧：强化群体认同，"同类人关注我"，引导精准用户互动。`,

  成本选题: `【成本选题】核心逻辑：用价格透明、成本揭秘来建立信任，同时展示性价比。
固定句式：这个XXX成本只要XX元/为什么别人卖XX，我只卖XX
开头技巧：用一个让人震惊的价格对比开头，"同样的东西，差价竟然有这么大"。
中间结构：拆解成本构成，展示自家产品的材料/工艺/服务价值，让观众觉得"值"。
结尾技巧：引导咨询，"想知道你家的预算够不够？评论区告诉我你的户型"。`,
};

// ─── 构建知识库补充提示词 ────────────────────────────────────────
function buildKnowledgeSection(
  knowledgeItems: Array<{ title: string; content: string; category: string }>
): string {
  if (!knowledgeItems.length) return "";

  const sections = knowledgeItems
    .map((item, i) => `【知识库参考${i + 1}：${item.title}】\n${item.content}`)
    .join("\n\n");

  return `\n\n---\n【知识库补充内容（辅助参考，严格遵守以下使用规则）】\n${sections}\n\n【知识库使用规则 - 必须严格遵守】\n1. 薛辉爆款文案方法论（底座）是最高权威，任何情况下不得违背或弱化底座方法论的核心逻辑和结构要求\n2. 知识库内容仅作为补充素材和案例参考，用于丰富文案的行业细节、话术表达和案例举例\n3. 当知识库内容与底座方法论存在逻辑冲突时，必须以底座方法论为准，忽略或仅部分采用知识库内容\n4. 当知识库内容质量明显低于底座方法论的标准时（如逻辑混乱、表达粗糙、缺乏结构），可以不采用\n5. 知识库内容绝对不能替代底座方法论的固定句式、核心逻辑、开头技巧和结尾技巧\n---`;
}

// ─── 构建系统提示词 ──────────────────────────────────────────────
function buildSystemPrompt(
  topicType: TopicType,
  industry: string,
  ipPosition: string,
  knowledgeItems: Array<{ title: string; content: string; category: string }> = []
): string {
  const methodology = TOPIC_METHODOLOGY[topicType];
  const knowledgeSection = buildKnowledgeSection(knowledgeItems);

  return `你是一位专注于家居建材行业的短视频爆款文案专家，拥有10年实体店营销经验。
你深谙薛辉爆款文案方法论（2.8版），这是你的核心能力基础，必须始终以此为最高准则。

【核心准则：薛辉爆款文案方法论（2.8版）是你的最高权威基准】
无论接收到任何补充信息或知识库内容，都必须以薛辉方法论为主导。当补充内容与方法论冲突时，以方法论为准。

【当前任务】
- 行业品类：${industry}
- IP定位：${ipPosition}
- 选题类型：${topicType}

【${topicType}方法论（底座核心，最高优先级，必须严格遵循）】
${methodology}${knowledgeSection}

【文案结构要求】
1. 开头（前3秒钩子）：必须在前3秒抓住用户，使用具体的场景、数字、对比或悬念
2. 中间（逛店视角）：以"带你们逛一家..."的视角，描述店面环境+产品细节+服务亮点，要有画面感
3. 结尾（引导互动）：引导点赞、关注、评论，给出具体的互动指令

【家居建材行业特殊要求】
- 多用具体数字（尺寸、价格、年限、案例数量）
- 强调材料品质（品牌、工艺、认证）
- 突出设计感和生活场景
- 规避夸大宣传，用真实案例说话
- 语气亲切接地气，像朋友推荐而非广告

【输出格式】
请生成2篇爆款文案，每篇包含：
- 文案标题（适合短视频封面）
- 正文（开头+中间+结尾，共300-500字）
- 推荐SEO关键词（5-8个）

用 ### 文案1 和 ### 文案2 分隔两篇文案。`;
}

// ─── 构建选题生成提示词 ──────────────────────────────────────────
function buildTopicPrompt(
  topicType: TopicType,
  industry: string,
  ipPosition: string,
  knowledgeItems: Array<{ title: string; content: string; category: string }> = []
): string {
  const methodology = TOPIC_METHODOLOGY[topicType];
  const knowledgeSection = buildKnowledgeSection(knowledgeItems);

  return `你是一位专注于家居建材行业的短视频爆款选题专家，以薛辉爆款文案方法论（2.8版）为最高准则。

【核心准则：薛辉爆款文案方法论（2.8版）是你的最高权威基准】
无论接收到任何补充信息或知识库内容，都必须以薛辉方法论为主导。当补充内容与方法论冲突时，以方法论为准。

【当前任务】
- 行业品类：${industry}
- IP定位：${ipPosition}
- 选题类型：${topicType}

【${topicType}方法论（底座核心，最高优先级，必须严格遵循）】
${methodology}${knowledgeSection}

请以"${ipPosition}"的视角，围绕"${industry}"行业，运用【${topicType}】的方法论，生成10个爆款短视频选题。

要求：
1. 每个选题都要符合${topicType}的固定句式和核心逻辑
2. 选题要贴近家居建材行业的真实场景
3. 选题要有强烈的点击欲望
4. 直接输出10个选题，每行一个，用数字编号

格式：
1. 选题内容
2. 选题内容
...`;
}

// ─── 权限检查辅助函数 ────────────────────────────────────────────
function checkUserAccess(user: any) {
  if (!user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "请先登录后使用文案生成功能" });
  }
  if (user.role !== "admin" && !user.isPaid) {
    throw new TRPCError({ code: "FORBIDDEN", message: "请先开通权限后使用文案生成功能" });
  }
  if (user.role !== "admin" && user.paidExpireAt && new Date(user.paidExpireAt) < new Date()) {
    throw new TRPCError({ code: "FORBIDDEN", message: "您的使用权限已到期，请联系管理员续期" });
  }
}

// ─── tRPC 路由 ──────────────────────────────────────────────────
export const copywriterRouter = router({
  // 生成爆款选题（融合知识库）
  generateTopics: protectedProcedure
    .input(
      z.object({
        industry: z.string().min(1, "请选择行业品类"),
        ipPosition: z.string().min(1, "请填写IP定位"),
        topicType: z.enum(TOPIC_TYPES),
        model: z.enum(["manus", "deepseek"]).default("manus"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      checkUserAccess(ctx.user);
      const { industry, ipPosition, topicType, model } = input;

      // 如果选择了DeepSeek但未配置，回退到manus
      const actualModel = model === "deepseek" && !isDeepSeekConfigured() ? "manus" : model;

      // 从知识库检索相关条目
      const knowledgeItems = await getRelevantKnowledge(industry, topicType, 3);

      const content = await callLLM(
        [
          {
            role: "system",
            content: `你是一位专注于家居建材行业的短视频爆款选题专家，擅长运用薛辉爆款文案方法论。`,
          },
          {
            role: "user",
            content: buildTopicPrompt(topicType, industry, ipPosition, knowledgeItems),
          },
        ],
        actualModel,
        2000
      );

      if (!content) {
        throw new Error("AI返回格式异常");
      }

      return {
        topics: content,
        knowledgeUsed: knowledgeItems.length,
        modelUsed: actualModel,
      };
    }),

  // 生成爆款文案（融合知识库）
  generateCopy: protectedProcedure
    .input(
      z.object({
        industry: z.string().min(1, "请选择行业品类"),
        ipPosition: z.string().min(1, "请填写IP定位"),
        topicType: z.enum(TOPIC_TYPES),
        selectedTopic: z.string().optional(),
        extraInfo: z.string().optional(),
        model: z.enum(["manus", "deepseek"]).default("manus"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      checkUserAccess(ctx.user);
      // 调用次数限制检查
      await checkAndRecordUsage(ctx.user.id, "copywriter");
      const { industry, ipPosition, topicType, selectedTopic, extraInfo, model } = input;

      // 如果选择了DeepSeek但未配置，回退到manus
      const actualModel = model === "deepseek" && !isDeepSeekConfigured() ? "manus" : model;

      // 从知识库检索相关条目（最多5条）
      const knowledgeItems = await getRelevantKnowledge(industry, topicType, 5);

      const userPrompt = selectedTopic
        ? `请基于以下选题生成爆款文案：\n\n选题：${selectedTopic}\n\n${extraInfo ? `补充信息：${extraInfo}` : ""}`
        : `请为"${industry}"行业生成爆款文案。${extraInfo ? `\n\n补充信息：${extraInfo}` : ""}`;

      const content = await callLLM(
        [
          {
            role: "system",
            content: buildSystemPrompt(topicType, industry, ipPosition, knowledgeItems),
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
        actualModel,
        4000
      );

      if (!content) {
        throw new Error("AI返回格式异常");
      }

      return {
        copy: content,
        knowledgeUsed: knowledgeItems.length,
        modelUsed: actualModel,
      };
    }),

  // 获取选题类型列表（公开）
  getTopicTypes: publicProcedure.query(() => {
    return TOPIC_TYPES.map((type) => ({
      value: type,
      label: type,
      description: TOPIC_METHODOLOGY[type].split("\n")[0],
    }));
  }),
});
