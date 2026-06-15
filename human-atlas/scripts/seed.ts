import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env' })

async function main() {
  const sql = neon(process.env.DATABASE_URL_UNPOOLED!)

  await sql`
    INSERT INTO species (name, common_name, path, era_start, era_end, region)
    VALUES
      ('Australopithecus',       'Australopithecus', 'Hominidae.Australopithecus',         -4000000, -2000000, 'East Africa'),
      ('Homo habilis',           'Handy Man',         'Hominidae.Homo.habilis',             -2400000, -1400000, 'East Africa'),
      ('Homo erectus',           'Upright Man',       'Hominidae.Homo.erectus',             -1900000,  -110000, 'Africa, Asia'),
      ('Homo heidelbergensis',   null,                'Hominidae.Homo.heidelbergensis',      -700000,  -200000, 'Europe, Africa'),
      ('Homo neanderthalensis',  'Neanderthal',       'Hominidae.Homo.neanderthalensis',     -400000,   -40000, 'Europe, W. Asia'),
      ('Homo sapiens',           'Modern human',      'Hominidae.Homo.sapiens',              -300000,     null, 'Global')
    ON CONFLICT DO NOTHING
  `

  console.log('Seeded species.')
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })