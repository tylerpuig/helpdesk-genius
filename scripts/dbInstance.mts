import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../src/server/db/schema'
import dotenv from 'dotenv'

dotenv.config({
  path: '../.env'
})

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in .env')
}

const conn = postgres(process.env.DATABASE_URL)

export const db = drizzle(conn, { schema })
