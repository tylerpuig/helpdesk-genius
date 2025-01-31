import readline from 'readline'
import fs from 'fs/promises'

export function createPrompt(): readline.Interface {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
}

export async function confirmContinue<T>(
  rl: readline.Interface,
  expectedOutput: T
): Promise<boolean> {
  console.log('Expected output: ', expectedOutput)

  const answer = await new Promise<string>((resolve) => {
    rl.question('Continue to next test? (y/n): ', resolve)
  })

  return answer.toLowerCase() === 'y'
}

export function randString() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export async function getTestData<T>(): Promise<T[] | undefined> {
  try {
    const data = await fs.readFile('data.json', 'utf8')
    console.log(JSON.parse(data))

    return JSON.parse(data) as T[]
  } catch (err) {
    console.error(err)
  }
}
