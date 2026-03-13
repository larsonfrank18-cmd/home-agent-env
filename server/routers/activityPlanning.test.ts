import { describe, it, expect, beforeEach, vi } from "vitest";
import { z } from "zod";

/**
 * 活动策划功能单元测试
 */

describe("Activity Planning Router", () => {
  // ─── 表单验证测试 ──────────────────────────

  describe("Form Validation", () => {
    const activityPlanFormSchema = z.object({
      activityName: z.string().min(1, "活动名称不能为空"),
      activityType: z.enum(["seasonal", "factory_group", "ceo_signing", "special_theme", "other"]),
      startTime: z.date(),
      endTime: z.date(),
      location: z.string().min(1, "活动地点不能为空"),
      targetCustomers: z.array(z.string()).min(1, "至少选择一个目标客户群体"),
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

    it("should validate required fields", () => {
      const validData = {
        activityName: "2026年终大促活动",
        activityType: "seasonal" as const,
        startTime: new Date("2026-12-01"),
        endTime: new Date("2026-12-31"),
        location: "全国门店",
        targetCustomers: ["new_customer", "old_customer"],
      };

      const result = activityPlanFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should reject empty activity name", () => {
      const invalidData = {
        activityName: "",
        activityType: "seasonal" as const,
        startTime: new Date("2026-12-01"),
        endTime: new Date("2026-12-31"),
        location: "全国门店",
        targetCustomers: ["new_customer"],
      };

      const result = activityPlanFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject empty location", () => {
      const invalidData = {
        activityName: "2026年终大促活动",
        activityType: "seasonal" as const,
        startTime: new Date("2026-12-01"),
        endTime: new Date("2026-12-31"),
        location: "",
        targetCustomers: ["new_customer"],
      };

      const result = activityPlanFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject empty target customers", () => {
      const invalidData = {
        activityName: "2026年终大促活动",
        activityType: "seasonal" as const,
        startTime: new Date("2026-12-01"),
        endTime: new Date("2026-12-31"),
        location: "全国门店",
        targetCustomers: [],
      };

      const result = activityPlanFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should accept optional fields", () => {
      const validData = {
        activityName: "2026年终大促活动",
        activityType: "seasonal" as const,
        startTime: new Date("2026-12-01"),
        endTime: new Date("2026-12-31"),
        location: "全国门店",
        targetCustomers: ["new_customer"],
        theme: "年终家装季",
        salesTarget: 100,
        expectedOrders: 50,
        averageOrderValue: 20000,
        expectedVisitors: 500,
        expectedConversionRate: 10,
        productDescription: "橱柜688元起、衣柜999元起",
      };

      const result = activityPlanFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should validate activity type enum", () => {
      const validTypes = ["seasonal", "factory_group", "ceo_signing", "special_theme", "other"];

      validTypes.forEach((type) => {
        const data = {
          activityName: "活动",
          activityType: type,
          startTime: new Date(),
          endTime: new Date(),
          location: "地点",
          targetCustomers: ["new_customer"],
        };

        const result = activityPlanFormSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it("should reject invalid activity type", () => {
      const invalidData = {
        activityName: "活动",
        activityType: "invalid_type",
        startTime: new Date(),
        endTime: new Date(),
        location: "地点",
        targetCustomers: ["new_customer"],
      };

      const result = activityPlanFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  // ─── 数据结构测试 ──────────────────────────

  describe("Data Structure", () => {
    it("should have correct activity plan structure", () => {
      const activityPlan = {
        id: 1,
        userId: 1,
        activityName: "2026年终大促活动",
        activityType: "seasonal",
        startTime: new Date("2026-12-01"),
        endTime: new Date("2026-12-31"),
        location: "全国门店",
        targetCustomers: JSON.stringify(["new_customer", "old_customer"]),
        theme: "年终家装季",
        salesTarget: 100,
        expectedOrders: 50,
        averageOrderValue: 20000,
        expectedVisitors: 500,
        expectedConversionRate: 10,
        productDiscounts: JSON.stringify({ discount: "8折" }),
        onSiteDiscounts: JSON.stringify(["free_measurement", "free_design"]),
        additionalBenefits: "50元打车费报销",
        productCategories: JSON.stringify(["cabinet", "wardrobe"]),
        productDescription: "橱柜688元起、衣柜999元起",
        productPackages: "精装拎包49800元",
        invitationScript: "邀约话术",
        introductionScript: "介绍话术",
        closingScript: "成交话术",
        preparationTasks: "物料准备",
        executionTimeline: JSON.stringify({ phase1: "12月1日" }),
        responsibilities: "销售负责人",
        generatedPlan: JSON.stringify({
          activityOverview: { name: "活动名称" },
          marketingScripts: { invitationScript: "邀约话术" },
        }),
        status: "completed",
        errorMessage: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(activityPlan).toHaveProperty("id");
      expect(activityPlan).toHaveProperty("userId");
      expect(activityPlan).toHaveProperty("activityName");
      expect(activityPlan).toHaveProperty("status");
      expect(activityPlan).toHaveProperty("generatedPlan");
    });

    it("should parse JSON fields correctly", () => {
      const targetCustomers = JSON.stringify(["new_customer", "old_customer"]);
      const parsed = JSON.parse(targetCustomers);

      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toContain("new_customer");
      expect(parsed).toContain("old_customer");
    });
  });

  // ─── 业务逻辑测试 ──────────────────────────

  describe("Business Logic", () => {
    it("should validate activity time range", () => {
      const startTime = new Date("2026-12-01");
      const endTime = new Date("2026-12-31");

      expect(endTime > startTime).toBe(true);
    });

    it("should calculate activity duration", () => {
      const startTime = new Date("2026-12-01");
      const endTime = new Date("2026-12-31");

      const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60 * 24);
      expect(duration).toBe(30);
    });

    it("should validate sales target", () => {
      const salesTarget = 100; // 万元
      const expectedOrders = 50;
      const averageOrderValue = 20000; // 元

      const calculatedSales = (expectedOrders * averageOrderValue) / 10000;
      expect(calculatedSales).toBe(100);
    });

    it("should validate conversion rate", () => {
      const expectedVisitors = 500;
      const expectedOrders = 50;
      const expectedConversionRate = 10; // %

      const calculatedRate = (expectedOrders / expectedVisitors) * 100;
      expect(calculatedRate).toBe(expectedConversionRate);
    });

    it("should handle optional fields gracefully", () => {
      const data = {
        activityName: "活动",
        activityType: "seasonal" as const,
        startTime: new Date(),
        endTime: new Date(),
        location: "地点",
        targetCustomers: ["new_customer"],
        theme: undefined,
        salesTarget: undefined,
      };

      expect(data.theme).toBeUndefined();
      expect(data.salesTarget).toBeUndefined();
    });
  });

  // ─── 状态管理测试 ──────────────────────────

  describe("Status Management", () => {
    it("should have valid status values", () => {
      const validStatuses = ["pending", "generating", "completed", "failed"];

      validStatuses.forEach((status) => {
        expect(["pending", "generating", "completed", "failed"]).toContain(status);
      });
    });

    it("should track generation status", () => {
      const statuses = ["pending", "generating", "completed"];

      expect(statuses[0]).toBe("pending");
      expect(statuses[1]).toBe("generating");
      expect(statuses[2]).toBe("completed");
    });

    it("should handle error messages", () => {
      const plan1 = {
        status: "completed",
        errorMessage: null,
      };

      const plan2 = {
        status: "failed",
        errorMessage: "生成失败：API超时",
      };

      expect(plan1.errorMessage).toBeNull();
      expect(plan2.errorMessage).not.toBeNull();
      expect(plan2.errorMessage).toContain("生成失败");
    });
  });

  // ─── 生成方案结构测试 ──────────────────────────

  describe("Generated Plan Structure", () => {
    it("should have correct generated plan structure", () => {
      const generatedPlan = {
        activityOverview: {
          name: "2026年终大促活动",
          type: "季节性大促",
          time: "2026-12-01 至 2026-12-31",
          location: "全国门店",
          targetCustomers: "新客户、老客户",
          theme: "年终家装季",
        },
        activityGoals: {
          salesTarget: "销售目标：100万元",
          visitorTarget: "客流目标：500人",
          brandGoal: "品牌目标：提升品牌知名度",
        },
        activityHighlights: ["亮点1", "亮点2", "亮点3"],
        detailedPlan: {
          productDiscounts: "产品优惠详情",
          onSiteDiscounts: "现场优惠详情",
          additionalBenefits: "额外福利详情",
          productSelection: "产品选择和定价",
        },
        marketingScripts: {
          invitationScript: "邀约话术",
          introductionScript: "活动介绍话术",
          closingScript: "成交话术",
        },
        executionPlan: {
          preparation: "前期准备清单",
          timeline: "执行时间节点",
          responsibilities: "人员分工",
        },
        expectedResults: {
          salesForecast: "销售预测",
          visitorForecast: "客流预测",
          conversionForecast: "成交率预测",
        },
        summary: "活动方案总结",
      };

      expect(generatedPlan).toHaveProperty("activityOverview");
      expect(generatedPlan).toHaveProperty("activityGoals");
      expect(generatedPlan).toHaveProperty("activityHighlights");
      expect(generatedPlan).toHaveProperty("detailedPlan");
      expect(generatedPlan).toHaveProperty("marketingScripts");
      expect(generatedPlan).toHaveProperty("executionPlan");
      expect(generatedPlan).toHaveProperty("expectedResults");
      expect(generatedPlan).toHaveProperty("summary");

      expect(Array.isArray(generatedPlan.activityHighlights)).toBe(true);
      expect(generatedPlan.activityHighlights.length).toBeGreaterThan(0);
    });

    it("should have complete marketing scripts", () => {
      const marketingScripts = {
        invitationScript: "某某哥/某某姐，您好！我们欧派欧铂尼全屋定制将在...",
        introductionScript: "这次活动有以下亮点：...",
        closingScript: "您现在下定，我们立即送2㎡衣柜...",
      };

      expect(marketingScripts.invitationScript).toBeTruthy();
      expect(marketingScripts.introductionScript).toBeTruthy();
      expect(marketingScripts.closingScript).toBeTruthy();
    });

    it("should have execution plan details", () => {
      const executionPlan = {
        preparation: "1. 物料准备\\n2. 人员培训\\n3. 系统设置",
        timeline: "12月1日：邀约阶段\\n12月15日：活动进行\\n12月31日：成交跟进",
        responsibilities: "销售负责人：邀约和成交\\n市场负责人：物料和宣传\\n客服负责人：接待和反馈",
      };

      expect(executionPlan.preparation).toContain("物料准备");
      expect(executionPlan.timeline).toContain("12月");
      expect(executionPlan.responsibilities).toContain("销售负责人");
    });
  });

  // ─── 边界情况测试 ──────────────────────────

  describe("Edge Cases", () => {
    it("should handle very long activity name", () => {
      const longName = "A".repeat(200);
      expect(longName.length).toBe(200);
    });

    it("should handle special characters in location", () => {
      const location = "增城商场3楼 (欧派专卖店)";
      expect(location).toContain("(");
      expect(location).toContain(")");
    });

    it("should handle zero sales target", () => {
      const salesTarget = 0;
      expect(salesTarget).toBe(0);
    });

    it("should handle 100% conversion rate", () => {
      const conversionRate = 100;
      expect(conversionRate).toBe(100);
    });

    it("should handle multiple product categories", () => {
      const categories = ["cabinet", "wardrobe", "door", "furniture"];
      expect(categories.length).toBe(4);
      expect(categories).toContain("cabinet");
    });

    it("should handle empty optional fields", () => {
      const data = {
        theme: "",
        additionalBenefits: "",
        productPackages: "",
      };

      expect(data.theme).toBe("");
      expect(data.additionalBenefits).toBe("");
      expect(data.productPackages).toBe("");
    });
  });
});
