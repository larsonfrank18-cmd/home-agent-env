/**
 * 忘记密码页面
 * 流程：输入手机号 → 发送验证码 → 输入新密码 → 重置成功
 */

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Phone, KeyRound, Eye, EyeOff, CheckCircle2 } from "lucide-react";

type Step = "phone" | "verify" | "success";

export default function ForgotPassword() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [smsCode, setSmsCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // 倒计时
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const sendCodeMutation = trpc.userAuth.sendResetSmsCode.useMutation({
    onSuccess: (data) => {
      toast.success("验证码已发送", { description: data.message });
      setCountdown(60);
      setStep("verify");
      // 开发模式：显示调试验证码
      if (data.debugCode) {
        toast.info(`开发模式验证码：${data.debugCode}`);
      }
    },
    onError: (err) => {
      toast.error("发送失败", { description: err.message });
    },
  });

  const resetMutation = trpc.userAuth.resetPassword.useMutation({
    onSuccess: () => {
      setStep("success");
    },
    onError: (err) => {
      toast.error("重置失败", { description: err.message });
    },
  });

  const handleSendCode = () => {
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      toast.error("手机号格式错误", { description: "请输入有效的11位手机号" });
      return;
    }
    sendCodeMutation.mutate({ phone });
  };

  const handleResend = () => {
    if (countdown > 0) return;
    sendCodeMutation.mutate({ phone });
  };

  const handleReset = () => {
    if (!smsCode || smsCode.length !== 6) {
      toast.error("验证码错误", { description: "请输入6位验证码" });
      return;
    }
    if (newPassword.length < 6) {
      toast.error("密码太短", { description: "密码至少6位" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("密码不一致", { description: "两次输入的密码不一致" });
      return;
    }
    resetMutation.mutate({ phone, smsCode, newPassword });
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "oklch(0.08 0.015 240)" }}
    >
      <div className="w-full max-w-md">
        {/* 返回按钮 */}
        <button
          onClick={() => navigate("/login")}
          className="flex items-center gap-2 text-sm mb-6 transition-colors"
          style={{ color: "oklch(0.65 0.05 240)" }}
        >
          <ArrowLeft className="w-4 h-4" />
          返回登录
        </button>

        <Card
          className="border"
          style={{
            background: "oklch(0.12 0.015 240)",
            borderColor: "oklch(0.25 0.03 240)",
          }}
        >
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: "oklch(0.65 0.2 40 / 0.15)" }}
              >
                <KeyRound className="w-5 h-5" style={{ color: "oklch(0.75 0.2 40)" }} />
              </div>
              <div>
                <CardTitle style={{ color: "oklch(0.97 0 0)" }}>找回密码</CardTitle>
                <CardDescription style={{ color: "oklch(0.6 0.05 240)" }}>
                  {step === "phone" && "输入注册手机号"}
                  {step === "verify" && "验证身份并设置新密码"}
                  {step === "success" && "密码重置成功"}
                </CardDescription>
              </div>
            </div>

            {/* 步骤指示器 */}
            {step !== "success" && (
              <div className="flex items-center gap-2 mt-2">
                {(["phone", "verify"] as Step[]).map((s, i) => (
                  <div key={s} className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                      style={{
                        background:
                          step === s
                            ? "oklch(0.75 0.2 40)"
                            : step === "verify" && s === "phone"
                            ? "oklch(0.4 0.1 40)"
                            : "oklch(0.2 0.02 240)",
                        color:
                          step === s || (step === "verify" && s === "phone")
                            ? "oklch(0.08 0.015 240)"
                            : "oklch(0.5 0.04 240)",
                      }}
                    >
                      {step === "verify" && s === "phone" ? "✓" : i + 1}
                    </div>
                    <span
                      className="text-xs"
                      style={{
                        color: step === s ? "oklch(0.75 0.2 40)" : "oklch(0.5 0.04 240)",
                      }}
                    >
                      {s === "phone" ? "验证手机" : "重置密码"}
                    </span>
                    {i < 1 && (
                      <div
                        className="w-8 h-px"
                        style={{
                          background:
                            step === "verify"
                              ? "oklch(0.4 0.1 40)"
                              : "oklch(0.2 0.02 240)",
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-4">
            {/* 步骤1：输入手机号 */}
            {step === "phone" && (
              <>
                <div className="space-y-2">
                  <Label style={{ color: "oklch(0.8 0.05 240)" }}>
                    注册手机号 <span style={{ color: "oklch(0.65 0.2 20)" }}>*</span>
                  </Label>
                  <div className="relative">
                    <Phone
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                      style={{ color: "oklch(0.5 0.04 240)" }}
                    />
                    <Input
                      type="tel"
                      placeholder="请输入注册时使用的手机号"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
                      onKeyDown={(e) => e.key === "Enter" && handleSendCode()}
                      className="pl-10 border"
                      style={{
                        background: "oklch(0.16 0.015 240)",
                        borderColor: "oklch(0.28 0.03 240)",
                        color: "oklch(0.97 0 0)",
                      }}
                    />
                  </div>
                </div>

                <Button
                  onClick={handleSendCode}
                  disabled={sendCodeMutation.isPending || phone.length !== 11}
                  className="w-full font-semibold"
                  style={{ background: "oklch(0.75 0.2 40)", color: "oklch(0.08 0.015 240)" }}
                >
                  {sendCodeMutation.isPending ? "发送中..." : "发送验证码"}
                </Button>
              </>
            )}

            {/* 步骤2：验证码 + 新密码 */}
            {step === "verify" && (
              <>
                {/* 手机号显示（只读） */}
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
                  style={{
                    background: "oklch(0.16 0.015 240)",
                    color: "oklch(0.65 0.05 240)",
                  }}
                >
                  <Phone className="w-4 h-4" />
                  <span>{phone}</span>
                  <button
                    onClick={() => setStep("phone")}
                    className="ml-auto text-xs underline"
                    style={{ color: "oklch(0.65 0.15 200)" }}
                  >
                    更换
                  </button>
                </div>

                {/* 验证码 */}
                <div className="space-y-2">
                  <Label style={{ color: "oklch(0.8 0.05 240)" }}>
                    短信验证码 <span style={{ color: "oklch(0.65 0.2 20)" }}>*</span>
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="6位验证码"
                      value={smsCode}
                      onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      className="flex-1 border text-center tracking-widest text-lg"
                      style={{
                        background: "oklch(0.16 0.015 240)",
                        borderColor: "oklch(0.28 0.03 240)",
                        color: "oklch(0.97 0 0)",
                      }}
                    />
                    <Button
                      variant="outline"
                      onClick={handleResend}
                      disabled={countdown > 0 || sendCodeMutation.isPending}
                      className="whitespace-nowrap border"
                      style={{
                        borderColor: "oklch(0.28 0.03 240)",
                        color: countdown > 0 ? "oklch(0.5 0.04 240)" : "oklch(0.75 0.2 40)",
                        background: "transparent",
                      }}
                    >
                      {countdown > 0 ? `${countdown}s` : "重新发送"}
                    </Button>
                  </div>
                </div>

                {/* 新密码 */}
                <div className="space-y-2">
                  <Label style={{ color: "oklch(0.8 0.05 240)" }}>
                    新密码 <span style={{ color: "oklch(0.65 0.2 20)" }}>*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="至少6位"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pr-10 border"
                      style={{
                        background: "oklch(0.16 0.015 240)",
                        borderColor: "oklch(0.28 0.03 240)",
                        color: "oklch(0.97 0 0)",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{ color: "oklch(0.5 0.04 240)" }}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* 确认密码 */}
                <div className="space-y-2">
                  <Label style={{ color: "oklch(0.8 0.05 240)" }}>
                    确认新密码 <span style={{ color: "oklch(0.65 0.2 20)" }}>*</span>
                  </Label>
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="再次输入新密码"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleReset()}
                    className="border"
                    style={{
                      background: "oklch(0.16 0.015 240)",
                      borderColor:
                        confirmPassword && confirmPassword !== newPassword
                          ? "oklch(0.55 0.2 20)"
                          : "oklch(0.28 0.03 240)",
                      color: "oklch(0.97 0 0)",
                    }}
                  />
                  {confirmPassword && confirmPassword !== newPassword && (
                    <p className="text-xs" style={{ color: "oklch(0.65 0.2 20)" }}>
                      两次密码不一致
                    </p>
                  )}
                </div>

                <Button
                  onClick={handleReset}
                  disabled={resetMutation.isPending}
                  className="w-full font-semibold"
                  style={{ background: "oklch(0.75 0.2 40)", color: "oklch(0.08 0.015 240)" }}
                >
                  {resetMutation.isPending ? "重置中..." : "确认重置密码"}
                </Button>
              </>
            )}

            {/* 步骤3：成功 */}
            {step === "success" && (
              <div className="text-center py-6 space-y-4">
                <CheckCircle2
                  className="w-16 h-16 mx-auto"
                  style={{ color: "oklch(0.75 0.2 150)" }}
                />
                <div>
                  <p className="text-lg font-semibold" style={{ color: "oklch(0.97 0 0)" }}>
                    密码重置成功！
                  </p>
                  <p className="text-sm mt-1" style={{ color: "oklch(0.6 0.05 240)" }}>
                    请使用新密码登录您的账号
                  </p>
                </div>
                <Button
                  onClick={() => navigate("/login")}
                  className="w-full font-semibold"
                  style={{ background: "oklch(0.75 0.2 40)", color: "oklch(0.08 0.015 240)" }}
                >
                  立即登录
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
