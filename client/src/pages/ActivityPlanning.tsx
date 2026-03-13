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

  const generatePlanMutation = trpc.activityPlanning.generatePlan.useMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<ActivityPlanFormData>({
    resolver: zodResolver(activityPlanFormSchema),
    defaultValues: {
      activityType: "seasonal",
      targetCustomers: [],
      productCategories: [],
      onSiteDiscounts: [],
    },
  });

  const onSubmit = async (data: ActivityPlanFormData) => {
    setIsGenerating(true);
    try {
      const result = await generatePlanMutation.mutateAsync({
        ...data,
        targetCustomers: selectedTargetCustomers,
        productCategories: selectedProductCategories,
        onSiteDiscounts: selectedOnSiteDiscounts,
      });

      setGeneratedPlan(result.plan.generatedPlan);
      console.log("活动方案已生成");
    } catch (error) {
      console.error("生成活动方案失败:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">活动策划生成器</h1>
          <p className="text-lg text-slate-600">
            填写活动信息，AI将为您生成完整的活动方案，包括优惠政策、营销话术和执行计划
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 表单区域 */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
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
                    {errors.activityName && <p className="text-sm text-red-500 mt-1">{errors.activityName.message}</p>}
                  </div>

                  {/* 活动类型 */}
                  <div>
                    <Label htmlFor="activityType">活动类型 *</Label>
                    <Select defaultValue="seasonal" onValueChange={(value) => setValue("activityType", value as any)}>
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
                      <Input id="startTime" type="datetime-local" {...register("startTime", { valueAsDate: true })} className="mt-1" />
                      {errors.startTime && <p className="text-sm text-red-500 mt-1">{errors.startTime.message}</p>}
                    </div>
                    <div>
                      <Label htmlFor="endTime">结束时间 *</Label>
                      <Input id="endTime" type="datetime-local" {...register("endTime", { valueAsDate: true })} className="mt-1" />
                      {errors.endTime && <p className="text-sm text-red-500 mt-1">{errors.endTime.message}</p>}
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
                    {errors.location && <p className="text-sm text-red-500 mt-1">{errors.location.message}</p>}
                  </div>

                  {/* 目标客户 */}
                  <div>
                    <Label>目标客户群体 *</Label>
                    <div className="space-y-2 mt-2">
                      {TARGET_CUSTOMERS.map((customer) => (
                        <div key={customer.value} className="flex items-center">
                          <Checkbox
                            id={customer.value}
                            checked={selectedTargetCustomers.includes(customer.value)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedTargetCustomers([...selectedTargetCustomers, customer.value]);
                              } else {
                                setSelectedTargetCustomers(selectedTargetCustomers.filter((c) => c !== customer.value));
                              }
                            }}
                          />
                          <Label htmlFor={customer.value} className="ml-2 cursor-pointer">
                            {customer.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 活动主题 */}
                  <div>
                    <Label htmlFor="theme">活动主题</Label>
                    <Input
                      id="theme"
                      placeholder="如：家装节、秋季家装季"
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
                      placeholder="0"
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
                      placeholder="0"
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
                      placeholder="0"
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
                      placeholder="0"
                      {...register("expectedVisitors", { valueAsNumber: true })}
                      className="mt-1"
                    />
                  </div>

                  {/* 期望转化率 */}
                  <div>
                    <Label htmlFor="expectedConversionRate">期望转化率（%）</Label>
                    <Input
                      id="expectedConversionRate"
                      type="number"
                      placeholder="0"
                      {...register("expectedConversionRate", { valueAsNumber: true })}
                      className="mt-1"
                    />
                  </div>

                  {/* 产品类别 */}
                  <div>
                    <Label>主要产品类别</Label>
                    <div className="space-y-2 mt-2">
                      {PRODUCT_CATEGORIES.map((category) => (
                        <div key={category.value} className="flex items-center">
                          <Checkbox
                            id={`product-${category.value}`}
                            checked={selectedProductCategories.includes(category.value)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedProductCategories([...selectedProductCategories, category.value]);
                              } else {
                                setSelectedProductCategories(selectedProductCategories.filter((c) => c !== category.value));
                              }
                            }}
                          />
                          <Label htmlFor={`product-${category.value}`} className="ml-2 cursor-pointer">
                            {category.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 产品描述 */}
                  <div>
                    <Label htmlFor="productDescription">参加活动的产品描述</Label>
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
                            checked={selectedOnSiteDiscounts.includes(discount.value)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedOnSiteDiscounts([...selectedOnSiteDiscounts, discount.value]);
                              } else {
                                setSelectedOnSiteDiscounts(selectedOnSiteDiscounts.filter((c) => c !== discount.value));
                              }
                            }}
                          />
                          <Label htmlFor={`discount-${discount.value}`} className="ml-2 cursor-pointer">
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

                  {/* 生成按钮 */}
                  <Button type="submit" className="w-full" disabled={isGenerating} size="lg">
                    {isGenerating ? "生成中..." : "生成活动方案"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* 结果展示区域 */}
          <div className="lg:col-span-2">
            {generatedPlan ? (
              <Card>
                <CardHeader>
                  <CardTitle>生成的活动方案</CardTitle>
                  <CardDescription>完整的活动策划方案</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 max-h-[80vh] overflow-y-auto">
                  {/* 活动概述 */}
                  {generatedPlan.activityOverview && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">活动概述</h3>
                      <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                        <p>
                          <strong>活动名称：</strong> {generatedPlan.activityOverview.name}
                        </p>
                        <p>
                          <strong>活动类型：</strong> {generatedPlan.activityOverview.type}
                        </p>
                        <p>
                          <strong>活动时间：</strong> {generatedPlan.activityOverview.time}
                        </p>
                        <p>
                          <strong>活动地点：</strong> {generatedPlan.activityOverview.location}
                        </p>
                        <p>
                          <strong>目标客户：</strong> {generatedPlan.activityOverview.targetCustomers}
                        </p>
                        {generatedPlan.activityOverview.theme && (
                          <p>
                            <strong>活动主题：</strong> {generatedPlan.activityOverview.theme}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 活动目标 */}
                  {generatedPlan.activityGoals && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">活动目标</h3>
                      <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                        {generatedPlan.activityGoals.salesTarget && (
                          <p>
                            <strong>销售目标：</strong> {generatedPlan.activityGoals.salesTarget}
                          </p>
                        )}
                        {generatedPlan.activityGoals.visitorTarget && (
                          <p>
                            <strong>客流目标：</strong> {generatedPlan.activityGoals.visitorTarget}
                          </p>
                        )}
                        {generatedPlan.activityGoals.brandGoal && (
                          <p>
                            <strong>品牌目标：</strong> {generatedPlan.activityGoals.brandGoal}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 活动亮点 */}
                  {generatedPlan.activityHighlights && generatedPlan.activityHighlights.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">活动亮点</h3>
                      <ul className="space-y-2">
                        {generatedPlan.activityHighlights.map((highlight: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-3">
                            <span className="text-blue-600 font-bold">•</span>
                            <span>{highlight}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 详细方案 */}
                  {generatedPlan.detailedPlan && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">详细方案</h3>
                      <div className="bg-slate-50 p-4 rounded-lg space-y-3">
                        {generatedPlan.detailedPlan.productDiscounts && (
                          <div>
                            <strong>产品优惠：</strong>
                            <p className="text-sm text-slate-700 mt-1">{generatedPlan.detailedPlan.productDiscounts}</p>
                          </div>
                        )}
                        {generatedPlan.detailedPlan.onSiteDiscounts && (
                          <div>
                            <strong>现场优惠：</strong>
                            <p className="text-sm text-slate-700 mt-1">{generatedPlan.detailedPlan.onSiteDiscounts}</p>
                          </div>
                        )}
                        {generatedPlan.detailedPlan.additionalBenefits && (
                          <div>
                            <strong>额外福利：</strong>
                            <p className="text-sm text-slate-700 mt-1">{generatedPlan.detailedPlan.additionalBenefits}</p>
                          </div>
                        )}
                        {generatedPlan.detailedPlan.productSelection && (
                          <div>
                            <strong>产品选择：</strong>
                            <p className="text-sm text-slate-700 mt-1">{generatedPlan.detailedPlan.productSelection}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 营销话术 */}
                  {generatedPlan.marketingScripts && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">营销话术</h3>
                      <div className="space-y-4">
                        {generatedPlan.marketingScripts.invitationScript && (
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <strong className="text-blue-900">邀约话术：</strong>
                            <Streamdown className="text-sm text-slate-700 mt-2">{generatedPlan.marketingScripts.invitationScript}</Streamdown>
                          </div>
                        )}
                        {generatedPlan.marketingScripts.introductionScript && (
                          <div className="bg-green-50 p-4 rounded-lg">
                            <strong className="text-green-900">活动介绍话术：</strong>
                            <Streamdown className="text-sm text-slate-700 mt-2">{generatedPlan.marketingScripts.introductionScript}</Streamdown>
                          </div>
                        )}
                        {generatedPlan.marketingScripts.closingScript && (
                          <div className="bg-purple-50 p-4 rounded-lg">
                            <strong className="text-purple-900">成交话术：</strong>
                            <Streamdown className="text-sm text-slate-700 mt-2">{generatedPlan.marketingScripts.closingScript}</Streamdown>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 执行计划 */}
                  {generatedPlan.executionPlan && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">执行计划</h3>
                      <div className="bg-slate-50 p-4 rounded-lg space-y-3">
                        {generatedPlan.executionPlan.preparation && (
                          <div>
                            <strong>前期准备：</strong>
                            <Streamdown className="text-sm text-slate-700 mt-1">{generatedPlan.executionPlan.preparation}</Streamdown>
                          </div>
                        )}
                        {generatedPlan.executionPlan.timeline && (
                          <div>
                            <strong>执行时间节点：</strong>
                            <Streamdown className="text-sm text-slate-700 mt-1">{generatedPlan.executionPlan.timeline}</Streamdown>
                          </div>
                        )}
                        {generatedPlan.executionPlan.responsibilities && (
                          <div>
                            <strong>人员分工：</strong>
                            <Streamdown className="text-sm text-slate-700 mt-1">{generatedPlan.executionPlan.responsibilities}</Streamdown>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 预期效果 */}
                  {generatedPlan.expectedResults && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">预期效果</h3>
                      <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                        {generatedPlan.expectedResults.salesForecast && (
                          <p>
                            <strong>销售预测：</strong> {generatedPlan.expectedResults.salesForecast}
                          </p>
                        )}
                        {generatedPlan.expectedResults.visitorForecast && (
                          <p>
                            <strong>客流预测：</strong> {generatedPlan.expectedResults.visitorForecast}
                          </p>
                        )}
                        {generatedPlan.expectedResults.conversionForecast && (
                          <p>
                            <strong>成交率预测：</strong> {generatedPlan.expectedResults.conversionForecast}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 方案总结 */}
                  {generatedPlan.summary && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">方案总结</h3>
                      <div className="bg-amber-50 p-4 rounded-lg">
                        <Streamdown className="text-sm text-slate-700">{generatedPlan.summary}</Streamdown>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="h-full flex items-center justify-center">
                <CardContent className="text-center">
                  <p className="text-slate-500 text-lg">填写表单并点击"生成活动方案"按钮</p>
                  <p className="text-slate-400 text-sm mt-2">系统将为您生成完整的活动策划方案</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
