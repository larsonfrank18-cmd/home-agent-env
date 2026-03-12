/**
 * 私信话术生成器路由 v2.0
 * 基于18份销售资料提炼的方法论体系
 * 核心框架：信任漏斗 × DISC人格 × 9种购买行为 × 跷跷板技巧
 * 8大场景 × 3种风格 → 每次生成3条可直接使用的话术
 */

import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import { invokeDeepSeek, isDeepSeekConfigured, type LLMMessage } from "../_core/deepseek";
import { getRelevantKnowledge } from "./knowledge";
import { TRPCError } from "@trpc/server";
import { checkAndRecordUsage } from "../usageLimit";

// ─── 场景定义 ────────────────────────────────────────────────────
const DM_SCENES = [
  "价格询问",
  "比较竞品",
  "犹豫观望",
  "质量疑虑",
  "售后担忧",
  "地址到店",
  "催促紧迫",
  "自定义场景",
] as const;

type DMScene = (typeof DM_SCENES)[number];

// ─── 话术风格定义 ────────────────────────────────────────────────
const DM_STYLES = ["亲切朋友式", "专业顾问式", "简洁高效式"] as const;
type DMStyle = (typeof DM_STYLES)[number];

// ─── 各场景的底层逻辑与转化策略（基于方法论升级版） ────────────────
const SCENE_STRATEGY: Record<DMScene, string> = {
  价格询问: `
【场景：价格询问】

底层逻辑：客户问价格，真正担心的不是"贵"，而是"花冤枉钱"——即担心效果达不到预期。
客户的潜台词是："我不确定你家值不值这个价"。

核心转化策略：
1. 【同位感受】先认同客户询价是聪明消费者的做法，让客户感到被理解
2. 【换框架】把"价格贵"转化为"担心效果"——"您担心的不是贵，是怕花冤枉钱，对吗？"
3. 【价值锚定】如果效果100%满足，多少钱都值——先让客户感受到"值"，再谈价格
4. 【引导下一步】邀约到店量尺/了解需求，"量了才能给您精准报价"

话术技巧：
- 跷跷板技巧：我已经为您做了准备，您来了我才能给您最合适的方案
- 第三人称法：领导专门给您申请了特价名额
- 绝对禁忌：不要直接报价，不要说"我们很便宜"，不要给模糊价格范围
`,

  比较竞品: `
【场景：比较竞品】

底层逻辑：客户货比三家是理性行为，说明有购买意向。
客户的潜台词是："我想买，但还没确定买谁家的"。

核心转化策略：
1. 【认可行为】货比三家是聪明消费者，我来帮您比，省去时间精力
2. 【水平线比较】"咱们对比，能否水平线对比，不能拿奇瑞跟宝马比"——建立正确比较维度
3. 【揭示隐患】低价背后的风险（隐藏费用、服务缺失、材料缩水）——"很多客户被低价吸引，最后吃了哑巴亏"
4. 【差异化聚焦】找到1-2个竞品无法匹敌的核心优势，让客户自己得出结论
5. 【邀约实地】"来看看实物，眼见为实"

话术技巧：
- 绝对不贬低竞品（显得不自信）
- 绝对不说"我们最好"（空口无凭）
- 要让客户自己说出"你家好"
`,

  犹豫观望: `
【场景：犹豫观望】

底层逻辑：客户犹豫的本质是"不够信任"或"过去有过被骗经历"，而非真的不感兴趣。
客户的潜台词是："我感兴趣，但我怕上当"。

核心转化策略：
1. 【确认兴趣】"您考虑了这么久，没有兴趣的话，您不会花这么多时间"
2. 【归因过去】"您不是不相信我，是过去有人欺骗过您，您还没放过自己"——"过去咬您的那条蛇，绝对不是我"
3. 【降低门槛】"来看看没有压力，不买没关系，先了解一下"
4. 【给出退路】"来了不一定要买，我只是想帮您把方案看清楚"
5. 【建立关系】"抛开合作，我们也可以做朋友"

话术技巧：
- 跷跷板技巧：让客户感到"欠了你的"，从而主动推进
- 虚心请教法：用"请教"代替"推销"
- 绝对禁忌：不要催促，不要说"现在不买就亏了"
`,

  质量疑虑: `
【场景：质量疑虑】

底层逻辑：客户用20分钟了解产品，却想否定研发团队两年的心血，这是不公平的。
客户的潜台词是："我怕买了后悔，我需要更多证据"。

核心转化策略：
1. 【反问建立壁垒】"我们研发团队花了两年，您用20分钟就想了解清楚，这可能吗？"
2. 【归因过去经历】"您今天的疑虑，可能是过去类似产品给您带来了不好的体验，但那不是我们"
3. 【用事实说话】具体数字（年限/认证/案例数量）比空口承诺更有力
4. 【多疑型客户专项】多举同行案例，可以让老客户配合"唱双簧"，用第三方背书
5. 【邀约看实物】"来看看样板间，眼见为实"

话术技巧：
- 案例故事法：用第三方案例替代直接说教，降低防御心理
- 绝对禁忌：不要说"我们质量很好"这种空话，要有具体数字和案例
`,

  售后担忧: `
【场景：售后担忧】

底层逻辑：客户担心售后，本质是担心"买完就不管了"，在规避风险。
客户的潜台词是："我怕买了之后出问题没人管"。

核心转化策略：
1. 【认同担忧】"这个担忧非常合理，我也会这样考虑"——同位感受
2. 【具体承诺】给出清晰、具体的售后政策（年限/响应时间/服务内容），不能说"售后没问题"
3. 【本地优势】强调本地服务优势（外地品牌售后难、响应慢）
4. 【建立人情】"我不光是销售，更是您的朋友，出了问题您第一个找我"
5. 【案例背书】"我有个客户，装了X年，上个月还来找我推荐朋友"

话术技巧：
- 先礼后兵：开口前先表达感谢或理解，降低戒备
- 绝对禁忌：不要说"售后没问题"，要给出具体承诺内容和时间节点
`,

  地址到店: `
【场景：地址到店】

底层逻辑：客户问地址，是有到店意向；但客户怕"去了被强行推销"。
客户的潜台词是："我想去看看，但我怕被套路"。

核心转化策略：
1. 【消除推销感】"来了不一定要买，我只是想帮您把方案看清楚"
2. 【制造期待】到店有额外价值（免费量尺/专属优惠/设计师服务/样板间参观）
3. 【预防放鸽子】提前告知已做准备——"我已经给领导打好招呼了，领导特意留出时间接待您"
4. 【预约车位】"我这边已经预留好车位，方便您停车"
5. 【确认时间】"您大概什么时候方便？我来安排"

话术技巧：
- 跷跷板技巧：制造"愧疚感"，让客户不好意思放鸽子
- 第三人称法：借助"领导/设计师"的名义增加到店价值
- 绝对禁忌：不要只回复地址，要让客户感到"去了有收获"
`,

  催促紧迫: `
【场景：催促紧迫】

底层逻辑：逼单要用"制造损失感"而非"施加压力"。
让客户感觉不是你在催他，而是他自己在损失机会。

核心转化策略：
1. 【不催促的催促】明确说"我不是来催您的"，然后给出真实的时间节点
2. 【制造损失感】"这个特价名额只剩最后X个了"——稀缺性
3. 【跷跷板技巧】"我已经把您的订单录入系统了，就等您确认"——让客户感到欠了你的
4. 【第三人称施压】"领导这边一直在问，我也不好意思催您"
5. 【给出退路】"即使不合作，我们也是朋友，宁愿丢一个客户，不愿丢一个朋友"

话术技巧：
- 愧疚感技巧：让客户感觉"不买对不起你"
- 绝对禁忌：不要制造虚假紧迫感，要基于真实活动；不要说"随时都有活动"
`,

  自定义场景: `
【场景：自定义场景】

底层逻辑：根据客户的实际私信内容，判断其人格类型、购买行为类型和真实顾虑，针对性回复。

分析框架（按顺序执行）：
1. 【判断人格类型】
   - 强势理性型（直接、数据敏感）→ 用数字和逻辑说话
   - 强势感性型（热情、爱被认可）→ 多赞美、抬高地位
   - 优柔理性型（严谨、贪小便宜）→ 给选择权、明退暗进
   - 优柔感性型（和善、重家庭）→ 归属感、从家庭入手

2. 【判断购买行为类型】
   - 犹豫型：捕捉内心矛盾，晓之以情
   - 暴躁型：以柔制刚，不要硬碰硬
   - 挑剔型：少说为佳，以事实回答
   - 多疑型：多举案例，用第三方背书
   - 沉稳型：语速慢，不逼单，给选择权

3. 【识别真实顾虑】价格/信任/效果/时机/其他

4. 【选择话术策略】同位感受 + 跷跷板 + 愧疚感

核心原则：回复要自然、真实，不能让客户感觉是在被"套路"。
`,
};

// ─── 风格说明（升级版，融入方法论） ─────────────────────────────
const STYLE_GUIDE: Record<DMStyle, string> = {
  亲切朋友式: `
话术风格：亲切朋友式

语言特征：
- 称呼：用"X哥/X姐"或"亲"，拉近距离
- 开场词：多用"坦白讲"、"说实话"、"不瞒您说"，营造真诚感
- 语气词：适当使用"哈"、"呀"、"嗯"等，口语化
- 句子：短句为主，像朋友聊天，有感情有温度
- 结尾：两个抱拳表情（🙏），表达诚意

适用场景：犹豫观望、售后担忧、催促紧迫、建立关系
适用平台：小红书、微信私信、私域社群
`,

  专业顾问式: `
话术风格：专业顾问式

语言特征：
- 称呼：用"X总"，保持专业距离和尊重
- 开场词：多用"跟您汇报一下"、"从专业角度来看"、"根据我的经验"
- 数据化：多用具体数字（年限/案例数量/认证/响应时间）
- 逻辑性：结构清晰，有1.2.3.的条理感
- 专业术语：适当使用行业术语，体现专业背景

适用场景：价格询问、比较竞品、质量疑虑
适用平台：抖音高客单价产品、企业微信、B端客户
`,

  简洁高效式: `
话术风格：简洁高效式

语言特征：
- 称呼：直接用"您"或名字
- 开场：直接切入主题，不绕弯子
- 句子：极短句，每句话都有信息量
- 结构：用数字列点（1. 2. 3.），清晰明了
- 去除：所有修饰性语言、寒暄语、废话

适用场景：暴躁型客户、地址到店、批量快速回复
适用平台：所有平台通用，尤其适合快速响应场景
`,
};

// ─── 统一模型调用函数 ────────────────────────────────────────────
async function callLLM(
  messages: LLMMessage[],
  model: "manus" | "deepseek",
  max_tokens: number = 3000
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

// ─── 构建系统提示词（基于方法论升级版） ─────────────────────────
function buildSystemPrompt(
  scene: DMScene,
  style: DMStyle,
  industry: string,
  sellingPoints: string,
  currentPromotion: string,
  location: string,
  knowledgeItems: Array<{ title: string; content: string; category: string }>
): string {
  const strategy = SCENE_STRATEGY[scene];
  const styleGuide = STYLE_GUIDE[style];

  const knowledgeSection =
    knowledgeItems.length > 0
      ? `\n\n【知识库补充信息（辅助参考）】\n${knowledgeItems.map((k, i) => `${i + 1}. ${k.title}：${k.content}`).join("\n")}`
      : "";

  const businessInfo = [
    industry && `行业品类：${industry}`,
    sellingPoints && `核心卖点：${sellingPoints}`,
    currentPromotion && `当前活动/优惠：${currentPromotion}`,
    location && `门店位置：${location}`,
  ]
    .filter(Boolean)
    .join("\n");

  return `你是一位专注于家居建材行业的私域运营专家，拥有10年门店销售经验，深谙客户心理。
你的话术体系基于以下核心方法论：

【核心方法论体系】

1. 信任漏斗模型：破冰→同频共鸣→挖掘需求→塑造价值→促成转化
   - 先给予，后索取（互惠原理）
   - 隐藏需求感：让客户感觉你是在帮他，而非卖给他
   - 同位感受：站在客户角度说话，让客户感觉被理解、被尊重

2. 跷跷板技巧：给客户制造"愧疚感"，让对方主动推进
   - "这个项目没有您的支持，恐怕真没我什么事"
   - "领导已经专门为您留出时间，机票都退了"

3. 第三人称沟通法：借助"领导/公司"的名义施压，而非自己直接要求
   - "我们领导开会专门提到您，让我第一时间联系"

4. 换框架技巧：把客户的负面认知转化为正面视角
   - 把"价格贵"换成"担心效果"
   - 把"不信任"换成"过去有过不好的经历"

5. 虚心请教法：用"请教"代替"推销"，让客户感觉自己是专家

6. 先礼后兵：开口前先表达感谢或理解，降低对方戒备

【10条禁忌话术（绝对不能用）】
1. "我能为您做点什么？"（太被动）
2. "请问您想买什么？"（推销感太强）
3. "我们的产品特别好，特别适合您"（自吹自擂）
4. "现在促销，特别划算"（典型推销话）
5. 上来就介绍产品（完全不顾客户感受）
6. "我们质量很好"（空话，无法验证）
7. "随时都有活动"（失去稀缺感）
8. "您不买就亏了"（施加压力，引起反感）
9. 直接报价（失去谈判空间）
10. 贬低竞品（显得不自信）

【商家信息】
${businessInfo || "家居建材商家（未填写具体信息）"}${knowledgeSection}

【当前场景与转化策略】
${strategy}

【话术风格要求】
${styleGuide}

【输出格式要求】
请生成3条私信回复话术，3条话术要覆盖不同的客户心理状态（如：刚刚询问的/已经对比过的/有点犹豫的）：

### 话术1：[适用情况，8字以内]
[回复正文，3-5句话，自然流畅，可直接复制发送给客户]
💡 使用提示：[什么情况下用这条，15字以内]

### 话术2：[适用情况，8字以内]
[回复正文，3-5句话，自然流畅，可直接复制发送给客户]
💡 使用提示：[什么情况下用这条，15字以内]

### 话术3：[适用情况，8字以内]
[回复正文，3-5句话，自然流畅，可直接复制发送给客户]
💡 使用提示：[什么情况下用这条，15字以内]

【质量标准】
- 每条话术必须有明确的行动引导（到店/预约/加微信/发图等）
- 话术要自然真实，不能让客户感觉在被"套路"
- 融入上述方法论技巧（跷跷板/同位感受/换框架等），但要隐性融入，不要生硬
- 根据商家信息和知识库内容，让话术更贴合实际业务
- ${style}风格要贯穿始终，语气统一`;
}

// ─── 权限检查 ────────────────────────────────────────────────────
function checkUserAccess(user: any) {
  if (!user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "请先登录后使用私信话术功能" });
  }
  if (user.role !== "admin" && !user.isPaid) {
    throw new TRPCError({ code: "FORBIDDEN", message: "请先开通权限后使用私信话术功能" });
  }
  if (user.role !== "admin" && user.paidExpireAt && new Date(user.paidExpireAt) < new Date()) {
    throw new TRPCError({ code: "FORBIDDEN", message: "您的使用权限已到期，请联系管理员续期" });
  }
}

// ─── tRPC 路由 ──────────────────────────────────────────────────
export const dmAssistantRouter = router({
  // 获取场景列表（公开）
  getScenes: publicProcedure.query(() => {
    return [
      { value: "价格询问", label: "价格询问", icon: "💰", desc: "客户问多少钱、预算多少" },
      { value: "比较竞品", label: "比较竞品", icon: "⚖️", desc: "客户在货比三家、问差异" },
      { value: "犹豫观望", label: "犹豫观望", icon: "😐", desc: "客户说先看看、还没到那一步" },
      { value: "质量疑虑", label: "质量疑虑", icon: "🔍", desc: "客户问质量、耐用性、材料" },
      { value: "售后担忧", label: "售后担忧", icon: "🛡️", desc: "客户问保修、售后、出问题怎么办" },
      { value: "地址到店", label: "地址到店", icon: "📍", desc: "客户问地址、怎么去、在哪里" },
      { value: "催促紧迫", label: "催促紧迫", icon: "⏰", desc: "客户问活动、现在买划不划算" },
      { value: "自定义场景", label: "自定义场景", icon: "✏️", desc: "粘贴客户原始私信内容" },
    ];
  }),

  // 获取风格列表（公开）
  getStyles: publicProcedure.query(() => {
    return [
      { value: "亲切朋友式", label: "亲切朋友式", desc: "口语化、有温度，适合小红书/微信" },
      { value: "专业顾问式", label: "专业顾问式", desc: "有数据、有逻辑，适合高客单价" },
      { value: "简洁高效式", label: "简洁高效式", desc: "短句直接，适合批量快速回复" },
    ];
  }),

  // 生成私信话术
  generateDMScript: protectedProcedure
    .input(
      z.object({
        scene: z.enum(DM_SCENES),
        style: z.enum(DM_STYLES).default("亲切朋友式"),
        industry: z.string().optional().default(""),
        sellingPoints: z.string().optional().default(""),
        currentPromotion: z.string().optional().default(""),
        location: z.string().optional().default(""),
        customMessage: z.string().optional().default(""), // 自定义场景时填写客户原话
        model: z.enum(["manus", "deepseek"]).default("manus"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      checkUserAccess(ctx.user);
      // 调用次数限制检查
      await checkAndRecordUsage(ctx.user.id, "dm");

      const { scene, style, industry, sellingPoints, currentPromotion, location, customMessage, model } = input;

      // 如果选择了DeepSeek但未配置，回退到manus
      const actualModel = model === "deepseek" && !isDeepSeekConfigured() ? "manus" : model;

      // 从知识库检索相关条目（最多3条）
      const knowledgeItems = await getRelevantKnowledge(industry || "家居建材", scene, 3);

      // 构建用户消息
      let userMessage: string;
      if (scene === "自定义场景" && customMessage) {
        userMessage = `客户发来的私信内容是：\n"${customMessage}"\n\n请先分析这条私信背后的客户心理（人格类型、购买行为类型、真实顾虑），然后生成3条最合适的回复话术。`;
      } else {
        userMessage = `请为"${scene}"场景生成3条私信回复话术。请确保3条话术覆盖不同的客户心理状态，并融入方法论中的跷跷板技巧、同位感受等核心技巧。`;
      }

      const content = await callLLM(
        [
          {
            role: "system",
            content: buildSystemPrompt(
              scene,
              style,
              industry || "",
              sellingPoints || "",
              currentPromotion || "",
              location || "",
              knowledgeItems
            ),
          },
          {
            role: "user",
            content: userMessage,
          },
        ],
        actualModel,
        3500
      );

      if (!content) {
        throw new Error("AI返回格式异常");
      }

      return {
        scripts: content,
        knowledgeUsed: knowledgeItems.length,
        modelUsed: actualModel,
        scene,
        style,
      };
    }),
});
