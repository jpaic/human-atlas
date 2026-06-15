CREATE TABLE "gene_flow" (
	"id" serial PRIMARY KEY NOT NULL,
	"source_id" integer,
	"target_id" integer,
	"percentage" numeric(5, 2),
	"era" integer,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "migration_routes" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"era_start" integer,
	"era_end" integer,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "populations" (
	"id" serial PRIMARY KEY NOT NULL,
	"species_id" integer,
	"name" text NOT NULL,
	"region" text,
	"era_start" integer,
	"era_end" integer
);
--> statement-breakpoint
CREATE TABLE "species" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"common_name" text,
	"path" "ltree" NOT NULL,
	"era_start" integer,
	"era_end" integer,
	"region" text,
	"tool_use" text,
	"description" text
);
--> statement-breakpoint
ALTER TABLE "gene_flow" ADD CONSTRAINT "gene_flow_source_id_populations_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."populations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gene_flow" ADD CONSTRAINT "gene_flow_target_id_populations_id_fk" FOREIGN KEY ("target_id") REFERENCES "public"."populations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "populations" ADD CONSTRAINT "populations_species_id_species_id_fk" FOREIGN KEY ("species_id") REFERENCES "public"."species"("id") ON DELETE no action ON UPDATE no action;