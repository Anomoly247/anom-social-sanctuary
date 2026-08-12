CREATE TABLE IF NOT EXISTS `tier_purchases` (
  `id` int AUTO_INCREMENT NOT NULL,
  `user_id` int NOT NULL,
  `tier` enum('basic','vip','super_vip') NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `currency` varchar(3) DEFAULT 'USD',
  `duration` int DEFAULT 30,
  `stripe_payment_intent_id` varchar(100),
  `status` enum('pending','completed','failed','refunded') DEFAULT 'pending',
  `expires_at` timestamp NULL,
  `completed_at` timestamp NULL,
  `refunded_at` timestamp NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `tier_purchases_id` PRIMARY KEY(`id`)
);
