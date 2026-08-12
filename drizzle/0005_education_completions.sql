CREATE TABLE IF NOT EXISTS `education_completions` (
  `id` int AUTO_INCREMENT NOT NULL,
  `user_id` int NOT NULL,
  `module_key` varchar(64) NOT NULL,
  `score` int,
  `completed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `education_completions_id` PRIMARY KEY(`id`)
);
