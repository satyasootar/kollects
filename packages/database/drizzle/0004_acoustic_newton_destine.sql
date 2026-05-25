ALTER TYPE "public"."form_visibility" ADD VALUE 'private';--> statement-breakpoint
CREATE INDEX "idx_forms_theme" ON "forms" USING btree ("theme_id");--> statement-breakpoint
CREATE INDEX "idx_form_responses_complete_submit" ON "form_responses" USING btree ("form_id","is_complete","submitted_at");--> statement-breakpoint
CREATE INDEX "idx_form_responses_session" ON "form_responses" USING btree ("form_id","is_complete",("metadata"->>'sessionId'));