import { db } from './dbInstance.mjs'
import * as schema from '../src/server/db/schema.js'
import dotenv from 'dotenv'
import bcrypt from 'bcrypt'

dotenv.config({
  path: '../.env'
})

async function addDemoUser() {
  try {
    const hashedPassword = await bcrypt.hash(process.env.NEXT_PUBLIC_DEMO_USER_PASSWORD!, 10)
    await db.insert(schema.users).values({
      name: 'Demo User',
      email: 'demo@example.com',
      password: hashedPassword
    })

    console.log('Demo user added successfully.')
  } catch (error) {
    console.error(error)
  }
}

addDemoUser()
