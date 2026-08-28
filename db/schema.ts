import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
export const activityEvents=sqliteTable("activity_events",{id:integer("id").primaryKey({autoIncrement:true}),event:text("event").notNull(),path:text("path").notNull(),productSlug:text("product_slug"),createdAt:integer("created_at").notNull()});

