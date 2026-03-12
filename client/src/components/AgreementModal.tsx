/* =============================================================
   用户协议弹窗组件 - 可复用
   - 需滚动到底部才能点击"同意"
   - 支持只读模式（仅展示，无同意/取消按钮）
   ============================================================= */

import { useRef, useState } from "react";

export const USER_AGREEMENT = `智源用户服务协议

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

interface AgreementModalProps {
  /** 只读模式：仅展示协议，不显示同意/取消按钮 */
  readOnly?: boolean;
  onAgree?: () => void;
  onClose: () => void;
}

export default function AgreementModal({
  readOnly = false,
  onAgree,
  onClose,
}: AgreementModalProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20) {
      setHasScrolledToBottom(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* 遮罩 */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 弹窗 */}
      <div
        className="relative w-full max-w-lg rounded-2xl border border-[oklch(0.75_0.18_55/30%)] overflow-hidden"
        style={{ background: "oklch(0.11 0.015 240)" }}
      >
        {/* 标题栏 */}
        <div className="px-6 py-4 border-b border-[oklch(1_0_0/8%)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "oklch(0.75 0.18 55 / 20%)" }}
            >
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4"
                fill="none"
                stroke="oklch(0.75 0.18 55)"
                strokeWidth="2"
              >
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <div>
              <h2 className="text-white font-semibold text-sm">
                智源用户服务协议
              </h2>
              <p className="text-gray-500 text-xs mt-0.5">
                {readOnly
                  ? "更新日期：2026年3月1日"
                  : "请阅读并同意以下协议后完成注册"}
              </p>
            </div>
          </div>
          {/* 关闭按钮 */}
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-200 hover:bg-white/10 transition-colors"
          >
            <svg
              viewBox="0 0 24 24"
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* 协议内容 */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="px-6 py-4 overflow-y-auto text-xs text-gray-400 leading-relaxed whitespace-pre-wrap"
          style={{ maxHeight: "55vh" }}
        >
          {USER_AGREEMENT}
        </div>

        {/* 操作按钮区（仅注册模式显示） */}
        {!readOnly && (
          <>
            {/* 滚动提示 */}
            {!hasScrolledToBottom && (
              <div className="px-6 py-2 flex items-center gap-1.5 text-xs text-gray-600 border-t border-[oklch(1_0_0/6%)]">
                <svg
                  viewBox="0 0 24 24"
                  className="w-3.5 h-3.5 animate-bounce"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
                请向下滚动阅读完整协议
              </div>
            )}
            <div className="px-6 py-4 border-t border-[oklch(1_0_0/8%)] flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-lg border border-[oklch(1_0_0/15%)] text-gray-400 text-sm hover:border-[oklch(1_0_0/30%)] hover:text-gray-200 transition-colors"
              >
                取消注册
              </button>
              <button
                onClick={hasScrolledToBottom ? onAgree : undefined}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all"
                style={{
                  background: hasScrolledToBottom
                    ? "oklch(0.75 0.18 55)"
                    : "oklch(0.75 0.18 55 / 40%)",
                  color: "oklch(0.09 0.01 30)",
                  cursor: hasScrolledToBottom ? "pointer" : "default",
                }}
              >
                {hasScrolledToBottom ? "同意并注册" : "请先阅读完协议"}
              </button>
            </div>
          </>
        )}

        {/* 只读模式底部关闭按钮 */}
        {readOnly && (
          <div className="px-6 py-4 border-t border-[oklch(1_0_0/8%)]">
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all"
              style={{
                background: "oklch(0.75 0.18 55)",
                color: "oklch(0.09 0.01 30)",
              }}
            >
              我已知晓
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
