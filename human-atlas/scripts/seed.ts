import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env' })

async function main() {
  const sql = neon(process.env.DATABASE_URL_UNPOOLED!)

  // Reset table (clean slate + reset IDs + FK-safe)
  await sql`
    TRUNCATE TABLE species RESTART IDENTITY CASCADE;
  `

  await sql`
    INSERT INTO species (name, common_name, path, era_start, era_end, region)
    VALUES
      -- EARLY POSSIBLE HOMININS
      ('Sahelanthropus tchadensis', null, 'Hominidae.Sahelanthropus.tchadensis', -7000000, -6000000, 'Central Africa'),
      ('Orrorin tugenensis', null, 'Hominidae.Orrorin.tugenensis', -6000000, -5700000, 'Kenya'),
      ('Ardipithecus kadabba', null, 'Hominidae.Ardipithecus.kadabba', -5800000, -5200000, 'Ethiopia'),
      ('Ardipithecus ramidus', null, 'Hominidae.Ardipithecus.ramidus', -4400000, -4100000, 'Ethiopia'),

      -- AUSTRALOPITHECUS
      ('Australopithecus anamensis', null, 'Hominidae.Australopithecus.anamensis', -4200000, -3900000, 'Kenya, Ethiopia'),
      ('Australopithecus afarensis', 'Lucy species', 'Hominidae.Australopithecus.afarensis', -3900000, -2900000, 'East Africa'),
      ('Australopithecus africanus', null, 'Hominidae.Australopithecus.africanus', -3000000, -2100000, 'South Africa'),
      ('Australopithecus garhi', null, 'Hominidae.Australopithecus.garhi', -2500000, -2500000, 'Ethiopia'),
      ('Australopithecus sediba', null, 'Hominidae.Australopithecus.sediba', -2000000, -1900000, 'South Africa'),

      -- PARANTHROPUS (robust australopithecines)
      ('Paranthropus aethiopicus', null, 'Hominidae.Paranthropus.aethiopicus', -2700000, -2300000, 'East Africa'),
      ('Paranthropus boisei', null, 'Hominidae.Paranthropus.boisei', -2300000, -1200000, 'East Africa'),
      ('Paranthropus robustus', null, 'Hominidae.Paranthropus.robustus', -2000000, -1200000, 'South Africa'),

      -- EARLY HOMO
      ('Homo habilis', 'Handy Man', 'Hominidae.Homo.habilis', -2400000, -1400000, 'East Africa'),
      ('Homo rudolfensis', null, 'Hominidae.Homo.rudolfensis', -2400000, -1800000, 'East Africa'),

      -- EARLY MIGRANTS / ARCHAIC HOMO
      ('Homo erectus', 'Upright Man', 'Hominidae.Homo.erectus', -1900000, -110000, 'Africa, Asia'),
      ('Homo ergaster', null, 'Hominidae.Homo.ergaster', -1900000, -140000, 'East Africa'),
      ('Homo antecessor', null, 'Hominidae.Homo.antecessor', -1200000, -800000, 'Europe'),

      -- MIDDLE ARCHAIC HOMO
      ('Homo heidelbergensis', null, 'Hominidae.Homo.heidelbergensis', -700000, -200000, 'Europe, Africa'),
      ('Homo rhodesiensis', null, 'Hominidae.Homo.rhodesiensis', -300000, -125000, 'Africa'),

      -- LATER BRANCHES
      ('Homo neanderthalensis', 'Neanderthal', 'Hominidae.Homo.neanderthalensis', -400000, -40000, 'Europe, West Asia'),
      ('Denisovans', null, 'Hominidae.Homo.denisova', -300000, -50000, 'Asia'),

      -- ISLAND & LATE SURVIVORS
      ('Homo naledi', null, 'Hominidae.Homo.naledi', -335000, -236000, 'South Africa'),
      ('Homo floresiensis', 'Hobbit', 'Hominidae.Homo.floresiensis', -100000, -50000, 'Indonesia'),
      ('Homo luzonensis', null, 'Hominidae.Homo.luzonensis', -67000, -50000, 'Philippines'),

      -- MODERN HUMANS
      ('Homo sapiens idaltu', null, 'Hominidae.Homo.sapiens.idaltu', -160000, -154000, 'Ethiopia'),
      ('Homo sapiens', 'Modern human', 'Hominidae.Homo.sapiens', -300000, null, 'Global')
    ON CONFLICT DO NOTHING;
  `

  console.log('Seeded expanded species dataset.')
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })