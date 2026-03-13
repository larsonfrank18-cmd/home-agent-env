/**
 * 活动策划生成路由
 * 用户填写活动策划表单，系统生成完整的活动方案
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import { TRPCError } from "@trpc/server";
import { checkAndRecordUsage } from "../usageLimit";
import { createActivityPlan, getUserActivityPlans, getActivityPlanById, updateActivityPlan } from "../db/activityPlans";

// ─── 活动策划系统提示词 ──────────────────────────
const ACTIVITY_PLANNING_SYSTEM_PROMPT = `你是一位专业的家居建材行业营销专家，拥有15年活动策划和营销推广经验。你擅长根据客户的活动需求，设计和生成完整的、可执行的活动方案。

【活动策划核心要素】

1. 活动目标设定
   - 明确销售目标、客流目标、品牌目标
   - 目标应该是具体、可衡量、可实现的

2. 优惠政策设计
   - 产品优惠：折扣、满减、赠送等
   - 现场优惠：免费测量、免费出图、免费报价等
   - 额外福利：红包、打车费报销等
   - 优惠政策应该有吸引力，但保证利润空间

3. 营销话术准备
   - 邀约话术：吸引客户到场的关键
   - 活动介绍话术：突出活动亮点和优惠
   - 成交话术：促成下定和转化

4. 执行计划制定
   - 明确时间节点
   - 清晰的任务分工
   - 具体的执行步骤

【生成要求】
根据用户提供的活动策划信息，生成一份完整的、专业的、可直接执行的活动方案。方案应该包括：
- 活动概述
- 活动目标
- 活动亮点
- 详细方案（优惠、产品、话术）
- 执行计划
- 预期效果

【输出格式】
必须严格按照以下JSON格式输出，不要有任何额外文字：

{
  "activityOverview": {
    "name": "活动名称",
    "type": "活动类型",
    "time": "活动时间（开始-结束）",
    "location": "活动地点",
    "targetCustomers": "目标客户群体",
    "theme": "活动主题"
  },
  "activityGoals": {
    "salesTarget": "销售目标说明",
    "visitorTarget": "客流目标说明",
    "brandGoal": "品牌目标说明"
  },
  "activityHighlights": [
    "亮点1",
    "亮点2",
    "亮点3"
  ],
  "detailedPlan": {
    "productDiscounts": "产品优惠详情",
    "onSiteDiscounts": "现场优惠详情",
    "additionalBenefits": "额外福利详情",
    "productSelection": "产品选择和定价"
  },
  "marketingScripts": {
    "invitationScript": "邀约话术（包含多个场景）",
    "introductionScript": "活动介绍话术",
    "closingScript": "成交话术"
  },
  "executionPlan": {
    "preparation": "前期准备清单",
    "timeline": "执行时间节点",
    "responsibilities": "人员分工"
  },
  "expectedResults": {
    "salesForecast": "销售预测",
    "visitorForecast": "客流预测",
    "conversionForecast": "成交率预测"
  },
  "summary": "活动方案总结（200字以内）"
}`;

// ─── 表单验证 ──────────────────────────
const CreateActivityPlanInput = z.object({
  activityName: z.string().min(1, "活动名称不能为空"),
  activityType: z.enum(["seasonal", "factory_group", "ceo_signing", "special_theme", "other"]),
  startTime: z.date(),
  endTime: z.date(),
  location: z.string().min(1, "活动地点不能为空"),
  targetCustomers: z.array(z.string()).min(1, "目标客户不能为空"),
  theme: z.string().optional(),
  salesTarget: z.number().optional(),
  expectedOrders: z.number().optional(),
  averageOrderValue: z.number().optional(),
  expectedVisitors: z.number().optional(),
  expectedConversionRate: z.number().optional(),
  productDiscounts: z.record(z.string(), z.any()).optional(),
  onSiteDiscounts: z.array(z.string()).optional(),
  additionalBenefits: z.string().optional(),
  productCategories: z.array(z.string()).optional(),
  productDescription: z.string().optional(),
  productPackages: z.string().optional(),
  invitationScript: z.string().optional(),
  introductionScript: z.string().optional(),
  closingScript: z.string().optional(),
  preparationTasks: z.string().optional(),
  executionTimeline: z.record(z.string(), z.any()).optional(),
  responsibilities: z.string().optional(),
});

export const activityPlanningRouter = router({
  /**
   * 创建活动策划并生成方案
   */
  generatePlan: protectedProcedure
    .input(CreateActivityPlanInput)
    .mutation(async ({ input, ctx }) => {
      // 检查配额
      try {
        await checkAndRecordUsage(ctx.user.id, "copywriter");
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "您已达到今日调用上限，请明天再试或升级会员",
        });
      }

      try {
        // 创建活动策划记录（状态为generating）
        const plan = await createActivityPlan({
          userId: ctx.user.id,
          activityName: input.activityName,
          activityType: input.activityType,
          startTime: input.startTime,
          endTime: input.endTime,
          location: input.location,
          targetCustomers: JSON.stringify(input.targetCustomers),
          theme: input.theme,
          salesTarget: input.salesTarget,
          expectedOrders: input.expectedOrders,
          averageOrderValue: input.averageOrderValue,
          expectedVisitors: input.expectedVisitors,
          expectedConversionRate: input.expectedConversionRate,
          productDiscounts: input.productDiscounts ? JSON.stringify(input.productDiscounts) : null,
          onSiteDiscounts: input.onSiteDiscounts ? JSON.stringify(input.onSiteDiscounts) : null,
          additionalBenefits: input.additionalBenefits,
          productCategories: input.productCategories ? JSON.stringify(input.productCategories) : null,
          productDescription: input.productDescription,
          productPackages: input.productPackages,
          invitationScript: input.invitationScript,
          introductionScript: input.introductionScript,
          closingScript: input.closingScript,
          preparationTasks: input.preparationTasks,
          executionTimeline: input.executionTimeline ? JSON.stringify(input.executionTimeline) : null,
          responsibilities: input.responsibilities,
          status: "generating",
        });

        if (!plan) {
          throw new Error("Failed to create activity plan");
        }

        // 构建用户提供的信息摘要
        const userInfo = `
活动名称：${input.activityName}
活动类型：${input.activityType}
活动时间：${input.startTime.toLocaleDateString()} - ${input.endTime.toLocaleDateString()}
活动地点：${input.location}
目标客户：${input.targetCustomers.join("、")}
活动主题：${input.theme || "未指定"}

销售目标：${input.salesTarget ? `${input.salesTarget}万元` : "未指定"}
期望订单数：${input.expectedOrders || "未指定"}
平均客单价：${input.averageOrderValue ? `${input.averageOrderValue}元` : "未指定"}
期望到场人数：${input.expectedVisitors || "未指定"}
期望转化率：${input.expectedConversionRate ? `${input.expectedConversionRate}%` : "未指定"}

产品优惠：${input.productDiscounts ? JSON.stringify(input.productDiscounts) : "未指定"}
现场优惠：${input.onSiteDiscounts ? input.onSiteDiscounts.join("、") : "未指定"}
额外福利：${input.additionalBenefits || "未指定"}

主要产品类别：${input.productCategories ? input.productCategories.join("、") : "未指定"}
产品描述：${input.productDescription || "未指定"}
产品套餐：${input.productPackages || "未指定"}

邀约话术：${input.invitationScript || "未提供"}
活动介绍话术：${input.introductionScript || "未提供"}
成交话术：${input.closingScript || "未提供"}

前期准备：${input.preparationTasks || "未指定"}
执行时间节点：${input.executionTimeline ? JSON.stringify(input.executionTimeline) : "未指定"}
负责人分工：${input.responsibilities || "未指定"}
`;

        // 调用LLM生成活动方案
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: ACTIVITY_PLANNING_SYSTEM_PROMPT,
            },
            {
              role: "user",
              content: `请根据以下活动信息，生成一份完整的活动策划方案：\n\n${userInfo}`,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "activity_plan",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  activityOverview: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      type: { type: "string" },
                      time: { type: "string" },
                      location: { type: "string" },
                      targetCustomers: { type: "string" },
                      theme: { type: "string" },
                    },
                    required: ["name", "type", "time", "location"],
                  },
                  activityGoals: {
                    type: "object",
                    properties: {
                      salesTarget: { type: "string" },
                      visitorTarget: { type: "string" },
                      brandGoal: { type: "string" },
                    },
                  },
                  activityHighlights: {
                    type: "array",
                    items: { type: "string" },
                  },
                  detailedPlan: {
                    type: "object",
                    properties: {
                      productDiscounts: { type: "string" },
                      onSiteDiscounts: { type: "string" },
                      additionalBenefits: { type: "string" },
                      productSelection: { type: "string" },
                    },
                  },
                  marketingScripts: {
                    type: "object",
                    properties: {
                      invitationScript: { type: "string" },
                      introductionScript: { type: "string" },
                      closingScript: { type: "string" },
                    },
                  },
                  executionPlan: {
                    type: "object",
                    properties: {
                      preparation: { type: "string" },
                      timeline: { type: "string" },
                      responsibilities: { type: "string" },
                    },
                  },
                  expectedResults: {
                    type: "object",
                    properties: {
                      salesForecast: { type: "string" },
                      visitorForecast: { type: "string" },
                      conversionForecast: { type: "string" },
                    },
                  },
                  summary: { type: "string" },
                },
                required: ["activityOverview", "marketingScripts"],
                additionalProperties: false,
              },
            },
          },
        });

        const content = response.choices[0]?.message.content;
        if (!content) {
          throw new Error("LLM returned empty response");
        }

        const generatedPlan = typeof content === "string" ? JSON.parse(content) : content;

        // 更新活动策划记录，保存生成的方案
        const updatedPlan = await updateActivityPlan(plan.id, {
          generatedPlan: JSON.stringify(generatedPlan),
          status: "completed",
        });

        if (!updatedPlan) {
          throw new Error("Failed to update activity plan");
        }

        return {
          success: true,
          planId: updatedPlan.id,
          plan: {
            ...updatedPlan,
            generatedPlan: generatedPlan,
          },
        };
      } catch (error) {
        console.error("[ActivityPlanning] Generation error:", error);

        // 更新状态为failed
        if (error instanceof Error) {
          const plan = await getActivityPlanById(parseInt(error.message) || 0);
          if (plan) {
            await updateActivityPlan(plan.id, {
              status: "failed",
              errorMessage: error.message,
            });
          }
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "活动方案生成失败，请重试",
        });
      }
    }),

  /**
   * 获取用户的所有活动策划
   */
  getMyPlans: protectedProcedure.query(async ({ ctx }) => {
    return await getUserActivityPlans(ctx.user.id);
  }),

  /**
   * 获取活动策划详情
   */
  getPlanById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input, ctx }) => {
    const plan = await getActivityPlanById(input.id);
    if (!plan) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "活动策划不存在",
      });
    }

    // 检查权限
    if (plan.userId !== ctx.user.id && ctx.user.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "您没有权限访问此活动策划",
      });
    }

    return {
      ...plan,
      targetCustomers: JSON.parse(plan.targetCustomers || "[]"),
      productDiscounts: plan.productDiscounts ? JSON.parse(plan.productDiscounts) : null,
      onSiteDiscounts: plan.onSiteDiscounts ? JSON.parse(plan.onSiteDiscounts) : null,
      productCategories: plan.productCategories ? JSON.parse(plan.productCategories) : null,
      executionTimeline: plan.executionTimeline ? JSON.parse(plan.executionTimeline) : null,
      generatedPlan: plan.generatedPlan ? JSON.parse(plan.generatedPlan) : null,
    };
  }),
});
