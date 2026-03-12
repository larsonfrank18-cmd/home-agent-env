/* =============================================================
   导航栏组件 - 橘黄暖光主题
   简化版：Logo + 核心导航 + 联系我们 + 登录/用户按钮
   ============================================================= */

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Phone, MessageCircle, Copy, Check } from "lucide-react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedWechat, setCopiedWechat] = useState(false);
  const [, navigate] = useLocation();

  const { data: user } = trpc.auth.me.useQuery();
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      window.location.href = "/";
    },
  });

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const copyToClipboard = (text: string, type: "phone" | "wechat") => {
    navigator.clipboard.writeText(text).then(() => {
      if (type === "phone") {
        setCopiedPhone(true);
        setTimeout(() => setCopiedPhone(false), 2000);
      } else {
        setCopiedWechat(true);
        setTimeout(() => setCopiedWechat(false), 2000);
      }
      toast.success("已复制到剪贴板");
    });
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "glass-nav" : "bg-transparent"
        }`}
      >
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <a href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded border border-[oklch(0.75_0.18_55/60%)] flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="oklch(0.75 0.18 55)" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                  <polyline points="9,22 9,12 15,12 15,22" />
                </svg>
              </div>
              <span className="font-['Orbitron'] text-sm font-bold tracking-widest text-[oklch(0.82_0.18_178)]">
                智源AI
              </span>
            </a>

            {/* Center Nav */}
            <div className="hidden md:flex items-center gap-6">
              <a
                href="/"
                className="text-sm text-[oklch(0.82_0.18_178)] hover:text-[oklch(0.92_0.18_178)] transition-colors font-medium"
              >
                首页
              </a>
              <button
                onClick={() => navigate("/generator")}
                className="text-sm text-[oklch(0.82_0.18_178)] hover:text-[oklch(0.92_0.18_178)] transition-colors font-medium"
              >
                文案生成
              </button>
                <button
                onClick={() => navigate("/dm-assistant")}
                className="text-sm text-[oklch(0.82_0.18_178)] hover:text-[oklch(0.92_0.18_178)] transition-colors font-medium"
              >
                私信话术
              </button>
              <button
                onClick={() => navigate("/disc-analyzer")}
                className="text-sm text-[oklch(0.82_0.18_178)] hover:text-[oklch(0.92_0.18_178)] transition-colors font-medium"
              >
                人格分析
              </button>
              <button
                onClick={() => setContactOpen(true)}
                className="text-sm text-[oklch(0.82_0.18_178)] hover:text-[oklch(0.92_0.18_178)] transition-colors font-medium"
              >
                联系我们
              </button>
              {user?.role === "admin" && (
                <button
                  onClick={() => navigate("/admin")}
                  className="text-sm text-[oklch(0.82_0.18_178)] hover:text-[oklch(0.92_0.18_178)] transition-colors font-medium"
                >
                  管理后台
                </button>
              )}
            </div>

            {/* Right Buttons */}
            <div className="flex items-center gap-2">
              {user ? (
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 hidden md:block">
                    {user.name || user.email || "用户"}
                  </span>
                  <button
                    className="px-4 py-1.5 text-xs font-semibold rounded neon-btn"
                    onClick={() => logoutMutation.mutate()}
                  >
                    退出
                  </button>
                </div>
              ) : (
                <button
                  className="px-4 py-1.5 text-xs font-semibold rounded neon-btn-primary"
                  onClick={() => navigate("/login")}
                >
                  登录 / 注册
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* 联系我们弹窗 */}
      <Dialog open={contactOpen} onOpenChange={setContactOpen}>
        <DialogContent
          className="max-w-sm border border-[oklch(0.75_0.18_55/30%)]"
          style={{ background: "oklch(0.1 0.015 240)", color: "oklch(0.97 0 0)" }}
        >
          <DialogHeader>
            <DialogTitle className="text-center text-lg font-bold text-[oklch(0.75_0.18_55)]">
              联系我们
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <p className="text-center text-xs text-gray-400 mb-4">
              如需开通权限或咨询合作，欢迎随时联系
            </p>

            {/* 电话 */}
            <div
              className="flex items-center justify-between p-4 rounded-lg border border-[oklch(0.75_0.18_55/20%)] cursor-pointer hover:border-[oklch(0.75_0.18_55/50%)] transition-colors group"
              style={{ background: "oklch(0.13 0.015 240)" }}
              onClick={() => copyToClipboard("17302479516", "phone")}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "oklch(0.75_0.18_55/15%)" }}>
                  <Phone className="w-4 h-4 text-[oklch(0.75_0.18_55)]" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">电话 / 微信</p>
                  <p className="text-base font-bold text-white tracking-wider">173 0247 9516</p>
                </div>
              </div>
              <div className="text-gray-500 group-hover:text-[oklch(0.75_0.18_55)] transition-colors">
                {copiedPhone ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </div>
            </div>

            {/* 微信 */}
            <div
              className="flex items-center justify-between p-4 rounded-lg border border-[oklch(0.82_0.18_178/20%)] cursor-pointer hover:border-[oklch(0.82_0.18_178/50%)] transition-colors group"
              style={{ background: "oklch(0.13 0.015 240)" }}
              onClick={() => copyToClipboard("lb04001982", "wechat")}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "oklch(0.82_0.18_178/15%)" }}>
                  <MessageCircle className="w-4 h-4 text-[oklch(0.82_0.18_178)]" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">微信号</p>
                  <p className="text-base font-bold text-white tracking-wider">lb04001982</p>
                </div>
              </div>
              <div className="text-gray-500 group-hover:text-[oklch(0.82_0.18_178)] transition-colors">
                {copiedWechat ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </div>
            </div>

            <p className="text-center text-xs text-gray-500 pt-1">
              点击卡片可一键复制联系方式
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
