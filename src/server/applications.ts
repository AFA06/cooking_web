import "server-only";
import { count, desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";

export type ApplicationStatus = "pending" | "approved" | "rejected";

export interface Application {
  id: string;
  userId: string;
  accountName: string;
  accountPhone: string | null;
  fullName: string;
  phone: string;
  instagram: string | null;
  telegram: string | null;
  audience: string;
  about: string;
  status: ApplicationStatus;
  adminNote: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
}

const select = {
  id: schema.creatorApplications.id,
  userId: schema.creatorApplications.userId,
  accountName: schema.users.name,
  accountPhone: schema.users.phone,
  fullName: schema.creatorApplications.fullName,
  phone: schema.creatorApplications.phone,
  instagram: schema.creatorApplications.instagram,
  telegram: schema.creatorApplications.telegram,
  audience: schema.creatorApplications.audience,
  about: schema.creatorApplications.about,
  status: schema.creatorApplications.status,
  adminNote: schema.creatorApplications.adminNote,
  reviewedAt: schema.creatorApplications.reviewedAt,
  createdAt: schema.creatorApplications.createdAt,
};

function base() {
  return db.select(select).from(schema.creatorApplications).innerJoin(schema.users, eq(schema.users.id, schema.creatorApplications.userId));
}

/** The person's newest request, to show its status on the "become a creator" page. */
export async function getMyApplication(userId: string): Promise<Application | null> {
  const [row] = await base().where(eq(schema.creatorApplications.userId, userId)).orderBy(desc(schema.creatorApplications.createdAt)).limit(1);
  return row ?? null;
}

export async function listApplications(status: ApplicationStatus): Promise<Application[]> {
  return base().where(eq(schema.creatorApplications.status, status)).orderBy(desc(schema.creatorApplications.createdAt)).limit(200);
}

export async function getApplication(id: string): Promise<Application | null> {
  const [row] = await base().where(eq(schema.creatorApplications.id, id)).limit(1);
  return row ?? null;
}

export async function countPendingApplications(): Promise<number> {
  const [row] = await db.select({ n: count() }).from(schema.creatorApplications).where(eq(schema.creatorApplications.status, "pending"));
  return row?.n ?? 0;
}
