import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// 用户表
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),           // nanoid
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: integer('created_at').notNull(), // Unix timestamp
});

// 教程系列表（支持无限层级树）
export const series = sqliteTable('series', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  parentId: text('parent_id'),            // null = 顶级系列
  title: text('title').notNull(),
  description: text('description'),
  icon: text('icon'),                     // emoji 或 icon key
  sortOrder: integer('sort_order').default(0),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

// 文章表
export const articles = sqliteTable('articles', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  seriesId: text('series_id').references(() => series.id),
  title: text('title').notNull(),
  content: text('content').notNull().default(''), // 原始 Markdown
  summary: text('summary'),
  status: text('status').notNull().default('draft'), // draft | published
  sortOrder: integer('sort_order').default(0),
  wordCount: integer('word_count').default(0),
  readingMinutes: integer('reading_minutes').default(0),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
  publishedAt: integer('published_at'),
});

// 标签表
export const tags = sqliteTable('tags', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  color: text('color').default('gray'),
});

// 文章-标签关联
export const articleTags = sqliteTable('article_tags', {
  articleId: text('article_id').references(() => articles.id),
  tagId: text('tag_id').references(() => tags.id),
});

// 快速笔记
export const notes = sqliteTable('notes', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  content: text('content').notNull(),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

// 文章修改历史（保留最近 20 版）
export const articleHistory = sqliteTable('article_history', {
  id: text('id').primaryKey(),
  articleId: text('article_id').references(() => articles.id),
  content: text('content').notNull(),
  savedAt: integer('saved_at').notNull(),
});

// 每日写作记录（热力图数据）
export const writingLogs = sqliteTable('writing_logs', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  date: text('date').notNull(),          // YYYY-MM-DD
  articleCount: integer('article_count').default(0),
  wordCount: integer('word_count').default(0),
});
