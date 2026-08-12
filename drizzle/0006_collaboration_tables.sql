CREATE TABLE IF NOT EXISTS `collaboration_projects` (
  `id` int AUTO_INCREMENT NOT NULL,
  `creator_id` int NOT NULL,
  `title` varchar(100) NOT NULL,
  `description` text,
  `cause` varchar(50) NOT NULL,
  `image_url` text,
  `status` enum('active','completed','paused') NOT NULL DEFAULT 'active',
  `target_members` int DEFAULT 1,
  `current_members` int DEFAULT 1,
  `coin_reward_per_task` decimal(10,2) DEFAULT '10',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `collaboration_projects_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `collaboration_members` (
  `id` int AUTO_INCREMENT NOT NULL,
  `project_id` int NOT NULL,
  `user_id` int NOT NULL,
  `role` enum('creator','member') NOT NULL DEFAULT 'member',
  `tasks_completed` int DEFAULT 0,
  `coins_earned` decimal(10,2) DEFAULT '0',
  `joined_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `collaboration_members_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `collaboration_tasks` (
  `id` int AUTO_INCREMENT NOT NULL,
  `project_id` int NOT NULL,
  `title` varchar(100) NOT NULL,
  `description` text,
  `assigned_to` int,
  `status` enum('pending','in_progress','completed') NOT NULL DEFAULT 'pending',
  `due_date` timestamp NULL,
  `completed_at` timestamp NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `collaboration_tasks_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `collaboration_updates` (
  `id` int AUTO_INCREMENT NOT NULL,
  `project_id` int NOT NULL,
  `user_id` int NOT NULL,
  `update_type` enum('task_completed','member_joined','milestone_reached','comment') NOT NULL,
  `content` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `collaboration_updates_id` PRIMARY KEY(`id`)
);
