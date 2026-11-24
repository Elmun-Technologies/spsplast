CREATE TABLE "catalog_sync_log" (
	"file" text PRIMARY KEY NOT NULL,
	"sha" text NOT NULL,
	"result" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
