import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extended with Anom Artsy profile and economy fields.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "ambassador", "moderator", "admin", "owner"]).default("user").notNull(),
  status: mysqlEnum("status", ["active", "suspended"]).default("active").notNull(),
  moderatorTier: varchar("moderator_tier", { length: 20 }).default("none"),
  dateOfBirth: timestamp("date_of_birth"),
  ageTier: mysqlEnum("age_tier", ["unverified", "sprout", "explorer", "builder", "architect", "guardian"]).default("unverified").notNull(),
  tierOverride: boolean("tier_override").default(false).notNull(),
  restrictedUntil: timestamp("restricted_until"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * User Profiles — stores Anom Artsy-specific profile data
 */
export const userProfiles = mysqlTable("user_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().unique(),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  neonTheme: varchar("neon_theme", { length: 50 }).default("magenta"),
  nameColor: varchar("name_color", { length: 7 }).default("#00eaff"), // hex color for VIP name display
  decorationPackageIds: json("decoration_package_ids").$type<number[]>(),
  level: int("level").default(1),
  xp: int("xp").default(0),
  anomCoinBalance: decimal("anom_coin_balance", { precision: 10, scale: 2 }).default("0"),
  membershipTier: mysqlEnum("membership_tier", ["basic", "vip", "super_vip"]).default("basic"),
  tierUpgradedAt: timestamp("tier_upgraded_at"),
  tierExpiresAt: timestamp("tier_expires_at"),
  coinMultiplier: decimal("coin_multiplier", { precision: 3, scale: 1 }).default("1.0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = typeof userProfiles.$inferInsert;

/**
 * Decoration Packages — pre-built neon themes, character badges, mood glows
 */
export const decorationPackages = mysqlTable("decoration_packages", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 50 }).notNull(), // "character_badge", "mood_glow", "neon_theme"
  imageUrl: text("image_url"),
  costAnom: decimal("cost_anom", { precision: 10, scale: 2 }).default("0"),
  costReal: decimal("cost_real", { precision: 10, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type DecorationPackage = typeof decorationPackages.$inferSelect;
export type InsertDecorationPackage = typeof decorationPackages.$inferInsert;

/**
 * Anom Coin Transactions — track all coin earning and spending
 */
export const coinTransactions = mysqlTable("coin_transactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  type: mysqlEnum("type", ["earn", "spend"]).notNull(),
  reason: varchar("reason", { length: 100 }).notNull(), // "game_completion", "lesson_finish", "package_purchase", etc.
  relatedId: int("related_id"), // ID of related entity (game score, achievement, etc.)
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type CoinTransaction = typeof coinTransactions.$inferSelect;
export type InsertCoinTransaction = typeof coinTransactions.$inferInsert;

/**
 * Achievements — visual badges earned for positive engagement
 */
export const achievements = mysqlTable("achievements", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  iconUrl: text("icon_url"),
  category: varchar("category", { length: 50 }).notNull(), // "social_good", "game", "family", "community"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = typeof achievements.$inferInsert;

/**
 * User Achievements — tracks which achievements a user has earned
 */
export const userAchievements = mysqlTable("user_achievements", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  achievementId: int("achievement_id").notNull(),
  unlockedAt: timestamp("unlocked_at").defaultNow().notNull(),
});

export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertUserAchievement = typeof userAchievements.$inferInsert;

/**
 * Lounges — private social spaces for Family, Friends, Coworkers
 */
export const lounges = mysqlTable("lounges", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  type: mysqlEnum("type", ["family", "friends", "coworkers"]).notNull(),
  ownerId: int("owner_id").notNull(),
  description: text("description"),
  neonTheme: varchar("neon_theme", { length: 50 }).default("magenta"),
  costAnom: decimal("cost_anom", { precision: 10, scale: 2 }).default("0"),
  costReal: decimal("cost_real", { precision: 10, scale: 2 }).default("0"),
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type Lounge = typeof lounges.$inferSelect;
export type InsertLounge = typeof lounges.$inferInsert;

/**
 * Lounge Members — tracks membership and access
 */
export const loungeMembers = mysqlTable("lounge_members", {
  id: int("id").autoincrement().primaryKey(),
  loungeId: int("lounge_id").notNull(),
  userId: int("user_id").notNull(),
  role: mysqlEnum("role", ["owner", "admin", "member"]).default("member"),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

export type LoungeMember = typeof loungeMembers.$inferSelect;
export type InsertLoungeMember = typeof loungeMembers.$inferInsert;

/**
 * Lounge Messages — chat history within lounges
 */
export const loungeMessages = mysqlTable("lounge_messages", {
  id: int("id").autoincrement().primaryKey(),
  loungeId: int("lounge_id").notNull(),
  userId: int("user_id").notNull(),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  isPinned: boolean("is_pinned").default(false).notNull(),
  reactions: json("reactions").$type<Record<string, number[]>>(), // emoji -> array of userIds
  deletedAt: timestamp("deleted_at"),
  deletedByUserId: int("deleted_by_user_id"),
  moderationStatus: varchar("moderation_status", { length: 30 }).default("visible").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Activity Feed Events — broadcast recent lounge milestones, pinned announcements, and social updates
 */
export const activityEvents = mysqlTable("activity_events", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  loungeId: int("lounge_id"),
  title: varchar("title", { length: 150 }).notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 50 }).default("milestone").notNull(), // "milestone", "pinned_announcement", "lounge_created"
  likesCount: int("likes_count").default(0).notNull(),
  ratingSum: int("rating_sum").default(0).notNull(),
  ratingCount: int("rating_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ActivityEvent = typeof activityEvents.$inferSelect;
export type InsertActivityEvent = typeof activityEvents.$inferInsert;

export type LoungeMessage = typeof loungeMessages.$inferSelect;
export type InsertLoungeMessage = typeof loungeMessages.$inferInsert;

/**
 * Lounge Read States — track last read timestamps per user per lounge for unread badges
 */
export const loungeReadStates = mysqlTable("lounge_read_states", {
  id: int("id").autoincrement().primaryKey(),
  loungeId: int("lounge_id").notNull(),
  userId: int("user_id").notNull(),
  lastReadAt: timestamp("last_read_at").defaultNow().notNull(),
});

export type LoungeReadState = typeof loungeReadStates.$inferSelect;
export type InsertLoungeReadState = typeof loungeReadStates.$inferInsert;

/**
 * Merch Requests — customer custom art requests
 */
export const merchRequests = mysqlTable("merch_requests", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  title: varchar("title", { length: 100 }).notNull(),
  description: text("description").notNull(),
  referenceImages: json("reference_images").$type<string[]>(),
  status: mysqlEnum("status", ["pending", "approved", "in_progress", "completed", "rejected"]).default("pending"),
  estimatedPrice: decimal("estimated_price", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type MerchRequest = typeof merchRequests.$inferSelect;
export type InsertMerchRequest = typeof merchRequests.$inferInsert;

/**
 * Merch Orders — completed purchases
 */
export const merchOrders = mysqlTable("merch_orders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  requestId: int("request_id"),
  productName: varchar("product_name", { length: 100 }).notNull(),
  quantity: int("quantity").default(1),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  paymentStatus: mysqlEnum("payment_status", ["pending", "paid", "failed"]).default("pending"),
  fulfillmentStatus: mysqlEnum("fulfillment_status", ["pending", "created", "shipped", "delivered"]).default("pending"),
  printfulOrderId: varchar("printful_order_id", { length: 100 }),
  trackingUrl: text("tracking_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type MerchOrder = typeof merchOrders.$inferSelect;
export type InsertMerchOrder = typeof merchOrders.$inferInsert;

/**
 * Game Scores — tracks mini-game performance
 */
export const gameScores = mysqlTable("game_scores", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  gameName: varchar("game_name", { length: 50 }).notNull(), // "trivia", "memory", "mood_matcher", "snack_vault"
  score: int("score").notNull(),
  coinReward: decimal("coin_reward", { precision: 10, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type GameScore = typeof gameScores.$inferSelect;
export type InsertGameScore = typeof gameScores.$inferInsert;

/**
 * Social Feed Posts — community content (memes, highlights, updates)
 */
export const feedPosts = mysqlTable("feed_posts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id"),
  postType: mysqlEnum("post_type", ["meme", "highlight", "update", "achievement"]).notNull(),
  title: varchar("title", { length: 100 }),
  content: text("content"),
  imageUrl: text("image_url"),
  likes: int("likes").default(0),
  deletedAt: timestamp("deleted_at"),
  deletedByUserId: int("deleted_by_user_id"),
  moderationStatus: varchar("moderation_status", { length: 30 }).default("visible").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type FeedPost = typeof feedPosts.$inferSelect;
export type InsertFeedPost = typeof feedPosts.$inferInsert;

/**
 * Kids Corner Progress — tracks lessons, videos watched, game completions
 */
export const kidsProgress = mysqlTable("kids_progress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  guardianLinkId: int("guardian_link_id"),
  contentType: varchar("content_type", { length: 50 }).notNull(), // "video", "lesson", "game", "coloring", "showcase", "irl_media"
  contentId: varchar("content_id", { length: 100 }).notNull(),
  approvalStatus: mysqlEnum("approval_status", ["pending_guardian", "approved", "rejected"]).default("pending_guardian").notNull(),
  completed: boolean("completed").default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type KidsProgress = typeof kidsProgress.$inferSelect;
export type InsertKidsProgress = typeof kidsProgress.$inferInsert;

/**
 * Collaboration Projects — social good initiatives created by users
 */
export const collaborationProjects = mysqlTable("collaboration_projects", {
  id: int("id").autoincrement().primaryKey(),
  creatorId: int("creator_id").notNull(),
  title: varchar("title", { length: 100 }).notNull(),
  description: text("description"),
  cause: varchar("cause", { length: 50 }).notNull(), // "environment", "education", "health", "community", "technology"
  imageUrl: text("image_url"),
  status: mysqlEnum("status", ["active", "completed", "paused"]).default("active").notNull(),
  targetMembers: int("target_members").default(1),
  currentMembers: int("current_members").default(1),
  coinRewardPerTask: decimal("coin_reward_per_task", { precision: 10, scale: 2 }).default("10"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type CollaborationProject = typeof collaborationProjects.$inferSelect;
export type InsertCollaborationProject = typeof collaborationProjects.$inferInsert;

/**
 * Collaboration Project Members — tracks members and their contributions
 */
export const collaborationMembers = mysqlTable("collaboration_members", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("project_id").notNull(),
  userId: int("user_id").notNull(),
  role: mysqlEnum("role", ["creator", "member"]).default("member").notNull(),
  tasksCompleted: int("tasks_completed").default(0),
  coinsEarned: decimal("coins_earned", { precision: 10, scale: 2 }).default("0"),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

export type CollaborationMember = typeof collaborationMembers.$inferSelect;
export type InsertCollaborationMember = typeof collaborationMembers.$inferInsert;

/**
 * Collaboration Tasks — individual tasks within projects
 */
export const collaborationTasks = mysqlTable("collaboration_tasks", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("project_id").notNull(),
  title: varchar("title", { length: 100 }).notNull(),
  description: text("description"),
  assignedTo: int("assigned_to"),
  status: mysqlEnum("status", ["pending", "in_progress", "completed"]).default("pending").notNull(),
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type CollaborationTask = typeof collaborationTasks.$inferSelect;
export type InsertCollaborationTask = typeof collaborationTasks.$inferInsert;

/**
 * Collaboration Updates — project activity feed
 */
export const collaborationUpdates = mysqlTable("collaboration_updates", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("project_id").notNull(),
  userId: int("user_id").notNull(),
  updateType: mysqlEnum("update_type", ["task_completed", "member_joined", "milestone_reached", "comment"]).notNull(),
  content: text("content"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type CollaborationUpdate = typeof collaborationUpdates.$inferSelect;
export type InsertCollaborationUpdate = typeof collaborationUpdates.$inferInsert;


/**
 * Platform Settings — owner/admin configuration for the entire platform
 */
export const platformSettings = mysqlTable("platform_settings", {
  id: int("id").autoincrement().primaryKey(),
  siteName: varchar("site_name", { length: 255 }).default("Anom Artsy"),
  siteDescription: text("site_description"),
  logoUrl: text("logo_url"),
  faviconUrl: text("favicon_url"),
  primaryColor: varchar("primary_color", { length: 7 }).default("#ff00cc"), // magenta
  secondaryColor: varchar("secondary_color", { length: 7 }).default("#00eaff"), // cyan
  accentColor: varchar("accent_color", { length: 7 }).default("#9d4edd"), // purple
  
  // Economy settings
  coinRewardPerAction: int("coin_reward_per_action").default(10),
  coinRewardPerGame: int("coin_reward_per_game").default(50),
  coinRewardPerTask: int("coin_reward_per_task").default(10),
  xpPerLevel: int("xp_per_level").default(100),
  
  // Feature flags
  enableMerch: boolean("enable_merch").default(true),
  enableLounges: boolean("enable_lounges").default(true),
  enableGames: boolean("enable_games").default(true),
  enableCollaboration: boolean("enable_collaboration").default(true),
  enableKidsCorner: boolean("enable_kids_corner").default(true),
  
  // Feature flags JSON storage
  featureFlags: json("feature_flags").$type<Record<string, boolean>>(),

  // Payment settings
  stripePublicKey: varchar("stripe_public_key", { length: 255 }),
  stripeSecretKey: varchar("stripe_secret_key", { length: 255 }),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type PlatformSettings = typeof platformSettings.$inferSelect;
export type InsertPlatformSettings = typeof platformSettings.$inferInsert;

/**
 * Audit Log — tracks admin actions and platform events
 */
export const auditLog = mysqlTable("audit_log", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id"),
  action: varchar("action", { length: 100 }).notNull(), // "user_created", "coin_transaction", "achievement_awarded", etc.
  entityType: varchar("entity_type", { length: 50 }).notNull(), // "user", "coin", "achievement", etc.
  entityId: int("entity_id"),
  details: json("details").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AuditLog = typeof auditLog.$inferSelect;
export type InsertAuditLog = typeof auditLog.$inferInsert;

/**
 * VIP Tiers — defines VIP membership levels and benefits
 */
export const vipTiers = mysqlTable("vip_tiers", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 50 }).notNull(), // "vip", "super_vip"
  monthlyPrice: decimal("monthly_price", { precision: 10, scale: 2 }).notNull(),
  coinMultiplier: decimal("coin_multiplier", { precision: 3, scale: 1 }).default("1.5"),
  xpMultiplier: decimal("xp_multiplier", { precision: 3, scale: 1 }).default("1.5"),
  benefits: json("benefits").$type<string[]>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type VipTier = typeof vipTiers.$inferSelect;
export type InsertVipTier = typeof vipTiers.$inferInsert;

/**
 * User VIP Subscriptions — tracks active VIP memberships
 */
export const userVipSubscriptions = mysqlTable("user_vip_subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().unique(),
  tierId: int("tier_id").notNull(),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 100 }),
  status: mysqlEnum("status", ["active", "paused", "cancelled"]).default("active"),
  startDate: timestamp("start_date").defaultNow().notNull(),
  renewalDate: timestamp("renewal_date"),
  cancelledAt: timestamp("cancelled_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type UserVipSubscription = typeof userVipSubscriptions.$inferSelect;
export type InsertUserVipSubscription = typeof userVipSubscriptions.$inferInsert;

/**
 * VIP Benefits Log — tracks VIP-exclusive rewards and perks
 */
export const vipBenefitsLog = mysqlTable("vip_benefits_log", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  benefitType: varchar("benefit_type", { length: 50 }).notNull(), // "bonus_coins", "exclusive_decoration", "early_access"
  amount: decimal("amount", { precision: 10, scale: 2 }),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type VipBenefitsLog = typeof vipBenefitsLog.$inferSelect;
export type InsertVipBenefitsLog = typeof vipBenefitsLog.$inferInsert;

/**
 * Music Library — tracks user's music collection and playlists
 */
export const musicLibrary = mysqlTable("music_library", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  title: varchar("title", { length: 100 }).notNull(),
  artist: varchar("artist", { length: 100 }),
  url: text("url").notNull(),
  duration: int("duration"), // in seconds
  isPlaylist: boolean("is_playlist").default(false),
  playlistItems: json("playlist_items").$type<number[]>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type MusicLibrary = typeof musicLibrary.$inferSelect;
export type InsertMusicLibrary = typeof musicLibrary.$inferInsert;

/**
 * User Presence — tracks online status for real-time features
 */
export const userPresence = mysqlTable("user_presence", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().unique(),
  status: mysqlEnum("status", ["online", "away", "offline"]).default("offline"),
  lastSeenAt: timestamp("last_seen_at").defaultNow().notNull(),
  currentChannelId: int("current_channel_id"),
});

export type UserPresence = typeof userPresence.$inferSelect;
export type InsertUserPresence = typeof userPresence.$inferInsert;

/**
 * Chat Notifications — notification preferences and history
 */
export const chatNotifications = mysqlTable("chat_notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  messageId: int("message_id").notNull(),
  channelId: int("channel_id"),
  type: mysqlEnum("type", ["mention", "direct_message", "channel_message", "system"]).default("channel_message"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  readAt: timestamp("read_at"),
});

export type ChatNotification = typeof chatNotifications.$inferSelect;
export type InsertChatNotification = typeof chatNotifications.$inferInsert;


/**
 * Tips — tracks donations and tips from members to support the platform
 */
export const tips = mysqlTable("tips", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD"),
  tipType: mysqlEnum("tip_type", ["one_time", "recurring"]).default("one_time"),
  message: text("message"),
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 100 }),
  status: mysqlEnum("status", ["pending", "completed", "failed", "refunded"]).default("pending"),
  completedAt: timestamp("completed_at"),
  refundedAt: timestamp("refunded_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type Tip = typeof tips.$inferSelect;
export type InsertTip = typeof tips.$inferInsert;

/**
 * Membership Tier Purchases — tracks tier upgrade purchases
 */
export const tierPurchases = mysqlTable("tier_purchases", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  tier: mysqlEnum("tier", ["basic", "vip", "super_vip"]).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD"),
  duration: int("duration").default(30), // days
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 100 }),
  status: mysqlEnum("status", ["pending", "completed", "failed", "refunded"]).default("pending"),
  expiresAt: timestamp("expires_at"),
  completedAt: timestamp("completed_at"),
  refundedAt: timestamp("refunded_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type TierPurchase = typeof tierPurchases.$inferSelect;
export type InsertTierPurchase = typeof tierPurchases.$inferInsert;

/**
 * Reports Table — tracks user-submitted content and user reports
 */
export const reports = mysqlTable("reports", {
  id: int("id").autoincrement().primaryKey(),
  reporterUserId: int("reporter_user_id").notNull(),
  targetType: mysqlEnum("target_type", ["message", "post", "user", "profile", "lounge"]).notNull(),
  targetId: int("target_id").notNull(),
  reason: mysqlEnum("reason", ["harassment", "sexual_content", "violence", "self_harm", "hate", "spam", "child_safety", "other"]).notNull(),
  details: text("details"),
  status: mysqlEnum("status", ["open", "in_review", "actioned", "dismissed"]).default("open").notNull(),
  assignedToUserId: int("assigned_to_user_id"),
  resolutionNote: text("resolution_note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type Report = typeof reports.$inferSelect;
export type InsertReport = typeof reports.$inferInsert;

/**
 * User Blocks Table — tracks blocks between users
 */
export const userBlocks = mysqlTable("user_blocks", {
  id: int("id").autoincrement().primaryKey(),
  blockerUserId: int("blocker_user_id").notNull(),
  blockedUserId: int("blocked_user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type UserBlock = typeof userBlocks.$inferSelect;
export type InsertUserBlock = typeof userBlocks.$inferInsert;

/**
 * Moderation Actions Table — specific queryable moderation record
 */
export const moderationActions = mysqlTable("moderation_actions", {
  id: int("id").autoincrement().primaryKey(),
  moderatorUserId: int("moderator_user_id").notNull(),
  targetUserId: int("target_user_id"),
  targetType: varchar("target_type", { length: 50 }),
  targetId: int("target_id"),
  actionType: mysqlEnum("action_type", ["warn", "mute", "timeout", "content_remove", "suspend", "ban", "reinstate"]).notNull(),
  reportId: int("report_id"),
  reason: text("reason").notNull(),
  expiresAt: timestamp("expires_at"),
  reversedAt: timestamp("reversed_at"),
  reversedByUserId: int("reversed_by_user_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ModerationAction = typeof moderationActions.$inferSelect;
export type InsertModerationAction = typeof moderationActions.$inferInsert;

/**
 * Guardian Links Table — parental consent and linking for minors
 */
export const guardianLinks = mysqlTable("guardian_links", {
  id: int("id").autoincrement().primaryKey(),
  guardianUserId: int("guardian_user_id").notNull(),
  childUserId: int("child_user_id").notNull(),
  consentStatus: mysqlEnum("consent_status", ["pending", "granted", "revoked"]).default("pending").notNull(),
  consentMethod: varchar("consent_method", { length: 64 }),
  relationshipType: mysqlEnum("relationship_type", ["parent", "legal_guardian", "other"]).default("parent").notNull(),
  dashboardOptOut: boolean("dashboard_opt_out").default(false).notNull(),
  consentGrantedAt: timestamp("consent_granted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const educationCompletions = mysqlTable("education_completions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  moduleKey: varchar("module_key", { length: 64 }).notNull(),
  score: int("score"),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
});

export type EducationCompletion = typeof educationCompletions.$inferSelect;
export type InsertEducationCompletion = typeof educationCompletions.$inferInsert;

export type GuardianLink = typeof guardianLinks.$inferSelect;
export type InsertGuardianLink = typeof guardianLinks.$inferInsert;


/**
 * Anom's Corner Episodes — managed content for Pixel & Dot series, storybooks, and videos
 */
export const anomsCornerEpisodes = mysqlTable("anoms_corner_episodes", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 50 }).default("video").notNull(), // video, audio, storybook, giffy
  mediaUrl: text("media_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  duration: varchar("duration", { length: 20 }),
  isPublished: boolean("is_published").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type AnomsCornerEpisode = typeof anomsCornerEpisodes.$inferSelect;
export type InsertAnomsCornerEpisode = typeof anomsCornerEpisodes.$inferInsert;

/**
 * Merch Items — managed products for the Custom Merch Store
 */
export const merchItems = mysqlTable("merch_items", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 155 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("image_url").notNull(),
  category: varchar("category", { length: 50 }).default("apparel").notNull(),
  inStock: boolean("in_stock").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type MerchItem = typeof merchItems.$inferSelect;
export type InsertMerchItem = typeof merchItems.$inferInsert;
