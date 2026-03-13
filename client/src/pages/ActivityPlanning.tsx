import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { Streamdown } from "streamdown";

// 表单验证schema
const activityPlanFormSchema = z.object({
  activityName: z.string().min(1, "活动名称不能为空"),
  activityType: z.enum(["seasonal", "factory_group", "ceo_signing", "special_theme", "other"]),
  startTime: z.date(),
  endTime: z.date(),
  location: z.string().min(1, "活动地点不能为空"),
  targetCustomers: z.array(z.string()).optional(),
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

type ActivityPlanFormData = z.infer<typeof activityPlanFormSchema>;

const ACTIVITY_TYPES = [
  { value: "seasonal", label: "季节性大促" },
  { value: "factory_group", label: "工厂团购会" },
  { value: "ceo_signing", label: "总裁签售会" },
  { value: "special_theme", label: "特殊主题活动" },
  { value: "other", label: "其他" },
];

const TARGET_CUSTOMERS = [
  { value: "new_customer", label: "新客户" },
  { value: "old_customer", label: "老客户" },
  { value: "specific_community", label: "特定小区业主" },
  { value: "renovation_owner", label: "装修业主" },
  { value: "other", label: "其他" },
];

const PRODUCT_CATEGORIES = [
  { value: "cabinet", label: "橱柜" },
  { value: "wardrobe", label: "衣柜" },
  { value: "door", label: "木门" },
  { value: "furniture", label: "家具" },
  { value: "other", label: "其他" },
];

const ON_SITE_DISCOUNTS = [
  { value: "free_measurement", label: "免费测量" },
  { value: "free_design", label: "免费出图" },
  { value: "free_quote", label: "免费报价" },
  { value: "free_consultation", label: "免费咨询" },
];

export default function ActivityPlanning() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<any>(null);
  const [selectedTargetCustomers, setSelectedTargetCustomers] = useState<string[]>([]);
  const [selectedProductCategories, setSelectedProductCategories] = useState<string[]>([]);
  const [selectedOnSiteDiscounts, setSelectedOnSiteDiscounts] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const generatePlanMutation = trpc.activityPlanning.generatePlan.useMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<ActivityPlanFormData>({
    resolver: zodResolver(activityPlanFormSchema),
    mode: "onBlur",
    defaultValues: {
      activityType: "seasonal",
      targetCustomers: [],
      productCategories: [],
      onSiteDiscounts: [],
    },
  });

  // 导出方案为PDF
  const exportPlanToPDF = async () => {
    if (!generatedPlan) return;

    try {
      // 构建HTML内容
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${generatedPlan.activityOverview?.name || "活动方案"}</title>
  <style>
    * { margin: 0; padding: 0; }
    body { 
      font-family: 'Microsoft YaHei', 'SimHei', sans-serif; 
      line-height: 1.8; 
      color: #333; 
      background: #f5f5f5;
    }
    .container { max-width: 900px; margin: 0 auto; background: white; padding: 40px; }
    h1 { 
      color: #ff9500; 
      font-size: 32px; 
      margin-bottom: 30px; 
      border-bottom: 4px solid #ff9500; 
      padding-bottom: 15px;
      text-align: center;
    }
    h2 { 
      color: #ff9500; 
      font-size: 20px; 
      margin-top: 30px; 
      margin-bottom: 15px;
      border-left: 4px solid #ff9500;
      padding-left: 10px;
    }
    .section { margin-bottom: 30px; page-break-inside: avoid; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px; }
    .info-item { background: #fff3e0; padding: 15px; border-left: 4px solid #ff9500; border-radius: 4px; }
    .info-label { font-weight: bold; color: #ff9500; font-size: 13px; }
    .info-value { color: #333; margin-top: 8px; font-size: 14px; }
    ul, ol { margin-left: 20px; }
    li { margin-bottom: 10px; color: #333; }
    p { margin-bottom: 10px; color: #333; line-height: 1.8; }
    strong { color: #ff9500; }
    .highlight { background: #fff3e0; padding: 20px; border-radius: 4px; margin-bottom: 15px; border-left: 4px solid #ff9500; }
    .footer { margin-top: 50px; text-align: center; color: #999; font-size: 12px; border-top: 1px solid #ddd; padding-top: 20px; }
    @media print { body { background: white; } .container { padding: 20px; } }
  </style>
</head>
<body>
  <div class="container">
    <h1>📋 ${generatedPlan.activityOverview?.name || "活动方案"}</h1>
    
    ${
      generatedPlan.activityOverview
        ? `
      <div class="section">
        <h2>活动概述</h2>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">活动名称</div>
            <div class="info-value">${generatedPlan.activityOverview.name}</div>
          </div>
          <div class="info-item">
            <div class="info-label">活动类型</div>
            <div class="info-value">${generatedPlan.activityOverview.type}</div>
          </div>
          <div class="info-item">
            <div class="info-label">活动时间</div>
            <div class="info-value">${generatedPlan.activityOverview.time}</div>
          </div>
          <div class="info-item">
            <div class="info-label">活动地点</div>
            <div class="info-value">${generatedPlan.activityOverview.location}</div>
          </div>
        </div>
      </div>
    `
        : ""
    }
    
    ${
      generatedPlan.activityGoals
        ? `
      <div class="section">
        <h2>活动目标</h2>
        ${generatedPlan.activityGoals.salesTarget ? `<p><strong>销售目标：</strong> ${generatedPlan.activityGoals.salesTarget}</p>` : ""}
        ${generatedPlan.activityGoals.visitorTarget ? `<p><strong>客流目标：</strong> ${generatedPlan.activityGoals.visitorTarget}</p>` : ""}
        ${generatedPlan.activityGoals.brandGoal ? `<p><strong>品牌目标：</strong> ${generatedPlan.activityGoals.brandGoal}</p>` : ""}
      </div>
    `
        : ""
    }
    
    ${
      generatedPlan.activityHighlights && generatedPlan.activityHighlights.length > 0
        ? `
      <div class="section">
        <h2>活动亮点</h2>
        <ul>
          ${generatedPlan.activityHighlights.map((h: string) => `<li>${h}</li>`).join("")}
        </ul>
      </div>
    `
        : ""
    }
    
    ${
      generatedPlan.detailedPlan
        ? `
      <div class="section">
        <h2>详细方案</h2>
        ${generatedPlan.detailedPlan.productDiscounts ? `<p><strong>产品优惠：</strong> ${generatedPlan.detailedPlan.productDiscounts}</p>` : ""}
        ${generatedPlan.detailedPlan.onSiteDiscounts ? `<p><strong>现场优惠：</strong> ${generatedPlan.detailedPlan.onSiteDiscounts}</p>` : ""}
        ${generatedPlan.detailedPlan.additionalBenefits ? `<p><strong>额外福利：</strong> ${generatedPlan.detailedPlan.additionalBenefits}</p>` : ""}
        ${generatedPlan.detailedPlan.productSelection ? `<p><strong>产品选择：</strong> ${generatedPlan.detailedPlan.productSelection}</p>` : ""}
      </div>
    `
        : ""
    }
    
    ${
      generatedPlan.marketingScripts
        ? `
      <div class="section">
        <h2>营销话术</h2>
        ${
          generatedPlan.marketingScripts.invitationScript
            ? `
          <div class="highlight">
            <strong>邀约话术</strong>
            <p>${generatedPlan.marketingScripts.invitationScript.replace(/\n/g, "<br>")}</p>
          </div>
        `
            : ""
        }
        ${
          generatedPlan.marketingScripts.introductionScript
            ? `
          <div class="highlight">
            <strong>活动介绍话术</strong>
            <p>${generatedPlan.marketingScripts.introductionScript.replace(/\n/g, "<br>")}</p>
          </div>
        `
            : ""
        }
        ${
          generatedPlan.marketingScripts.closingScript
            ? `
          <div class="highlight">
            <strong>成交话术</strong>
            <p>${generatedPlan.marketingScripts.closingScript.replace(/\n/g, "<br>")}</p>
          </div>
        `
            : ""
        }
      </div>
    `
        : ""
    }
    
    ${
      generatedPlan.executionPlan
        ? `
      <div class="section">
        <h2>执行计划</h2>
        ${generatedPlan.executionPlan.preparation ? `<p><strong>前期准备：</strong> ${generatedPlan.executionPlan.preparation.replace(/\n/g, "<br>")}</p>` : ""}
        ${generatedPlan.executionPlan.timeline ? `<p><strong>执行时间节点：</strong> ${generatedPlan.executionPlan.timeline.replace(/\n/g, "<br>")}</p>` : ""}
        ${generatedPlan.executionPlan.responsibilities ? `<p><strong>负责人分工：</strong> ${generatedPlan.executionPlan.responsibilities.replace(/\n/g, "<br>")}</p>` : ""}
      </div>
    `
        : ""
    }
    
    ${
      generatedPlan.expectedResults
        ? `
      <div class="section">
        <h2>预期效果</h2>
        ${generatedPlan.expectedResults.salesForecast ? `<p><strong>销售预测：</strong> ${generatedPlan.expectedResults.salesForecast}</p>` : ""}
        ${generatedPlan.expectedResults.visitorForecast ? `<p><strong>客流预测：</strong> ${generatedPlan.expectedResults.visitorForecast}</p>` : ""}
        ${generatedPlan.expectedResults.conversionForecast ? `<p><strong>转化预测：</strong> ${generatedPlan.expectedResults.conversionForecast}</p>` : ""}
      </div>
    `
        : ""
    }
    
    ${generatedPlan.summary ? `<div class="highlight"><strong>方案总结</strong><p>${generatedPlan.summary}</p></div>` : ""}
    
    <div class="footer">
      <p>此方案由智源AI生成 | 生成时间：${new Date().toLocaleString("zh-CN")}</p>
    </div>
  </div>
</body>
</html>
      `;

      // 使用浏览器API下载PDF
      const element = document.createElement("a");
      element.setAttribute(
        "href",
        "data:text/html;charset=utf-8," + encodeURIComponent(htmlContent)
      );
      element.setAttribute(
        "download",
        `${generatedPlan.activityOverview?.name || "活动方案"}-${new Date().getTime()}.html`
      );
      element.style.display = "none";
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);

      // 提示用户可以在浏览器中打印为PDF
      alert(
        "方案已导出为HTML文件。您可以：\n1. 在浏览器中按 Ctrl+P (或 Cmd+P) 打印\n2. 选择 '另存为PDF' 保存为PDF文件"
      );
    } catch (error) {
      console.error("导出失败:", error);
      alert("导出失败，请重试");
    }
  };

  const onSubmit = async (data: ActivityPlanFormData) => {
    // 验证必选字段
    if (selectedTargetCustomers.length === 0) {
      setErrorMessage("请至少选择一个目标客户群体");
      setIsGenerating(false);
      return;
    }

    setIsGenerating(true);
    setErrorMessage("");
    console.log("开始生成活动方案，表单数据:", data);

    try {
      const result = await generatePlanMutation.mutateAsync({
        ...data,
        targetCustomers: selectedTargetCustomers,
        productCategories: selectedProductCategories,
        onSiteDiscounts: selectedOnSiteDiscounts,
      });

      console.log("活动方案已生成:", result);
      setGeneratedPlan(result.plan.generatedPlan);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "生成活动方案失败，请重试";
      console.error("生成活动方案失败:", error);
      setErrorMessage(errorMsg);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[oklch(0.75_0.18_55)] mb-2">
            活动策划生成器
          </h1>
          <p className="text-lg text-[oklch(0.58_0.04_50)]">
            填写活动信息，AI将为您生成完整的活动方案，包括优惠政策、营销话术和执行计划
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 表单区域 */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6 bg-card border-[oklch(0.75_0.18_55/20%)]">
              <CardHeader>
                <CardTitle>活动信息</CardTitle>
                <CardDescription>填写活动基本信息</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {/* 活动名称 */}
                  <div>
                    <Label htmlFor="activityName">活动名称 *</Label>
                    <Input
                      id="activityName"
                      placeholder="如：2026年终大促活动"
                      {...register("activityName")}
                      className="mt-1"
                    />
                    {errors.activityName && (
                      <p className="text-sm text-red-500 mt-1">
                        {errors.activityName.message}
                      </p>
                    )}
                  </div>

                  {/* 活动类型 */}
                  <div>
                    <Label htmlFor="activityType">活动类型 *</Label>
                    <Select
                      defaultValue="seasonal"
                      onValueChange={(value) =>
                        setValue("activityType", value as any)
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ACTIVITY_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 活动时间 */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="startTime">开始时间 *</Label>
                      <Input
                        id="startTime"
                        type="datetime-local"
                        {...register("startTime", { valueAsDate: true })}
                        className="mt-1"
                      />
                      {errors.startTime && (
                        <p className="text-sm text-red-500 mt-1">
                          {errors.startTime.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="endTime">结束时间 *</Label>
                      <Input
                        id="endTime"
                        type="datetime-local"
                        {...register("endTime", { valueAsDate: true })}
                        className="mt-1"
                      />
                      {errors.endTime && (
                        <p className="text-sm text-red-500 mt-1">
                          {errors.endTime.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 活动地点 */}
                  <div>
                    <Label htmlFor="location">活动地点 *</Label>
                    <Input
                      id="location"
                      placeholder="如：增城商场3楼"
                      {...register("location")}
                      className="mt-1"
                    />
                    {errors.location && (
                      <p className="text-sm text-red-500 mt-1">
                        {errors.location.message}
                      </p>
                    )}
                  </div>

                  {/* 目标客户 */}
                  <div>
                    <Label>目标客户群体 *</Label>
                    <div className="space-y-2 mt-2">
                      {TARGET_CUSTOMERS.map((customer) => (
                        <div key={customer.value} className="flex items-center">
                          <Checkbox
                            id={`customer-${customer.value}`}
                            checked={selectedTargetCustomers.includes(
                              customer.value
                            )}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedTargetCustomers([
                                  ...selectedTargetCustomers,
                                  customer.value,
                                ]);
                              } else {
                                setSelectedTargetCustomers(
                                  selectedTargetCustomers.filter(
                                    (c) => c !== customer.value
                                  )
                                );
                              }
                            }}
                          />
                          <Label
                            htmlFor={`customer-${customer.value}`}
                            className="ml-2 cursor-pointer"
                          >
                            {customer.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                    {selectedTargetCustomers.length === 0 && (
                      <p className="text-sm text-red-500 mt-1">
                        至少选择一个目标客户群体
                      </p>
                    )}
                  </div>

                  {/* 活动主题 */}
                  <div>
                    <Label htmlFor="theme">活动主题</Label>
                    <Input
                      id="theme"
                      placeholder="如：年终感恩回馈"
                      {...register("theme")}
                      className="mt-1"
                    />
                  </div>

                  {/* 销售目标 */}
                  <div>
                    <Label htmlFor="salesTarget">销售目标（万元）</Label>
                    <Input
                      id="salesTarget"
                      type="number"
                      placeholder="如：50"
                      {...register("salesTarget", { valueAsNumber: true })}
                      className="mt-1"
                    />
                  </div>

                  {/* 期望订单数 */}
                  <div>
                    <Label htmlFor="expectedOrders">期望订单数</Label>
                    <Input
                      id="expectedOrders"
                      type="number"
                      placeholder="如：20"
                      {...register("expectedOrders", { valueAsNumber: true })}
                      className="mt-1"
                    />
                  </div>

                  {/* 平均客单价 */}
                  <div>
                    <Label htmlFor="averageOrderValue">平均客单价（元）</Label>
                    <Input
                      id="averageOrderValue"
                      type="number"
                      placeholder="如：25000"
                      {...register("averageOrderValue", { valueAsNumber: true })}
                      className="mt-1"
                    />
                  </div>

                  {/* 期望到场人数 */}
                  <div>
                    <Label htmlFor="expectedVisitors">期望到场人数</Label>
                    <Input
                      id="expectedVisitors"
                      type="number"
                      placeholder="如：100"
                      {...register("expectedVisitors", { valueAsNumber: true })}
                      className="mt-1"
                    />
                  </div>

                  {/* 期望转化率 */}
                  <div>
                    <Label htmlFor="expectedConversionRate">
                      期望转化率（%）
                    </Label>
                    <Input
                      id="expectedConversionRate"
                      type="number"
                      placeholder="如：20"
                      {...register("expectedConversionRate", {
                        valueAsNumber: true,
                      })}
                      className="mt-1"
                    />
                  </div>

                  {/* 产品类别 */}
                  <div>
                    <Label>产品类别</Label>
                    <div className="space-y-2 mt-2">
                      {PRODUCT_CATEGORIES.map((category) => (
                        <div key={category.value} className="flex items-center">
                          <Checkbox
                            id={`product-${category.value}`}
                            checked={selectedProductCategories.includes(
                              category.value
                            )}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedProductCategories([
                                  ...selectedProductCategories,
                                  category.value,
                                ]);
                              } else {
                                setSelectedProductCategories(
                                  selectedProductCategories.filter(
                                    (c) => c !== category.value
                                  )
                                );
                              }
                            }}
                          />
                          <Label
                            htmlFor={`product-${category.value}`}
                            className="ml-2 cursor-pointer"
                          >
                            {category.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 产品描述 */}
                  <div>
                    <Label htmlFor="productDescription">
                      参加活动的产品描述
                    </Label>
                    <Textarea
                      id="productDescription"
                      placeholder="如：橱柜688元起、衣柜999元起、木门7999元"
                      {...register("productDescription")}
                      className="mt-1"
                      rows={3}
                    />
                  </div>

                  {/* 产品套餐 */}
                  <div>
                    <Label htmlFor="productPackages">产品组合/套餐</Label>
                    <Textarea
                      id="productPackages"
                      placeholder="如：精装拎包49800元、全屋定制套餐"
                      {...register("productPackages")}
                      className="mt-1"
                      rows={2}
                    />
                  </div>

                  {/* 现场优惠 */}
                  <div>
                    <Label>现场优惠</Label>
                    <div className="space-y-2 mt-2">
                      {ON_SITE_DISCOUNTS.map((discount) => (
                        <div key={discount.value} className="flex items-center">
                          <Checkbox
                            id={`discount-${discount.value}`}
                            checked={selectedOnSiteDiscounts.includes(
                              discount.value
                            )}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedOnSiteDiscounts([
                                  ...selectedOnSiteDiscounts,
                                  discount.value,
                                ]);
                              } else {
                                setSelectedOnSiteDiscounts(
                                  selectedOnSiteDiscounts.filter(
                                    (c) => c !== discount.value
                                  )
                                );
                              }
                            }}
                          />
                          <Label
                            htmlFor={`discount-${discount.value}`}
                            className="ml-2 cursor-pointer"
                          >
                            {discount.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 额外福利 */}
                  <div>
                    <Label htmlFor="additionalBenefits">额外福利</Label>
                    <Textarea
                      id="additionalBenefits"
                      placeholder="如：50元打车费报销、红包、礼品等"
                      {...register("additionalBenefits")}
                      className="mt-1"
                      rows={2}
                    />
                  </div>

                  {/* 邀约话术 */}
                  <div>
                    <Label htmlFor="invitationScript">邀约话术</Label>
                    <Textarea
                      id="invitationScript"
                      placeholder="输入邀约话术（可选，系统会自动生成）"
                      {...register("invitationScript")}
                      className="mt-1"
                      rows={3}
                    />
                  </div>

                  {/* 活动介绍话术 */}
                  <div>
                    <Label htmlFor="introductionScript">活动介绍话术</Label>
                    <Textarea
                      id="introductionScript"
                      placeholder="输入活动介绍话术（可选，系统会自动生成）"
                      {...register("introductionScript")}
                      className="mt-1"
                      rows={3}
                    />
                  </div>

                  {/* 成交话术 */}
                  <div>
                    <Label htmlFor="closingScript">成交话术</Label>
                    <Textarea
                      id="closingScript"
                      placeholder="输入成交话术（可选，系统会自动生成）"
                      {...register("closingScript")}
                      className="mt-1"
                      rows={3}
                    />
                  </div>

                  {/* 前期准备工作 */}
                  <div>
                    <Label htmlFor="preparationTasks">前期准备工作</Label>
                    <Textarea
                      id="preparationTasks"
                      placeholder="如：物料准备、人员培训、系统设置等"
                      {...register("preparationTasks")}
                      className="mt-1"
                      rows={2}
                    />
                  </div>

                  {/* 负责人及分工 */}
                  <div>
                    <Label htmlFor="responsibilities">负责人及分工</Label>
                    <Textarea
                      id="responsibilities"
                      placeholder="如：销售负责人、市场负责人、客服负责人等"
                      {...register("responsibilities")}
                      className="mt-1"
                      rows={2}
                    />
                  </div>

                  {/* 错误提示 */}
                  {errorMessage && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                      {errorMessage}
                    </div>
                  )}

                  {/* 生成按钮 */}
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isGenerating}
                    size="lg"
                  >
                    {isGenerating ? (
                      <span className="flex items-center gap-2">
                        <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        生成中...
                      </span>
                    ) : (
                      "生成活动方案"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* 结果展示区域 */}
          <div className="lg:col-span-2">
            {generatedPlan ? (
              <div className="space-y-4">
                {/* 操作按钮 */}
                <div className="flex gap-3">
                  <Button
                    onClick={exportPlanToPDF}
                    className="flex-1 bg-[oklch(0.75_0.18_55)] hover:bg-[oklch(0.70_0.18_55)] text-[oklch(0.09_0.01_30)]"
                    size="lg"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    导出方案
                  </Button>
                  <Button
                    onClick={() => setGeneratedPlan(null)}
                    variant="outline"
                    size="lg"
                  >
                    返回编辑
                  </Button>
                </div>

                {/* 方案内容卡片 */}
                <Card className="bg-card border-[oklch(0.75_0.18_55/30%)]">
                  <CardHeader className="bg-[oklch(0.12_0.015_30)] border-b border-[oklch(0.75_0.18_55/20%)]">
                    <CardTitle className="text-[oklch(0.75_0.18_55)] text-2xl">
                      📋 {generatedPlan.activityOverview?.name || "活动方案"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-6">
                    {/* 活动概述 */}
                    {generatedPlan.activityOverview && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3 text-[oklch(0.75_0.18_55)] border-b-2 border-[oklch(0.75_0.18_55/20%)] pb-2">
                          活动概述
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-[oklch(0.12_0.015_30)] rounded-lg border-l-4 border-[oklch(0.75_0.18_55)]">
                            <p className="text-sm text-[oklch(0.58_0.04_50)] font-medium">
                              活动名称
                            </p>
                            <p className="text-foreground mt-1">
                              {generatedPlan.activityOverview.name}
                            </p>
                          </div>
                          <div className="p-4 bg-[oklch(0.12_0.015_30)] rounded-lg border-l-4 border-[oklch(0.75_0.18_55)]">
                            <p className="text-sm text-[oklch(0.58_0.04_50)] font-medium">
                              活动类型
                            </p>
                            <p className="text-foreground mt-1">
                              {generatedPlan.activityOverview.type}
                            </p>
                          </div>
                          <div className="p-4 bg-[oklch(0.12_0.015_30)] rounded-lg border-l-4 border-[oklch(0.75_0.18_55)]">
                            <p className="text-sm text-[oklch(0.58_0.04_50)] font-medium">
                              活动时间
                            </p>
                            <p className="text-foreground mt-1">
                              {generatedPlan.activityOverview.time}
                            </p>
                          </div>
                          <div className="p-4 bg-[oklch(0.12_0.015_30)] rounded-lg border-l-4 border-[oklch(0.75_0.18_55)]">
                            <p className="text-sm text-[oklch(0.58_0.04_50)] font-medium">
                              活动地点
                            </p>
                            <p className="text-foreground mt-1">
                              {generatedPlan.activityOverview.location}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 活动目标 */}
                    {generatedPlan.activityGoals && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3 text-[oklch(0.75_0.18_55)] border-b-2 border-[oklch(0.75_0.18_55/20%)] pb-2">
                          活动目标
                        </h3>
                        <div className="space-y-3 p-4 bg-[oklch(0.12_0.015_30)] rounded-lg">
                          {generatedPlan.activityGoals.salesTarget && (
                            <p className="text-foreground">
                              <strong className="text-[oklch(0.75_0.18_55)]">
                                销售目标：
                              </strong>{" "}
                              {generatedPlan.activityGoals.salesTarget}
                            </p>
                          )}
                          {generatedPlan.activityGoals.visitorTarget && (
                            <p className="text-foreground">
                              <strong className="text-[oklch(0.75_0.18_55)]">
                                客流目标：
                              </strong>{" "}
                              {generatedPlan.activityGoals.visitorTarget}
                            </p>
                          )}
                          {generatedPlan.activityGoals.brandGoal && (
                            <p className="text-foreground">
                              <strong className="text-[oklch(0.75_0.18_55)]">
                                品牌目标：
                              </strong>{" "}
                              {generatedPlan.activityGoals.brandGoal}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 活动亮点 */}
                    {generatedPlan.activityHighlights &&
                      generatedPlan.activityHighlights.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold mb-3 text-[oklch(0.75_0.18_55)] border-b-2 border-[oklch(0.75_0.18_55/20%)] pb-2">
                            活动亮点
                          </h3>
                          <ul className="space-y-2">
                            {generatedPlan.activityHighlights.map(
                              (highlight: string, index: number) => (
                                <li
                                  key={index}
                                  className="flex gap-3 p-3 bg-[oklch(0.12_0.015_30)] rounded-lg border-l-4 border-[oklch(0.75_0.18_55)]"
                                >
                                  <span className="text-[oklch(0.75_0.18_55)] font-bold flex-shrink-0">
                                    ✓
                                  </span>
                                  <span className="text-foreground">
                                    {highlight}
                                  </span>
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      )}

                    {/* 详细方案 */}
                    {generatedPlan.detailedPlan && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3 text-[oklch(0.75_0.18_55)] border-b-2 border-[oklch(0.75_0.18_55/20%)] pb-2">
                          详细方案
                        </h3>
                        <div className="space-y-3 p-4 bg-[oklch(0.12_0.015_30)] rounded-lg">
                          {generatedPlan.detailedPlan.productDiscounts && (
                            <div>
                              <p className="font-medium text-[oklch(0.75_0.18_55)]">
                                产品优惠
                              </p>
                              <p className="text-foreground mt-1">
                                {generatedPlan.detailedPlan.productDiscounts}
                              </p>
                            </div>
                          )}
                          {generatedPlan.detailedPlan.onSiteDiscounts && (
                            <div>
                              <p className="font-medium text-[oklch(0.75_0.18_55)]">
                                现场优惠
                              </p>
                              <p className="text-foreground mt-1">
                                {generatedPlan.detailedPlan.onSiteDiscounts}
                              </p>
                            </div>
                          )}
                          {generatedPlan.detailedPlan.additionalBenefits && (
                            <div>
                              <p className="font-medium text-[oklch(0.75_0.18_55)]">
                                额外福利
                              </p>
                              <p className="text-foreground mt-1">
                                {generatedPlan.detailedPlan.additionalBenefits}
                              </p>
                            </div>
                          )}
                          {generatedPlan.detailedPlan.productSelection && (
                            <div>
                              <p className="font-medium text-[oklch(0.75_0.18_55)]">
                                产品选择
                              </p>
                              <p className="text-foreground mt-1">
                                {generatedPlan.detailedPlan.productSelection}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 营销话术 */}
                    {generatedPlan.marketingScripts && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3 text-[oklch(0.75_0.18_55)] border-b-2 border-[oklch(0.75_0.18_55/20%)] pb-2">
                          营销话术
                        </h3>
                        <div className="space-y-4">
                          {generatedPlan.marketingScripts.invitationScript && (
                            <div className="p-4 bg-[oklch(0.12_0.015_30)] rounded-lg border-l-4 border-[oklch(0.75_0.18_55)]">
                              <p className="font-medium text-[oklch(0.75_0.18_55)] mb-2">
                                邀约话术
                              </p>
                              <Streamdown className="text-foreground">
                                {
                                  generatedPlan.marketingScripts
                                    .invitationScript
                                }
                              </Streamdown>
                            </div>
                          )}
                          {generatedPlan.marketingScripts
                            .introductionScript && (
                            <div className="p-4 bg-[oklch(0.12_0.015_30)] rounded-lg border-l-4 border-[oklch(0.75_0.18_55)]">
                              <p className="font-medium text-[oklch(0.75_0.18_55)] mb-2">
                                活动介绍话术
                              </p>
                              <Streamdown className="text-foreground">
                                {
                                  generatedPlan.marketingScripts
                                    .introductionScript
                                }
                              </Streamdown>
                            </div>
                          )}
                          {generatedPlan.marketingScripts.closingScript && (
                            <div className="p-4 bg-[oklch(0.12_0.015_30)] rounded-lg border-l-4 border-[oklch(0.75_0.18_55)]">
                              <p className="font-medium text-[oklch(0.75_0.18_55)] mb-2">
                                成交话术
                              </p>
                              <Streamdown className="text-foreground">
                                {generatedPlan.marketingScripts.closingScript}
                              </Streamdown>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 执行计划 */}
                    {generatedPlan.executionPlan && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3 text-[oklch(0.75_0.18_55)] border-b-2 border-[oklch(0.75_0.18_55/20%)] pb-2">
                          执行计划
                        </h3>
                        <div className="space-y-3 p-4 bg-[oklch(0.12_0.015_30)] rounded-lg">
                          {generatedPlan.executionPlan.preparation && (
                            <div>
                              <p className="font-medium text-[oklch(0.75_0.18_55)]">
                                前期准备
                              </p>
                              <Streamdown className="text-foreground mt-1">
                                {generatedPlan.executionPlan.preparation}
                              </Streamdown>
                            </div>
                          )}
                          {generatedPlan.executionPlan.timeline && (
                            <div>
                              <p className="font-medium text-[oklch(0.75_0.18_55)]">
                                执行时间节点
                              </p>
                              <Streamdown className="text-foreground mt-1">
                                {generatedPlan.executionPlan.timeline}
                              </Streamdown>
                            </div>
                          )}
                          {generatedPlan.executionPlan.responsibilities && (
                            <div>
                              <p className="font-medium text-[oklch(0.75_0.18_55)]">
                                负责人分工
                              </p>
                              <Streamdown className="text-foreground mt-1">
                                {generatedPlan.executionPlan.responsibilities}
                              </Streamdown>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 预期效果 */}
                    {generatedPlan.expectedResults && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3 text-[oklch(0.75_0.18_55)] border-b-2 border-[oklch(0.75_0.18_55/20%)] pb-2">
                          预期效果
                        </h3>
                        <div className="space-y-2 p-4 bg-[oklch(0.12_0.015_30)] rounded-lg">
                          {generatedPlan.expectedResults.salesForecast && (
                            <p className="text-foreground">
                              <strong className="text-[oklch(0.75_0.18_55)]">
                                销售预测：
                              </strong>{" "}
                              {generatedPlan.expectedResults.salesForecast}
                            </p>
                          )}
                          {generatedPlan.expectedResults.visitorForecast && (
                            <p className="text-foreground">
                              <strong className="text-[oklch(0.75_0.18_55)]">
                                客流预测：
                              </strong>{" "}
                              {generatedPlan.expectedResults.visitorForecast}
                            </p>
                          )}
                          {generatedPlan.expectedResults.conversionForecast && (
                            <p className="text-foreground">
                              <strong className="text-[oklch(0.75_0.18_55)]">
                                转化预测：
                              </strong>{" "}
                              {generatedPlan.expectedResults.conversionForecast}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 总结 */}
                    {generatedPlan.summary && (
                      <div className="p-4 bg-[oklch(0.12_0.015_30)] rounded-lg border-l-4 border-[oklch(0.75_0.18_55)]">
                        <h3 className="font-semibold text-[oklch(0.75_0.18_55)] mb-2">
                          方案总结
                        </h3>
                        <Streamdown className="text-foreground">
                          {generatedPlan.summary}
                        </Streamdown>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="h-full flex items-center justify-center min-h-96 bg-card">
                <CardContent className="text-center">
                  <div className="text-6xl mb-4">📋</div>
                  <p className="text-[oklch(0.75_0.18_55)] text-lg font-medium">
                    填写表单并点击"生成活动方案"按钮
                  </p>
                  <p className="text-[oklch(0.58_0.04_50)] text-sm mt-2">
                    AI将为您生成完整的活动策划方案
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
