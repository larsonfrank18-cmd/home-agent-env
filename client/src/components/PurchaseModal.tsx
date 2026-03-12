/* =============================================================
   购买会员弹窗组件
   - 两个入口：联系管理员 / 直接购买
   - 三档价格：季度799 / 年度2699 / 永久6699
   - 展示微信/支付宝收款码
   ============================================================= */

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, CreditCard, Copy, Check, Phone, X } from "lucide-react";
import { toast } from "sonner";

const WECHAT_PAY_QR = "https://d2xsxph8kpxj0f.cloudfront.net/310519663424321294/HS8qgRakRiSQeDBKf2ngfC/wechat-pay-qr_555f868b.jpg";
const ALIPAY_QR = "https://d2xsxph8kpxj0f.cloudfront.net/310519663424321294/HS8qgRakRiSQeDBKf2ngfC/alipay-qr_ed89050e.jpg";

const ADMIN_WECHAT = "lb04001982";
const ADMIN_PHONE = "17302479516";

const PLANS = [
  {
    id: "quarterly",
    name: "季度会员",
    price: 799,
    period: "3个月",
    dailyLimit: 50,
    monthlyLimit: 500,
    color: "from-blue-500/20 to-blue-600/10",
    border: "border-blue-500/30",
    badge: "",
    features: ["每日50次调用", "每月500次调用", "文案生成", "私信话术", "人格分析"],
  },
  {
    id: "annual",
    name: "年度会员",
    price: 2699,
    period: "12个月",
    dailyLimit: 65,
    monthlyLimit: 650,
    color: "from-amber-500/20 to-orange-600/10",
    border: "border-amber-500/50",
    badge: "最受欢迎",
    features: ["每日65次调用", "每月650次调用", "文案生成", "私信话术", "人格分析", "优先响应"],
  },
  {
    id: "lifetime",
    name: "永久会员",
    price: 6699,
    period: "永久有效",
    dailyLimit: 80,
    monthlyLimit: 800,
    color: "from-purple-500/20 to-pink-600/10",
    border: "border-purple-500/30",
    badge: "超值推荐",
    features: ["每日80次调用", "每月800次调用", "文案生成", "私信话术", "人格分析", "优先响应", "新功能优先体验"],
  },
];

type ModalView = "choice" | "contact" | "purchase" | "payment";

interface PurchaseModalProps {
  open: boolean;
  onClose: () => void;
}

