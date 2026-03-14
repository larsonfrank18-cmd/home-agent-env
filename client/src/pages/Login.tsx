/* =============================================================
   登录 / 注册页面 - 橘黄暖光主题
   注册：昵称(必填) + 邮箱(必填) + 密码(必填)
   登录：邮箱 + 密码
   注册前弹出用户协议，同意后方可注册
   ============================================================= */

import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import AgreementModal from "@/components/AgreementModal";

// ─── 用户协议内容（已移至 AgreementModal 组件）──────────────────────
// ... (协议内容保持不变，此处省略以保持简洁)
const _UNUSED = `...`;

// ─── 主页面 ────────────────────────────────────────────────────────
export default function Login() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [, navigate] = useLocation();

  // 登录表单
  const [loginAccount, setLoginAccount] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // 注册表单
  const [nickname, setNickname] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [email, setEmail] = useState("");

  // 用户协议弹窗
  const [showAgreement, setShowAgreement] = useState(false);
  // 暂存待提交的注册数据
  const pendingRegisterRef = useRef<{
    nickname: string;
    password: string;
    email: string;
  } | null>(null);

  useEffect(() => {
    // 清理函数可以保留，以防未来添加需要清理的 effect
  }, []);

  // ─── tRPC mutations ──────────────────────────────────────────────

  const loginMutation = trpc.userAuth.login.useMutation({
    onSuccess: () => {
      toast.success("登录成功！");
      window.location.href = "/generator";
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const registerMutation = trpc.userAuth.register.useMutation({
    onSuccess: () => {
      toast.success("注册成功，已自动登录！");
      window.location.href = "/generator";
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  // ─── 事件处理 ────────────────────────────────────────────────────

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ account: loginAccount, password: loginPassword });
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 基础验证
    if (!nickname.trim()) {
      toast.error("请输入昵称");
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("请输入有效的邮箱地址");
      return;
    }
    if (regPassword.length < 6) {
      toast.error("密码至少6位");
      return;
    }

    // 暂存数据，弹出协议
    pendingRegisterRef.current = {
      nickname: nickname.trim(),
      password: regPassword,
      email: email.trim(),
    };
    setShowAgreement(true);
  };

  const handleAgreeAndRegister = () => {
    setShowAgreement(false);
    if (pendingRegisterRef.current) {
      registerMutation.mutate(pendingRegisterRef.current);
      pendingRegisterRef.current = null;
    }
  };

  const handleCancelAgreement = () => {
    setShowAgreement(false);
    pendingRegisterRef.current = null;
    toast.info("注册已取消");
  };

  const isLoading =
    loginMutation.isPending ||
    registerMutation.isPending;

  // ─── 渲染 ────────────────────────────────────────────────────────

  return (
    <>
      {/* 用户协议弹窗（注册确认模式） */}
      {showAgreement && (
        <AgreementModal
          onAgree={handleAgreeAndRegister}
          onClose={handleCancelAgreement}
        />
      )}

      <div
        className="min-h-screen bg-background flex items-center justify-center px-4 py-8"
        style={{
          backgroundImage: `
            radial-gradient(ellipse at 50% 0%, oklch(0.75 0.18 55 / 8%) 0%, transparent 60%),
            linear-gradient(oklch(0.75 0.18 55 / 4%) 1px, transparent 1px),
            linear-gradient(90deg, oklch(0.75 0.18 55 / 4%) 1px, transparent 1px)
          `,
          backgroundSize: "100% 100%, 50px 50px, 50px 50px",
        }}
      >
        {/* 返回首页 */}
        <button
          onClick={() => navigate("/")}
          className="fixed top-5 left-5 flex items-center gap-2 text-xs text-gray-500 hover:text-[oklch(0.75_0.18_55)] transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          返回首页
        </button>

        <div className="w-full max-w-sm animate-fadeIn">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded border border-[oklch(0.75_0.18_55/60%)] flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="oklch(0.75 0.18 55)" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                  <polyline points="9,22 9,12 15,12 15,22" />
                </svg>
              </div>
              <span className="font-['Orbitron'] text-sm font-bold tracking-widest text-white">
                智源AI
              </span>
            </div>
            <h1 className="text-2xl font-black text-white font-['Noto_Sans_SC']">
              {mode === "login" ? "欢迎回来" : "创建账号"}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {mode === "login" ? "登录后开始生成爆款文案" : "注册后联系管理员开通权限"}
            </p>
          </div>

          {/* 表单卡片 */}
          <div className="dashed-card rounded-xl p-7">
            {/* Tab切换 */}
            <div className="flex mb-6 bg-[oklch(0.09_0.01_30)] rounded-lg p-1">
              <button
                onClick={() => setMode("login")}
                className={`flex-1 py-2 text-sm rounded-md font-medium transition-all ${
                  mode === "login"
                    ? "bg-[oklch(0.75_0.18_55)] text-[oklch(0.09_0.01_30)]"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                登录
              </button>
              <button
                onClick={() => setMode("register")}
                className={`flex-1 py-2 text-sm rounded-md font-medium transition-all ${
                  mode === "register"
                    ? "bg-[oklch(0.75_0.18_55)] text-[oklch(0.09_0.01_30)]"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                注册
              </button>
            </div>

            {/* ── 登录表单 ── */}
            {mode === "login" && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">邮箱</label>
                  <input
                    type="email"
                    value={loginAccount}
                    onChange={(e) => setLoginAccount(e.target.value)}
                    placeholder="example@email.com"
                    required
                    className="w-full bg-[oklch(0.09_0.01_30)] border border-[oklch(1_0_0/12%)] rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[oklch(0.75_0.18_55/60%)] transition-colors"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs text-gray-400">密码</label>
                    <a
                      href="/forgot-password"
                      className="text-xs transition-colors"
                      style={{ color: "oklch(0.65 0.15 200)" }}
                    >
                      忘记密码？
                    </a>
                  </div>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="请输入密码"
                    required
                    className="w-full bg-[oklch(0.09_0.01_30)] border border-[oklch(1_0_0/12%)] rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[oklch(0.75_0.18_55/60%)] transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full neon-btn-primary py-3 rounded-lg text-sm font-semibold mt-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loginMutation.isPending ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity="0.3" />
                        <path d="M21 12a9 9 0 00-9-9" />
                      </svg>
                      登录中...
                    </>
                  ) : "登录"}
                </button>
              </form>
            )}

            {/* ── 注册表单 ── */}
            {mode === "register" && (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                {/* 昵称（必填） */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">
                    昵称 <span className="text-[oklch(0.75_0.18_55)]">*</span>
                  </label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="您的称呼"
                    required
                    maxLength={50}
                    className="w-full bg-[oklch(0.09_0.01_30)] border border-[oklch(1_0_0/12%)] rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[oklch(0.75_0.18_55/60%)] transition-colors"
                  />
                </div>

                {/* 邮箱（必填） */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">
                    邮箱 <span className="text-[oklch(0.75_0.18_55)]">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@email.com"
                    required
                    className="w-full bg-[oklch(0.09_0.01_30)] border border-[oklch(1_0_0/12%)] rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[oklch(0.75_0.18_55/60%)] transition-colors"
                  />
                </div>

                {/* 密码（必填） */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">
                    密码 <span className="text-[oklch(0.75_0.18_55)]">*</span>
                  </label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="至少6位"
                    required
                    minLength={6}
                    className="w-full bg-[oklch(0.09_0.01_30)] border border-[oklch(1_0_0/12%)] rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[oklch(0.75_0.18_55/60%)] transition-colors"
                  />
                </div>

                {/* 协议提示 */}
                <p className="text-xs text-gray-600 leading-relaxed">
                  点击"注册"即表示您已阅读并同意
                  <button
                    type="button"
                    onClick={() => {
                      pendingRegisterRef.current = null;
                      setShowAgreement(true);
                    }}
                    className="text-[oklch(0.75_0.18_55)] hover:underline mx-0.5"
                  >
                    《智源用户服务协议》
                  </button>
                </p>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full neon-btn-primary py-3 rounded-lg text-sm font-semibold mt-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {registerMutation.isPending ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity="0.3" />
                        <path d="M21 12a9 9 0 00-9-9" />
                      </svg>
                      注册中...
                    </>
                  ) : "注册"}
                </button>
              </form>
            )}

            {/* 底部提示 */}
            {mode === "register" && (
              <p className="text-xs text-gray-600 text-center mt-4 leading-relaxed">
                注册后请联系管理员开通使用权限
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
