CREATE TABLE "testimonials" (
	"id" serial PRIMARY KEY NOT NULL,
	"author_name" jsonb NOT NULL,
	"author_role" jsonb,
	"text" jsonb NOT NULL,
	"rating" integer,
	"sort" integer DEFAULT 100 NOT NULL,
	"visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
