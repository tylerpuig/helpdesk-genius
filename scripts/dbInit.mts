import { db } from './dbInstance.mjs'
import * as schema from '../src/server/db/schema.js'
import dotenv from 'dotenv'
import bcrypt from 'bcrypt'
import { faker } from '@faker-js/faker'

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

async function addDemoWorkspaceUsers(workspaceId: string) {
  try {
    // first create users
    const users: { name: string | null; email: string; id: string }[] = []

    for (let i = 0; i < 3; i++) {
      const hashedPassword = await bcrypt.hash(process.env.DEMO_ACCOUNT_PASSWORD!, 10)
      const [user] = await db
        .insert(schema.users)
        .values({
          name: faker.person.fullName(),
          email: faker.internet.email(),
          password: hashedPassword
        })
        .returning({
          name: schema.users.name,
          email: schema.users.email,
          id: schema.users.id
        })

      users.push(user)
    }

    // add them to the workspace
    for (const user of users) {
      await db.insert(schema.workspaceMembersTable).values({
        workspaceId,
        userId: user.id,
        role: 'member'
      })
    }
  } catch (err) {
    console.error(err)
  }
}

// addDemoUser()
// addDemoWorkspaceUsers('fe2c85c0-88b4-4248-b724-7dd93eac53ce')
