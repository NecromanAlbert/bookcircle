import pg from 'pg'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const client = new pg.Client({
  host: 'db.caxpwetxsdptpjescdgk.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'ZQXQLb26lGu535qs',
  ssl: { rejectUnauthorized: false },
})

async function main() {
  await client.connect()
  console.log('Connected to Supabase DB')

  const sql = readFileSync(join(__dirname, '..', 'supabase', 'schema.sql'), 'utf8')

  const statements = sql
    .replace(/--.*$/gm, '')
    .split(/;\s*$/m)
    .map(s => s.trim())
    .filter(s => s.length > 0)

  for (const stmt of statements) {
    try {
      await client.query(stmt)
      const preview = stmt.slice(0, 60).replace(/\n/g, ' ')
      console.log(`OK: ${preview}...`)
    } catch (err) {
      console.error(`FAIL: ${stmt.slice(0, 60)}...`)
      console.error(`  ${err.message}`)
    }
  }

  await client.end()
  console.log('Done')
}

main().catch(console.error)
