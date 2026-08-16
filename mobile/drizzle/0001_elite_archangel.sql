CREATE TABLE `feedback_sync_envelopes` (
	`userId` int NOT NULL,
	`envelope` text NOT NULL,
	`revision` int NOT NULL DEFAULT 1,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `feedback_sync_envelopes_userId` PRIMARY KEY(`userId`)
);