export function PurchaseModal({ open, onClose }: PurchaseModalProps) {
  const [view, setView] = useState<ModalView>("choice");
  const [selectedPlan, setSelectedPlan] = useState<typeof PLANS[0] | null>(null);
  const [payMethod, setPayMethod] = useState<"wechat" | "alipay">("wechat");
  const [copied, setCopied] = useState<string | null>(null);

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setView("choice");
      setSelectedPlan(null);
    }, 300);
  };

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label);
      toast.success(`${label}已复制`);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const handleSelectPlan = (plan: typeof PLANS[0]) => {
    setSelectedPlan(plan);
    setView("payment");
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-lg border-0 p-0 overflow-hidden"
        style={{ background: "oklch(0.1 0.015 240)", color: "oklch(0.97 0 0)" }}
      >
        {/* 顶部标题栏 */}
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="text-xl font-bold" style={{ color: "oklch(0.97 0 0)" }}>
            {view === "choice" && "开通会员"}
            {view === "contact" && "联系管理员"}
            {view === "purchase" && "选择套餐"}
            {view === "payment" && `支付 ¥${selectedPlan?.price}`}
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-6 pt-4">

          {/* ===== 选择视图 ===== */}
          {view === "choice" && (
            <div className="space-y-4">
              <p className="text-sm" style={{ color: "oklch(0.7 0.02 240)" }}>
                您当前未登录或无使用权限，请选择以下方式继续：
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setView("contact")}
                  className="flex flex-col items-center gap-3 p-5 rounded-xl border transition-all hover:scale-105"
                  style={{
                    background: "oklch(0.15 0.02 240)",
                    borderColor: "oklch(0.82 0.18 178 / 0.4)",
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ background: "oklch(0.82 0.18 178 / 0.15)" }}
                  >
                    <MessageCircle className="w-6 h-6" style={{ color: "oklch(0.82 0.18 178)" }} />
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-sm">联系管理员</div>
                    <div className="text-xs mt-1" style={{ color: "oklch(0.6 0.02 240)" }}>
                      咨询后开通
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setView("purchase")}
                  className="flex flex-col items-center gap-3 p-5 rounded-xl border transition-all hover:scale-105"
                  style={{
                    background: "oklch(0.15 0.02 240)",
                    borderColor: "oklch(0.75 0.18 55 / 0.5)",
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ background: "oklch(0.75 0.18 55 / 0.15)" }}
                  >
                    <CreditCard className="w-6 h-6" style={{ color: "oklch(0.75 0.18 55)" }} />
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-sm">直接购买</div>
                    <div className="text-xs mt-1" style={{ color: "oklch(0.6 0.02 240)" }}>
                      扫码立即开通
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* ===== 联系管理员视图 ===== */}
          {view === "contact" && (
            <div className="space-y-4">
              <p className="text-sm" style={{ color: "oklch(0.7 0.02 240)" }}>
                添加管理员微信或拨打电话，告知您的需求，管理员将为您开通账号。
              </p>

              {/* 微信 */}
              <div
                className="flex items-center justify-between p-4 rounded-xl border"
                style={{ background: "oklch(0.15 0.02 240)", borderColor: "oklch(0.82 0.18 178 / 0.3)" }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold"
                    style={{ background: "oklch(0.82 0.18 178 / 0.15)", color: "oklch(0.82 0.18 178)" }}
                  >
                    微
                  </div>
                  <div>
                    <div className="text-xs" style={{ color: "oklch(0.6 0.02 240)" }}>微信号</div>
                    <div className="font-mono font-semibold">{ADMIN_WECHAT}</div>
                  </div>
                </div>
                <button
                  onClick={() => copyText(ADMIN_WECHAT, "微信号")}
                  className="p-2 rounded-lg transition-colors hover:opacity-80"
                  style={{ background: "oklch(0.82 0.18 178 / 0.15)" }}
                >
                  {copied === "微信号" ? (
                    <Check className="w-4 h-4" style={{ color: "oklch(0.82 0.18 178)" }} />
                  ) : (
                    <Copy className="w-4 h-4" style={{ color: "oklch(0.82 0.18 178)" }} />
                  )}
                </button>
              </div>

              {/* 电话 */}
              <div
                className="flex items-center justify-between p-4 rounded-xl border"
                style={{ background: "oklch(0.15 0.02 240)", borderColor: "oklch(0.75 0.18 55 / 0.3)" }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ background: "oklch(0.75 0.18 55 / 0.15)", color: "oklch(0.75 0.18 55)" }}
                  >
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs" style={{ color: "oklch(0.6 0.02 240)" }}>联系电话</div>
                    <div className="font-mono font-semibold">{ADMIN_PHONE}</div>
                  </div>
                </div>
                <button
                  onClick={() => copyText(ADMIN_PHONE, "电话号码")}
                  className="p-2 rounded-lg transition-colors hover:opacity-80"
                  style={{ background: "oklch(0.75 0.18 55 / 0.15)" }}
                >
                  {copied === "电话号码" ? (
                    <Check className="w-4 h-4" style={{ color: "oklch(0.75 0.18 55)" }} />
                  ) : (
                    <Copy className="w-4 h-4" style={{ color: "oklch(0.75 0.18 55)" }} />
                  )}
                </button>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => setView("choice")}
                style={{ borderColor: "oklch(0.3 0.02 240)", color: "oklch(0.7 0.02 240)" }}
              >
                返回
              </Button>
            </div>
          )}

          {/* ===== 选择套餐视图 ===== */}
          {view === "purchase" && (
            <div className="space-y-3">
              <p className="text-sm" style={{ color: "oklch(0.7 0.02 240)" }}>
                选择适合您的套餐，扫码支付后联系管理员激活账号。
              </p>
              {PLANS.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => handleSelectPlan(plan)}
                  className={`w-full text-left p-4 rounded-xl border transition-all hover:scale-[1.01] bg-gradient-to-r ${plan.color} ${plan.border} border`}
                  style={{ borderColor: undefined }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{plan.name}</span>
                          {plan.badge && (
                            <Badge
                              className="text-xs px-2 py-0"
                              style={{
                                background: "oklch(0.75 0.18 55 / 0.2)",
                                color: "oklch(0.75 0.18 55)",
                                border: "1px solid oklch(0.75 0.18 55 / 0.4)",
                              }}
                            >
                              {plan.badge}
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: "oklch(0.6 0.02 240)" }}>
                          {plan.period} · 每日{plan.dailyLimit}次
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold" style={{ color: "oklch(0.75 0.18 55)" }}>
                        ¥{plan.price.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
              <Button
                variant="outline"
                className="w-full mt-2"
                onClick={() => setView("choice")}
                style={{ borderColor: "oklch(0.3 0.02 240)", color: "oklch(0.7 0.02 240)" }}
              >
                返回
              </Button>
            </div>
          )}

          {/* ===== 支付视图 ===== */}
          {view === "payment" && selectedPlan && (
            <div className="space-y-4">
              {/* 套餐信息 */}
              <div
                className="p-3 rounded-xl border flex items-center justify-between"
                style={{ background: "oklch(0.15 0.02 240)", borderColor: "oklch(0.3 0.02 240)" }}
              >
                <span className="font-semibold">{selectedPlan.name}</span>
                <span className="text-xl font-bold" style={{ color: "oklch(0.75 0.18 55)" }}>
                  ¥{selectedPlan.price.toLocaleString()}
                </span>
              </div>

              {/* 支付方式切换 */}
              <div className="flex gap-2">
                <button
                  onClick={() => setPayMethod("wechat")}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all border ${
                    payMethod === "wechat" ? "border-green-500/60" : "border-transparent"
                  }`}
                  style={{
                    background: payMethod === "wechat" ? "oklch(0.55 0.18 145 / 0.2)" : "oklch(0.15 0.02 240)",
                    color: payMethod === "wechat" ? "oklch(0.75 0.2 145)" : "oklch(0.6 0.02 240)",
                  }}
                >
                  微信支付
                </button>
                <button
                  onClick={() => setPayMethod("alipay")}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all border ${
                    payMethod === "alipay" ? "border-blue-500/60" : "border-transparent"
                  }`}
                  style={{
                    background: payMethod === "alipay" ? "oklch(0.55 0.18 250 / 0.2)" : "oklch(0.15 0.02 240)",
                    color: payMethod === "alipay" ? "oklch(0.7 0.18 250)" : "oklch(0.6 0.02 240)",
                  }}
                >
                  支付宝
                </button>
              </div>

              {/* 收款码 */}
              <div className="flex justify-center">
                <div
                  className="p-3 rounded-2xl"
                  style={{ background: "oklch(0.98 0 0)" }}
                >
                  <img
                    src={payMethod === "wechat" ? WECHAT_PAY_QR : ALIPAY_QR}
                    alt={payMethod === "wechat" ? "微信收款码" : "支付宝收款码"}
                    className="w-48 h-48 object-contain rounded-xl"
                  />
                </div>
              </div>

              {/* 提示 */}
              <div
                className="p-3 rounded-xl text-xs text-center space-y-1"
                style={{ background: "oklch(0.75 0.18 55 / 0.08)", color: "oklch(0.75 0.18 55)" }}
              >
                <p className="font-medium">扫码支付后，请截图发送给管理员激活账号</p>
                <p style={{ color: "oklch(0.6 0.02 240)" }}>
                  管理员微信：{ADMIN_WECHAT} · 电话：{ADMIN_PHONE}
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setView("purchase")}
                  style={{ borderColor: "oklch(0.3 0.02 240)", color: "oklch(0.7 0.02 240)" }}
                >
                  返回
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => copyText(ADMIN_WECHAT, "管理员微信")}
                  style={{ background: "oklch(0.82 0.18 178 / 0.2)", color: "oklch(0.82 0.18 178)", border: "1px solid oklch(0.82 0.18 178 / 0.4)" }}
                >
                  {copied === "管理员微信" ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                  复制微信号
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
