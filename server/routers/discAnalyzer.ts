/**
 * 客户人格判断辅助工具路由
 * 基于DISC模型 + 9种购买行为分析
 * 输入：头像描述、朋友圈内容、言论、职业等
 * 输出：DISC人格类型、购买行为类型、话术建议、禁忌提示
 */

import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import { invokeDeepSeek, isDeepSeekConfigured, type LLMMessage } from "../_core/deepseek";
import { TRPCError } from "@trpc/server";
import { checkAndRecordUsage } from "../usageLimit";

// ─── DISC 系统提示词（基于方法论体系） ──────────────────────────
const DISC_SYSTEM_PROMPT = `你是一位专业的客户心理分析专家，拥有10年家居建材行业销售经验，深谙DISC人格模型与销售心理学。

【DISC人格模型说明】

D型（支配型 / 强势理性型）：
- 特征：果断、直接、逻辑强、数据敏感、追求效率、重视结果
- 外在表现：说话简短有力、不废话、喜欢掌控局面、头像多为正装或商务照
- 朋友圈特点：发工作成就、行业资讯、励志语录，很少发生活琐事
- 口头禅："直接说重点"、"结果怎么样"、"效率"
- 购买驱动：效率、投资回报、地位提升

I型（影响型 / 强势感性型）：
- 特征：热情、善交际、爱被认可、有感染力、乐观开朗
- 外在表现：头像多为活泼照片、自拍、聚会照，喜欢用表情包
- 朋友圈特点：频繁发自拍、美食、旅游、聚会，互动多、点赞多
- 口头禅："太棒了"、"超级喜欢"、"一起来"
- 购买驱动：被认可、社交价值、新鲜感

S型（稳健型 / 优柔感性型）：
- 特征：和善、随和、耐心、重家庭、优柔寡断、重人际关系
- 外在表现：头像多为家庭照、孩子照，说话温和，不急不躁
- 朋友圈特点：发家庭生活、孩子成长、美食烹饪，很少发工作
- 口头禅："我再想想"、"和家人商量一下"、"不着急"
- 购买驱动：安全感、家人认可、长期关系

C型（谨慎型 / 优柔理性型）：
- 特征：严谨、保守、追求完美、注重细节、贪小便宜、多疑
- 外在表现：头像多为风景或卡通，说话谨慎，喜欢问细节
- 朋友圈特点：很少发朋友圈，或发行业知识、读书笔记
- 口头禅："有没有数据"、"能不能便宜点"、"我需要仔细研究一下"
- 购买驱动：数据证明、细节完美、性价比

【9种购买行为类型】
1. 率直型：褒贬分明，眼里容不得沙子
2. 犹豫型：患得患失，天然优柔寡断
3. 夜郎型：自以为是，盛气凌人
4. 挑剔型：诸多挑剔，要求众多
5. 暴躁型：性格急，追求效率，不喜欢废话
6. 自私型：私心重，斤斤计较，寸利必争
7. 多疑型：习惯性怀疑，缺乏安全感
8. 沉稳型：老成持重，三思而行
9. 独尊型：自以为是，反客为主，喜欢表现

【分析要求】
根据用户提供的客户信息（头像描述、朋友圈内容、言论、职业等），进行综合分析，输出以下内容：

1. DISC主类型（D/I/S/C之一）及置信度（0-100）
2. DISC次类型（可能的第二人格倾向）
3. 购买行为类型（从9种中选1-2种最匹配的）
4. 四个维度的得分（D/I/S/C各0-100分，总和不超过200）
5. 核心心理需求（2-3个关键词）
6. 沟通突破口（最有效的切入点）
7. 推荐话术风格（亲切朋友式/专业顾问式/简洁高效式）
8. 3条具体话术建议（针对家居建材销售场景）
9. 3条绝对禁忌（这类客户最反感的说法）
10. 综合分析说明（100字以内）

【输出格式】
必须严格按照以下JSON格式输出，不要有任何额外文字：

{
  "discType": "D|I|S|C",
  "discTypeLabel": "支配型|影响型|稳健型|谨慎型",
  "discTypeDesc": "对该主类型的简短描述，20字以内",
  "confidence": 85,
  "secondaryType": "D|I|S|C|null",
  "behaviorTypes": ["购买行为类型1", "购买行为类型2"],
  "scores": {
    "D": 75,
    "I": 45,
    "S": 30,
    "C": 50
  },
  "coreNeeds": ["核心需求1", "核心需求2", "核心需求3"],
  "breakthrough": "最有效的沟通切入点，30字以内",
  "recommendedStyle": "亲切朋友式|专业顾问式|简洁高效式",
  "scriptSuggestions": [
    {
      "scenario": "初次接触",
      "script": "具体话术内容，30-50字",
      "tip": "使用提示，15字以内"
    },
    {
      "scenario": "价格谈判",
      "script": "具体话术内容，30-50字",
      "tip": "使用提示，15字以内"
    },
    {
      "scenario": "促成到店",
      "script": "具体话术内容，30-50字",
      "tip": "使用提示，15字以内"
    }
  ],
  "taboos": [
    "禁忌话术1，20字以内",
    "禁忌话术2，20字以内",
    "禁忌话术3，20字以内"
  ],
  "summary": "综合分析说明，100字以内"
}`;

