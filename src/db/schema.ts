import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

// Users table with JWT authentication
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  roles: text('roles', { mode: 'json' }).notNull(),
  profile: text('profile', { mode: 'json' }),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Refresh tokens for JWT authentication
export const refreshTokens = sqliteTable('refresh_tokens', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  tokenHash: text('token_hash').notNull(),
  expiresAt: text('expires_at').notNull(),
  createdAt: text('created_at').notNull(),
  revoked: integer('revoked', { mode: 'boolean' }).notNull().default(false),
});

// Workspaces for multi-tenancy
export const workspaces = sqliteTable('workspaces', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ownerId: integer('owner_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Workspace members for collaboration
export const workspaceMembers = sqliteTable('workspace_members', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  workspaceId: integer('workspace_id').notNull().references(() => workspaces.id),
  userId: integer('user_id').notNull().references(() => users.id),
  role: text('role').notNull(),
  joinedAt: text('joined_at').notNull(),
});

// Datasets for training AI models
export const datasets = sqliteTable('datasets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  workspaceId: integer('workspace_id').notNull().references(() => workspaces.id),
  name: text('name').notNull(),
  filename: text('filename').notNull(),
  fileUrl: text('file_url').notNull(),
  format: text('format').notNull(),
  status: text('status').notNull(),
  validationReport: text('validation_report', { mode: 'json' }),
  createdBy: integer('created_by').notNull().references(() => users.id),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Training jobs for AI model training
export const trainingJobs = sqliteTable('training_jobs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  workspaceId: integer('workspace_id').notNull().references(() => workspaces.id),
  datasetId: integer('dataset_id').notNull().references(() => datasets.id),
  status: text('status').notNull(),
  log: text('log'),
  modelPath: text('model_path'),
  createdAt: text('created_at').notNull(),
  finishedAt: text('finished_at'),
});

// Conversation history for chat analytics
export const conversationHistory = sqliteTable('conversation_history', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  workspaceId: integer('workspace_id').notNull().references(() => workspaces.id),
  sessionId: text('session_id').notNull(),
  message: text('message').notNull(),
  intent: text('intent'),
  entities: text('entities', { mode: 'json' }),
  sentiment: text('sentiment'),
  response: text('response'),
  createdAt: text('created_at').notNull(),
});