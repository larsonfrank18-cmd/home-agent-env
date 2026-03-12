/* =============================================================
   家居建材行业类目组件 - 赛博朋克极简主义
   图标 + 文字网格 + 悬停效果
   ============================================================= */

import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";

const INDUSTRY_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663424321294/HS8qgRakRiSQeDBKf2ngfC/industry-banner-87JrBrLUqVRtufqMaj7zqG.webp";

interface Category {
  name: string;
  sub: string[];
  svgPath: string;
  hot?: boolean;
}

const CATEGORIES: Category[] = [
  {
    name: "全屋定制",
    sub: ["衣柜/衣帽间", "橱柜", "榻榻米", "电视柜", "玄关柜", "阳台柜", "护墙板"],
    svgPath: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10",
    hot: true,
  },
  {
    name: "系统门窗",
    sub: ["断桥铝门窗", "铝木复合门窗", "阳光房", "推拉门", "折叠门", "入户门"],
    svgPath: "M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3",
    hot: true,
  },
  {
    name: "地面材料",
    sub: ["实木地板", "复合地板", "瓷砖", "大理石", "水磨石", "地毯"],
    svgPath: "M4 5h16M4 12h16M4 19h16",
    hot: false,
  },
  {
    name: "墙面材料",
    sub: ["乳胶漆", "艺术涂料", "墙纸/墙布", "硅藻泥", "岩板", "木饰面"],
    svgPath: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
    hot: false,
  },
  {
    name: "卫浴洁具",
    sub: ["智能马桶", "浴室柜", "花洒", "浴缸", "五金挂件", "淋浴房"],
    svgPath: "M7 16.5c0 2.485 2.239 4.5 5 4.5s5-2.015 5-4.5V5H7v11.5zM7 5H4M17 5h3",
    hot: false,
  },
  {
    name: "厨房电器",
    sub: ["油烟机", "灶具", "洗碗机", "蒸烤箱", "净水器"],
    svgPath: "M3 3h18v4H3zM3 7v14h18V7M9 7v14M15 7v14",
    hot: false,
  },
  {
    name: "灯光照明",
    sub: ["无主灯设计", "筒灯/射灯", "磁吸轨道灯", "灯带", "吊灯", "氛围灯"],
    svgPath: "M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41M12 7a5 5 0 100 10 5 5 0 000-10z",
    hot: false,
  },
  {
    name: "软装配饰",
    sub: ["窗帘", "沙发", "床垫", "地毯", "装饰画", "绿植"],
    svgPath: "M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z",
    hot: false,
  },
  {
    name: "智能家居",
    sub: ["智能门锁", "智能控制系统", "智能窗帘", "安防监控"],
    svgPath: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
    hot: false,
  },
];

function CategoryCard({ cat, delay }: { cat: Category; delay: number }) {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const [, navigate] = useLocation();

  const handleSelect = () => {
    navigate(`/generator?industry=${encodeURIComponent(cat.name)}`);
  };

  return (
    <div
      ref={ref}
      className="dashed-card rounded p-4 cursor-pointer group"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        transition: `all 0.5s ease ${delay}s`,
      }}
      onClick={handleSelect}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      {/* 图标 + 标题行 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-[oklch(0.82_0.18_178)] group-hover:scale-110 transition-transform flex-shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d={cat.svgPath} />
          </svg>
          <span className="text-white text-sm font-semibold font-['Noto_Sans_SC'] group-hover:text-[oklch(0.82_0.18_178)] transition-colors">
            {cat.name}
          </span>
        </div>
        {cat.hot && (
          <span className="text-[10px] px-1.5 py-0.5 rounded border border-[oklch(0.78_0.15_55/60%)] text-[oklch(0.78_0.15_55)] font-['Inter']">
            HOT
          </span>
        )}
      </div>

      {/* 子类目 */}
      <div
        className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: expanded ? "200px" : "40px" }}
      >
        <div className="flex flex-wrap gap-1">
          {cat.sub.map((s) => (
            <span
              key={s}
              className="text-[10px] text-gray-500 bg-[oklch(0.82_0.18_178/5%)] border border-[oklch(0.82_0.18_178/15%)] px-1.5 py-0.5 rounded font-['Noto_Sans_SC']"
            >
              {s}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function IndustrySection() {
  const [titleVisible, setTitleVisible] = useState(false);
  const titleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setTitleVisible(true);
      },
      { threshold: 0.2 }
    );
    if (titleRef.current) observer.observe(titleRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="py-24 relative overflow-hidden">
      {/* 背景图 */}
      <div
        className="absolute inset-0 opacity-15"
        style={{
          backgroundImage: `url(${INDUSTRY_BG})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="absolute inset-0 bg-[oklch(0.08_0.015_240/80%)]" />

      <div className="container mx-auto px-4 relative z-10">
        {/* 标题 */}
        <div
          ref={titleRef}
          className="text-center mb-16"
          style={{
            opacity: titleVisible ? 1 : 0,
            transform: titleVisible ? "translateY(0)" : "translateY(30px)",
            transition: "all 0.6s ease",
          }}
        >
          <p className="text-xs font-['Orbitron'] tracking-[0.3em] text-[oklch(0.82_0.18_178)] mb-3 uppercase">
            Industry Categories
          </p>
          <h2 className="text-3xl md:text-4xl font-['Noto_Sans_SC'] font-black text-white mb-4">
            覆盖家居建材全品类赛道
          </h2>
          <p className="text-gray-500 text-sm font-['Noto_Sans_SC']">
            选择你的行业赛道，AI将为你定制专属获客方案
          </p>
          <hr className="neon-divider mt-6 max-w-xs mx-auto" />
        </div>

        {/* 类目网格 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
          {CATEGORIES.map((cat, i) => (
            <CategoryCard key={cat.name} cat={cat} delay={i * 0.06} />
          ))}
        </div>

        {/* 底部提示 */}
        <p className="text-center text-gray-600 text-xs mt-8 font-['Noto_Sans_SC']">
          点击任意品类，AI将为您生成专属获客方案 · 悬停查看细分品类
        </p>
      </div>
    </section>
  );
}