// ─── 统一模型调用函数 ────────────────────────────────────────────
async function callLLM(
  messages: LLMMessage[],
  model: "manus" | "deepseek",
  max_tokens: number = 2000
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

// ─── 权限检查 ────────────────────────────────────────────────────
function checkUserAccess(user: any) {
  if (!user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "请先登录后使用人格分析功能" });
  }
  if (user.role !== "admin" && !user.isPaid) {
    throw new TRPCError({ code: "FORBIDDEN", message: "请先开通权限后使用人格分析功能" });
  }
  if (user.role !== "admin" && user.paidExpireAt && new Date(user.paidExpireAt) < new Date()) {
    throw new TRPCError({ code: "FORBIDDEN", message: "您的使用权限已到期，请联系管理员续期" });
  }
}

// ─── tRPC 路由 ──────────────────────────────────────────────────
export const discAnalyzerRouter = router({
  // 分析客户人格（受保护）
  analyzePersonality: protectedProcedure
    .input(
      z.object({
        // 基本信息
        avatarDesc: z.string().optional().default(""),       // 头像描述
        momentContent: z.string().optional().default(""),   // 朋友圈内容
        chatContent: z.string().optional().default(""),     // 聊天言论/私信内容
        occupation: z.string().optional().default(""),      // 职业/身份
        gender: z.enum(["男", "女", "未知"]).optional().default("未知"),
        additionalInfo: z.string().optional().default(""),  // 其他补充信息
        model: z.enum(["manus", "deepseek"]).default("manus"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      checkUserAccess(ctx.user);
      // 调用次数限制检查
      await checkAndRecordUsage(ctx.user.id, "disc");

      const { avatarDesc, momentContent, chatContent, occupation, gender, additionalInfo, model } = input;

      // 至少需要一项输入
      if (!avatarDesc && !momentContent && !chatContent && !occupation && !additionalInfo) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "请至少填写一项客户信息（头像描述、朋友圈内容、聊天言论等）",
        });
      }

      // 如果选择了DeepSeek但未配置，回退到manus
      const actualModel = model === "deepseek" && !isDeepSeekConfigured() ? "manus" : model;

      // 构建用户输入信息
      const inputParts: string[] = [];
      if (gender !== "未知") inputParts.push(`性别：${gender}`);
      if (occupation) inputParts.push(`职业/身份：${occupation}`);
      if (avatarDesc) inputParts.push(`头像描述：${avatarDesc}`);
      if (momentContent) inputParts.push(`朋友圈内容：\n${momentContent}`);
      if (chatContent) inputParts.push(`聊天言论/私信内容：\n${chatContent}`);
      if (additionalInfo) inputParts.push(`其他补充信息：${additionalInfo}`);

      const userMessage = `请根据以下客户信息，分析其DISC人格类型和购买行为特征：

${inputParts.join("\n\n")}

请严格按照JSON格式输出分析结果。`;

      const content = await callLLM(
        [
          { role: "system", content: DISC_SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        actualModel,
        2000
      );

      if (!content) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "AI分析失败，请重试" });
      }

      // 解析JSON结果
      let result: any;
      try {
        // 提取JSON（有时LLM会在JSON前后加说明文字）
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("未找到JSON");
        result = JSON.parse(jsonMatch[0]);
      } catch {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "AI返回格式异常，请重试",
        });
      }

      return {
        ...result,
        modelUsed: actualModel,
      };
    }),

  // 获取DISC类型说明（公开）
  getDiscTypes: publicProcedure.query(() => {
    return [
      {
        type: "D",
        label: "支配型",
        color: "#ef4444",
        emoji: "🦁",
        keywords: ["果断", "直接", "效率", "结果导向"],
        desc: "强势理性，追求效率和结果，重视数据和逻辑",
      },
      {
        type: "I",
        label: "影响型",
        color: "#f59e0b",
        emoji: "🐒",
        keywords: ["热情", "善交际", "爱被认可", "乐观"],
        desc: "强势感性，热情开朗，重视人际关系和被认可",
      },
      {
        type: "S",
        label: "稳健型",
        color: "#10b981",
        emoji: "🐑",
        keywords: ["和善", "随和", "重家庭", "稳定"],
        desc: "优柔感性，重视家庭和人际关系，需要安全感",
      },
      {
        type: "C",
        label: "谨慎型",
        color: "#3b82f6",
        emoji: "🦊",
        keywords: ["严谨", "保守", "追求完美", "多疑"],
        desc: "优柔理性，注重细节和数据，追求完美和性价比",
      },
    ];
  }),
});
