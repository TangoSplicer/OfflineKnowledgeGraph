CREATE TABLE `audit_sync_envelopes` (
	`userId` int NOT NULL,
	`envelope` text NOT NULL,
	`revision` int NOT NULL DEFAULT 1,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `audit_sync_envelopes_userId` PRIMARY KEY(`userId`)
);
--> statement-breakpoint
CREATE TABLE `subgraph_sync_envelopes` (
	`id` varchar(96) NOT NULL,
	`userId` int NOT NULL,
	`label` varchar(160) NOT NULL,
	`envelope` text NOT NULL,
	`revision` int NOT NULL DEFAULT 1,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subgraph_sync_envelopes_id` PRIMARY KEY(`id`)
);
