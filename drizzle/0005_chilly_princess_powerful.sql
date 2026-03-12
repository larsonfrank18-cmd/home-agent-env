CREATE TABLE `generation_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('copywriter','dm','disc') NOT NULL,
	`inputParams` text NOT NULL,
	`result` text NOT NULL,
	`model` varchar(50),
	`duration` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `generation_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trend_data` (
	`id` int AUTO_INCREMENT NOT NULL,
	`keyword` varchar(200) NOT NULL,
	`platform` varchar(50) NOT NULL,
	`data` text NOT NULL,
	`sourceUrl` varchar(500),
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `trend_data_id` PRIMARY KEY(`id`)
);
