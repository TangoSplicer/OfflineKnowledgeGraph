CREATE TABLE `graph_sync_snapshots` (
	`id` varchar(96) NOT NULL,
	`userId` int NOT NULL,
	`sourceRevision` int NOT NULL,
	`label` varchar(160) NOT NULL,
	`envelope` text NOT NULL,
	`conceptCount` int NOT NULL,
	`relationshipCount` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `graph_sync_snapshots_id` PRIMARY KEY(`id`)
);
