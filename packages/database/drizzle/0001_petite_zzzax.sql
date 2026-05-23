CREATE TYPE "public"."form_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."form_visibility" AS ENUM('public', 'unlisted');--> statement-breakpoint
CREATE TYPE "public"."field_type" AS ENUM('short_text', 'long_text', 'email', 'number', 'date', 'single_select', 'multi_select', 'checkbox', 'rating', 'url', 'phone');--> statement-breakpoint
CREATE TABLE "forms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(64) NOT NULL,
	"creator_id" uuid NOT NULL,
	"theme_id" uuid,
	"title" varchar(255) NOT NULL,
	"description" text,
	"cover_image_url" text,
	"status" "form_status" DEFAULT 'draft' NOT NULL,
	"visibility" "form_visibility" DEFAULT 'public' NOT NULL,
	"password_hash" varchar(255),
	"response_limit" integer,
	"expires_at" timestamp,
	"total_views" integer DEFAULT 0 NOT NULL,
	"total_starts" integer DEFAULT 0 NOT NULL,
	"total_submissions" integer DEFAULT 0 NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"published_at" timestamp,
	"archived_at" timestamp,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	CONSTRAINT "forms_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "form_fields" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"form_id" uuid NOT NULL,
	"type" "field_type" NOT NULL,
	"label" text NOT NULL,
	"placeholder" text,
	"help_text" text,
	"required" boolean DEFAULT false NOT NULL,
	"order" integer NOT NULL,
	"page_number" integer DEFAULT 1 NOT NULL,
	"options" jsonb,
	"logic" jsonb,
	"settings" jsonb,
	"validations" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "form_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"form_id" uuid NOT NULL,
	"respondent_email" varchar(255),
	"respondent_name" varchar(255),
	"ip_hash" varchar(64),
	"user_agent" text,
	"referrer" text,
	"is_complete" boolean DEFAULT false NOT NULL,
	"completion_time_seconds" integer,
	"metadata" jsonb,
	"submitted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "response_answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"response_id" uuid NOT NULL,
	"field_id" uuid NOT NULL,
	"value" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "forms" ADD CONSTRAINT "forms_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forms" ADD CONSTRAINT "forms_theme_id_themes_id_fk" FOREIGN KEY ("theme_id") REFERENCES "public"."themes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_fields" ADD CONSTRAINT "form_fields_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_responses" ADD CONSTRAINT "form_responses_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "response_answers" ADD CONSTRAINT "response_answers_response_id_form_responses_id_fk" FOREIGN KEY ("response_id") REFERENCES "public"."form_responses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "response_answers" ADD CONSTRAINT "response_answers_field_id_form_fields_id_fk" FOREIGN KEY ("field_id") REFERENCES "public"."form_fields"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_forms_creator" ON "forms" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "idx_forms_slug" ON "forms" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_form_fields_order" ON "form_fields" USING btree ("form_id","order");--> statement-breakpoint
CREATE INDEX "idx_form_responses_form" ON "form_responses" USING btree ("form_id");--> statement-breakpoint
CREATE INDEX "idx_response_answers_response" ON "response_answers" USING btree ("response_id");--> statement-breakpoint
CREATE INDEX "idx_response_answers_field" ON "response_answers" USING btree ("field_id");