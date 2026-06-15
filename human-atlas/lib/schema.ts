import { pgTable, serial, text, integer, numeric, customType } from 'drizzle-orm/pg-core'

const ltree = customType<{ data: string }>({
  dataType() { return 'ltree' }
})

export const species = pgTable('species', {
  id:          serial('id').primaryKey(),
  name:        text('name').notNull(),
  commonName:  text('common_name'),
  path:        ltree('path').notNull(),
  eraStart:    integer('era_start'),
  eraEnd:      integer('era_end'),
  region:      text('region'),
  toolUse:     text('tool_use'),
  description: text('description'),
})

export const migrationRoutes = pgTable('migration_routes', {
  id:          serial('id').primaryKey(),
  name:        text('name').notNull(),
  eraStart:    integer('era_start'),
  eraEnd:      integer('era_end'),
  description: text('description'),
})

export const populations = pgTable('populations', {
  id:        serial('id').primaryKey(),
  speciesId: integer('species_id').references(() => species.id),
  name:      text('name').notNull(),
  region:    text('region'),
  eraStart:  integer('era_start'),
  eraEnd:    integer('era_end'),
})

export const geneFlow = pgTable('gene_flow', {
  id:         serial('id').primaryKey(),
  sourceId:   integer('source_id').references(() => populations.id),
  targetId:   integer('target_id').references(() => populations.id),
  percentage: numeric('percentage', { precision: 5, scale: 2 }),
  era:        integer('era'),
  notes:      text('notes'),
})