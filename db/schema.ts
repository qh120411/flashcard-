import { sql } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const userProgress = sqliteTable("user_progress", {
  userEmail: text("user_email").primaryKey(),
  ratings: text("ratings").notNull().default("{}"),
  history: text("history").notNull().default("[]"),
  startDate: text("start_date").notNull(),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
