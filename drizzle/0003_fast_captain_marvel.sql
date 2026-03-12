CREATE TABLE `api_usage_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`usageDate` date NOT NULL,
	`dailyCount` int NOT NULL DEFAULT 0,
	`feature` enum('copywriter','dm','disc') NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `api_usage_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `memberType` enum('free','quarterly','annual','lifetime') DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `customDailyLimit` int;--> statement-breakpoint
ALTER TABLE `users` ADD `customMonthlyLimit` int;