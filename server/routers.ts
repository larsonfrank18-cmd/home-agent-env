import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { copywriterRouter } from "./routers/copywriter";
import { userAuthRouter } from "./routers/userAuth";
import { trendsRouter } from "./routers/trends";
import { knowledgeRouter } from "./routers/knowledge";
import { fileParserRouter } from "./routers/fileParser";
import { dmAssistantRouter } from "./routers/dmAssistant";
import { discAnalyzerRouter } from "./routers/discAnalyzer";
import { adminUsersRouter } from "./routers/adminUsers";
import { activityPlanningRouter } from "./routers/activityPlanning";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  // 用户注册/登录/权限管理
  userAuth: userAuthRouter,
  // 爆款文案生成
  copywriter: copywriterRouter,
  // 热点素材搜索
  trends: trendsRouter,
  // 方法论知识库
  knowledge: knowledgeRouter,
  // 文件解析
  fileParser: fileParserRouter,
  // 私信话术生成器
  dmAssistant: dmAssistantRouter,
  // 客户人格判断工具
  discAnalyzer: discAnalyzerRouter,
  // 管理员用户管理
  adminUsers: adminUsersRouter,
  // 活动策划生成
  activityPlanning: activityPlanningRouter,
});

export type AppRouter = typeof appRouter;
