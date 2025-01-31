import dotenv from 'dotenv'
import { createPrompt, confirmContinue, getTestData, randString } from '../utils.js'

dotenv.config({
  path: '../../../.env'
})

const apiUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
const workspaceId = process.env.WORKSPACE_ID ?? ''
if (!apiUrl || !workspaceId) {
  throw new Error('env variables not set')
}

type TestData = {
  input: string
  output: {
    title: string
    description: string
    startTime: string | null
    endTime: string | null
    duration: number
  }
}

let score = 0
let totalItems = 0
async function run() {
  try {
    const testData = await getTestData<TestData>()
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

      //   console.log('expected output: ', output)
      const isCorrect = await confirmContinue<TestData['output']>(rl, output)
      if (isCorrect) score++
    }

    rl.close()

    console.log(`Score: ${score}/${totalItems}`)
  } catch (err) {
    console.error(err)
  }
}

run()
