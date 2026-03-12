/* =============================================================
   登录 / 注册页面 - 橘黄暖光主题
   注册：昵称(必填) + 手机号(必填) + 短信验证码(必填) + 密码(必填) + 邮箱(可选)
   登录：手机号或邮箱 + 密码
   注册前弹出用户协议，同意后方可注册
   ============================================================= */

import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import AgreementModal from "@/components/AgreementModal";

// ─── 用户协议内容（已移至 AgreementModal 组件）──────────────────────
// 协议文本已移至 @/components/AgreementModal.tsx 中统一管理
const _UNUSED = `智源用户服务协议

更新日期：2026年3月1日

欢迎您使用智源（以下简称"本服务"或"我们"）。本协议是您与我们之间关于使用智源产品及相关服务所订立的协议。

一、重要提示

【审慎阅读】在您使用本服务前，请您务必仔细阅读并充分理解本协议的全部内容。如果您不同意本协议的任何条款，请立即停止使用本服务。

【签约动作】当您按照注册页面提示完成注册，或您开始使用本服务，即表示您已充分阅读、理解并接受本协议的全部内容，与我们达成一致，成为智源的用户。

【未成年人】如果您未满18周岁，请在法定监护人陪同下阅读本协议，并在监护人同意后使用本服务。

二、我们提供的服务

智源是一款面向家居建材行业经销商老板的AI营销智能体，主要提供以下服务：
· 营销文案生成
· 销售话术支持
· 营销策划建议
· 其他相关的AI内容生成服务

具体服务内容以我们实际提供的为准。我们有权根据业务发展需要，对服务内容进行调整、升级或更新。

三、您的账户

3.1 注册与使用
您需要使用手机号码注册账户后方可使用本服务。您应保证注册信息的真实性、准确性，并对您账户下的一切行为负责。

3.2 账户安全
您的账户由您自行保管，我们不会主动向您索要密码。因您主动泄露账户信息或遭受他人攻击造成的损失，由您自行承担。

3.3 账户归属
账户仅限您本人使用，未经我们书面同意，不得以任何形式转让、出租、借用给第三方。

四、您的权利与义务

4.1 合法使用
您在使用本服务时，不得输入或生成包含以下内容的言论：
· 违反国家法律法规的；
· 危害国家安全、泄露国家秘密的；
· 损害国家荣誉和利益的；
· 煽动民族仇恨、民族歧视的；
· 散布谣言，扰乱社会秩序的；
· 散布淫秽、色情、赌博、暴力、凶杀的；
· 侮辱诽谤他人，侵害他人合法权益的；
· 其他法律法规禁止的内容。

4.2 禁止行为
您不得从事以下行为：
· 对本服务进行反向工程、反编译、破解等操作；
· 利用本服务开发、训练与我们有竞争关系的算法或模型；
· 通过爬虫、机器人等自动化方式批量获取服务内容；
· 干扰本服务的正常运行。

4.3 内容责任
您对输入的内容和生成的内容承担全部责任。因您使用本服务产生的任何法律纠纷，由您自行处理并承担责任。

五、费用与支付

5.1 订阅费用
本服务为付费订阅产品，具体费用以订购页面展示为准。您完成支付后方可开通相应服务。

5.2 常规不退费原则
本服务为数字化在线产品，一经订阅并开通使用，已支付的订阅费用原则上不予退还。此约定符合《中华人民共和国消费者权益保护法》第二十五条关于数字化商品的例外规定。

5.3 服务问题处理
若因本服务自身故障、核心功能失效导致您无法正常使用的，请及时联系客服并提供相关证据。我们将在5个工作日内完成核实，并根据情况提供补偿：
· 短期故障：按故障天数延长服务期
· 重大故障：按剩余服务天数比例退还费用
· 完全无法使用：全额退还当期费用

5.4 意外重复扣费
因系统错误导致同一订单重复扣费的，经核实后我们将立即全额退还多扣款项。

5.5 未成年人误购
若监护人能证明订阅行为系未成年人未经同意完成并提供有效证明的，经核实后可协商退款事宜。

5.6 自动续费说明
若您开通自动续费，将在每个订阅期到期前发送提醒。您可随时在账户设置中关闭自动续费，关闭后服务将持续至当期结束，不再续扣。

六、知识产权

6.1 服务知识产权
本服务相关的所有知识产权（包括但不限于软件、技术、界面、算法等）均归我们所有。

6.2 生成内容的使用
您在使用本服务过程中生成的内容，您可以在合法范围内使用。但我们不对生成内容的准确性、完整性、适用性做任何保证。

6.3 您的输入内容
您输入的内容，您仍保留原有的知识产权。您授予我们必要的使用权限，以便为您提供本服务。

七、免责声明

7.1 服务按现状提供
本服务按"现状"和"可用"的原则提供，我们不保证服务绝对无误、不间断，也不保证生成内容的准确性、可靠性。

7.2 AI生成内容仅供参考
本服务基于生成式人工智能技术，生成内容仅供参考，不构成专业建议。您不应将生成内容作为决策的唯一依据。

7.3 不可抗力
因不可抗力、黑客攻击、网络故障等原因导致服务中断或数据丢失的，我们不承担赔偿责任。

八、协议的修改与终止

我们有权根据需要修改本协议，修改后的协议将在公布后生效。如您继续使用本服务，视为接受修改后的协议。

若您违反本协议的任何条款，我们有权暂停或终止向您提供服务。

九、联系我们

如您对本协议有任何疑问，或需要申请退款、反馈问题，可通过以下方式联系我们：
· 客服邮箱：jy.libo@163.com
· 客服微信/QQ：lb04001982

我们将在5个工作日内回复您的咨询。`;

