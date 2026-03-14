import { eq, or, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";
import { InsertUser, User, users, generationHistory, GenerationHistory, InsertGenerationHistory, trendData, TrendData, InsertTrendData } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      // 运行时数据库连接配置
      // 创建一个 mysql2 连接池，并明确指定 SSL 证书
      const pool = mysql.createPool({
        uri: process.env.DATABASE_URL,
        ssl: {
          // Vercel 构建环境中，__dirname 指向当前文件所在目录
          // 我们需要找到项目根目录下的 certs/isrg-root-x1.pem
          ca: fs.readFileSync(path.resolve(process.cwd(), "certs/isrg-root-x1.pem")),
        },
      });
      _db = drizzle(pool);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    const value = user[field];
    if (value === undefined) continue;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  }

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0] ?? undefined;
}

/** 通过邮箱查找用户 */
export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result[0] ?? undefined;
}


/** 创建邮箱/手机号注册用户 */
export async function createLocalUser(data: {
  openId: string;
  email?: string;
  phone?: string;
  name?: string;
  passwordHash: string;
  passwordPlain?: string;
  role?: "user" | "admin";
}): Promise<User> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(users).values({
    openId: data.openId,
    email: data.email ?? null,
    phone: data.phone ?? null,
    name: data.name ?? null,
    passwordHash: data.passwordHash,
    passwordPlain: data.passwordPlain ?? null,
    loginMethod: "local",
    role: data.role ?? "user",
    lastSignedIn: new Date(),
  });

  const created = await getUserByOpenId(data.openId);
  if (!created) throw new Error("Failed to create user");
  return created;
}

/** 获取所有用户（管理员用） */
export async function getAllUsers(): Promise<User[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(users.createdAt);
}

/** 更新用户付费状态 */
export async function setUserPaidStatus(
  userId: number,
  isPaid: boolean,
  expireAt?: Date | null,
  note?: string
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: Record<string, unknown> = {
    isPaid,
    paidAt: isPaid ? new Date() : null,
    paidExpireAt: expireAt ?? null,
  };
  if (note !== undefined) updateData.adminNote = note;

  await db.update(users).set(updateData).where(eq(users.id, userId));
}

/** 更新用户角色 */
export async function setUserRole(userId: number, role: "user" | "admin"): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

/** 保存生成历史 */
export async function saveGenerationHistory(data: InsertGenerationHistory): Promise<GenerationHistory> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(generationHistory).values(data);
  const id = result[0]?.insertId;
  if (!id) throw new Error("Failed to save generation history");
  
  const saved = await db.select().from(generationHistory).where(eq(generationHistory.id, id as number)).limit(1);
  if (!saved[0]) throw new Error("Failed to retrieve saved history");
  return saved[0];
}

/** 获取用户的生成历史 */
export async function getUserGenerationHistory(userId: number, type?: string, limit: number = 50): Promise<GenerationHistory[]> {
  const db = await getDb();
  if (!db) return [];
  
  if (type) {
    return db
      .select()
      .from(generationHistory)
      .where(and(eq(generationHistory.userId, userId), eq(generationHistory.type, type as any)))
      .orderBy(desc(generationHistory.createdAt))
      .limit(limit);
  }
  
  return db
    .select()
    .from(generationHistory)
    .where(eq(generationHistory.userId, userId))
    .orderBy(desc(generationHistory.createdAt))
    .limit(limit);
}

/** 保存趋势数据 */
export async function saveTrendData(data: InsertTrendData): Promise<TrendData> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(trendData).values(data);
  const id = result[0]?.insertId;
  if (!id) throw new Error("Failed to save trend data");
  
  const saved = await db.select().from(trendData).where(eq(trendData.id, id as number)).limit(1);
  if (!saved[0]) throw new Error("Failed to retrieve saved trend data");
  return saved[0];
}

/** 获取缓存的趋势数据 */
export async function getCachedTrendData(keyword: string, platform: string): Promise<TrendData | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db
    .select()
    .from(trendData)
    .where(eq(trendData.keyword, keyword))
    .limit(1);
  
  if (!result[0]) return undefined;
  if (result[0].platform !== platform) return undefined;
  
  return result[0];
}
