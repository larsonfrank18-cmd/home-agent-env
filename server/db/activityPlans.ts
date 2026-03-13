import { eq, and } from "drizzle-orm";
import { getDb } from "../db";
import { activityPlans, ActivityPlan, InsertActivityPlan } from "../../drizzle/schema";

/**
 * 创建活动策划
 */
export async function createActivityPlan(data: InsertActivityPlan): Promise<ActivityPlan | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.insert(activityPlans).values(data);
  const id = (result as any)[0]?.insertId;
  if (!id) return null;

  return getActivityPlanById(id as number);
}

/**
 * 获取活动策划详情
 */
export async function getActivityPlanById(id: number): Promise<ActivityPlan | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(activityPlans).where(eq(activityPlans.id, id)).limit(1);
  return result[0] ?? null;
}

/**
 * 获取用户的所有活动策划
 */
export async function getUserActivityPlans(userId: number): Promise<ActivityPlan[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(activityPlans).where(eq(activityPlans.userId, userId));
}

/**
 * 更新活动策划
 */
export async function updateActivityPlan(id: number, data: Partial<InsertActivityPlan>): Promise<ActivityPlan | null> {
  const db = await getDb();
  if (!db) return null;

  const updateData: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      updateData[key] = value;
    }
  }

  if (Object.keys(updateData).length > 0) {
    await db.update(activityPlans).set(updateData as any).where(eq(activityPlans.id, id));
  }
  return getActivityPlanById(id);
}

/**
 * 删除活动策划
 */
export async function deleteActivityPlan(id: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  await db.delete(activityPlans).where(eq(activityPlans.id, id));
  return true;
}

/**
 * 获取用户的待生成活动策划
 */
export async function getPendingActivityPlans(userId: number): Promise<ActivityPlan[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(activityPlans)
    .where(and(eq(activityPlans.userId, userId), eq(activityPlans.status, "pending")));
}
