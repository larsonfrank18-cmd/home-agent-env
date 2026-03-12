/**
 * 方法论知识库管理页面（仅管理员）
 * 路径：/knowledge
 *
 * 功能：
 * - 查看所有知识条目（搜索/分类筛选）
 * - 新增知识条目（标题/分类/标签/内容）
 * - 编辑/启用/禁用/删除条目
 * - 查看统计数据
 */

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

const CATEGORY_OPTIONS = [
  { value: "method", label: "方法论/技巧", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  { value: "case", label: "真实案例", color: "bg-green-500/20 text-green-300 border-green-500/30" },
  { value: "script", label: "话术模板", color: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
  { value: "insight", label: "行业洞察", color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" },
  { value: "other", label: "其他", color: "bg-gray-500/20 text-gray-300 border-gray-500/30" },
];

const INDUSTRY_TAGS = [
  "全屋定制", "系统门窗", "地面材料", "墙面材料", "卫浴洁具",
  "厨房电器", "灯光照明", "软装配饰", "智能家居", "通用",
];

function getCategoryStyle(category: string) {
  return CATEGORY_OPTIONS.find((c) => c.value === category)?.color ||
    "bg-gray-500/20 text-gray-300 border-gray-500/30";
}

function getCategoryLabel(category: string) {
  return CATEGORY_OPTIONS.find((c) => c.value === category)?.label || category;
}

// ─── 新增/编辑弹窗 ────────────────────────────────────────────────

interface EntryFormProps {
  initial?: {
    id?: number;
    title: string;
    content: string;
    category: string;
    tags: string;
  };
  onClose: () => void;
  onSaved: () => void;
}

function EntryForm({ initial, onClose, onSaved }: EntryFormProps) {
  const [title, setTitle] = useState(initial?.title || "");
  const [content, setContent] = useState(initial?.content || "");
  const [category, setCategory] = useState(initial?.category || "method");
  const [selectedTags, setSelectedTags] = useState<string[]>(
    initial?.tags ? initial.tags.split(",").filter(Boolean) : []
  );
  const [preview, setPreview] = useState(false);
  const [fileUploading, setFileUploading] = useState(false);
  const [fileInfo, setFileInfo] = useState<string | null>(null);

  const parseFileMutation = trpc.fileParser.parse.useMutation({
    onSuccess: (data) => {
      setContent((prev) => {
        const separator = prev.trim() ? "\n\n---\n\n" : "";
        return prev + separator + data.extractedText;
      });
      setFileInfo(`✅ 已解析：${data.filename}（${data.charCount.toLocaleString()} 字${data.truncated ? "，内容已截断" : ""}）`);
      setFileUploading(false);
      toast.success(`文件解析成功，内容已填入`);
    },
    onError: (e) => {
      setFileUploading(false);
      toast.error(e.message);
    },
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_SIZE = 30 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      toast.error("文件大小不能超过 30MB");
      return;
    }

    setFileUploading(true);
    setFileInfo(`⏳ 正在解析：${file.name}...`);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      // dataUrl 格式: "data:mime/type;base64,XXXXX"
      const base64 = dataUrl.split(",")[1];
      if (!base64) {
        setFileUploading(false);
        toast.error("文件读取失败");
        return;
      }
      parseFileMutation.mutate({
        filename: file.name,
        mimeType: file.type || "application/octet-stream",
        data: base64,
        size: file.size,
      });
    };
    reader.onerror = () => {
      setFileUploading(false);
      toast.error("文件读取失败，请重试");
    };
    reader.readAsDataURL(file);
    // 清空 input，允许重复上传同一文件
    e.target.value = "";
  };

  const createMutation = trpc.knowledge.create.useMutation({
    onSuccess: () => {
      toast.success("知识条目已添加！");
      onSaved();
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.knowledge.update.useMutation({
    onSuccess: () => {
      toast.success("知识条目已更新！");
      onSaved();
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = () => {
    if (!title.trim()) return toast.error("请填写标题");
    if (!content.trim()) return toast.error("请填写内容");

    const tags = selectedTags.filter((t) => t !== "通用").join(",");

    if (initial?.id) {
      updateMutation.mutate({ id: initial.id, title, content, category: category as any, tags });
    } else {
      createMutation.mutate({ title, content, category: category as any, tags });
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div
        className="w-full max-w-2xl rounded-xl border border-orange-500/30 overflow-hidden"
        style={{ background: "oklch(0.12 0.015 240)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-orange-500/20">
          <h2 className="text-lg font-bold text-white">
            {initial?.id ? "编辑知识条目" : "新增知识条目"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">✕</button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* 标题 */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">标题 <span className="text-orange-400">*</span></label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：全屋定制爆款开头公式"
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-orange-500/50"
            />
          </div>

          {/* 分类 */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">分类</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setCategory(opt.value)}
                  className={`px-3 py-1 rounded-full text-xs border transition-all ${
                    category === opt.value
                      ? opt.color + " border-opacity-100"
                      : "bg-white/5 text-gray-400 border-white/10 hover:border-white/20"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 适用品类标签 */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              适用品类 <span className="text-gray-500 text-xs">（不选则通用，适用所有品类）</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {INDUSTRY_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1 rounded-full text-xs border transition-all ${
                    selectedTags.includes(tag)
                      ? "bg-orange-500/20 text-orange-300 border-orange-500/40"
                      : "bg-white/5 text-gray-400 border-white/10 hover:border-white/20"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* 内容 */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm text-gray-400">
                内容 <span className="text-orange-400">*</span>
                <span className="text-gray-500 text-xs ml-2">（支持 Markdown 格式）</span>
              </label>
              <div className="flex items-center gap-3">
                {/* 文件上传按钮 */}
                <label
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs border cursor-pointer transition-all ${
                    fileUploading
                      ? "opacity-50 cursor-not-allowed border-orange-500/30 text-orange-400"
                      : "border-orange-500/40 text-orange-400 hover:bg-orange-500/10 hover:border-orange-500/60"
                  }`}
                >
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.md,.jpg,.jpeg,.png,.gif,.webp,.bmp"
                    onChange={handleFileUpload}
                    disabled={fileUploading}
                    className="hidden"
                  />
                  {fileUploading ? (
                    <>
                      <span className="inline-block w-3 h-3 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
                      解析中...
                    </>
                  ) : (
                    <>
                      <span>📎</span>
                      上传文件
                    </>
                  )}
                </label>
                <button
                  onClick={() => setPreview(!preview)}
                  className="text-xs text-orange-400 hover:text-orange-300"
                >
                  {preview ? "编辑" : "预览"}
                </button>
              </div>
            </div>
            {/* 文件解析状态提示 */}
            {fileInfo && (
              <div className="mb-2 px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-xs text-orange-300">
                {fileInfo}
              </div>
            )}
            {/* 支持格式说明 */}
            <p className="text-xs text-gray-500 mb-1">
              支持上传：PDF · Word(.docx) · Excel(.xlsx/.csv) · 图片(jpg/png) · 文本(.txt/.md)，最大 20MB
            </p>
            {preview ? (
              <div className="min-h-[200px] p-3 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-200 prose prose-invert prose-sm max-w-none">
                <Streamdown>{content}</Streamdown>
              </div>
            ) : (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="在此输入方法论、案例、话术或洞察内容...

例如：
## 爆款开头公式
1. 痛点开头：「你是不是也遇到过...」
2. 数字开头：「3个技巧让你的全屋定制省30%」
3. 悬念开头：「99%的人装修都不知道这件事」"
                rows={10}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-orange-500/50 resize-none font-mono"
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-orange-500/20">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-6 py-2 text-sm font-semibold rounded-lg transition-all disabled:opacity-50"
            style={{ background: "oklch(0.65 0.18 55)", color: "oklch(0.1 0 0)" }}
          >
            {isLoading ? "保存中..." : initial?.id ? "保存修改" : "添加到知识库"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── 主页面 ───────────────────────────────────────────────────────

export default function Knowledge() {
  const [, navigate] = useLocation();
  const { data: user, isLoading: authLoading } = trpc.auth.me.useQuery();

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editEntry, setEditEntry] = useState<any>(null);

  // 权限检查
  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  const utils = trpc.useUtils();

  const { data: stats } = trpc.knowledge.stats.useQuery(undefined, {
    enabled: user?.role === "admin",
  });

  const { data: listData, isLoading: listLoading } = trpc.knowledge.list.useQuery(
    {
      search: search || undefined,
      category: filterCategory as any,
      page,
      pageSize: 15,
    },
    { enabled: user?.role === "admin" }
  );

  const deleteMutation = trpc.knowledge.delete.useMutation({
    onSuccess: () => {
      toast.success("已删除");
      utils.knowledge.list.invalidate();
      utils.knowledge.stats.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleActiveMutation = trpc.knowledge.update.useMutation({
    onSuccess: () => {
      utils.knowledge.list.invalidate();
      utils.knowledge.stats.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleDelete = (id: number, title: string) => {
    if (window.confirm(`确认删除「${title}」？此操作不可撤销。`)) {
      deleteMutation.mutate({ id });
    }
  };

  const handleToggleActive = (id: number, current: boolean) => {
    toggleActiveMutation.mutate({ id, isActive: !current });
  };

  const handleSaved = () => {
    utils.knowledge.list.invalidate();
    utils.knowledge.stats.invalidate();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "oklch(0.08 0.015 240)" }}>
        <div className="text-gray-400">加载中...</div>
      </div>
    );
  }

  if (!user || user.role !== "admin") return null;

  return (
    <div className="min-h-screen" style={{ background: "oklch(0.08 0.015 240)", color: "oklch(0.97 0 0)" }}>
      {/* 顶部导航 */}
      <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/admin")}
            className="text-gray-400 hover:text-white text-sm flex items-center gap-1"
          >
            ← 返回管理后台
          </button>
          <span className="text-white/20">|</span>
          <h1 className="text-lg font-bold text-white">方法论知识库</h1>
        </div>
        <button
          onClick={() => { setEditEntry(null); setShowForm(true); }}
          className="px-4 py-2 text-sm font-semibold rounded-lg"
          style={{ background: "oklch(0.65 0.18 55)", color: "oklch(0.1 0 0)" }}
        >
          + 新增知识条目
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* 统计卡片 */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="rounded-xl border border-white/10 p-4" style={{ background: "oklch(0.12 0.015 240)" }}>
              <div className="text-2xl font-bold text-white">{stats.total}</div>
              <div className="text-xs text-gray-400 mt-1">知识条目总数</div>
            </div>
            <div className="rounded-xl border border-green-500/20 p-4" style={{ background: "oklch(0.12 0.015 240)" }}>
              <div className="text-2xl font-bold text-green-400">{stats.active}</div>
              <div className="text-xs text-gray-400 mt-1">已启用（参与生成）</div>
            </div>
            {CATEGORY_OPTIONS.slice(0, 2).map((cat) => (
              <div key={cat.value} className="rounded-xl border border-white/10 p-4" style={{ background: "oklch(0.12 0.015 240)" }}>
                <div className="text-2xl font-bold text-orange-400">
                  {stats.byCategory[cat.value] || 0}
                </div>
                <div className="text-xs text-gray-400 mt-1">{cat.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* 说明卡片 */}
        <div className="rounded-xl border border-orange-500/20 p-4 mb-6 flex items-start gap-3"
          style={{ background: "oklch(0.65 0.18 55 / 0.08)" }}>
          <span className="text-orange-400 text-lg mt-0.5">💡</span>
          <div className="text-sm text-gray-300">
            <strong className="text-orange-300">知识库说明：</strong>
            这里的内容会在用户生成文案时自动被 AI 参考，与底座方法论（薛辉2.8版本）并行使用。
            知识库只增不替换，您可以随时追加新方法、真实案例、话术模板或行业洞察。
            <strong className="text-white"> 禁用</strong>的条目不会参与文案生成，但保留记录。
          </div>
        </div>

        {/* 搜索和筛选 */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="搜索标题、内容或标签..."
            className="flex-1 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-orange-500/50"
          />
          <div className="flex gap-2">
            <button
              onClick={() => { setFilterCategory("all"); setPage(1); }}
              className={`px-3 py-2 rounded-lg text-xs border transition-all ${
                filterCategory === "all"
                  ? "bg-orange-500/20 text-orange-300 border-orange-500/40"
                  : "bg-white/5 text-gray-400 border-white/10"
              }`}
            >
              全部
            </button>
            {CATEGORY_OPTIONS.map((cat) => (
              <button
                key={cat.value}
                onClick={() => { setFilterCategory(cat.value); setPage(1); }}
                className={`px-3 py-2 rounded-lg text-xs border transition-all ${
                  filterCategory === cat.value ? cat.color : "bg-white/5 text-gray-400 border-white/10"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* 知识条目列表 */}
        {listLoading ? (
          <div className="text-center py-12 text-gray-400">加载中...</div>
        ) : !listData?.entries.length ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-4">📚</div>
            <div className="text-gray-400 mb-2">知识库还是空的</div>
            <div className="text-gray-500 text-sm mb-6">添加您的第一条方法论、案例或话术</div>
            <button
              onClick={() => { setEditEntry(null); setShowForm(true); }}
              className="px-6 py-2 text-sm font-semibold rounded-lg"
              style={{ background: "oklch(0.65 0.18 55)", color: "oklch(0.1 0 0)" }}
            >
              + 新增知识条目
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {listData.entries.map((entry) => (
              <div
                key={entry.id}
                className={`rounded-xl border p-5 transition-all ${
                  entry.isActive
                    ? "border-white/10"
                    : "border-white/5 opacity-50"
                }`}
                style={{ background: "oklch(0.12 0.015 240)" }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full text-xs border ${getCategoryStyle(entry.category)}`}>
                        {getCategoryLabel(entry.category)}
                      </span>
                      {entry.tags && entry.tags.split(",").filter(Boolean).map((tag) => (
                        <span key={tag} className="px-2 py-0.5 rounded-full text-xs bg-orange-500/10 text-orange-400 border border-orange-500/20">
                          {tag}
                        </span>
                      ))}
                      {(!entry.tags || entry.tags === "") && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-white/5 text-gray-500 border border-white/10">
                          通用
                        </span>
                      )}
                      {!entry.isActive && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-red-500/10 text-red-400 border border-red-500/20">
                          已禁用
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-white mb-1">{entry.title}</h3>
                    <p className="text-sm text-gray-400 line-clamp-2">
                      {entry.content.replace(/[#*`]/g, "").slice(0, 120)}
                      {entry.content.length > 120 ? "..." : ""}
                    </p>
                    <div className="text-xs text-gray-600 mt-2">
                      {new Date(entry.createdAt).toLocaleDateString("zh-CN")} 添加
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleToggleActive(entry.id, entry.isActive)}
                      className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${
                        entry.isActive
                          ? "bg-white/5 text-gray-400 border-white/10 hover:border-yellow-500/30 hover:text-yellow-400"
                          : "bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20"
                      }`}
                    >
                      {entry.isActive ? "禁用" : "启用"}
                    </button>
                    <button
                      onClick={() => { setEditEntry(entry); setShowForm(true); }}
                      className="px-3 py-1.5 rounded-lg text-xs border bg-white/5 text-gray-400 border-white/10 hover:border-blue-500/30 hover:text-blue-400 transition-all"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleDelete(entry.id, entry.title)}
                      className="px-3 py-1.5 rounded-lg text-xs border bg-white/5 text-gray-400 border-white/10 hover:border-red-500/30 hover:text-red-400 transition-all"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* 分页 */}
            {listData.total > 15 && (
              <div className="flex items-center justify-center gap-3 pt-4">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 text-sm rounded-lg bg-white/5 border border-white/10 text-gray-400 disabled:opacity-30 hover:border-white/20"
                >
                  上一页
                </button>
                <span className="text-sm text-gray-400">
                  第 {page} 页 / 共 {Math.ceil(listData.total / 15)} 页（{listData.total} 条）
                </span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= Math.ceil(listData.total / 15)}
                  className="px-4 py-2 text-sm rounded-lg bg-white/5 border border-white/10 text-gray-400 disabled:opacity-30 hover:border-white/20"
                >
                  下一页
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 新增/编辑弹窗 */}
      {showForm && (
        <EntryForm
          initial={editEntry || undefined}
          onClose={() => { setShowForm(false); setEditEntry(null); }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
