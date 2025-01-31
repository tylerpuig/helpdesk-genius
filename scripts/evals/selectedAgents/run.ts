import fs from 'fs/promises'
import dotenv from 'dotenv'
import { createPrompt, confirmContinue } from '../utils.js'

dotenv.config({
  path: '../../../.env'
})

const apiUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
const workspaceId = process.env.WORKSPACE_ID ?? ''
if (!apiUrl || !workspaceId) {
  throw new Error('env variables not set')
}

function randString() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

let score = 0
let totalItems = 0
async function run() {
  try {
    const testData = await getTestData()
    if (!testData) {
      return
    }

    totalItems = testData.length

    const testUser = {
      name: 'test',
      email: 'test@test.com'
    }

    const rl = createPrompt()
    for (const entry of testData) {
      const { input, output } = entry

      const response = await fetch(`${apiUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          workspaceId: workspaceId,
          message: input,
          user: testUser,
          chatId: randString()
        })
      })

      const data = await response.json()
      console.log(data)

      console.log('expected output: ', output)
      const isCorrect = await confirmContinue(rl, output)
      if (isCorrect) score++
    }

    rl.close()

    console.log(`Score: ${score}/${totalItems}`)
  } catch (err) {
    console.error(err)
  }
}

type TestData = {
  input: string
  output: string[]
}

async function getTestData(): Promise<TestData[] | undefined> {
  try {
    const data = await fs.readFile('data.json', 'utf8')
    console.log(JSON.parse(data))

    return JSON.parse(data) as TestData[]
  } catch (err) {
    console.error(err)
  }
}

run()
