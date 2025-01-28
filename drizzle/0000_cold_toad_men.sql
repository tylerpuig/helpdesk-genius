CREATE TABLE "account" (
	"user_id" varchar(255) NOT NULL,
	"type" varchar(255) NOT NULL,
	"provider" varchar(255) NOT NULL,
	"provider_account_id" varchar(255) NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" varchar(255),
	"scope" varchar(255),
	"id_token" text,
	"session_state" varchar(255),
	CONSTRAINT "account_provider_provider_account_id_pk" PRIMARY KEY("provider","provider_account_id")
);
--> statement-breakpoint
CREATE TABLE "agent_function_embeddings" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"function_id" varchar(255) NOT NULL,
	"embedding" vector(1536) NOT NULL,
	"context" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_function" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"agent_id" varchar(255) NOT NULL,
	"function_category" varchar(50) NOT NULL,
	"function_name" varchar(200) NOT NULL,
	"name" varchar(100) NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"workspace_id" varchar(255) NOT NULL,
	"title" varchar(100) NOT NULL,
	"enabled" boolean DEFAULT true,
	"allow_auto_reply" boolean DEFAULT true,
	"is_custom" boolean DEFAULT true,
	"description" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "calendar_event" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"workspace_id" varchar(255) NOT NULL,
	"title" varchar(100) NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"start" timestamp with time zone NOT NULL,
	"end" timestamp with time zone NOT NULL,
	"color" varchar NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"workspace_id" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255),
	"company" varchar(255),
	"last_contacted_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_base_embeddings" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"agent_id" varchar(255) NOT NULL,
	"embedding" vector(1536),
	"raw_content_summary" text NOT NULL,
	"raw_content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "live_chat" (
	"id" varchar PRIMARY KEY NOT NULL,
	"thread_id" varchar,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "message" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"thread_id" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"sender_email" varchar(255) NOT NULL,
	"sender_name" varchar(255),
	"role" varchar(50) NOT NULL,
	"is_unread" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"session_token" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"expires" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tag" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"workspace_id" varchar(255) NOT NULL,
	"name" varchar(100) NOT NULL,
	"color" varchar(7) NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "thread_assignment" (
	"thread_id" varchar(255) NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "thread_assignment_thread_id_user_id_pk" PRIMARY KEY("thread_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "thread_tag" (
	"thread_id" varchar(255) NOT NULL,
	"tag_id" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "thread_tag_thread_id_tag_id_pk" PRIMARY KEY("thread_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "thread" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"status" varchar(50) DEFAULT 'open' NOT NULL,
	"priority" varchar(50) DEFAULT 'low' NOT NULL,
	"title" varchar(256),
	"workspace_id" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"channel" varchar(50) NOT NULL,
	"updated_at" timestamp with time zone,
	"last_message_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"is_unread" boolean DEFAULT true,
	"message_count" integer DEFAULT 0 NOT NULL,
	"customer_message_count" integer DEFAULT 0 NOT NULL,
	"agent_message_count" integer DEFAULT 0 NOT NULL,
	"first_response_time" integer
);
--> statement-breakpoint
CREATE TABLE "user_daily_metrics" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"workspace_id" varchar(255) NOT NULL,
	"date" timestamp with time zone DEFAULT date_trunc('day', CURRENT_TIMESTAMP) NOT NULL,
	"threads_assigned" integer DEFAULT 0 NOT NULL,
	"threads_resolved" integer DEFAULT 0 NOT NULL,
	"total_response_time" integer DEFAULT 0 NOT NULL,
	"response_count" integer DEFAULT 0 NOT NULL,
	"average_first_response_time" integer DEFAULT 0 NOT NULL,
	"customer_message_count" integer DEFAULT 0 NOT NULL,
	"agent_message_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_stats" (
	"user_id" varchar(255) NOT NULL,
	"workspace_id" varchar(255) NOT NULL,
	"total_threads_handled" integer DEFAULT 0 NOT NULL,
	"total_threads_resolved" integer DEFAULT 0 NOT NULL,
	"average_response_time" integer DEFAULT 0 NOT NULL,
	"average_first_response_time" integer DEFAULT 0 NOT NULL,
	"total_customer_messages" integer DEFAULT 0 NOT NULL,
	"total_agent_messages" integer DEFAULT 0 NOT NULL,
	"last_active_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "user_stats_user_id_workspace_id_pk" PRIMARY KEY("user_id","workspace_id")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255),
	"email" varchar(255) NOT NULL,
	"password" varchar(255),
	"email_verified" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"image" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "verification_token" (
	"identifier" varchar(255) NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	CONSTRAINT "verification_token_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
CREATE TABLE "workspace_invitation" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"workspace_id" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"role" varchar(50) DEFAULT 'member' NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"invited_by" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	"accepted_by" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "workspace_member" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"workspace_id" varchar(255) NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"role" varchar(50) DEFAULT 'member' NOT NULL,
	"joined_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspace" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "workspace_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_function_embeddings" ADD CONSTRAINT "agent_function_embeddings_function_id_agent_function_id_fk" FOREIGN KEY ("function_id") REFERENCES "public"."agent_function"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_function" ADD CONSTRAINT "agent_function_agent_id_agent_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agent"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent" ADD CONSTRAINT "agent_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_event" ADD CONSTRAINT "calendar_event_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact" ADD CONSTRAINT "contact_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_base_embeddings" ADD CONSTRAINT "knowledge_base_embeddings_agent_id_agent_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agent"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message" ADD CONSTRAINT "message_thread_id_thread_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."thread"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tag" ADD CONSTRAINT "tag_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "thread_assignment" ADD CONSTRAINT "thread_assignment_thread_id_thread_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."thread"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "thread_assignment" ADD CONSTRAINT "thread_assignment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "thread_tag" ADD CONSTRAINT "thread_tag_thread_id_thread_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."thread"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "thread_tag" ADD CONSTRAINT "thread_tag_tag_id_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tag"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "thread" ADD CONSTRAINT "thread_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_daily_metrics" ADD CONSTRAINT "user_daily_metrics_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_daily_metrics" ADD CONSTRAINT "user_daily_metrics_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_stats" ADD CONSTRAINT "user_stats_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_stats" ADD CONSTRAINT "user_stats_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_invitation" ADD CONSTRAINT "workspace_invitation_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_invitation" ADD CONSTRAINT "workspace_invitation_invited_by_user_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_invitation" ADD CONSTRAINT "workspace_invitation_accepted_by_user_id_fk" FOREIGN KEY ("accepted_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_member" ADD CONSTRAINT "workspace_member_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_member" ADD CONSTRAINT "workspace_member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "function_embedding_function_id_idx" ON "agent_function_embeddings" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "calendar_event_workspace_idx" ON "calendar_event" USING btree ("workspace_id");--> statement-breakpoint
CREATE UNIQUE INDEX "contact_workspace_email_idx" ON "contact" USING btree ("workspace_id","email");--> statement-breakpoint
CREATE INDEX "contact_workspace_idx" ON "contact" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "contact_email_idx" ON "contact" USING btree ("email");--> statement-breakpoint
CREATE INDEX "knowledge_base_embeddings_agent_idx" ON "knowledge_base_embeddings" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "knowledge_base_embeddings_message_idx" ON "knowledge_base_embeddings" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "message_thread_id_idx" ON "message" USING btree ("thread_id");--> statement-breakpoint
CREATE INDEX "message_created_at_idx" ON "message" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tag_workspace_name_idx" ON "tag" USING btree ("workspace_id","name");--> statement-breakpoint
CREATE INDEX "tag_workspace_idx" ON "tag" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "thread_assignment_thread_idx" ON "thread_assignment" USING btree ("thread_id");--> statement-breakpoint
CREATE INDEX "thread_assignment_user_idx" ON "thread_assignment" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "thread_tag_thread_idx" ON "thread_tag" USING btree ("thread_id");--> statement-breakpoint
CREATE INDEX "thread_tag_tag_idx" ON "thread_tag" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "thread_workspace_idx" ON "thread" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "thread_status_idx" ON "thread" USING btree ("status");--> statement-breakpoint
CREATE INDEX "thread_last_message_idx" ON "thread" USING btree ("last_message_at");--> statement-breakpoint
CREATE INDEX "thread_channel_idx" ON "thread" USING btree ("channel");--> statement-breakpoint
CREATE UNIQUE INDEX "user_daily_metrics_workspace_user_date_idx" ON "user_daily_metrics" USING btree ("workspace_id","user_id","date");--> statement-breakpoint
CREATE INDEX "user_daily_metrics_workspace_idx" ON "user_daily_metrics" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "user_daily_metrics_user_idx" ON "user_daily_metrics" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_daily_metrics_date_idx" ON "user_daily_metrics" USING btree ("date");--> statement-breakpoint
CREATE INDEX "user_stats_workspace_idx" ON "user_stats" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "workspace_invitation_workspace_idx" ON "workspace_invitation" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "workspace_invitation_email_idx" ON "workspace_invitation" USING btree ("email");--> statement-breakpoint
CREATE INDEX "workspace_invitation_status_idx" ON "workspace_invitation" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_member_workspace_user_idx" ON "workspace_member" USING btree ("workspace_id","user_id");--> statement-breakpoint
CREATE INDEX "workspace_member_workspace_idx" ON "workspace_member" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "workspace_member_user_idx" ON "workspace_member" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_slug_idx" ON "workspace" USING btree ("slug");