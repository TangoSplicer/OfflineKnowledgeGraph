CREATE TABLE `graph_sync_envelopes` (
	`userId` int NOT NULL,
	`envelope` text NOT NULL,
	`revision` int NOT NULL DEFAULT 1,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `graph_sync_envelopes_userId` PRIMARY KEY(`userId`)
);
--> statement-breakpoint
CREATE TABLE `trusted_sync_devices` (
	`id` varchar(96) NOT NULL,
	`userId` int NOT NULL,
	`label` varchar(120) NOT NULL,
	`platform` varchar(32) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`lastSeenAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`revokedAt` timestamp,
	CONSTRAINT `trusted_sync_devices_id` PRIMARY KEY(`id`)
);