// ─── 主页面 ────────────────────────────────────────────────────────
export default function Login() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [, navigate] = useLocation();

  // 登录表单
  const [loginAccount, setLoginAccount] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // 注册表单
  const [nickname, setNickname] = useState("");
  const [phone, setPhone] = useState("");
  const [smsCode, setSmsCode] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [email, setEmail] = useState("");

  // 短信倒计时
  const [countdown, setCountdown] = useState(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 用户协议弹窗
  const [showAgreement, setShowAgreement] = useState(false);
  // 暂存待提交的注册数据
  const pendingRegisterRef = useRef<{
    nickname: string;
    phone: string;
    smsCode: string;
    password: string;
    email?: string;
  } | null>(null);

  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
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

  const sendSmsMutation = trpc.userAuth.sendSmsCode.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      // 开发模式下显示验证码
      if (data.debugCode) {
        toast.info(`[开发模式] 验证码：${data.debugCode}`, { duration: 30000 });
      }
      // 开始60秒倒计时
      setCountdown(60);
      countdownRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (countdownRef.current) clearInterval(countdownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
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

  const handleSendSms = () => {
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      toast.error("请先输入有效的11位手机号");
      return;
    }
    sendSmsMutation.mutate({ phone });
  };

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
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      toast.error("请输入有效的11位手机号");
      return;
    }
    if (!smsCode || smsCode.length !== 6) {
      toast.error("请输入6位短信验证码");
      return;
    }
    if (regPassword.length < 6) {
      toast.error("密码至少6位");
      return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("请输入有效的邮箱地址");
      return;
    }

    // 暂存数据，弹出协议
    pendingRegisterRef.current = {
      nickname: nickname.trim(),
      phone,
      smsCode,
      password: regPassword,
      email: email.trim() || undefined,
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
    registerMutation.isPending ||
    sendSmsMutation.isPending;

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
                  <label className="block text-xs text-gray-400 mb-1.5">手机号 或 邮箱</label>
                  <input
                    type="text"
                    value={loginAccount}
                    onChange={(e) => setLoginAccount(e.target.value)}
                    placeholder="138xxxx 或 example@email.com"
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

                {/* 手机号（必填）+ 发送验证码 */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">
                    手机号 <span className="text-[oklch(0.75_0.18_55)]">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
                      placeholder="138xxxxxxxx"
                      required
                      className="flex-1 bg-[oklch(0.09_0.01_30)] border border-[oklch(1_0_0/12%)] rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[oklch(0.75_0.18_55/60%)] transition-colors"
                    />
                    <button
                      type="button"
                      onClick={handleSendSms}
                      disabled={countdown > 0 || sendSmsMutation.isPending}
                      className="flex-shrink-0 px-3 py-2.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        background: countdown > 0 || sendSmsMutation.isPending
                          ? "oklch(0.75 0.18 55 / 20%)"
                          : "oklch(0.75 0.18 55 / 30%)",
                        border: "1px solid oklch(0.75 0.18 55 / 40%)",
                        color: "oklch(0.75 0.18 55)",
                        minWidth: "80px",
                      }}
                    >
                      {sendSmsMutation.isPending
                        ? "发送中..."
                        : countdown > 0
                        ? `${countdown}s`
                        : "获取验证码"}
                    </button>
                  </div>
                </div>

                {/* 短信验证码（必填） */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">
                    短信验证码 <span className="text-[oklch(0.75_0.18_55)]">*</span>
                  </label>
                  <input
                    type="text"
                    value={smsCode}
                    onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="6位数字验证码"
                    required
                    maxLength={6}
                    className="w-full bg-[oklch(0.09_0.01_30)] border border-[oklch(1_0_0/12%)] rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[oklch(0.75_0.18_55/60%)] transition-colors tracking-widest"
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

                {/* 邮箱（可选） */}
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">
                    邮箱
                    <span className="text-gray-600 ml-1">（可选，用于找回密码）</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@email.com"
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
