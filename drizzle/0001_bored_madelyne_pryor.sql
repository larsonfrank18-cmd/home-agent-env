ALTER TABLE `users` ADD `phone` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `passwordHash` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `isPaid` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `paidAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `paidExpireAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `adminNote` text;