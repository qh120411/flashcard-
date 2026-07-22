CREATE TABLE `user_progress` (
	`user_email` text PRIMARY KEY NOT NULL,
	`ratings` text DEFAULT '{}' NOT NULL,
	`history` text DEFAULT '[]' NOT NULL,
	`start_date` text NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
