ALTER TABLE `coin_transactions`
  ADD COLUMN `source` varchar(50) NOT NULL DEFAULT 'legacy',
  ADD COLUMN `balance_after` decimal(10,2) NOT NULL DEFAULT '0';

CREATE TABLE `global_missions` (
  `id` varchar(64) NOT NULL,
  `name` varchar(120) NOT NULL,
  `description` text,
  `reward` decimal(10,2) NOT NULL,
  `active` boolean NOT NULL DEFAULT true,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `global_missions_id` PRIMARY KEY(`id`)
);

CREATE TABLE `mission_contributions` (
  `id` int AUTO_INCREMENT NOT NULL,
  `user_id` int NOT NULL,
  `mission_id` varchar(64) NOT NULL,
  `event_id` varchar(120) NOT NULL,
  `source` varchar(50) NOT NULL,
  `house` varchar(32),
  `mount` varchar(64),
  `reward` decimal(10,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `mission_contributions_id` PRIMARY KEY(`id`),
  CONSTRAINT `mission_contributions_user_mission_event` UNIQUE(`user_id`,`mission_id`,`event_id`)
);
